// validateSchema.js

const VALID_RELATIONS = new Set([
"required",
"optional",
]);

const normalize = (value) =>
String(value ?? "").trim().toLowerCase();

const getTableName = (node) =>
String(node?.data?.tableName ?? node?.id ?? "").trim();

const getColumns = (node) =>
Array.isArray(node?.data?.columns)
    ? node.data.columns
    : [];

const getColumnName = (column) =>
String(column?.name ?? "").trim();

const getColumnType = (column) =>
normalize(column?.type).toUpperCase();

export function validateSchema(nodes = [], edges = []) {
const errors = [];
const warnings = [];

// --------------------------------------------------
// Basic schema validation
// --------------------------------------------------

if (!Array.isArray(nodes) || nodes.length === 0) {
    return {
    valid: false,
    errors: ["Schema must contain at least one table."],
    warnings: [],
    };
}

if (!Array.isArray(edges)) {
    warnings.push(
    "Relationships data is invalid and was treated as empty."
    );
    edges = [];
}

// --------------------------------------------------
// Table validation
// --------------------------------------------------

const tableNames = new Map();
const nodeMap = new Map();

nodes.forEach((node) => {
    if (!node?.id) {
    errors.push("A table is missing a node ID.");
    return;
    }

    nodeMap.set(node.id, node);

    const tableName = getTableName(node);

    if (!tableName) {
    errors.push(
        `Table "${node.id}" must have a name.`
    );
    return;
    }

    const normalizedTableName = normalize(tableName);

    if (tableNames.has(normalizedTableName)) {
    errors.push(
        `Duplicate table name: "${tableName}".`
    );
    } else {
    tableNames.set(
        normalizedTableName,
        node.id
    );
    }

    const columns = getColumns(node);

    if (columns.length === 0) {
    errors.push(
        `Table "${tableName}" must have at least one column.`
    );
    return;
    }

    // --------------------------------------------------
    // Column validation
    // --------------------------------------------------

    const columnNames = new Set();

    columns.forEach((column) => {
    const columnName = getColumnName(column);

    if (!columnName) {
        errors.push(
        `Table "${tableName}" contains a column without a name.`
        );
        return;
    }

    const normalizedColumnName =
        normalize(columnName);

    if (columnNames.has(normalizedColumnName)) {
        errors.push(
        `Duplicate column "${columnName}" in table "${tableName}".`
        );
    } else {
        columnNames.add(normalizedColumnName);
    }

    const type = getColumnType(column);

    if (!type) {
        errors.push(
        `Column "${tableName}.${columnName}" must have a data type.`
        );
    }

    // Primary keys cannot be nullable.
    if (
        column.isPrimaryKey &&
        column.isNullable
    ) {
        errors.push(
        `Primary key "${tableName}.${columnName}" cannot be nullable.`
        );
    }

    // Auto increment should normally be used with PK.
    if (
        column.autoIncrement &&
        !column.isPrimaryKey
    ) {
        warnings.push(
        `Auto-increment column "${tableName}.${columnName}" is not a primary key.`
        );
    }

    // VARCHAR validation.
    if (type === "VARCHAR") {
        if (
        column.length !== undefined &&
        column.length !== null &&
        (
            !Number.isFinite(
            Number(column.length)
            ) ||
            Number(column.length) <= 0
        )
        ) {
        errors.push(
            `VARCHAR column "${tableName}.${columnName}" must have a valid length.`
        );
        }
    }

    // DECIMAL validation.
    if (type === "DECIMAL") {
        const precision =
        Number(column.precision ?? 10);

        const scale =
        Number(column.scale ?? 2);

        if (
        !Number.isFinite(precision) ||
        precision <= 0
        ) {
        errors.push(
            `DECIMAL column "${tableName}.${columnName}" has invalid precision.`
        );
        }

        if (
        !Number.isFinite(scale) ||
        scale < 0 ||
        scale > precision
        ) {
        errors.push(
            `DECIMAL column "${tableName}.${columnName}" has invalid scale.`
        );
        }
    }
    });

    // --------------------------------------------------
    // Primary key validation
    // --------------------------------------------------

    const primaryKeys = columns.filter(
    (column) => column.isPrimaryKey
    );

    if (primaryKeys.length === 0) {
    warnings.push(
        `Table "${tableName}" does not have a primary key.`
    );
    }
});

// --------------------------------------------------
// Relationship validation
// --------------------------------------------------

const constraintNames = new Set();

edges.forEach((edge, index) => {
    const relationshipNumber = index + 1;

    if (!edge?.source || !edge?.target) {
    errors.push(
        `Relationship ${relationshipNumber} is missing a source or target table.`
    );
    return;
    }

    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode) {
    errors.push(
        `Relationship ${relationshipNumber} references a missing source table.`
    );
    return;
    }

    if (!targetNode) {
    errors.push(
        `Relationship ${relationshipNumber} references a missing target table.`
    );
    return;
    }

    const sourceTableName =
    getTableName(sourceNode);

    const targetTableName =
    getTableName(targetNode);

    const sourceColumns =
    getColumns(sourceNode);

    const targetColumns =
    getColumns(targetNode);

    // --------------------------------------------------
    // Source column
    // --------------------------------------------------

    const sourceColumn =
    sourceColumns.find(
        (column) =>
        column.id === edge.sourceHandle
    );

    if (!sourceColumn) {
    errors.push(
        `Relationship from "${sourceTableName}" references a missing source column.`
    );
    return;
    }

    // --------------------------------------------------
    // Target column
    // --------------------------------------------------

    const targetColumn =
    targetColumns.find(
        (column) =>
        column.id === edge.targetHandle
    );

    if (!targetColumn) {
    errors.push(
        `Relationship to "${targetTableName}" references a missing target column.`
    );
    return;
    }

    const sourceColumnName =
    getColumnName(sourceColumn);

    const targetColumnName =
    getColumnName(targetColumn);

    // --------------------------------------------------
    // Target must be PK or UNIQUE
    // --------------------------------------------------

    if (
    !targetColumn.isPrimaryKey &&
    !targetColumn.isUnique
    ) {
    errors.push(
        `Foreign key "${sourceTableName}.${sourceColumnName}" must reference a primary key or unique column.`
    );
    }

    // --------------------------------------------------
    // Self-reference validation
    // --------------------------------------------------

    if (
    sourceNode.id === targetNode.id &&
    sourceColumn.id === targetColumn.id
    ) {
    errors.push(
        `Invalid self-reference on "${sourceTableName}.${sourceColumnName}".`
    );
    }

    // --------------------------------------------------
    // Relationship type
    // --------------------------------------------------

    const relation =
    normalize(edge.data?.relation);

    if (!VALID_RELATIONS.has(relation)) {
    warnings.push(
        `Relationship "${sourceTableName}.${sourceColumnName}" has no valid relation type.`
    );
    }

    // --------------------------------------------------
    // Optional relationship + NOT NULL
    // --------------------------------------------------

    if (
    relation === "optional" &&
    sourceColumn.isNullable === false
    ) {
    warnings.push(
        `Optional relationship "${sourceTableName}.${sourceColumnName}" is marked NOT NULL.`
    );
    }

    // --------------------------------------------------
    // Foreign-key type compatibility
    // --------------------------------------------------

    const sourceType =
    getColumnType(sourceColumn);

    const targetType =
    getColumnType(targetColumn);

    if (
    sourceType &&
    targetType &&
    sourceType !== targetType
    ) {
    warnings.push(
        `Foreign key "${sourceTableName}.${sourceColumnName}" and referenced column "${targetTableName}.${targetColumnName}" use different data types (${sourceType} vs ${targetType}).`
    );
    }

    // --------------------------------------------------
    // Constraint name collision
    // --------------------------------------------------

    const constraintName =
    `fk_${sourceTableName}_${sourceColumnName}`;

    const normalizedConstraintName =
    normalize(constraintName);

    if (
    constraintNames.has(
        normalizedConstraintName
    )
    ) {
    warnings.push(
        `Multiple relationships may generate the same constraint name for "${sourceTableName}.${sourceColumnName}".`
    );
    }

    constraintNames.add(
    normalizedConstraintName
    );
});

// --------------------------------------------------
// Final result
// --------------------------------------------------

return {
    valid: errors.length === 0,
    errors,
    warnings,
};
}

export function isSchemaValid(
nodes = [],
edges = []
) {
return validateSchema(
    nodes,
    edges
).valid;
}

export default validateSchema;