const SUPPORTED_DIALECTS = [
"postgresql",
"mysql",
"sqlite",
];

const VALID_ON_DELETE = [
"NO ACTION",
"CASCADE",
"SET NULL",
"SET DEFAULT",
"RESTRICT",
];

/* =========================================================
IDENTIFIER HELPERS
========================================================= */

const quoteIdentifier = (name, dialect) => {
if (name === undefined || name === null) {
    return "";
}

const identifier = String(name).trim();

if (!identifier) {
    return "";
}

switch (dialect) {
    case "mysql":
    return `\`${identifier.replace(/`/g, "``")}\``;

    case "postgresql":
    case "sqlite":
    default:
    return `"${identifier.replace(/"/g, '""')}"`;
}
};


/* =========================================================
DATA TYPE MAPPING
========================================================= */

const mapType = (column = {}, dialect) => {
const type = String(
    column.type || "TEXT"
).trim().toUpperCase();

switch (dialect) {

    /* -----------------------------------------------------
    POSTGRESQL
    ----------------------------------------------------- */

    case "postgresql": {
    switch (type) {
        case "INTEGER":
        return column.autoIncrement
            ? "SERIAL"
            : "INTEGER";

        case "BIGINT":
        return column.autoIncrement
            ? "BIGSERIAL"
            : "BIGINT";

        case "VARCHAR":
        return `VARCHAR(${column.length || 255})`;

        case "DECIMAL":
        return `DECIMAL(${column.precision || 10}, ${
            column.scale ?? 2
        })`;

        case "FLOAT":
        return "DOUBLE PRECISION";

        case "BOOLEAN":
        return "BOOLEAN";

        case "DATE":
        return "DATE";

        case "TIMESTAMP":
        return "TIMESTAMP";

        case "TEXT":
        default:
        return "TEXT";
    }
    }


    /* -----------------------------------------------------
    MYSQL
    ----------------------------------------------------- */

    case "mysql": {
    switch (type) {
        case "INTEGER":
        return "INT";

        case "BIGINT":
        return "BIGINT";

        case "VARCHAR":
        return `VARCHAR(${column.length || 255})`;

        case "DECIMAL":
        return `DECIMAL(${column.precision || 10},${
            column.scale ?? 2
        })`;

        case "FLOAT":
        return "DOUBLE";

        case "BOOLEAN":
        return "BOOLEAN";

        case "DATE":
        return "DATE";

        case "TIMESTAMP":
        return "TIMESTAMP";

        case "TEXT":
        default:
        return "TEXT";
    }
    }


    /* -----------------------------------------------------
    SQLITE
    ----------------------------------------------------- */

    case "sqlite": {
    switch (type) {
        case "INTEGER":
        return "INTEGER";

        case "BIGINT":
        return "INTEGER";

        case "VARCHAR":
        return "TEXT";

        case "TEXT":
        return "TEXT";

        case "DECIMAL":
        case "FLOAT":
        return "REAL";

        case "BOOLEAN":
        return "INTEGER";

        case "DATE":
        case "TIMESTAMP":
        return "TEXT";

        default:
        return "TEXT";
    }
    }


    default:
    return type;
}
};


/* =========================================================
FIND COLUMN FROM REACT FLOW HANDLE
========================================================= */

const findColumn = (
nodes,
nodeId,
handleId
) => {
const node = nodes.find(
    (item) => item.id === nodeId
);

if (!node) {
    return null;
}

const column = node.data?.columns?.find(
    (item) => item.id === handleId
);

if (!column) {
    return null;
}

return {
    node,
    column,
    tableName:
    node.data?.tableName || node.id,
};
};


/* =========================================================
NORMALIZE DELETE ACTION
========================================================= */

const getOnDelete = (
edge,
sourceColumn
) => {
let onDelete =
    edge.data?.onDelete ||
    "NO ACTION";

onDelete = String(
    onDelete
).trim().toUpperCase();

if (
    !VALID_ON_DELETE.includes(
    onDelete
    )
) {
    onDelete = "NO ACTION";
}

/*
* SET NULL requires a nullable FK column.
*/
if (
    onDelete === "SET NULL" &&
    sourceColumn?.isNullable === false
) {
    return "NO ACTION";
}

return onDelete;
};


/* =========================================================
FOREIGN KEY INFORMATION
========================================================= */

const resolveRelationship = (
edge,
nodes
) => {
const source = findColumn(
    nodes,
    edge.source,
    edge.sourceHandle
);

const target = findColumn(
    nodes,
    edge.target,
    edge.targetHandle
);

if (!source || !target) {
    return null;
}

return {
    edge,

    sourceTable:
    source.tableName,

    sourceColumn:
    source.column,

    targetTable:
    target.tableName,

    targetColumn:
    target.column,

    onDelete:
    getOnDelete(
        edge,
        source.column
    ),
};
};


/* =========================================================
CONSTRAINT NAME
========================================================= */

const createConstraintName = (
relationship,
index
) => {
const sourceTable =
    relationship.sourceTable;

const sourceColumn =
    relationship.sourceColumn?.name ||
    "column";

const targetTable =
    relationship.targetTable;

const targetColumn =
    relationship.targetColumn?.name ||
    "column";

/*
* Keep generated constraint names predictable.
*/
return [
    "fk",
    sourceTable,
    sourceColumn,
    targetTable,
    targetColumn,
    index,
]
    .join("_")
    .replace(/[^a-zA-Z0-9_]/g, "_");
};


/* =========================================================
COLUMN DEFINITION
========================================================= */

const generateColumnDefinition = (
column,
dialect
) => {
const name =
    quoteIdentifier(
    column.name || "column",
    dialect
    );

const type =
    String(
    column.type || "TEXT"
    ).trim().toUpperCase();

const isPrimaryKey =
    Boolean(column.isPrimaryKey);

const isAutoIncrement =
    Boolean(column.autoIncrement);

const parts = [
    name,
];


/* -------------------------------------------------------
    SQLITE AUTOINCREMENT

    SQLite requires:

    INTEGER PRIMARY KEY AUTOINCREMENT

    This must be inline.
------------------------------------------------------- */

if (
    dialect === "sqlite" &&
    isPrimaryKey &&
    isAutoIncrement &&
    type === "INTEGER"
) {
    parts.push(
    "INTEGER",
    "PRIMARY KEY",
    "AUTOINCREMENT"
    );

    return parts.join(" ");
}


/* -------------------------------------------------------
    NORMAL TYPE
------------------------------------------------------- */

parts.push(
    mapType(
    column,
    dialect
    )
);


/* -------------------------------------------------------
    MYSQL AUTO_INCREMENT
------------------------------------------------------- */

if (
    dialect === "mysql" &&
    isAutoIncrement
) {
    parts.push(
    "AUTO_INCREMENT"
    );
}


/* -------------------------------------------------------
    SQLITE PRIMARY KEY

    Only inline for normal SQLite PKs.
------------------------------------------------------- */

if (
    dialect === "sqlite" &&
    isPrimaryKey
) {
    parts.push(
    "PRIMARY KEY"
    );
}


/* -------------------------------------------------------
    NOT NULL

    PK columns are always NOT NULL.
------------------------------------------------------- */

const shouldBeNotNull =
    column.isNullable === false ||
    isPrimaryKey;

if (
    shouldBeNotNull &&
    !(
    dialect === "sqlite" &&
    isPrimaryKey &&
    isAutoIncrement &&
    type === "INTEGER"
    )
) {
    parts.push(
    "NOT NULL"
    );
}


/* -------------------------------------------------------
    UNIQUE
------------------------------------------------------- */

if (
    column.isUnique &&
    !isPrimaryKey
) {
    parts.push(
    "UNIQUE"
    );
}


/* -------------------------------------------------------
    DEFAULT VALUE

    Supports defaultValue if your column model
    contains it.
------------------------------------------------------- */

if (
    column.defaultValue !== undefined &&
    column.defaultValue !== null &&
    String(column.defaultValue).trim() !== ""
) {
    const defaultValue =
    String(
        column.defaultValue
    ).trim();

    parts.push(
    `DEFAULT ${defaultValue}`
    );
}

return parts.join(" ");
};


/* =========================================================
CREATE TABLE
========================================================= */

const generateCreateTable = (
node,
dialect,
relationships = [],
tableIndex = 0
) => {
const tableName =
    node.data?.tableName ||
    node.id ||
    `table_${tableIndex + 1}`;

const columns =
    node.data?.columns || [];

const quotedTableName =
    quoteIdentifier(
    tableName,
    dialect
    );


/* -------------------------------------------------------
    EMPTY TABLE
------------------------------------------------------- */

if (!columns.length) {
    return [
    `CREATE TABLE ${quotedTableName} (`,
    ");",
    ].join("\n");
}


/* -------------------------------------------------------
    PRIMARY KEYS
------------------------------------------------------- */

const primaryKeys =
    columns
    .filter(
        (column) =>
        column.isPrimaryKey
    )
    .map(
        (column) =>
        quoteIdentifier(
            column.name,
            dialect
        )
    );


/* -------------------------------------------------------
    COLUMN DEFINITIONS
------------------------------------------------------- */

const columnDefinitions =
    columns.map(
    (column) =>
        generateColumnDefinition(
        column,
        dialect
        )
    );


/* -------------------------------------------------------
    POSTGRESQL / MYSQL PRIMARY KEY
    Table-level constraint.

    This also correctly supports
    composite primary keys.
------------------------------------------------------- */

if (
    primaryKeys.length > 0 &&
    (
    dialect === "postgresql" ||
    dialect === "mysql"
    )
) {
    columnDefinitions.push(
    `PRIMARY KEY (${primaryKeys.join(", ")})`
    );
}


/* -------------------------------------------------------
    SQLITE COMPOSITE PRIMARY KEY

    A single SQLite PK is already inline.

    Composite PK must be table-level.
------------------------------------------------------- */

if (
    dialect === "sqlite" &&
    primaryKeys.length > 1
) {
    columnDefinitions.push(
    `PRIMARY KEY (${primaryKeys.join(", ")})`
    );
}


/* -------------------------------------------------------
    SQLITE FOREIGN KEYS

    IMPORTANT:

    SQLite does NOT support:

    ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY

    Therefore SQLite foreign keys must be included
    inside CREATE TABLE.
------------------------------------------------------- */

if (
    dialect === "sqlite" &&
    relationships.length > 0
) {
    relationships
    .filter(
        (relationship) =>
        relationship.sourceTable ===
        tableName
    )
    .forEach(
        (
        relationship,
        relationshipIndex
        ) => {
        const constraintName =
            createConstraintName(
            relationship,
            relationshipIndex + 1
            );

        columnDefinitions.push(
            `CONSTRAINT ${quoteIdentifier(
            constraintName,
            dialect
            )} FOREIGN KEY (${quoteIdentifier(
            relationship.sourceColumn.name,
            dialect
            )}) REFERENCES ${quoteIdentifier(
            relationship.targetTable,
            dialect
            )} (${quoteIdentifier(
            relationship.targetColumn.name,
            dialect
            )}) ON DELETE ${
            relationship.onDelete
            }`
        );
        }
    );
}


return [
    `CREATE TABLE ${quotedTableName} (`,
    columnDefinitions.join(",\n"),
    ");",
].join("\n");
};


/* =========================================================
POSTGRESQL / MYSQL FOREIGN KEY
========================================================= */

const generateForeignKey = (
relationship,
dialect,
index
) => {
if (!relationship) {
    return null;
}

const constraintName =
    createConstraintName(
    relationship,
    index
    );

const sourceTable =
    quoteIdentifier(
    relationship.sourceTable,
    dialect
    );

const sourceColumn =
    quoteIdentifier(
    relationship.sourceColumn.name,
    dialect
    );

const targetTable =
    quoteIdentifier(
    relationship.targetTable,
    dialect
    );

const targetColumn =
    quoteIdentifier(
    relationship.targetColumn.name,
    dialect
    );

const constraint =
    quoteIdentifier(
    constraintName,
    dialect
    );


return [
    `ALTER TABLE ${sourceTable}`,
    `ADD CONSTRAINT ${constraint}`,
    `FOREIGN KEY (${sourceColumn})`,
    `REFERENCES ${targetTable} (${targetColumn})`,
    `ON DELETE ${relationship.onDelete};`,
].join(" ");
};


/* =========================================================
MAIN SQL GENERATOR
========================================================= */

export function generateSQL(
nodes = [],
edges = [],
dialect = "postgresql"
) {
/* -------------------------------------------------------
    EMPTY SCHEMA
------------------------------------------------------- */

if (!Array.isArray(nodes) || nodes.length === 0) {
    return "-- Add tables to generate SQL.";
}


/* -------------------------------------------------------
    NORMALIZE DIALECT
------------------------------------------------------- */

const normalizedDialect =
    String(
    dialect || "postgresql"
    )
    .trim()
    .toLowerCase();

const safeDialect =
    SUPPORTED_DIALECTS.includes(
    normalizedDialect
    )
    ? normalizedDialect
    : "postgresql";


/* -------------------------------------------------------
    RESOLVE ALL VALID RELATIONSHIPS

    Only edges whose sourceHandle and targetHandle
    actually point to existing columns are used.
------------------------------------------------------- */

const relationships =
    Array.isArray(edges)
    ? edges
        .map((edge) =>
            resolveRelationship(
            edge,
            nodes
            )
        )
        .filter(Boolean)
    : [];


/* -------------------------------------------------------
    CREATE TABLE STATEMENTS
------------------------------------------------------- */

const createStatements =
    nodes.map(
    (node, index) =>
        generateCreateTable(
        node,
        safeDialect,
        relationships,
        index
        )
    );


/* -------------------------------------------------------
    FOREIGN KEYS

    PostgreSQL + MySQL:
    Generated after CREATE TABLE.

    SQLite:
    Already generated inside CREATE TABLE.
------------------------------------------------------- */

let foreignKeyStatements = [];

if (
    safeDialect === "postgresql" ||
    safeDialect === "mysql"
) {
    foreignKeyStatements =
    relationships
        .map(
        (
            relationship,
            index
        ) =>
            generateForeignKey(
            relationship,
            safeDialect,
            index + 1
            )
        )
        .filter(Boolean);
}


/* -------------------------------------------------------
    FINAL SQL
------------------------------------------------------- */

return [
    ...createStatements,
    ...foreignKeyStatements,
].join("\n\n");
}


/* =========================================================
EXPORT HELPERS
========================================================= */

export {
SUPPORTED_DIALECTS,
VALID_ON_DELETE,
mapType,
quoteIdentifier,
findColumn,
resolveRelationship,
};