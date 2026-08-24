import "./SchemaToolbar.css";

function SchemaToolbar({
onAddTable,
onClear,
dialect,
onDialectChange,
sqlPreviewOpen,
onToggleSQLPreview,
onHelp,
}) {
return (
    <div className="schema-toolbar">
    <div className="schema-toolbar-left">
        <button
        type="button"
        className="schema-toolbar-button primary"
        onClick={onAddTable}
        >
        <span className="toolbar-icon">+</span>
        <span>Add Table</span>
        </button>

        <div className="toolbar-divider" />

        <button
        type="button"
        className="schema-toolbar-button"
        onClick={() => window.history.back()}
        >
        <span className="toolbar-icon back-icon">←</span>
        <span>Back</span>
        </button>

        <button
        type="button"
        className="schema-toolbar-button danger"
        onClick={onClear}
        >
        <span>Clear</span>
        </button>
    </div>

    <div className="schema-toolbar-center">
        <div className="dialect-selector">
        <span className="dialect-label">TARGET</span>

        <select
            value={dialect}
            onChange={(event) => onDialectChange(event.target.value)}
            aria-label="SQL dialect"
        >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
        </select>
        </div>
    </div>

    <div className="schema-toolbar-right">
        <button
        type="button"
        className={`schema-toolbar-button sql-button ${
            sqlPreviewOpen ? "active" : ""
        }`}
        onClick={onToggleSQLPreview}
        aria-pressed={sqlPreviewOpen}
        >
        <span className="toolbar-sql-icon">&lt;/&gt;</span>
        <span>SQL Preview</span>
        </button>

        <button
        type="button"
        className="schema-help-button"
        onClick={onHelp}
        title="How to use Schema Builder"
        aria-label="How to use Schema Builder"
        >
        ?
        </button>
    </div>
    </div>
);
}

export default SchemaToolbar;