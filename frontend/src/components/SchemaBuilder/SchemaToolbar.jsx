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
    dialect = "postgresql",
    onDialectChange,
    sqlPreviewOpen = false,
    onToggleSQLPreview,
    onHelp,
}) {
    const currentDialect =
        DIALECTS[dialect] || DIALECTS.postgresql;

    const DialectIcon = currentDialect.icon;

    const handleBack = () => {
        if (typeof window !== "undefined") {
            window.history.back();
        }
    };

    const handleClear = () => {
        if (typeof onClear === "function") {
            onClear();
        }
    };

    const handleDialectChange = (event) => {
        if (typeof onDialectChange === "function") {
            onDialectChange(event.target.value);
        }
    };

    return (
        <header className="schema-toolbar">
            <div className="schema-toolbar-left">
                <button
                    type="button"
                    className="schema-toolbar-button primary"
                    onClick={onAddTable}
                    disabled={typeof onAddTable !== "function"}
                    aria-label="Add a new table"
                >
                    <FiPlus className="toolbar-button-icon" />
                    <span>Add Table</span>
                </button>

                <div className="toolbar-divider" />

                <button
                    type="button"
                    className="schema-toolbar-button"
                    onClick={handleBack}
                    aria-label="Go back"
                >
                    <FiArrowLeft className="toolbar-button-icon" />
                    <span>Back</span>
                </button>

                <button
                    type="button"
                    className="schema-toolbar-button danger"
                    onClick={handleClear}
                    disabled={typeof onClear !== "function"}
                    aria-label="Clear all tables and relationships"
                >
                    <FiTrash2 className="toolbar-button-icon" />
                    <span>Clear</span>
                </button>
            </div>

            <div className="schema-toolbar-center">
                <div className="dialect-selector">
                    <span className="dialect-label">TARGET</span>

                    <div className="dialect-select-wrapper">
                        <DialectIcon
                            className="dialect-icon"
                            aria-hidden="true"
                        />

                        <select
                            value={
                                DIALECTS[dialect]
                                    ? dialect
                                    : "postgresql"
                            }
                            onChange={handleDialectChange}
                            aria-label="SQL dialect"
                            title={`Target database: ${currentDialect.label}`}
                        >
                            {Object.entries(DIALECTS).map(
                                ([value, option]) => (
                                    <option
                                        key={value}
                                        value={value}
                                    >
                                        {option.label}
                                    </option>
                                )
                            )}
                        </select>

                        <FiChevronDown
                            className="dialect-chevron"
                            aria-hidden="true"
                        />
                    </div>
                </div>
            </div>

            <div className="schema-toolbar-right">
                <button
                    type="button"
                    className={`schema-toolbar-button sql-button ${
                        sqlPreviewOpen ? "active" : ""
                    }`}
                    onClick={onToggleSQLPreview}
                    disabled={
                        typeof onToggleSQLPreview !== "function"
                    }
                    aria-pressed={sqlPreviewOpen}
                    aria-label="Toggle SQL preview"
                >
                    <FiCode className="toolbar-button-icon" />
                    <span>SQL Preview</span>
                </button>

                <button
                    type="button"
                    className="schema-help-button"
                    onClick={onHelp}
                    disabled={typeof onHelp !== "function"}
                    title="How to use Schema Builder"
                    aria-label="How to use Schema Builder"
                >
                    <FiHelpCircle />
                </button>
            </div>
        </header>
    );
}

export default SchemaToolbar;