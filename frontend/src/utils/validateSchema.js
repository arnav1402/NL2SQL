// validateSchema.js

const VALID_RELATIONS = new Set([
    "required",
    "optional",
]);

const VALID_CASCADE_ACTIONS = new Set([
    "NO ACTION",
    "CASCADE",
    "SET NULL",
    "SET DEFAULT",
    "RESTRICT",
]);

const normalize = (value) =>
    String(value ?? "").trim().toLowerCase();

const normalizeAction = (value) =>
    String(value ?? "NO ACTION")
        .trim()
        .toUpperCase();

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

const getColumnId = (column) =>
    String(column?.id ?? "").trim();

const isNullable = (column) =>
    column?.isNullable !== false;

const getRelation = (edge) => {
    const relation = normalize(edge?.data?.relation);

    return VALID_RELATIONS.has(relation)
        ? relation
        : "required";
};

const getOnDelete = (edge) =>
    normalizeAction(edge?.data?.onDelete);

const getOnUpdate = (edge) =>
    normalizeAction(edge?.data?.onUpdate);

const getColumnByHandle = (node, handleId) => {
    const columns = getColumns(node);

    return columns.find(
        (column) =>
            getColumnId(column) ===
            String(handleId ?? "").trim()
    );
};

const getColumnTypeSignature = (column) => {
    const type = getColumnType(column);

    if (!type) {
        return "";
    }

    if (type === "VARCHAR") {
        const length =
            column?.length !== undefined &&
            column?.length !== null
                ? Number(column.length)
                : null;

        return Number.isFinite(length)
            ? `VARCHAR(${length})`
            : "VARCHAR";
    }

    if (type === "DECIMAL") {
        const precision =
            Number(column?.precision ?? 10);

        const scale =
            Number(column?.scale ?? 2);

        return `DECIMAL(${precision},${scale})`;
    }

    return type;
};

export function validateSchema(nodes = [], edges = []) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(nodes) || nodes.length === 0) {
        return {
            valid: false,
            errors: [
                "Schema must contain at least one table.",
            ],
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
    // Tables
    // --------------------------------------------------

    const tableNames = new Map();
    const nodeMap = new Map();

    nodes.forEach((node) => {
        if (!node?.id) {
            errors.push(
                "A table is missing a node ID."
            );
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

        const normalizedTableName =
            normalize(tableName);

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
        // Columns
        // --------------------------------------------------

        const columnNames = new Set();
        const columnIds = new Set();

        columns.forEach((column) => {
            const columnName =
                getColumnName(column);

            const columnId =
                getColumnId(column);

            if (!columnId) {
                errors.push(
                    `Column "${tableName}.${columnName || "unknown"}" is missing a column ID.`
                );
            } else if (columnIds.has(columnId)) {
                errors.push(
                    `Duplicate column ID "${columnId}" in table "${tableName}".`
                );
            } else {
                columnIds.add(columnId);
            }

            if (!columnName) {
                errors.push(
                    `Table "${tableName}" contains a column without a name.`
                );
                return;
            }

            const normalizedColumnName =
                normalize(columnName);

            if (
                columnNames.has(
                    normalizedColumnName
                )
            ) {
                errors.push(
                    `Duplicate column "${columnName}" in table "${tableName}".`
                );
            } else {
                columnNames.add(
                    normalizedColumnName
                );
            }

            const type =
                getColumnType(column);

            if (!type) {
                errors.push(
                    `Column "${tableName}.${columnName}" must have a data type.`
                );
            }

            // --------------------------------------------------
            // Primary key
            // --------------------------------------------------

            if (
                column.isPrimaryKey &&
                isNullable(column)
            ) {
                errors.push(
                    `Primary key "${tableName}.${columnName}" cannot be nullable.`
                );
            }

            if (
                column.autoIncrement &&
                !column.isPrimaryKey
            ) {
                warnings.push(
                    `Auto-increment column "${tableName}.${columnName}" is not a primary key.`
                );
            }

            // --------------------------------------------------
            // VARCHAR
            // --------------------------------------------------

            if (type === "VARCHAR") {
                if (
                    column.length !== undefined &&
                    column.length !== null
                ) {
                    const length =
                        Number(column.length);

                    if (
                        !Number.isFinite(length) ||
                        length <= 0
                    ) {
                        errors.push(
                            `VARCHAR column "${tableName}.${columnName}" must have a valid length.`
                        );
                    }
                }
            }

            // --------------------------------------------------
            // DECIMAL
            // --------------------------------------------------

            if (type === "DECIMAL") {
                const precision =
                    Number(
                        column.precision ?? 10
                    );

                const scale =
                    Number(
                        column.scale ?? 2
                    );

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

            // --------------------------------------------------
            // SET NULL requires nullable column
            // --------------------------------------------------

            if (
                normalizeAction(
                    column?.onDelete
                ) === "SET NULL" &&
                !isNullable(column)
            ) {
                errors.push(
                    `Column "${tableName}.${columnName}" cannot use SET NULL because it is NOT NULL.`
                );
            }
        });

        // --------------------------------------------------
        // Primary key validation
        // --------------------------------------------------

        const primaryKeys =
            columns.filter(
                (column) =>
                    column?.isPrimaryKey === true
            );

        if (primaryKeys.length === 0) {
            warnings.push(
                `Table "${tableName}" does not have a primary key.`
            );
        }

        // --------------------------------------------------
        // Unique columns
        // --------------------------------------------------

        columns.forEach((column) => {
            if (
                column?.isUnique &&
                column?.isPrimaryKey
            ) {
                warnings.push(
                    `Column "${tableName}.${getColumnName(column)}" is marked both PRIMARY KEY and UNIQUE.`
                );
            }
        });
    });

    // --------------------------------------------------
    // Relationships
    // --------------------------------------------------

    const relationshipKeys = new Set();
    const constraintNames = new Set();

    edges.forEach((edge, index) => {
        const relationshipNumber = index + 1;

        if (!edge) {
            errors.push(
                `Relationship ${relationshipNumber} is invalid.`
            );
            return;
        }

        if (!edge.source || !edge.target) {
            errors.push(
                `Relationship ${relationshipNumber} is missing a source or target table.`
            );
            return;
        }

        if (!edge.sourceHandle) {
            errors.push(
                `Relationship ${relationshipNumber} is missing a source column handle.`
            );
            return;
        }

        if (!edge.targetHandle) {
            errors.push(
                `Relationship ${relationshipNumber} is missing a target column handle.`
            );
            return;
        }

        const sourceNode =
            nodeMap.get(edge.source);

        const targetNode =
            nodeMap.get(edge.target);

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

        const sourceColumn =
            getColumnByHandle(
                sourceNode,
                edge.sourceHandle
            );

        const targetColumn =
            getColumnByHandle(
                targetNode,
                edge.targetHandle
            );

        // --------------------------------------------------
        // Source column
        // --------------------------------------------------

        if (!sourceColumn) {
            errors.push(
                `Relationship from "${sourceTableName}" references a missing source column.`
            );
            return;
        }

        // --------------------------------------------------
        // Target column
        // --------------------------------------------------

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
        // Duplicate relationship
        // --------------------------------------------------

        const relationshipKey =
            [
                edge.source,
                edge.sourceHandle,
                edge.target,
                edge.targetHandle,
            ].join("::");

        if (
            relationshipKeys.has(
                relationshipKey
            )
        ) {
            errors.push(
                `Duplicate relationship: "${sourceTableName}.${sourceColumnName}" references "${targetTableName}.${targetColumnName}" more than once.`
            );
        } else {
            relationshipKeys.add(
                relationshipKey
            );
        }

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
        // Self-reference
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

        const rawRelation =
            normalize(edge.data?.relation);

        if (
            rawRelation &&
            !VALID_RELATIONS.has(rawRelation)
        ) {
            warnings.push(
                `Relationship "${sourceTableName}.${sourceColumnName}" has an invalid relation type "${edge.data?.relation}".`
            );
        }

        const relation =
            getRelation(edge);

        // --------------------------------------------------
        // Optional relationship
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
        // Required relationship
        // --------------------------------------------------

        if (
            relation === "required" &&
            sourceColumn.isNullable === true
        ) {
            warnings.push(
                `Required relationship "${sourceTableName}.${sourceColumnName}" is nullable.`
            );
        }

        // --------------------------------------------------
        // Foreign key type compatibility
        // --------------------------------------------------

        const sourceType =
            getColumnTypeSignature(
                sourceColumn
            );

        const targetType =
            getColumnTypeSignature(
                targetColumn
            );

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
        // ON DELETE / ON UPDATE
        // --------------------------------------------------

        const onDelete =
            getOnDelete(edge);

        const onUpdate =
            getOnUpdate(edge);

        if (
            !VALID_CASCADE_ACTIONS.has(
                onDelete
            )
        ) {
            errors.push(
                `Relationship "${sourceTableName}.${sourceColumnName}" has an invalid ON DELETE action "${onDelete}".`
            );
        }

        if (
            !VALID_CASCADE_ACTIONS.has(
                onUpdate
            )
        ) {
            errors.push(
                `Relationship "${sourceTableName}.${sourceColumnName}" has an invalid ON UPDATE action "${onUpdate}".`
            );
        }

        // SET NULL only makes sense for nullable FK columns.
        if (
            onDelete === "SET NULL" &&
            !isNullable(sourceColumn)
        ) {
            errors.push(
                `Relationship "${sourceTableName}.${sourceColumnName}" cannot use ON DELETE SET NULL because the foreign key column is NOT NULL.`
            );
        }

        if (
            onUpdate === "SET NULL" &&
            !isNullable(sourceColumn)
        ) {
            errors.push(
                `Relationship "${sourceTableName}.${sourceColumnName}" cannot use ON UPDATE SET NULL because the foreign key column is NOT NULL.`
            );
        }

        // --------------------------------------------------
        // Cascade warning
        // --------------------------------------------------

        if (
            onDelete === "CASCADE"
        ) {
            warnings.push(
                `Deleting a row from "${targetTableName}" will cascade to "${sourceTableName}.${sourceColumnName}".`
            );
        }

        if (
            onUpdate === "CASCADE"
        ) {
            warnings.push(
                `Updating the referenced key "${targetTableName}.${targetColumnName}" will cascade to "${sourceTableName}.${sourceColumnName}".`
            );
        }

        // --------------------------------------------------
        // Constraint name
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