import "./SessionStatus.css";

const STATUS_CONFIG = {
    connected: {
        label: "SESSION CONNECTED",
        className: "is-connected",
    },

    connecting: {
        label: "CONNECTING",
        className: "is-reconnecting",
    },

    reconnecting: {
        label: "RECONNECTING",
        className: "is-reconnecting",
    },

    disconnected: {
        label: "DISCONNECTED",
        className: "is-disconnected",
    },

    error: {
        label: "CONNECTION ERROR",
        className: "is-disconnected",
    },
};

export default function SessionStatus({
    connection,
    status: externalStatus,
}) {
    /*
    ========================================================
    DETERMINE CURRENT STATUS
    ========================================================

    Priority:

    1. Explicit status from parent
    2. Status contained inside connection object
    3. If there is a connection object but it is not
       explicitly connected -> disconnected
    4. No connection -> disconnected

    IMPORTANT:
    We DO NOT default to connected anymore.
    */

    let status = externalStatus;

    if (!status && connection) {
        /*
        Support several possible backend response shapes.
        */

        if (
            connection.status === "connected" ||
            connection.status === "success" ||
            connection.connected === true
        ) {
            status = "connected";
        } else if (
            connection.status === "connecting"
        ) {
            status = "connecting";
        } else if (
            connection.status === "reconnecting"
        ) {
            status = "reconnecting";
        } else {
            status = "disconnected";
        }
    }

    /*
    No connection + no explicit status means
    there is currently no active database session.
    */

    if (!status) {
        status = "disconnected";
    }

    const currentStatus =
        STATUS_CONFIG[status] ||
        STATUS_CONFIG.disconnected;

    return (
        <div
            className={`session-status ${currentStatus.className}`}
            role="status"
            aria-live="polite"
            aria-label={currentStatus.label}
        >
            <span
                className="session-status__dot"
                aria-hidden="true"
            />

            <span className="session-status__label">
                {currentStatus.label}
            </span>
        </div>
    );
}