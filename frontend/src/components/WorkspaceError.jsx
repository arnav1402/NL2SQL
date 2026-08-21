import "./WorkspaceError.css";

const ERROR_STATES = {
server: {
    code: "500",
    eyebrow: "SYSTEM ERROR",
    title: "Something went wrong",
    message:
    "An unexpected error occurred while processing your request.",
    action: "Try Again",
},

network: {
    code: "NETWORK",
    eyebrow: "CONNECTION ERROR",
    title: "Can't reach the server",
    message:
    "The NL2SQL service could not be reached. Check your connection and try again.",
    action: "Try Again",
},

connection: {
    code: "CONNECTION",
    eyebrow: "CONNECTION ERROR",
    title: "Connection unavailable",
    message:
    "Your database connection could not be restored. Please establish the connection again.",
    action: "Reconnect",
},

session: {
    code: "SESSION",
    eyebrow: "SESSION EXPIRED",
    title: "Session expired",
    message:
    "Your database connection timed out. Please reconnect to continue.",
    action: "Reconnect",
},

unknown: {
    code: "ERROR",
    eyebrow: "UNEXPECTED ERROR",
    title: "Something went wrong",
    message:
    "We couldn't complete that operation. Please try again.",
    action: "Try Again",
},
};

export default function WorkspaceError({
type = "unknown",
variant = "fullpage",
onRetry,
onBackHome,
}) {
const error =
    ERROR_STATES[type] ||
    ERROR_STATES.unknown;

/*
* --------------------------------------------------------
* BANNER
* --------------------------------------------------------
*
* Used inside the workspace for:
*
* - Session expired
* - Connection unavailable
*
* The sidebar remains visible.
*/

if (variant === "banner") {
    return (
    <div
        className={`workspace-error-banner workspace-error-banner--${type}`}
        role="alert"
    >
        <div className="workspace-error-banner-icon">
        !
        </div>

        <div className="workspace-error-banner-content">
        <div className="workspace-error-banner-title">
            {error.title}
        </div>

        <div className="workspace-error-banner-message">
            {error.message}
        </div>
        </div>

        <button
        type="button"
        className="workspace-error-banner-action"
        onClick={onRetry}
        >
        {error.action}
        </button>
    </div>
    );
}

/*
* --------------------------------------------------------
* FULL PAGE
* --------------------------------------------------------
*
* Used for catastrophic failures where the workspace
* itself cannot continue.
*/

return (
    <main
    className="workspace-error-page"
    role="alert"
    >
    <div className="workspace-error-page-inner">

        <div className="workspace-error-mark">
        <span>!</span>
        </div>

        <div className="workspace-error-eyebrow">
        {error.eyebrow}
        </div>

        <h1>
        {error.title}
        </h1>

        <p>
        {error.message}
        </p>

        <div className="workspace-error-code">
        <span>
            ERROR
        </span>

        <span>
            {error.code}
        </span>
        </div>

        <div className="workspace-error-actions">
        <button
            type="button"
            className="workspace-error-primary"
            onClick={onRetry}
        >
            {error.action}
            <span>↗</span>
        </button>

        <button
            type="button"
            className="workspace-error-secondary"
            onClick={onBackHome}
        >
            Back to Home
        </button>
        </div>

    </div>

    <div
        className="workspace-error-footer"
        aria-hidden="true"
    >
        <span>NL2SQL</span>
        <span>.</span>
    </div>
    </main>
);
}