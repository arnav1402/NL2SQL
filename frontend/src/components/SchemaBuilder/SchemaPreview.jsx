import { useMemo } from "react";
import {
FiCode,
FiCopy,
FiDownload,
FiDatabase,
FiLink,
FiKey,
} from "react-icons/fi";

import "./SchemaPreview.css";

function SchemaPreview({
nodes = [],
edges = [],
dialect = "postgresql",
sql = "",
onCopy,
onDownload,
}) {
const tables = useMemo(
    () =>
    nodes.map((node) => ({
        id: node.id,
        name: node.data?.tableName || node.id,
        columns: node.data?.columns || [],
    })),
    [nodes]
);

const relationships = useMemo(
    () =>
    edges
        .map((edge) => {
        const source = nodes.find(
            (node) => node.id === edge.source
        );

        const target = nodes.find(
            (node) => node.id === edge.target
        );

        const sourceColumn =
            source?.data?.columns?.find(
            (column) =>
                column.id === edge.sourceHandle
            );

        const targetColumn =
            target?.data?.columns?.find(
            (column) =>
                column.id === edge.targetHandle
            );

        if (!source || !target) {
            return null;
        }

        return {
            id: edge.id,

            sourceTable:
            source.data?.tableName ||
            source.id,

            sourceColumn:
            sourceColumn?.name ||
            edge.sourceHandle ||
            "unknown",

            targetTable:
            target.data?.tableName ||
            target.id,

            targetColumn:
            targetColumn?.name ||
            edge.targetHandle ||
            "unknown",

            relation:
            edge.data?.relation === "optional"
                ? "optional"
                : "required",
        };
        })
        .filter(Boolean),
    [nodes, edges]
);

const totalColumns = useMemo(
    () =>
    tables.reduce(
        (total, table) =>
        total + table.columns.length,
        0
    ),
    [tables]
);

const formattedDialect =
    dialect.toUpperCase();

return (
    <aside className="schema-preview">
    {/* =========================================
        HEADER
    ========================================= */}

    <header className="schema-preview-header">
        <div className="schema-preview-header-main">
        <div className="schema-preview-title-row">
            <span className="schema-preview-title-icon">
            <FiCode />
            </span>

            <div className="schema-preview-heading">
            <span className="schema-preview-eyebrow">
                GENERATED DDL
            </span>

            <h2>SQL Preview</h2>
            </div>
        </div>
        </div>

        <div className="schema-preview-dialect">
        {formattedDialect}
        </div>
    </header>

    {/* =========================================
        CODE
    ========================================= */}

    <div className="schema-preview-code">
        {sql ? (
        <div className="schema-code-wrapper">
            <pre className="schema-code">
            {sql}
            </pre>
        </div>
        ) : (
        <div className="schema-preview-empty">
            <div className="schema-preview-empty-icon">
            <FiDatabase />
            </div>

            <div className="schema-preview-empty-label">
            NO DDL GENERATED
            </div>

            <p>
            Add tables and relationships to
            generate the SQL schema.
            </p>
        </div>
        )}
    </div>

    {/* =========================================
        RELATIONSHIP INSPECTOR
    ========================================= */}

    {relationships.length > 0 && (
        <section className="schema-preview-relations">
        <div className="schema-preview-section-heading">
            <div className="schema-preview-section-title">
            <FiLink />
            RELATIONSHIPS
            </div>

            <span>
            {relationships.length}
            </span>
        </div>

        <div className="schema-preview-relation-list">
            {relationships.map((relation) => (
            <div
                key={relation.id}
                className="schema-preview-relation"
            >
                <div className="relation-end">
                <span className="relation-table">
                    {relation.sourceTable}
                </span>

                <span className="relation-column">
                    {relation.sourceColumn}
                </span>
                </div>

                <div
                className={`relation-connector ${
                    relation.relation ===
                    "optional"
                    ? "optional"
                    : "required"
                }`}
                >
                <span className="relation-line" />

                <span className="relation-arrow">
                    →
                </span>
                </div>

                <div className="relation-end target">
                <span className="relation-table">
                    {relation.targetTable}
                </span>

                <span className="relation-column">
                    {relation.targetColumn}
                </span>
                </div>
            </div>
            ))}
        </div>
        </section>
    )}

    {/* =========================================
        FOOTER
    ========================================= */}

    <footer className="schema-preview-footer">
        <div className="schema-preview-stats">
        <span>
            <FiDatabase />
            {tables.length} TABLES
        </span>

        <span className="schema-preview-footer-divider" />

        <span>
            <FiKey />
            {totalColumns} COLUMNS
        </span>

        {relationships.length > 0 && (
            <>
            <span className="schema-preview-footer-divider" />

            <span>
                <FiLink />
                {relationships.length} RELATIONS
            </span>
            </>
        )}
        </div>

        <div className="schema-preview-actions">
        <button
            type="button"
            className="preview-action"
            onClick={onCopy}
            disabled={!sql}
        >
            <FiCopy />
            <span>Copy SQL</span>
        </button>

        <button
            type="button"
            className="preview-action primary"
            onClick={onDownload}
            disabled={!sql}
        >
            <FiDownload />
            <span>Download .sql</span>
        </button>
        </div>
    </footer>
    </aside>
);
}

export default SchemaPreview;