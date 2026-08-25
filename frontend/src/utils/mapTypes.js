const TYPE_MAP = {
    postgresql: {
        INTEGER: "INTEGER",
        BIGINT: "BIGINT",
        VARCHAR: "VARCHAR",
        TEXT: "TEXT",
        BOOLEAN: "BOOLEAN",
        DATE: "DATE",
        TIMESTAMP: "TIMESTAMP",
        DATETIME: "TIMESTAMP",
        TIME: "TIME",
        JSON: "JSON",
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
        DATETIME: "DATETIME",
        TIME: "TIME",
        JSON: "JSON",
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
        DATETIME: "TEXT",
        TIME: "TEXT",
        JSON: "TEXT",
        DECIMAL: "REAL",
        FLOAT: "REAL",
    },
};

// Common synonyms users may type/store on a column that should resolve
// to one of the canonical keys above instead of silently falling back to TEXT.
const TYPE_ALIASES = {
    INT: "INTEGER",
    INT4: "INTEGER",
    INT8: "BIGINT",
    BOOL: "BOOLEAN",
    DOUBLE: "FLOAT",
    "DOUBLE PRECISION": "FLOAT",
    NUMERIC: "DECIMAL",
    CHAR: "VARCHAR",
    STRING: "VARCHAR",
};

const DEFAULT_DIALECT = "postgresql";
const DEFAULT_VARCHAR_LENGTH = 255;
const DEFAULT_DECIMAL_PRECISION = 10;
const DEFAULT_DECIMAL_SCALE = 2;

const normalizeDialect = (dialect) => {
    const value = String(
        dialect ?? DEFAULT_DIALECT
    )
        .trim()
        .toLowerCase();

    return TYPE_MAP[value]
        ? value
        : DEFAULT_DIALECT;
};

const normalizeType = (type) => {
    const upper = String(type ?? "TEXT")
        .trim()
        .toUpperCase();

    return TYPE_ALIASES[upper] || upper;
};

const toPositiveInteger = (
    value,
    fallback
) => {
    const number = Number(value);

    return Number.isFinite(number) &&
        number > 0
        ? Math.floor(number)
        : fallback;
};

const toNonNegativeInteger = (
    value,
    fallback
) => {
    const number = Number(value);

    return Number.isFinite(number) &&
        number >= 0
        ? Math.floor(number)
        : fallback;
};

export function mapType(
    type,
    dialect = DEFAULT_DIALECT,
    options = {}
) {
    const normalizedDialect =
        normalizeDialect(dialect);

    const normalizedType =
        normalizeType(type);

    const dialectMap =
        TYPE_MAP[normalizedDialect];

    const mappedType =
        dialectMap[normalizedType] ||
        dialectMap.TEXT;

    if (normalizedType === "VARCHAR") {
        if (normalizedDialect === "sqlite") {
            return "TEXT";
        }

        const length = toPositiveInteger(
            options.length,
            DEFAULT_VARCHAR_LENGTH
        );

        return `VARCHAR(${length})`;
    }

    if (normalizedType === "DECIMAL") {
        if (normalizedDialect === "sqlite") {
            return "REAL";
        }

        const precision = toPositiveInteger(
            options.precision,
            DEFAULT_DECIMAL_PRECISION
        );

        const scale = toNonNegativeInteger(
            options.scale,
            DEFAULT_DECIMAL_SCALE
        );

        const safeScale = Math.min(
            scale,
            precision
        );

        return `DECIMAL(${precision},${safeScale})`;
    }

    if (
        options.autoIncrement &&
        normalizedType === "INTEGER"
    ) {
        if (normalizedDialect === "postgresql") {
            return "SERIAL";
        }

        if (normalizedDialect === "mysql") {
            return "INT";
        }

        if (normalizedDialect === "sqlite") {
            return "INTEGER";
        }
    }

    if (
        options.autoIncrement &&
        normalizedType === "BIGINT"
    ) {
        if (normalizedDialect === "postgresql") {
            return "BIGSERIAL";
        }

        if (normalizedDialect === "mysql") {
            return "BIGINT";
        }

        if (normalizedDialect === "sqlite") {
            return "INTEGER";
        }
    }

    return mappedType;
}

export function getSupportedTypes(
    dialect = DEFAULT_DIALECT
) {
    const normalizedDialect =
        normalizeDialect(dialect);

    return Object.keys(
        TYPE_MAP[normalizedDialect]
    );
}

export function getTypeMap(
    dialect = DEFAULT_DIALECT
) {
    const normalizedDialect =
        normalizeDialect(dialect);

    return {
        ...TYPE_MAP[normalizedDialect],
    };
}

export function isSupportedType(
    type,
    dialect = DEFAULT_DIALECT
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

export { TYPE_MAP, TYPE_ALIASES };

export default TYPE_MAP;