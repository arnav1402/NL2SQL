import { useEffect, useState } from "react";
import "./SessionStatus.css";

const STATUS_CONFIG = {
connected: {
    label: "SESSION IN PROGRESS",
    className: "is-connected",
},

reconnecting: {
    label: "RECONNECTING",
    className: "is-reconnecting",
},

disconnected: {
    label: "DISCONNECTED",
    className: "is-disconnected",
},
};

export default function SessionStatus({
connection,
status: externalStatus,
}) {
/*
* --------------------------------------------------------
* CURRENT STATUS
* --------------------------------------------------------
*
* For now, a successfully created frontend connection
* is treated as connected.
*
* Later this can be driven by:
*
* GET /connection/{connection_id}
*
* without changing the visual component.
*/

const [status, setStatus] = useState(
    externalStatus || "connected"
);

/*
* If the parent eventually supplies a status,
* allow it to control this component.
*/
useEffect(() => {
    if (externalStatus) {
    setStatus(externalStatus);
    }
}, [externalStatus]);

/*
* --------------------------------------------------------
* FUTURE CONNECTION CHECK
* --------------------------------------------------------
*
* This is intentionally NOT active yet.
*
* Later:
*
* useEffect(() => {
*
*   if (!connection?.connection_id) return;
*
*   const checkConnection = async () => {
*
*     try {
*
*       const response = await fetch(
*         `/connection/${connection.connection_id}`
*       );
*
*       if (response.ok) {
*         setStatus("connected");
*       } else if (response.status === 404) {
*         setStatus("disconnected");
*       } else {
*         setStatus("reconnecting");
*       }
*
*     } catch {
*       setStatus("disconnected");
*     }
*   };
*
*   checkConnection();
*
*   const interval = setInterval(
*     checkConnection,
*     30000
*   );
*
*   return () => clearInterval(interval);
*
* }, [connection?.connection_id]);
*/


/*
* --------------------------------------------------------
* SAFETY FALLBACK
* --------------------------------------------------------
*/

const currentStatus =
    STATUS_CONFIG[status] ||
    STATUS_CONFIG.connected;


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