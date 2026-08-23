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
    status = "disconnected",
}) {
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