const TYPE_MAP = {
postgresql: {
    INTEGER: "INTEGER",
    BIGINT: "BIGINT",
    VARCHAR: "VARCHAR",
    TEXT: "TEXT",
    BOOLEAN: "BOOLEAN",
    DATE: "DATE",
    TIMESTAMP: "TIMESTAMP",
    DECIMAL: "DECIMAL",
    FLOAT: "DOUBLE PRECISION",
},

mysql: {
    INTEGER: "INT",
    BIGINT: "BIGINT",
    VARCHAR: "VARCHAR",
    TEXT: "TEXT",
    BOOLEAN: "BOOLEAN",
    DATE: "DATE",
    TIMESTAMP: "TIMESTAMP",
    DECIMAL: "DECIMAL",
    FLOAT: "DOUBLE",
},

sqlite: {
    INTEGER: "INTEGER",
    BIGINT: "INTEGER",
    VARCHAR: "TEXT",
    TEXT: "TEXT",
    BOOLEAN: "INTEGER",
    DATE: "TEXT",
    TIMESTAMP: "TEXT",
    DECIMAL: "REAL",
    FLOAT: "REAL",
},
};


/* -------------------------------------------------------
Map a column type to the target dialect
------------------------------------------------------- */

export function mapType(
type,
dialect = "postgresql",
options = {}
) {
const normalizedDialect = String(
    dialect || "postgresql"
).toLowerCase();

const normalizedType = String(
    type || "TEXT"
).toUpperCase();

const dialectMap =
    TYPE_MAP[normalizedDialect] ||
    TYPE_MAP.postgresql;

let mappedType =
    dialectMap[normalizedType] || "TEXT";


/* -----------------------------------------------------
    VARCHAR
----------------------------------------------------- */

if (normalizedType === "VARCHAR") {
    const length =
    Number(options.length) > 0
        ? Number(options.length)
        : 255;

    if (normalizedDialect === "sqlite") {
    return "TEXT";
    }

    return `VARCHAR(${length})`;
}


/* -----------------------------------------------------
    DECIMAL
----------------------------------------------------- */

if (normalizedType === "DECIMAL") {
    const precision =
    Number(options.precision) > 0
        ? Number(options.precision)
        : 10;

    const scale =
    Number(options.scale) >= 0
        ? Number(options.scale)
        : 2;

    return `DECIMAL(${precision},${scale})`;
}


/* -----------------------------------------------------
    INTEGER AUTO INCREMENT
----------------------------------------------------- */

if (
    options.autoIncrement &&
    normalizedType === "INTEGER"
) {
    switch (normalizedDialect) {
    case "postgresql":
        return "SERIAL";

    case "mysql":
        return "INT";

    case "sqlite":
        return "INTEGER";

    default:
        return mappedType;
    }
}


/* -----------------------------------------------------
    BIGINT AUTO INCREMENT
----------------------------------------------------- */

if (
    options.autoIncrement &&
    normalizedType === "BIGINT"
) {
    switch (normalizedDialect) {
    case "postgresql":
        return "BIGSERIAL";

    case "mysql":
        return "BIGINT";

    case "sqlite":
        return "INTEGER";

    default:
        return mappedType;
    }
}


return mappedType;
}


/* -------------------------------------------------------
Get all supported logical types
------------------------------------------------------- */

export function getSupportedTypes(
dialect = "postgresql"
) {
const normalizedDialect = String(
    dialect || "postgresql"
).toLowerCase();

return Object.keys(
    TYPE_MAP[normalizedDialect] ||
    TYPE_MAP.postgresql
);
}


/* -------------------------------------------------------
Get the dialect type mapping
------------------------------------------------------- */

export function getTypeMap(
dialect = "postgresql"
) {
const normalizedDialect = String(
    dialect || "postgresql"
).toLowerCase();

return (
    TYPE_MAP[normalizedDialect] ||
    TYPE_MAP.postgresql
);
}


export default TYPE_MAP;