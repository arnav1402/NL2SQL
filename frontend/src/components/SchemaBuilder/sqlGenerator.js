// Turns the canvas's nodes/edges into dialect-specific SQL DDL.
// Kept dependency-free and pure so it can be unit tested or reused
// by both SchemaBuilder (to feed the preview) and any future export.

const QUOTE_BY_DIALECT = {
    postgresql: (name) => `"${name}"`,
    mysql: (name) => `\`${name}\``,
    sqlite: (name) => `"${name}"`,
};

function quote(dialect, name) {
    const quoteFn = QUOTE_BY_DIALECT[dialect] || QUOTE_BY_DIALECT.postgresql;
    return quoteFn(name && String(name).trim() ? name : "unnamed");
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "x";
}

function buildColumnLine(dialect, column) {
    const parts = [
        quote(dialect, column.name || "column"),
        (column.type || "TEXT").toString().toUpperCase(),
    ];

    if (column.isNullable === false) {
        parts.push("NOT NULL");
    }

    if (column.isUnique && !column.isPrimaryKey) {
        parts.push("UNIQUE");
    }

    return `    ${parts.join(" ")}`;
}

export function generateSQL(nodes = [], edges = [], dialect = "postgresql") {
    const tables = nodes.filter(
        (node) => Array.isArray(node.data?.columns) && node.data.columns.length > 0
    );

    if (tables.length === 0) {
        return "";
    }

    const createStatements = tables.map((node) => {
        const tableName = node.data?.tableName || node.id;
        const columns = node.data.columns;

        const columnLines = columns.map((column) => buildColumnLine(dialect, column));

        const primaryKeyColumns = columns
            .filter((column) => column.isPrimaryKey)
            .map((column) => quote(dialect, column.name || "column"));

        if (primaryKeyColumns.length > 0) {
            columnLines.push(`    PRIMARY KEY (${primaryKeyColumns.join(", ")})`);
        }

        return `CREATE TABLE ${quote(dialect, tableName)} (\n${columnLines.join(",\n")}\n);`;
    });

    const foreignKeyStatements = edges
        .map((edge) => {
            const sourceNode = nodes.find((node) => node.id === edge.source);
            const targetNode = nodes.find((node) => node.id === edge.target);

            if (!sourceNode || !targetNode) {
                return null;
            }

            const sourceColumns = Array.isArray(sourceNode.data?.columns)
                ? sourceNode.data.columns
                : [];

            const targetColumns = Array.isArray(targetNode.data?.columns)
                ? targetNode.data.columns
                : [];

            const sourceColumn = sourceColumns.find(
                (column) => column.id === edge.sourceHandle
            );

            const targetColumn = targetColumns.find(
                (column) => column.id === edge.targetHandle
            );

            if (!sourceColumn || !targetColumn) {
                return null;
            }

            const sourceTable = sourceNode.data?.tableName || sourceNode.id;
            const targetTable = targetNode.data?.tableName || targetNode.id;

            const onDelete = edge.data?.onDelete || "NO ACTION";
            const onUpdate = edge.data?.onUpdate || "NO ACTION";

            const constraintName = `fk_${slugify(sourceTable)}_${slugify(sourceColumn.name)}`;

            return (
                `ALTER TABLE ${quote(dialect, sourceTable)} ` +
                `ADD CONSTRAINT ${quote(dialect, constraintName)} ` +
                `FOREIGN KEY (${quote(dialect, sourceColumn.name)}) ` +
                `REFERENCES ${quote(dialect, targetTable)} (${quote(dialect, targetColumn.name)}) ` +
                `ON DELETE ${onDelete} ON UPDATE ${onUpdate};`
            );
        })
        .filter(Boolean);

    const sections = [createStatements.join("\n\n")];

    if (foreignKeyStatements.length > 0) {
        sections.push(
            ["-- Foreign key constraints", ...foreignKeyStatements].join("\n")
        );
    }

    return sections.join("\n\n");
}