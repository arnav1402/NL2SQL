import React from "react";
import "./ChatMessage.css";
import ReactMarkdown from "react-markdown";
import { FiCheck, FiCopy, FiDownload } from "react-icons/fi";
import remarkGfm from "remark-gfm";

const markdownComponents = {
    h1: ({ children }) => <h3 className="chat-md-heading">{children}</h3>,
    h2: ({ children }) => <h3 className="chat-md-heading">{children}</h3>,
    h3: ({ children }) => <h4 className="chat-md-heading">{children}</h4>,

    p: ({ children }) => (
        <p className="chat-md-paragraph">{children}</p>
    ),

    ul: ({ children }) => (
        <ul className="chat-md-list">{children}</ul>
    ),

    ol: ({ children }) => (
        <ol className="chat-md-list">{children}</ol>
    ),

    li: ({ children }) => (
        <li className="chat-md-list-item">{children}</li>
    ),

    strong: ({ children }) => (
        <strong className="chat-md-strong">{children}</strong>
    ),

    blockquote: ({ children }) => (
        <blockquote className="chat-md-blockquote">
            {children}
        </blockquote>
    ),

    hr: () => <hr className="chat-md-divider" />,

    code: ({ inline, className, children, ...props }) => {
        const language =
            className?.replace("language-", "") || "";

        if (inline) {
            return (
                <code className="chat-md-inline-code" {...props}>
                    {children}
                </code>
            );
        }

        return (
            <div className="chat-md-code-block">
                {language && (
                    <div className="chat-md-code-language">
                        {language}
                    </div>
                )}

                <pre>
                    <code {...props}>{children}</code>
                </pre>
            </div>
        );
    },

    table: ({ children }) => (
        <div className="chat-md-table-wrap">
            <table className="chat-md-table">{children}</table>
        </div>
    ),

    thead: ({ children }) => <thead>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr>{children}</tr>,

    th: ({ children }) => <th>{children}</th>,
    td: ({ children }) => <td>{children}</td>,
};


const csvValue = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    let stringValue;

    if (typeof value === "object") {
        try {
            stringValue = JSON.stringify(value);
        } catch {
            stringValue = String(value);
        }
    } else {
        stringValue = String(value);
    }

    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
};

const buildCsv = (columns, rows) => {
    const header = columns.map(csvValue).join(",");

    const body = rows.map((row) =>
        columns
            .map((column, columnIndex) => {
                let value;

                if (Array.isArray(row)) {
                    value = row[columnIndex];
                } else if (row && typeof row === "object") {
                    value = row[column];
                }

                return csvValue(value);
            })
            .join(",")
    );

    return [header, ...body].join("\r\n");
};

function MarkdownContent({ children, className = "" }) {
    if (
        children === null ||
        children === undefined ||
        children === ""
    ) {
        return null;
    }

    return (
        <div className={`chat-markdown ${className}`.trim()}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {String(children)}
            </ReactMarkdown>
        </div>
    );
}

export default function ChatMessage({ message }) {
    const [copied, setCopied] = React.useState(null);

    if (!message) {
        return null;
    }

    const {
        role,
        type,
        content,
        sql,
        columns,
        rows,
        answer,
        errorTitle,
        errorCode,
        errorMessage,
        details,
        retryable,
        onRetry,
        explanation,
        analysis,
        insights,
        truncated,
        total_rows_available,
    } = message;

    /*
     * =========================================================
     * USER MESSAGE
     * =========================================================
     */

    if (role === "user") {
        return (
            <article className="chat-message chat-message--user">
                <div className="chat-user-row">
                    <div className="chat-user-bubble">
                        <MarkdownContent>
                            {content}
                        </MarkdownContent>
                    </div>
                </div>
            </article>
        );
    }

    /*
     * =========================================================
     * ERROR MESSAGE
     * =========================================================
     */

    if (type === "error") {
        return (
            <article className="chat-message chat-message--assistant">
                <div className="chat-assistant-row">
                    <div className="chat-assistant-avatar">
                        N
                    </div>

                    <div className="chat-assistant-content">
                        <div className="chat-assistant-name">
                            NL2SQL
                        </div>

                        <div className="chat-error-card">
                            <div className="chat-error-header">
                                <div className="chat-error-title">
                                    <span className="chat-error-icon">
                                        !
                                    </span>

                                    <span>
                                        {errorTitle ||
                                            "QUERY ERROR"}
                                    </span>
                                </div>

                                {errorCode && (
                                    <span className="chat-error-code">
                                        {errorCode}
                                    </span>
                                )}
                            </div>

                            <div className="chat-error-text">
                                <MarkdownContent>
                                    {errorMessage ||
                                        content ||
                                        "The query could not be completed."}
                                </MarkdownContent>
                            </div>

                            {details && (
                                <pre className="chat-error-details">
                                    {typeof details === "string"
                                        ? details
                                        : JSON.stringify(
                                                details,
                                                null,
                                                2
                                        )}
                                </pre>
                            )}

                            {retryable &&
                                typeof onRetry ===
                                    "function" && (
                                    <button
                                        type="button"
                                        className="chat-error-retry"
                                        onClick={onRetry}
                                    >
                                        Try Again
                                    </button>
                                )}
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    /*
     * =========================================================
     * SCHEMA SUMMARY
     * =========================================================
     */

    if (type === "schema_summary") {
        return (
            <article className="chat-message chat-message--assistant">
                <div className="chat-assistant-row">
                    <div className="chat-assistant-avatar">
                        N
                    </div>

                    <div className="chat-assistant-content">
                        <div className="chat-assistant-name">
                            NL2SQL
                        </div>

                        <div className="chat-schema-card">
                            <div className="chat-card-header">
                                <span>DATABASE</span>

                                <span className="chat-card-status">
                                    SCHEMA
                                </span>
                            </div>

                            <div className="chat-schema-content">
                                <MarkdownContent>
                                    {answer ||
                                        content ||
                                        "No database information available."}
                                </MarkdownContent>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    /*
     * =========================================================
     * SQL RESULT
     * =========================================================
     */

    if (type === "sql_result") {
        const normalizedSql = Array.isArray(sql)
            ? sql.join("\n")
            : sql || "";

        const normalizedColumns = Array.isArray(columns)
            ? columns
            : [];

        const normalizedRows = Array.isArray(rows)
            ? rows
            : [];

        return (
            <article className="chat-message chat-message--assistant">
                <div className="chat-assistant-row">
                    <div className="chat-assistant-avatar">
                        N
                    </div>

                    <div className="chat-assistant-content">
                        <div className="chat-assistant-name">
                            NL2SQL
                        </div>

                        <div className="chat-answer-card">
                            <div className="chat-card-header">
                                <span>QUERY EXECUTED</span>

                                <span className="chat-card-status">
                                    SQL
                                </span>
                            </div>

                            {normalizedSql && (
                                <section className="chat-sql-section">
                                    <div className="chat-sql-label">
                                        <span>SQL</span>
                                        <button
                                            type="button"
                                            className="chat-output-button"
                                            onClick={async () => {
                                                try {
                                                    await navigator.clipboard.writeText(normalizedSql);
                                                    setCopied("sql");
                                                    window.setTimeout(() => setCopied(null), 1600);
                                                } catch {
                                                    setCopied(null);
                                                }
                                            }}
                                            title="Copy SQL"
                                            aria-label="Copy SQL"
                                        >
                                            {copied === "sql" ? <FiCheck /> : <FiCopy />}
                                            <span>{copied === "sql" ? "Copied" : "Copy"}</span>
                                        </button>
                                    </div>

                                    <div className="chat-sql">
                                    {normalizedSql
                                        .split("\n")
                                        .map(
                                            (
                                                line,
                                                index
                                            ) => (
                                                <div
                                                    className="chat-sql-line"
                                                    key={index}
                                                >
                                                    <span className="chat-sql-number">
                                                        {String(
                                                            index +
                                                                1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </span>

                                                    <span>
                                                        {line}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </section>
                            )}

                            <div className="chat-result">
                                <div className="chat-result-header">
                                    <span className="chat-result-title">RESULT</span>

                                    <div className="chat-result-actions">
                                        <span className="chat-result-count">
                                            {normalizedRows.length}{" "}
                                            {normalizedRows.length === 1 ? "ROW" : "ROWS"}
                                        </span>

                                        {normalizedColumns.length > 0 && normalizedRows.length > 0 && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="chat-output-button"
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(
                                                                buildCsv(normalizedColumns, normalizedRows)
                                                            );
                                                            setCopied("csv");
                                                            window.setTimeout(() => setCopied(null), 1600);
                                                        } catch {
                                                            setCopied(null);
                                                        }
                                                    }}
                                                    title="Copy result as CSV"
                                                    aria-label="Copy result as CSV"
                                                >
                                                    {copied === "csv" ? <FiCheck /> : <FiCopy />}
                                                    <span>{copied === "csv" ? "Copied" : "Copy CSV"}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="chat-output-button"
                                                    onClick={() => {
                                                        const csv = buildCsv(normalizedColumns, normalizedRows);
                                                        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                                                        const url = URL.createObjectURL(blob);
                                                        const link = document.createElement("a");
                                                        link.href = url;
                                                        link.download = "query-results.csv";
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        link.remove();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    title="Download result as CSV"
                                                    aria-label="Download result as CSV"
                                                >
                                                    <FiDownload />
                                                    <span>Download CSV</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {normalizedColumns.length >
                                    0 &&
                                normalizedRows.length >
                                    0 ? (
                                    <div className="chat-table-wrap">
                                        <table className="chat-table">
                                            <thead>
                                                <tr>
                                                    {normalizedColumns.map(
                                                        (
                                                            column,
                                                            index
                                                        ) => (
                                                            <th
                                                                key={`${String(
                                                                    column
                                                                )}-${index}`}
                                                            >
                                                                {
                                                                    column
                                                                }
                                                            </th>
                                                        )
                                                    )}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {normalizedRows.map(
                                                    (
                                                        row,
                                                        rowIndex
                                                    ) => (
                                                        <tr
                                                            key={
                                                                rowIndex
                                                            }
                                                        >
                                                            {normalizedColumns.map(
                                                                (
                                                                    column,
                                                                    columnIndex
                                                                ) => {
                                                                    let value;

                                                                    if (
                                                                        Array.isArray(
                                                                            row
                                                                        )
                                                                    ) {
                                                                        value =
                                                                            row[
                                                                                columnIndex
                                                                            ];
                                                                    } else if (
                                                                        row &&
                                                                        typeof row ===
                                                                            "object"
                                                                    ) {
                                                                        value =
                                                                            row[
                                                                                column
                                                                            ];
                                                                    } else {
                                                                        value =
                                                                            undefined;
                                                                    }

                                                                    return (
                                                                        <td
                                                                            key={`${rowIndex}-${columnIndex}`}
                                                                        >
                                                                            {value ===
                                                                                null ||
                                                                            value ===
                                                                                undefined
                                                                                ? "NULL"
                                                                                : String(
                                                                                        value
                                                                                )}
                                                                        </td>
                                                                    );
                                                                }
                                                            )}
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="chat-empty-result">
                                        No rows returned.
                                    </div>
                                )}

                                {truncated && (
                                    <div className="chat-result-truncated">
                                        Showing the first{" "}
                                        {
                                            normalizedRows.length
                                        }{" "}
                                        rows.
                                        {total_rows_available && (
                                            <>
                                                {" "}
                                                More rows are
                                                available.
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    /*
     * =========================================================
     * GENERIC ASSISTANT RESPONSE
     * =========================================================
     */

    const genericContent =
        content ||
        answer ||
        explanation ||
        analysis ||
        "No response available.";

    return (
        <article className="chat-message chat-message--assistant">
            <div className="chat-assistant-row">
                <div className="chat-assistant-avatar">
                    N
                </div>

                <div className="chat-assistant-content">
                    <div className="chat-assistant-name">
                        NL2SQL
                    </div>

                    <div className="chat-generic-card">
                        <MarkdownContent>
                            {genericContent}
                        </MarkdownContent>

                        {Array.isArray(insights) &&
                            insights.length > 0 && (
                                <div className="chat-insights">
                                    <div className="chat-insights-label">
                                        INSIGHTS
                                    </div>

                                    {insights.map(
                                        (
                                            insight,
                                            index
                                        ) => (
                                            <div
                                                className="chat-insight"
                                                key={index}
                                            >
                                                <span>—</span>

                                                <MarkdownContent>
                                                    {insight}
                                                </MarkdownContent>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </article>
    );
}