import "./SchemaPreview.css";
import { useMemo } from "react";

function SchemaPreview({
nodes = [],
edges = [],
dialect = "postgresql",
}) {
const tables = useMemo(
    () =>
    nodes.map((node) => ({
        id: node.id,
        name: node.data?.tableName || "table",
        columns: node.data?.columns || [],
    })),
    [nodes]
);

const relationships = useMemo(
    () =>
    edges
        .map((edge) => {
        const sourceTable = nodes.find(
            (node) => node.id === edge.source
        );

        const targetTable = nodes.find(
            (node) => node.id === edge.target
        );

        const sourceColumn = sourceTable?.data?.columns?.find(
            (column) => column.id === edge.sourceHandle
        );

        const targetColumn = targetTable?.data?.columns?.find(
            (column) => column.id === edge.targetHandle
        );

        if (!sourceTable || !targetTable) {
            return null;
        }

        return {
            id: edge.id,
            sourceTable:
            sourceTable.data?.tableName || edge.source,
            sourceColumn:
            sourceColumn?.name || edge.sourceHandle || "column",
            targetTable:
            targetTable.data?.tableName || edge.target,
            targetColumn:
            targetColumn?.name || edge.targetHandle || "column",
            relation: edge.data?.relation || "required",
        };
        })
        .filter(Boolean),
    [nodes, edges]
);

return (
    <div className="schema-preview">
    <header className="schema-preview-header">
        <div className="schema-preview-heading">
        <span className="schema-preview-eyebrow">
            DATABASE STRUCTURE
        </span>

        <h3>Schema Preview</h3>
        </div>

        <span className="schema-preview-dialect">
        {dialect.toUpperCase()}
        </span>
    </header>

    <div className="schema-preview-body">
        {tables.length === 0 ? (
        <div className="schema-preview-empty">
            <div className="schema-preview-empty-icon">
            <span>+</span>
            </div>

            <span className="schema-preview-empty-label">
            NO TABLES
            </span>

            <p>
            Add tables to preview
            your database structure.
            </p>
        </div>
        ) : (
        <>
            <section className="schema-preview-section">
            <div className="schema-preview-section-heading">
                <span>TABLES</span>
                <span>{tables.length}</span>
            </div>

            <div className="schema-preview-tables">
                {tables.map((table) => (
                <article
                    className="schema-preview-table"
                    key={table.id}
                >
                    <div className="schema-preview-table-header">
                    <span className="schema-preview-table-icon">
                        ▦
                    </span>

                    <span className="schema-preview-table-name">
                        {table.name}
                    </span>

                    <span className="schema-preview-column-count">
                        {table.columns.length}
                    </span>
                    </div>

                    <div className="schema-preview-columns">
                    {table.columns.length === 0 ? (
                        <div className="schema-preview-no-columns">
                        No columns
                        </div>
                    ) : (
                        table.columns.map((column) => (
                        <div
                            className="schema-preview-column"
                            key={column.id}
                        >
                            <div className="schema-preview-column-info">
                            <span
                                className={`schema-preview-key ${
                                column.isPrimaryKey
                                    ? "pk"
                                    : ""
                                }`}
                            >
                                {column.isPrimaryKey ? "PK" : "—"}
                            </span>

                            <span className="schema-preview-column-name">
                                {column.name || "unnamed"}
                            </span>
                            </div>

                            <div className="schema-preview-column-meta">
                            <span className="column-type">
                                {column.type || "TEXT"}
                                {column.type === "VARCHAR" &&
                                column.length
                                ? `(${column.length})`
                                : ""}
                            </span>

                            {!column.isNullable && (
                                <span className="column-badge">
                                NN
                                </span>
                            )}

                            {column.isUnique && (
                                <span className="column-badge">
                                UQ
                                </span>
                            )}
                            </div>
                        </div>
                        ))
                    )}
                    </div>
                </article>
                ))}
            </div>
            </section>

            {relationships.length > 0 && (
            <section className="schema-preview-section schema-preview-relations">
                <div className="schema-preview-section-heading">
                <span>RELATIONSHIPS</span>
                <span>{relationships.length}</span>
                </div>

                <div className="schema-preview-relation-list">
                {relationships.map((relationship) => (
                    <div
                    className="schema-preview-relation"
                    key={relationship.id}
                    >
                    <div className="relation-end">
                        <span className="relation-table">
                        {relationship.sourceTable}
                        </span>

                        <span className="relation-column">
                        {relationship.sourceColumn}
                        </span>
                    </div>

                    <div
                        className={`relation-connector ${
                        relationship.relation === "optional"
                            ? "optional"
                            : ""
                        }`}
                    >
                        <span className="relation-line" />

                        <span className="relation-arrow">
                        →
                        </span>
                    </div>

                    <div className="relation-end target">
                        <span className="relation-table">
                        {relationship.targetTable}
                        </span>

                        <span className="relation-column">
                        {relationship.targetColumn}
                        </span>
                    </div>
                    </div>
                ))}
                </div>
            </section>
            )}
        </>
        )}
    </div>

    <footer className="schema-preview-footer">
        <div className="schema-preview-stat">
        <span className="schema-preview-stat-value">
            {tables.length}
        </span>
        <span>TABLE{tables.length === 1 ? "" : "S"}</span>
        </div>

        <span className="schema-preview-divider" />

        <div className="schema-preview-stat">
        <span className="schema-preview-stat-value">
            {relationships.length}
        </span>
        <span>
            RELATION{relationships.length === 1 ? "" : "S"}
        </span>
        </div>
    </footer>
    </div>
);
}

export default SchemaPreview;