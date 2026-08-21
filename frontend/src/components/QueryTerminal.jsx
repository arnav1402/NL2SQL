import { useEffect, useRef, useState } from "react";

/*
Visual-only terminal demo.

The terminal cycles through:
1. Simple SELECT / aggregation
2. JOIN / analytical query
3. Destructive query that gets visually blocked

Nothing here executes against a real database.
*/

const DEMOS = [
{
    question: "How many users signed up last month?",

    sql: [
    "SELECT COUNT(*) AS signups",
    "FROM users",
    "WHERE created_at >=",
    "  date_trunc('month', now())",
    "    - interval '1 month'",
    ],

    table: {
    columns: ["metric", "value"],
    rows: [
        ["signups", "1,204"],
        ["vs. prior month", "+18%"],
        ["source", "users"],
    ],
    },

    conclusion:
    "1,204 users signed up last month — up 18% on the month before.",

    status: "validated",
},

{
    question: "Show our top 5 customers by revenue.",

    sql: [
    "SELECT customers.name,",
    "  SUM(orders.amount) AS revenue",
    "FROM customers",
    "JOIN orders",
    "  ON orders.customer_id = customers.id",
    "GROUP BY customers.name",
    "ORDER BY revenue DESC",
    "LIMIT 5",
    ],

    table: {
    columns: ["customer", "revenue"],
    rows: [
        ["Acme Corp", "$48,920"],
        ["Globex", "$41,230"],
        ["Umbrella", "$37,840"],
        ["Initech", "$31,520"],
        ["Stark Industries", "$28,410"],
    ],
    },

    conclusion:
    "Top customers ranked by total order revenue.",

    status: "validated",
},

{
    question: "Delete all inactive users.",

    sql: [
    "DELETE FROM users",
    "WHERE last_login <",
    "  now() - interval '1 year';",
    ],

    error: {
    code: "NL2SQL-403",
    title: "DESTRUCTIVE OPERATION",
    message: "DELETE statements are not permitted.",
    detail: "Query execution prevented.",
    },

    conclusion:
    "Destructive operation detected — query blocked before execution.",

    status: "blocked",
},
];

const TYPE_SPEED_MS = 34;
const HOLD_AFTER_TYPE_MS = 550;
const THINKING_MS = 900;
const HOLD_RESULT_MS = 4000;
const RESET_PAUSE_MS = 900;

export default function QueryTerminal({ onPhaseChange }) {
const [demoIndex, setDemoIndex] = useState(0);
const [typed, setTyped] = useState("");
const [phase, setPhase] = useState("typing");

const reducedMotion = useRef(
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
);

const demo = DEMOS[demoIndex];

useEffect(() => {
    onPhaseChange?.(
    demo.status === "blocked" && phase === "result"
        ? "blocked"
        : phase
    );
}, [phase, demo.status, onPhaseChange]);

useEffect(() => {
    if (reducedMotion.current) {
    setTyped(demo.question);
    setPhase("result");
    return;
    }

    let timers = [];
    let cancelled = false;

    const clearAll = () => {
    timers.forEach(clearTimeout);
    };

    const runCycle = () => {
    if (cancelled) return;

    setPhase("typing");
    setTyped("");

    /*
        TYPE QUESTION
    */
    demo.question.split("").forEach((_, i) => {
        const timer = setTimeout(() => {
        if (!cancelled) {
            setTyped(demo.question.slice(0, i + 1));
        }
        }, TYPE_SPEED_MS * i);

        timers.push(timer);
    });

    const typedDuration =
        TYPE_SPEED_MS * demo.question.length;

    /*
        THINKING
    */
    timers.push(
        setTimeout(() => {
        if (!cancelled) {
            setPhase("thinking");
        }
        }, typedDuration + HOLD_AFTER_TYPE_MS)
    );

    /*
        SHOW SQL / RESULT / BLOCKED
    */
    timers.push(
        setTimeout(() => {
        if (!cancelled) {
            setPhase("result");
        }
        }, typedDuration + HOLD_AFTER_TYPE_MS + THINKING_MS)
    );

    /*
        RESET
    */
    timers.push(
    setTimeout(() => {
        if (!cancelled) {
        setDemoIndex(
            (current) => (current + 1) % DEMOS.length
        );
        }
    },
    typedDuration +
        HOLD_AFTER_TYPE_MS +
        THINKING_MS +
        HOLD_RESULT_MS +
        RESET_PAUSE_MS)
    );

    /*
        MOVE TO NEXT DEMO
    */
    timers.push(
        setTimeout(() => {
        if (!cancelled) {
            setDemoIndex((current) => {
            setPhase("typing");
            setTyped("");

            return (current + 1) % DEMOS.length;
            });
        }
        },
        typedDuration +
        HOLD_AFTER_TYPE_MS +
        THINKING_MS +
        HOLD_RESULT_MS +
        RESET_PAUSE_MS)
    );
    };

    runCycle();

    return () => {
    cancelled = true;
    clearAll();
    };
}, [demoIndex]);

const showResult =
  phase === "result" || phase === "resetting";

const fading = phase === "resetting";

const isBlocked =
  demo.status === "blocked" && showResult;

const hasResultTable =
  Boolean(demo.table?.columns && demo.table?.rows);

return (
    <div
    className={`query-terminal${
        fading ? " is-resetting" : ""
    }${isBlocked ? " is-blocked" : ""}`}
    role="group"
    aria-label="NL2SQL live example"
    >
    {/* --------------------------------------------------
        TERMINAL CHROME
    -------------------------------------------------- */}

    <div className="terminal-chrome">
        <span className="terminal-dot" />
        <span className="terminal-dot" />
        <span className="terminal-dot" />

        <span className="terminal-filename">
        query.sql
        </span>

        {showResult && (
        <span
            className={`terminal-status ${
            isBlocked
                ? "terminal-status--blocked"
                : "terminal-status--valid"
            }`}
        >
            <span className="terminal-status-dot" />
            {isBlocked ? "BLOCKED" : "VALIDATED"}
        </span>
        )}
    </div>

    {/* --------------------------------------------------
        TERMINAL BODY
    -------------------------------------------------- */}

    <div className="terminal-body">
        {/* Question */}

        <div className="terminal-line">
        <span className="terminal-prompt">&gt;</span>

        <span className="terminal-question">
            {typed}

            {phase === "typing" && (
            <span
                className="terminal-cursor"
                aria-hidden="true"
            />
            )}
        </span>
        </div>

        {/* Thinking */}

        {phase === "thinking" && (
        <div
            className="terminal-thinking"
            aria-live="polite"
        >
            <span className="thinking-label">
            UNDERSTANDING SCHEMA
            </span>

            <span className="thinking-dots">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            </span>
        </div>
        )}

        {/* Arrow */}

        <div
        className={`terminal-arrow${
            showResult ? " is-visible" : ""
        }`}
        aria-hidden="true"
        >
        ↓
        </div>

        {/* --------------------------------------------------
            RESULT / BLOCKED CONTENT
        -------------------------------------------------- */}

        <div
            className={`terminal-split${
                showResult ? " is-visible" : ""
            }${isBlocked ? " is-blocked" : ""}`}
            >
            {/* SQL */}

            <div className="terminal-pane terminal-pane--sql">
                <div className="pane-label">
                SQL
                </div>

                <pre className="sql-code">
                {demo.sql.map((line, index) => (
                    <div
                    key={index}
                    className="sql-line"
                    >
                    {highlightSQL(line)}
                    </div>
                ))}
                </pre>
            </div>

            {/* RESULT / VALIDATION */}

            <div
                className={`terminal-pane ${
                isBlocked
                    ? "terminal-pane--error"
                    : "terminal-pane--table"
                }`}
            >
                <div className="pane-label">
                {isBlocked ? "VALIDATION" : "RESULT"}
                </div>

                {isBlocked ? (
                <div className="terminal-error">
                    <div className="terminal-error-icon">
                    ×
                    </div>

                    <div className="terminal-error-code">
                    {demo.error?.code ?? "NL2SQL-403"}
                    </div>

                    <div className="terminal-error-title">
                    {demo.error?.title ?? "DESTRUCTIVE OPERATION"}
                    </div>

                    <div className="terminal-error-message">
                    {demo.error?.message ??
                        "This operation is not permitted."}
                    </div>

                    <div className="terminal-error-detail">
                    {demo.error?.detail ??
                        "Query execution prevented."}
                    </div>
                </div>
                ) : hasResultTable ? (
                <table className="result-table">
                    <thead>
                    <tr>
                        {demo.table.columns.map((column) => (
                        <th key={column}>
                            {column}
                        </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {demo.table.rows.map(
                        (row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map(
                            (cell, cellIndex) => (
                                <td key={cellIndex}>
                                {cell}
                                </td>
                            )
                            )}
                        </tr>
                        )
                    )}
                    </tbody>
                </table>
                ) : (
                <div className="terminal-error">
                    <div className="terminal-error-message">
                    No result returned.
                    </div>
                </div>
                )}
            </div>
            </div>

        {/* --------------------------------------------------
            CONCLUSION
        -------------------------------------------------- */}

        <div
        className={`terminal-conclusion${
            showResult ? " is-visible" : ""
        }${
            isBlocked
            ? " terminal-conclusion--blocked"
            : ""
        }`}
        >
        <span
            className="conclusion-check"
            aria-hidden="true"
        >
            {isBlocked ? "×" : "✓"}
        </span>

        {demo.conclusion}
        </div>
    </div>
    </div>
);
}

/*
Lightweight visual SQL highlighting.

This is intentionally simple because this is
a landing-page animation, not a SQL editor.
*/
function highlightSQL(line) {
const tokens = line.split(
    /(\bSELECT\b|\bFROM\b|\bWHERE\b|\bJOIN\b|\bON\b|\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b|\bAS\b|\bCOUNT\b|\bSUM\b|\bDELETE\b|\bdate_trunc\b|\bnow\b|\bINTERVAL\b|'[^']*'|\d+)/gi
);

return tokens.map((token, index) => {
    if (!token) return null;

    const upper = token.toUpperCase();

    if (
    [
        "SELECT",
        "FROM",
        "WHERE",
        "JOIN",
        "ON",
        "GROUP BY",
        "ORDER BY",
        "LIMIT",
        "AS",
        "DELETE",
        "INTERVAL",
    ].includes(upper)
    ) {
    return (
        <span
        key={index}
        className={
            upper === "DELETE"
            ? "sql-token sql-token--danger"
            : "sql-token sql-token--keyword"
        }
        >
        {token}
        </span>
    );
    }

    if (
    ["COUNT", "SUM", "DATE_TRUNC", "NOW"].includes(
        upper
    )
    ) {
    return (
        <span
        key={index}
        className="sql-token sql-token--function"
        >
        {token}
        </span>
    );
    }

    if (
    token.startsWith("'") &&
    token.endsWith("'")
    ) {
    return (
        <span
        key={index}
        className="sql-token sql-token--string"
        >
        {token}
        </span>
    );
    }

    if (/^\d+$/.test(token)) {
    return (
        <span
        key={index}
        className="sql-token sql-token--number"
        >
        {token}
        </span>
    );
    }

    return (
    <span key={index}>
        {token}
    </span>
    );
});
}