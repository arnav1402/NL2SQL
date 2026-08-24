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


/* =========================================================
NORMALIZE DIALECT
========================================================= */

const normalizeDialect = (dialect) => {
const normalized = String(
    dialect || "postgresql"
)
    .trim()
    .toLowerCase();

return TYPE_MAP[normalized]
    ? normalized
    : "postgresql";
};


/* =========================================================
NORMALIZE TYPE
========================================================= */

const normalizeType = (type) => {
return String(
    type || "TEXT"
)
    .trim()
    .toUpperCase();
};


/* =========================================================
MAP COLUMN TYPE
========================================================= */

export function mapType(
type,
dialect = "postgresql",
options = {}
) {
const normalizedDialect =
    normalizeDialect(dialect);

const normalizedType =
    normalizeType(type);

const dialectMap =
    TYPE_MAP[normalizedDialect];

let mappedType =
    dialectMap[normalizedType] ||
    dialectMap.TEXT;


/* -------------------------------------------------------
    VARCHAR
------------------------------------------------------- */

if (
    normalizedType === "VARCHAR"
) {
    const length =
    Number(options.length);

    const safeLength =
    Number.isFinite(length) &&
    length > 0
        ? Math.floor(length)
        : 255;

    /*
    * SQLite does not enforce VARCHAR length.
    */
    if (
    normalizedDialect === "sqlite"
    ) {
    return "TEXT";
    }

    return `VARCHAR(${safeLength})`;
}


/* -------------------------------------------------------
    DECIMAL
------------------------------------------------------- */

if (
    normalizedType === "DECIMAL"
) {
    const precision =
    Number(options.precision);

    const scale =
    Number(options.scale);

    const safePrecision =
    Number.isFinite(precision) &&
    precision > 0
        ? Math.floor(precision)
        : 10;

    const safeScale =
    Number.isFinite(scale) &&
    scale >= 0
        ? Math.floor(scale)
        : 2;

    /*
    * SQLite uses REAL for DECIMAL.
    */
    if (
    normalizedDialect === "sqlite"
    ) {
    return "REAL";
    }

    return `DECIMAL(${safePrecision},${safeScale})`;
}


/* -------------------------------------------------------
    INTEGER AUTO INCREMENT
------------------------------------------------------- */

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


/* -------------------------------------------------------
    BIGINT AUTO INCREMENT
------------------------------------------------------- */

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


/* =========================================================
GET SUPPORTED TYPES
========================================================= */

export function getSupportedTypes(
dialect = "postgresql"
) {
const normalizedDialect =
    normalizeDialect(dialect);

return Object.keys(
    TYPE_MAP[normalizedDialect]
);
}


/* =========================================================
GET COMPLETE TYPE MAP
========================================================= */

export function getTypeMap(
dialect = "postgresql"
) {
const normalizedDialect =
    normalizeDialect(dialect);

return {
    ...TYPE_MAP[normalizedDialect],
};
}


/* =========================================================
CHECK WHETHER A TYPE EXISTS
========================================================= */

export function isSupportedType(
type,
dialect = "postgresql"
) {
const normalizedDialect =
    normalizeDialect(dialect);

const normalizedType =
    normalizeType(type);

return Boolean(
    TYPE_MAP[normalizedDialect][
    normalizedType
    ]
);
}


/* =========================================================
EXPORT
========================================================= */

export default TYPE_MAP;