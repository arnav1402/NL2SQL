import "./WorkspaceSidebar.css";

import {
FiPlus,
FiMessageSquare,
FiDatabase,
FiLogOut,
} from "react-icons/fi";

import MySQLLogo from "../assets/MySQL.svg";
import PostgreSQLLogo from "../assets/PostgresSQL.svg";
import SQLiteLogo from "../assets/SQLite.svg";

const DATABASE_INFO = {
postgresql: {
    name: "PostgreSQL",
    logo: PostgreSQLLogo,
    color: "#336791",
},

mysql: {
    name: "MySQL",
    logo: MySQLLogo,
    color: "#00758F",
},

sqlite: {
    name: "SQLite",
    logo: SQLiteLogo,
    color: "#0F80CC",
},
};

export default function WorkspaceSidebar({
activeView,
connection,
onNewChat,
onOngoingChat,
onVisualizeDatabase,
onExit,
}) {
const databaseType =
    connection?.db_type ||
    connection?.database_type ||
    "postgresql";

const database =
    DATABASE_INFO[databaseType] ||
    DATABASE_INFO.postgresql;

const host =
    connection?.host ||
    "localhost";

return (
    <aside
    className="workspace-sidebar"
    style={{
        "--database-color": database.color,
    }}
    >
    <div className="workspace-sidebar-brand">
        <span>NL2SQL</span>
        <i>.</i>
    </div>

    <nav className="workspace-navigation">
        <div className="workspace-nav-group">
        <button
            type="button"
            className="workspace-nav-item workspace-nav-item--new"
            onClick={onNewChat}
        >
            <span className="workspace-nav-icon">
            <FiPlus />
            </span>

            <span className="workspace-nav-label">
            New Chat
            </span>
        </button>

        <button
            type="button"
            className={`workspace-nav-item ${
            activeView === "chat" ? "is-active" : ""
            }`}
            onClick={onOngoingChat}
            aria-current={
            activeView === "chat" ? "page" : undefined
            }
        >
            <span className="workspace-nav-icon">
            <FiMessageSquare />
            </span>

            <span className="workspace-nav-label">
            Ongoing Chat
            </span>
        </button>
        </div>

        <div className="workspace-nav-section">
        <div className="workspace-nav-section-label">
            DATABASE
        </div>

        <button
            type="button"
            className={`workspace-nav-item ${
            activeView === "database" ? "is-active" : ""
            }`}
            onClick={onVisualizeDatabase}
            aria-current={
            activeView === "database" ? "page" : undefined
            }
        >
            <span className="workspace-nav-icon">
            <FiDatabase />
            </span>

            <span className="workspace-nav-label">
            Visualize Your Database
            </span>
        </button>
        </div>
    </nav>

    <div className="workspace-sidebar-bottom">
        <div className="workspace-connection">
        <div className="workspace-connection-label">
            CONNECTION
        </div>

        <div className="workspace-connection-info">
            <div className="workspace-database-icon">
            <img
                src={database.logo}
                alt=""
            />
            </div>

            <div className="workspace-database-details">
            <span className="workspace-database-name">
                {database.name}
            </span>

            <span className="workspace-database-host">
                {host}
            </span>
            </div>
        </div>

        <div className="workspace-connection-status">
            <span className="workspace-status-dot" />
            <span>CONNECTED</span>
        </div>
        </div>

        <div className="workspace-sidebar-divider" />

        <button
        type="button"
        className="workspace-exit"
        onClick={onExit}
        >
        <span className="workspace-exit-icon">
            <FiLogOut />
        </span>

        <span>Exit</span>
        </button>
    </div>
    </aside>
);
}