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

/* -------------------------------------------------------
Identifier helpers
------------------------------------------------------- */

const quoteIdentifier = (name, dialect) => {
if (!name) {
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


/* -------------------------------------------------------
Data type mapping
------------------------------------------------------- */

const mapType = (column, dialect) => {
const type = (
    column?.type || "TEXT"
).toUpperCase();

switch (dialect) {
    /* ---------------- PostgreSQL ---------------- */

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


    /* ---------------- MySQL ---------------- */

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


    /* ---------------- SQLite ---------------- */

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


/* -------------------------------------------------------
Find a column from a React Flow handle
------------------------------------------------------- */

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


/* -------------------------------------------------------
Generate CREATE TABLE
------------------------------------------------------- */

const generateCreateTable = (
node,
dialect
) => {
const tableName =
    node.data?.tableName || node.id;

const columns =
    node.data?.columns || [];

const quotedTableName =
    quoteIdentifier(
    tableName,
    dialect
    );

/*
* Empty table
*/
if (!columns.length) {
    return [
    `CREATE TABLE ${quotedTableName} (`,
    ");",
    ].join("\n");
}


/*
* Collect primary keys.
*/
const primaryKeys = columns
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


/*
* Generate column definitions.
*/
const columnDefinitions =
    columns.map((column) => {
    const parts = [];

    const columnName =
        quoteIdentifier(
        column.name,
        dialect
        );

    const isPrimaryKey =
        Boolean(column.isPrimaryKey);

    const isAutoIncrement =
        Boolean(column.autoIncrement);


    parts.push(
        `  ${columnName}`
    );


    /*
    * SQLite
    *
    * INTEGER PRIMARY KEY AUTOINCREMENT
    * must be inline.
    */
    if (
        dialect === "sqlite" &&
        isPrimaryKey &&
        isAutoIncrement &&
        column.type?.toUpperCase() ===
        "INTEGER"
    ) {
        parts.push(
        "INTEGER PRIMARY KEY AUTOINCREMENT"
        );

        return parts.join(" ");
    }


    /*
    * Normal type.
    */
    parts.push(
        mapType(
        column,
        dialect
        )
    );


    /*
    * MySQL auto increment.
    */
    if (
        dialect === "mysql" &&
        isAutoIncrement
    ) {
        parts.push(
        "AUTO_INCREMENT"
        );
    }


    /*
    * PostgreSQL generated SERIAL /
    * BIGSERIAL already handles
    * auto increment.
    */


    /*
    * Primary key.
    *
    * PostgreSQL/MySQL use a table-level
    * constraint below.
    */
    if (
        isPrimaryKey &&
        dialect === "sqlite"
    ) {
        parts.push(
        "PRIMARY KEY"
        );
    }


    /*
    * NOT NULL
    */
    const shouldBeNotNull =
        column.isNullable === false ||
        isPrimaryKey;

    if (
        shouldBeNotNull &&
        !(
        dialect === "sqlite" &&
        isAutoIncrement &&
        isPrimaryKey
        )
    ) {
        parts.push(
        "NOT NULL"
        );
    }


    /*
    * UNIQUE
    *
    * Primary keys are already unique.
    */
    if (
        column.isUnique &&
        !isPrimaryKey
    ) {
        parts.push(
        "UNIQUE"
        );
    }

    return parts.join(" ");
    });


/*
* PostgreSQL / MySQL
* table-level primary key.
*/
if (
    primaryKeys.length > 0 &&
    (
    dialect === "postgresql" ||
    dialect === "mysql"
    )
) {
    columnDefinitions.push(
    `  PRIMARY KEY (${primaryKeys.join(
        ", "
    )})`
    );
}


/*
* SQLite composite primary keys.
*
* A single auto-increment primary key
* was already handled inline.
*/
if (
    dialect === "sqlite" &&
    primaryKeys.length > 1
) {
    columnDefinitions.push(
    `  PRIMARY KEY (${primaryKeys.join(
        ", "
    )})`
    );
}


return [
    `CREATE TABLE ${quotedTableName} (`,
    columnDefinitions.join(",\n"),
    ");",
].join("\n");
};


/* -------------------------------------------------------
Generate FOREIGN KEY
------------------------------------------------------- */

const generateForeignKey = (
edge,
nodes,
dialect,
index
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


/*
* Invalid relationship.
*/
if (!source || !target) {
    return null;
}


const constraintName =
    `fk_${source.tableName}_${source.column.name}_${index}`;


/*
* Use explicitly configured action
* when available.
*/
let onDelete =
    edge.data?.onDelete ||
    "NO ACTION";


onDelete =
    String(onDelete).toUpperCase();


/*
* Prevent invalid SQL.
*/
if (
    !VALID_ON_DELETE.includes(
    onDelete
    )
) {
    onDelete = "NO ACTION";
}


/*
* SET NULL only makes sense when
* the source column can actually
* accept NULL.
*/
if (
    onDelete === "SET NULL" &&
    source.column.isNullable === false
) {
    onDelete = "NO ACTION";
}


return [
    `ALTER TABLE ${quoteIdentifier(
    source.tableName,
    dialect
    )}`,

    `ADD CONSTRAINT ${quoteIdentifier(
    constraintName,
    dialect
    )}`,

    `FOREIGN KEY (${quoteIdentifier(
    source.column.name,
    dialect
    )})`,

    `REFERENCES ${quoteIdentifier(
    target.tableName,
    dialect
    )} (${quoteIdentifier(
    target.column.name,
    dialect
    )})`,

    `ON DELETE ${onDelete};`,
].join(" ");
};


/* -------------------------------------------------------
Main SQL generator
------------------------------------------------------- */

export function generateSQL(
nodes = [],
edges = [],
dialect = "postgresql"
) {
/*
* Empty schema.
*/
if (!nodes.length) {
    return "-- Add tables to generate SQL.";
}


/*
* Normalize dialect.
*/
const normalizedDialect =
    String(dialect || "postgresql")
    .toLowerCase();


/*
* Fallback to PostgreSQL if
* an unsupported dialect is passed.
*/
const safeDialect =
    SUPPORTED_DIALECTS.includes(
    normalizedDialect
    )
    ? normalizedDialect
    : "postgresql";


/*
* CREATE TABLE statements.
*/
const createStatements =
    nodes.map((node) =>
    generateCreateTable(
        node,
        safeDialect
    )
    );


/*
* FOREIGN KEY statements.
*/
const foreignKeyStatements =
    edges
    .map((edge, index) =>
        generateForeignKey(
        edge,
        nodes,
        safeDialect,
        index + 1
        )
    )
    .filter(Boolean);


/*
* Combine the complete schema.
*/
return [
    ...createStatements,
    ...foreignKeyStatements,
].join("\n\n");
}


/*
* Export type mapper if another
* component needs it.
*/
export {
mapType,
quoteIdentifier,
};