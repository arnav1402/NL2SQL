// import "./ChatMessage.css";

// export default function ChatMessage({ message }) {
// if (!message) return null;

// const {
//     role,
//     type,
//     content,
//     sql,
//     columns,
//     rows,
//     explanation,
//     analysis,
//     insights,
//     answer,
//     errorTitle,
//     errorCode,
//     errorMessage,
//     details,
//     retryable,
//     onRetry,
// } = message;

// /*
// * =========================================================
// * USER
// * =========================================================
// */

// if (role === "user") {
//     return (
//     <article className="chat-message chat-message--user">
//         <div className="chat-user-row">
//         <div className="chat-user-bubble">
//             {content}
//         </div>
//         </div>
//     </article>
//     );
// }

// /*
// * =========================================================
// * ERROR
// * =========================================================
// */

// if (type === "error") {
//     return (
//     <article className="chat-message chat-message--assistant">
//         <div className="chat-assistant-row">
//         <div className="chat-assistant-avatar">
//             N
//         </div>

//         <div className="chat-assistant-content">

//             <div className="chat-assistant-name">
//             NL2SQL
//             </div>

//             <div className="chat-error-card">

//             <div className="chat-error-header">

//                 <div className="chat-error-title">
//                 <span className="chat-error-icon">
//                     !
//                 </span>

//                 <span>
//                     {errorTitle || "QUERY ERROR"}
//                 </span>
//                 </div>

//                 {errorCode && (
//                 <span className="chat-error-code">
//                     {errorCode}
//                 </span>
//                 )}

//             </div>

//             <p className="chat-error-text">
//                 {errorMessage ||
//                 content ||
//                 "The query could not be completed."}
//             </p>

//             {details && (
//                 <pre className="chat-error-details">
//                 {details}
//                 </pre>
//             )}

//             {retryable && (
//                 <button
//                 type="button"
//                 className="chat-error-retry"
//                 onClick={onRetry}
//                 >
//                 Try Again
//                 </button>
//             )}

//             </div>

//         </div>
//         </div>
//     </article>
//     );
// }

// /*
// * =========================================================
// * SCHEMA SUMMARY
// * =========================================================
// */

// if (type === "schema_summary") {
//     return (
//     <article className="chat-message chat-message--assistant">

//         <div className="chat-assistant-row">

//         <div className="chat-assistant-avatar">
//             N
//         </div>

//         <div className="chat-assistant-content">

//             <div className="chat-assistant-name">
//             NL2SQL
//             </div>

//             <div className="chat-schema-card">

//             <div className="chat-card-header">
//                 <span>DATABASE</span>

//                 <span className="chat-card-status">
//                 SCHEMA
//                 </span>
//             </div>

//             <div className="chat-schema-content">
//                 {answer ||
//                 content ||
//                 "No database information available."}
//             </div>

//             </div>

//         </div>

//         </div>

//     </article>
//     );
// }

// /*
// * =========================================================
// * SQL RESULT
// * =========================================================
// */

// if (type === "sql_result") {
//     return (
//     <article className="chat-message chat-message--assistant">

//         <div className="chat-assistant-row">

//         <div className="chat-assistant-avatar">
//             N
//         </div>

//         <div className="chat-assistant-content">

//             <div className="chat-assistant-name">
//             NL2SQL
//             </div>

//             <div className="chat-answer-grid">

//             {/* =================================================
//                 LEFT — SQL + RESULT
//             ================================================= */}

//             <div className="chat-answer-card">

//                 <div className="chat-card-header">

//                 <span>
//                     QUERY EXECUTED
//                 </span>

//                 <span className="chat-card-status">
//                     SQL
//                 </span>

//                 </div>

//                 <div className="chat-sql">

//                 {Array.isArray(sql) ? (
//                     sql.map((line, index) => (
//                     <div
//                         className="chat-sql-line"
//                         key={index}
//                     >
//                         <span className="chat-sql-number">
//                         {String(index + 1).padStart(2, "0")}
//                         </span>

//                         <span>
//                         {line}
//                         </span>
//                     </div>
//                     ))
//                 ) : (
//                     <div className="chat-sql-line">
//                     {sql || "-- No SQL returned"}
//                     </div>
//                 )}

//                 </div>

//                 <div className="chat-result">

//                 <div className="chat-card-header">

//                     <span>
//                     RESULT
//                     </span>

//                     <span className="chat-card-status">
//                     {Array.isArray(rows)
//                         ? `${rows.length} ${
//                             rows.length === 1
//                             ? "ROW"
//                             : "ROWS"
//                         }`
//                         : "0 ROWS"}
//                     </span>

//                 </div>

//                 {Array.isArray(columns) &&
//                 Array.isArray(rows) &&
//                 columns.length > 0 ? (

//                     <div className="chat-table-wrap">

//                     <table className="chat-table">

//                         <thead>
//                         <tr>
//                             {columns.map(
//                             (column, index) => (
//                                 <th
//                                 key={`${column}-${index}`}
//                                 >
//                                 {column}
//                                 </th>
//                             )
//                             )}
//                         </tr>
//                         </thead>

//                         <tbody>

//                         {rows.map(
//                             (row, rowIndex) => (
//                             <tr key={rowIndex}>

//                                 {Array.isArray(row)
//                                 ? row.map(
//                                     (
//                                         cell,
//                                         cellIndex
//                                     ) => (
//                                         <td
//                                         key={
//                                             cellIndex
//                                         }
//                                         >
//                                         {cell ===
//                                             null ||
//                                         cell ===
//                                             undefined
//                                             ? "NULL"
//                                             : String(
//                                                 cell
//                                             )}
//                                         </td>
//                                     )
//                                     )
//                                 : (
//                                     <td>
//                                         {String(row)}
//                                     </td>
//                                     )}

//                             </tr>
//                             )
//                         )}

//                         </tbody>

//                     </table>

//                     </div>

//                 ) : (
//                     <div className="chat-empty-result">
//                     No rows returned.
//                     </div>
//                 )}

//                 </div>

//             </div>

//             {/* =================================================
//                 RIGHT — ANALYSIS
//             ================================================= */}

//             <div className="chat-analysis-card">

//                 <div className="chat-card-header">

//                 <span>
//                     ANALYSIS
//                 </span>

//                 <span className="chat-card-status">
//                     ∑
//                 </span>

//                 </div>

//                 <div className="chat-analysis-content">

//                 <p>
//                     {explanation ||
//                     analysis ||
//                     "The query was executed successfully."}
//                 </p>

//                 {Array.isArray(insights) &&
//                     insights.length > 0 && (
//                     <div className="chat-insights">

//                         <div className="chat-insights-label">
//                         INSIGHTS
//                         </div>

//                         {insights.map(
//                         (insight, index) => (
//                             <div
//                             className="chat-insight"
//                             key={index}
//                             >
//                             <span>—</span>
//                             <span>
//                                 {insight}
//                             </span>
//                             </div>
//                         )
//                         )}

//                     </div>
//                     )}

//                 </div>

//             </div>

//             </div>

//         </div>

//         </div>

//     </article>
//     );
// }

// /*
// * =========================================================
// * GENERIC ASSISTANT RESPONSE
// * =========================================================
// */

// return (
//     <article className="chat-message chat-message--assistant">

//     <div className="chat-assistant-row">

//         <div className="chat-assistant-avatar">
//         N
//         </div>

//         <div className="chat-assistant-content">

//         <div className="chat-assistant-name">
//             NL2SQL
//         </div>

//         <div className="chat-generic-card">
//             {content ||
//             answer ||
//             "No response available."}
//         </div>

//         </div>

//     </div>

//     </article>
// );
// }


export default function ChatMessage({ message }) {
if (!message) {
    return null;
}

const isUser = message.role === "user";

if (isUser) {
    return (
    <div className="chat-message chat-message-user">
        <div className="chat-message-content">
        {message.content}
        </div>
    </div>
    );
}

const sql = Array.isArray(message.sql)
    ? message.sql.join("\n")
    : message.sql || "";

const columns = Array.isArray(message.columns)
    ? message.columns
    : [];

const rows = Array.isArray(message.rows)
    ? message.rows
    : [];

return (
    <div className="chat-message chat-message-assistant">
    {sql && (
        <div className="chat-result-section">
        <div className="chat-result-label">
            SQL QUERY
        </div>

        <pre className="chat-sql">
            <code>{sql}</code>
        </pre>
        </div>
    )}

    {columns.length > 0 && (
        <div className="chat-result-section">
        <div className="chat-result-label">
            RESULTS
        </div>

        <div className="chat-result-table-wrapper">
            <table className="chat-result-table">
            <thead>
                <tr>
                {columns.map((column, index) => (
                    <th key={`${column}-${index}`}>
                    {column}
                    </th>
                ))}
                </tr>
            </thead>

            <tbody>
                {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                    {columns.map((_, columnIndex) => (
                    <td key={`${rowIndex}-${columnIndex}`}>
                        {row?.[columnIndex] ?? ""}
                    </td>
                    ))}
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    )}

    {message.explanation && (
        <div className="chat-result-section">
        <div className="chat-result-label">
            EXPLANATION
        </div>

        <p className="chat-explanation">
            {message.explanation}
        </p>
        </div>
    )}

    {Array.isArray(message.insights) &&
        message.insights.length > 0 && (
        <div className="chat-result-section">
            <div className="chat-result-label">
            INSIGHTS
            </div>

            <ul className="chat-insights">
            {message.insights.map((insight, index) => (
                <li key={index}>
                {insight}
                </li>
            ))}
            </ul>
        </div>
        )}
    </div>
);
}