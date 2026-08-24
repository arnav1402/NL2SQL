import { useState } from "react";
import {
FiCheck,
FiClipboard,
FiDownload,
FiCode,
} from "react-icons/fi";

import "./SQLPreview.css";

function SQLPreview({ sql = "", dialect = "postgresql" }) {
const [copied, setCopied] = useState(false);

const hasSQL = Boolean(sql?.trim());

const handleCopy = async () => {
    if (!hasSQL) return;

    try {
    await navigator.clipboard.writeText(sql);

    setCopied(true);

    window.setTimeout(() => {
        setCopied(false);
    }, 1500);
    } catch (error) {
    console.error("Failed to copy SQL:", error);
    }
};

const handleDownload = () => {
    if (!hasSQL) return;

    const blob = new Blob([sql], {
    type: "text/sql;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `schema-${dialect || "sql"}.sql`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
};

const lines = sql.split("\n");

return (
    <aside className="sql-preview">
    {/* =====================================================
        HEADER
    ===================================================== */}

    <header className="sql-preview-header">
        <div className="sql-preview-title">
        <div className="sql-preview-icon">
            <FiCode />
        </div>

        <div className="sql-preview-heading">
            <span className="sql-preview-eyebrow">
            GENERATED DDL
            </span>

            <h3>SQL Preview</h3>
        </div>
        </div>

        <div className="sql-dialect">
        {dialect.toUpperCase()}
        </div>
    </header>

    {/* =====================================================
        SQL BODY
    ===================================================== */}

    <div className="sql-preview-body">
        {hasSQL ? (
        <div className="sql-code">
            {lines.map((line, index) => (
            <div
                className="sql-line"
                key={`${index}-${line}`}
            >
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
            <FiCode />
            </div>

            <h4>NO SQL GENERATED</h4>

            <p>
            Add tables and columns to
            generate your database schema.
            </p>
        </div>
        )}
    </div>

    {/* =====================================================
        FOOTER
    ===================================================== */}

    <footer className="sql-preview-footer">
        <div className="sql-preview-status">
        <span className="sql-status-dot" />

        <span>
            {hasSQL ? "SCHEMA READY" : "WAITING FOR SCHEMA"}
        </span>
        </div>

        <div className="sql-preview-actions">
        <button
            type="button"
            className="sql-action"
            onClick={handleCopy}
            disabled={!hasSQL}
        >
            {copied ? (
            <FiCheck className="sql-action-icon" />
            ) : (
            <FiClipboard className="sql-action-icon" />
            )}

            <span>
            {copied ? "Copied" : "Copy SQL"}
            </span>
        </button>

        <button
            type="button"
            className="sql-action sql-action-primary"
            onClick={handleDownload}
            disabled={!hasSQL}
        >
            <FiDownload className="sql-action-icon" />

            <span>Download</span>
        </button>
        </div>
    </footer>
    </aside>
);
}

export default SQLPreview;