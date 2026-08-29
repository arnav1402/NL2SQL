import { useEffect, useMemo, useState } from "react";
import {
    FiCode,
    FiCopy,
    FiCheck,
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
}) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return undefined;

        const timer = window.setTimeout(() => setCopied(false), 1500);
        return () => window.clearTimeout(timer);
    }, [copied]);

    const tables = useMemo(
        () =>
            nodes.map((node) => ({
                id: node.id,
                name: node.data?.tableName || node.id,
                columns: Array.isArray(node.data?.columns)
                    ? node.data.columns
                    : [],
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

                    if (!source || !target) {
                        return null;
                    }

                    const sourceColumns = Array.isArray(
                        source.data?.columns
                    )
                        ? source.data.columns
                        : [];

                    const targetColumns = Array.isArray(
                        target.data?.columns
                    )
                        ? target.data.columns
                        : [];

                    const sourceColumn = sourceColumns.find(
                        (column) =>
                            column.id === edge.sourceHandle
                    );

                    const targetColumn = targetColumns.find(
                        (column) =>
                            column.id === edge.targetHandle
                    );

                    const relation =
                        edge.data?.relation === "optional"
                            ? "optional"
                            : "required";

                    const cardinality =
                        edge.data?.cardinality ||
                        (edge.data?.isOneToOne ? "1:1" : "1:N");

                    const onDelete =
                        edge.data?.onDelete || "NO ACTION";

                    const onUpdate =
                        edge.data?.onUpdate || "NO ACTION";

                    return {
                        id: edge.id,
                        sourceTable:
                            source.data?.tableName || source.id,
                        sourceColumn:
                            sourceColumn?.name ||
                            edge.sourceHandle ||
                            "unknown",
                        targetTable:
                            target.data?.tableName || target.id,
                        targetColumn:
                            targetColumn?.name ||
                            edge.targetHandle ||
                            "unknown",
                        relation,
                        cardinality,
                        onDelete,
                        onUpdate,
                    };
                })
                .filter(Boolean),
        [nodes, edges]
    );

    const totalColumns = useMemo(
        () =>
            tables.reduce(
                (total, table) => total + table.columns.length,
                0
            ),
        [tables]
    );

    const totalPrimaryKeys = useMemo(
        () =>
            tables.reduce(
                (total, table) =>
                    total +
                    table.columns.filter(
                        (column) => column.isPrimaryKey
                    ).length,
                0
            ),
        [tables]
    );

    const formattedDialect = String(dialect || "postgresql").toUpperCase();
    const hasSQL = sql.trim().length > 0;

    const handleCopy = async () => {
        if (!hasSQL) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(sql);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = sql;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";

                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                textarea.remove();
            }

            setCopied(true);
        } catch (error) {
            console.error("Failed to copy SQL:", error);
            setCopied(false);
        }
    };

    const handleDownload = () => {
        if (!hasSQL) return;

        const blob = new Blob([sql], { type: "text/sql;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `schema-${dialect || "sql"}.sql`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    return (
        <aside className="schema-preview">
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

            <div className="schema-preview-code">
                {hasSQL ? (
                    <div className="schema-code-wrapper">
                        <pre className="schema-code">{sql}</pre>
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
                            Add tables and columns to generate
                            your SQL schema.
                        </p>
                    </div>
                )}
            </div>

            {relationships.length > 0 && (
                <section className="schema-preview-relations">
                    <div className="schema-preview-section-heading">
                        <div className="schema-preview-section-title">
                            <FiLink />
                            RELATIONSHIPS
                        </div>

                        <span>{relationships.length}</span>
                    </div>

                    <div className="schema-preview-relation-list">
                        {relationships.map((relationship) => (
                            <div
                                key={relationship.id}
                                className="schema-preview-relation"
                            >
                                <div className="relation-end">
                                    <span className="relation-table">
                                        {relationship.sourceTable}
                                    </span>

                                    <span className="relation-column">
                                        {relationship.sourceColumn}
                                    </span>

                                    <span className="relation-role">
                                        FOREIGN KEY
                                    </span>
                                </div>

                                <div
                                    className={`relation-connector ${
                                        relationship.relation ===
                                        "optional"
                                            ? "optional"
                                            : "required"
                                    }`}
                                >
                                    <span className="relation-cardinality">
                                        {relationship.cardinality}
                                    </span>

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

                                    <span className="relation-role target">
                                        PRIMARY / UNIQUE
                                    </span>
                                </div>

                                <div className="relation-options">
                                    <span
                                        className={
                                            relationship.relation ===
                                            "optional"
                                                ? "relation-badge optional"
                                                : "relation-badge required"
                                        }
                                    >
                                        {relationship.relation.toUpperCase()}
                                    </span>

                                    <span className="relation-badge">
                                        DELETE{" "}
                                        {relationship.onDelete}
                                    </span>

                                    <span className="relation-badge">
                                        UPDATE{" "}
                                        {relationship.onUpdate}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

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

                    <span className="schema-preview-footer-divider" />

                    <span>
                        <FiKey />
                        {totalPrimaryKeys} PK
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
                        onClick={handleCopy}
                        disabled={!hasSQL}
                    >
                        {copied ? <FiCheck /> : <FiCopy />}
                        <span>{copied ? "Copied" : "Copy SQL"}</span>
                    </button>

                    <button
                        type="button"
                        className="preview-action primary"
                        onClick={handleDownload}
                        disabled={!hasSQL}
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