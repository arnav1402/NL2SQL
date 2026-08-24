import {
    FiPlus,
    FiArrowLeft,
    FiTrash2,
    FiCode,
    FiHelpCircle,
    FiChevronDown,
} from "react-icons/fi";

import {
    SiPostgresql,
    SiMysql,
    SiSqlite,
} from "react-icons/si";

import "./SchemaToolbar.css";

const DIALECTS = {
    postgresql: {
        label: "PostgreSQL",
        icon: SiPostgresql,
    },
    mysql: {
        label: "MySQL",
        icon: SiMysql,
    },
    sqlite: {
        label: "SQLite",
        icon: SiSqlite,
    },
};

function SchemaToolbar({
    onAddTable,
    onClear,
    dialect,
    onDialectChange,
    sqlPreviewOpen,
    onToggleSQLPreview,
    onHelp,
}) {
    const currentDialect =
        DIALECTS[dialect] || DIALECTS.postgresql;

    const DialectIcon = currentDialect.icon;

    return (
        <div className="schema-toolbar">

            {/* =====================================================
                LEFT ACTIONS
            ===================================================== */}

            <div className="schema-toolbar-left">

                <button
                    type="button"
                    className="schema-toolbar-button primary"
                    onClick={onAddTable}
                >
                    <FiPlus className="toolbar-button-icon" />

                    <span>Add Table</span>
                </button>

                <div className="toolbar-divider" />

                <button
                    type="button"
                    className="schema-toolbar-button"
                    onClick={() => window.history.back()}
                >
                    <FiArrowLeft className="toolbar-button-icon" />

                    <span>Back</span>
                </button>

                <button
                    type="button"
                    className="schema-toolbar-button danger"
                    onClick={onClear}
                >
                    <FiTrash2 className="toolbar-button-icon" />

                    <span>Clear</span>
                </button>

            </div>


            {/* =====================================================
                CENTER — DATABASE DIALECT
            ===================================================== */}

            <div className="schema-toolbar-center">

                <div className="dialect-selector">

                    <span className="dialect-label">
                        TARGET
                    </span>

                    <div className="dialect-select-wrapper">

                        <DialectIcon
                            className="dialect-icon"
                            aria-hidden="true"
                        />

                        <select
                            value={dialect}
                            onChange={(event) =>
                                onDialectChange(
                                    event.target.value
                                )
                            }
                            aria-label="SQL dialect"
                        >
                            <option value="postgresql">
                                PostgreSQL
                            </option>

                            <option value="mysql">
                                MySQL
                            </option>

                            <option value="sqlite">
                                SQLite
                            </option>
                        </select>

                        <FiChevronDown
                            className="dialect-chevron"
                            aria-hidden="true"
                        />

                    </div>

                </div>

            </div>


            {/* =====================================================
                RIGHT ACTIONS
            ===================================================== */}

            <div className="schema-toolbar-right">

                <button
                    type="button"
                    className={`schema-toolbar-button sql-button ${
                        sqlPreviewOpen ? "active" : ""
                    }`}
                    onClick={onToggleSQLPreview}
                    aria-pressed={sqlPreviewOpen}
                >
                    <FiCode className="toolbar-button-icon" />

                    <span>SQL Preview</span>
                </button>

                <button
                    type="button"
                    className="schema-help-button"
                    onClick={onHelp}
                    title="How to use Schema Builder"
                    aria-label="How to use Schema Builder"
                >
                    <FiHelpCircle />
                </button>

            </div>

        </div>
    );
}

export default SchemaToolbar;