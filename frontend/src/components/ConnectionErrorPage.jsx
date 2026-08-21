import "./ConnectionErrorPage.css";

const ERROR_CONFIG = {
server: {
    code: "NL2SQL-500",
    eyebrow: "SYSTEM ERROR",
    title: "Something went wrong",
    message:
    "An unexpected error occurred while establishing your database connection.",
},

network: {
    code: "NL2SQL-NET",
    eyebrow: "CONNECTION ERROR",
    title: "Can't reach the server",
    message:
    "The NL2SQL backend could not be reached. Check your connection and try again.",
},
};

export default function ConnectionErrorPage({
type = "server",
onBackHome,
onRetry,
}) {
const error = ERROR_CONFIG[type] || ERROR_CONFIG.server;

return (
    <main className="connection-error-page">
    <div className="connection-error-grid" />

    <div className="connection-error-content">
        <div className="connection-error-brand">
        <span>NL2SQL</span>
        <i>.</i>
        </div>

        <div className="connection-error-panel">
        <div className="connection-error-eyebrow">
            {error.eyebrow}
        </div>

        <div className="connection-error-icon">
            ×
        </div>

        <div className="connection-error-code">
            {error.code}
        </div>

        <h1>{error.title}</h1>

        <p>{error.message}</p>

        <div className="connection-error-actions">
            {onRetry && (
            <button
                className="connection-error-retry"
                onClick={onRetry}
            >
                <span>Try Again</span>
                <span>↻</span>
            </button>
            )}

            <button
            className="connection-error-home"
            onClick={onBackHome}
            >
            <span>Back to Home</span>
            <span>↗</span>
            </button>
        </div>
        </div>

        <div className="connection-error-footer">
        <span className="connection-error-status-dot" />
        <span>DATABASE INTELLIGENCE</span>
        <span className="connection-error-divider" />
        <span>CONNECTION UNAVAILABLE</span>
        </div>
    </div>
    </main>
);
}