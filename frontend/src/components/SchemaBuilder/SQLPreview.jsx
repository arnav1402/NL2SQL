// import { useEffect, useMemo, useState } from "react";
// import {
//     FiCheck,
//     FiClipboard,
//     FiDownload,
//     FiCode,
// } from "react-icons/fi";

// import "./SQLPreview.css";

// function SQLPreview({
//     sql = "",
//     dialect = "postgresql",
// }) {
//     const [copied, setCopied] = useState(false);

//     const normalizedSQL =
//         typeof sql === "string" ? sql.trimEnd() : "";

//     const hasSQL = normalizedSQL.trim().length > 0;

//     const lines = useMemo(
//         () => (hasSQL ? normalizedSQL.split("\n") : []),
//         [normalizedSQL, hasSQL]
//     );

//     useEffect(() => {
//         if (!copied) return;

//         const timer = window.setTimeout(() => {
//             setCopied(false);
//         }, 1500);

//         return () => window.clearTimeout(timer);
//     }, [copied]);

//     const normalizedDialect =
//         String(dialect || "postgresql")
//             .trim()
//             .toLowerCase();

//     const dialectLabel =
//         normalizedDialect === "postgresql"
//             ? "POSTGRESQL"
//             : normalizedDialect === "mysql"
//               ? "MYSQL"
//               : normalizedDialect === "sqlite"
//                 ? "SQLITE"
//                 : normalizedDialect.toUpperCase();

//     const handleCopy = async () => {
//         if (!hasSQL) return;

//         try {
//             if (navigator.clipboard?.writeText) {
//                 await navigator.clipboard.writeText(normalizedSQL);
//             } else {
//                 const textarea =
//                     document.createElement("textarea");

//                 textarea.value = normalizedSQL;
//                 textarea.setAttribute("readonly", "");
//                 textarea.style.position = "fixed";
//                 textarea.style.opacity = "0";

//                 document.body.appendChild(textarea);
//                 textarea.select();
//                 document.execCommand("copy");
//                 textarea.remove();
//             }

//             setCopied(true);
//         } catch (error) {
//             console.error("Failed to copy SQL:", error);
//             setCopied(false);
//         }
//     };

//     const handleDownload = () => {
//         if (!hasSQL) return;

//         const blob = new Blob([normalizedSQL], {
//             type: "text/sql;charset=utf-8",
//         });

//         const url = URL.createObjectURL(blob);
//         const link = document.createElement("a");

//         link.href = url;
//         link.download = `schema-${normalizedDialect || "sql"}.sql`;

//         document.body.appendChild(link);
//         link.click();
//         link.remove();

//         window.setTimeout(() => {
//             URL.revokeObjectURL(url);
//         }, 100);
//     };

//     return (
//         <aside className="sql-preview">
//             <header className="sql-preview-header">
//                 <div className="sql-preview-title">
//                     <div className="sql-preview-icon">
//                         <FiCode aria-hidden="true" />
//                     </div>

//                     <div className="sql-preview-heading">
//                         <span className="sql-preview-eyebrow">
//                             GENERATED DDL
//                         </span>

//                         <h3>SQL Preview</h3>
//                     </div>
//                 </div>

//                 <div className="sql-dialect">
//                     {dialectLabel}
//                 </div>
//             </header>

//             <div className="sql-preview-body">
//                 {hasSQL ? (
//                     <div
//                         className="sql-code"
//                         role="region"
//                         aria-label="Generated SQL"
//                     >
//                         {lines.map((line, index) => (
//                             <div
//                                 className="sql-line"
//                                 key={`${index}-${line}`}
//                             >
//                                 <span
//                                     className="sql-line-number"
//                                     aria-hidden="true"
//                                 >
//                                     {String(index + 1).padStart(
//                                         2,
//                                         "0"
//                                     )}
//                                 </span>

//                                 <code>
//                                     {line || "\u00A0"}
//                                 </code>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div className="sql-empty">
//                         <div className="sql-empty-symbol">
//                             <FiCode aria-hidden="true" />
//                         </div>

//                         <h4>NO SQL GENERATED</h4>

//                         <p>
//                             Add tables and columns to
//                             generate your database schema.
//                         </p>
//                     </div>
//                 )}
//             </div>

//             <footer className="sql-preview-footer">
//                 <div className="sql-preview-status">
//                     <span
//                         className={`sql-status-dot ${
//                             hasSQL ? "ready" : "waiting"
//                         }`}
//                     />

//                     <span>
//                         {hasSQL
//                             ? "SCHEMA READY"
//                             : "WAITING FOR SCHEMA"}
//                     </span>
//                 </div>

//                 <div className="sql-preview-actions">
//                     <button
//                         type="button"
//                         className="sql-action"
//                         onClick={handleCopy}
//                         disabled={!hasSQL}
//                         aria-label={
//                             copied
//                                 ? "SQL copied"
//                                 : "Copy generated SQL"
//                         }
//                     >
//                         {copied ? (
//                             <FiCheck
//                                 className="sql-action-icon"
//                                 aria-hidden="true"
//                             />
//                         ) : (
//                             <FiClipboard
//                                 className="sql-action-icon"
//                                 aria-hidden="true"
//                             />
//                         )}

//                         <span>
//                             {copied ? "Copied" : "Copy SQL"}
//                         </span>
//                     </button>

//                     <button
//                         type="button"
//                         className="sql-action sql-action-primary"
//                         onClick={handleDownload}
//                         disabled={!hasSQL}
//                         aria-label="Download generated SQL"
//                     >
//                         <FiDownload
//                             className="sql-action-icon"
//                             aria-hidden="true"
//                         />

//                         <span>Download</span>
//                     </button>
//                 </div>
//             </footer>
//         </aside>
//     );
// }

// export default SQLPreview;