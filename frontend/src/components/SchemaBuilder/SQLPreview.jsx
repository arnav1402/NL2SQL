import "./SQLPreview.css";
import { useState } from "react";

function SQLPreview({ sql, dialect }) {
const [copied, setCopied] = useState(false);

const handleCopy = async () => {
    try {
    await navigator.clipboard.writeText(sql || "");
    setCopied(true);

    setTimeout(() => {
        setCopied(false);
    }, 1500);
    } catch (error) {
    console.error("Failed to copy SQL:", error);
    }
};

const handleDownload = () => {
    if (!sql) return;

    const blob = new Blob([sql], {
    type: "text/sql;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `schema-${dialect || "sql"}.sql`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

const lines = (sql || "").split("\n");
const hasSQL = Boolean(sql?.trim());

return (
    <div className="sql-preview">
    <header className="sql-preview-header">
        <div className="sql-preview-title">
        <span className="sql-preview-indicator" />

        <div className="sql-preview-heading">
            <span className="sql-preview-eyebrow">
            GENERATED DDL
            </span>

            <h3>SQL Preview</h3>
        </div>
        </div>

        <span className="sql-dialect">
        {(dialect || "sql").toUpperCase()}
        </span>
    </header>

    <div className="sql-preview-body">
        {hasSQL ? (
        <div className="sql-code">
            {lines.map((line, index) => (
            <div className="sql-line" key={`${index}-${line}`}>
                <span className="sql-line-number">
                {String(index + 1).padStart(2, "0")}
                </span>

                <code>{line || "\u00A0"}</code>
            </div>
            ))}
        </div>
        ) : (
        <div className="sql-empty">
            <div className="sql-empty-symbol">
            {"</>"}
            </div>

            <h4>No SQL generated</h4>

            <p>
            Add tables and columns to
            generate your database schema.
            </p>
        </div>
        )}
    </div>

    <footer className="sql-preview-footer">
        <button
        type="button"
        className="sql-action"
        onClick={handleCopy}
        disabled={!hasSQL}
        >
        <span className="sql-action-icon">
            {copied ? "✓" : "□"}
        </span>

        {copied ? "Copied" : "Copy SQL"}
        </button>

        <button
        type="button"
        className="sql-action sql-action-primary"
        onClick={handleDownload}
        disabled={!hasSQL}
        >
        Download .sql
        <span className="sql-download-arrow">↗</span>
        </button>
    </footer>
    </div>
);
}

export default SQLPreview;