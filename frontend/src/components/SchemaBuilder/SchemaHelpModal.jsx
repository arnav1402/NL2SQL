import { FiX, FiKey } from "react-icons/fi";

const STEPS = [
    {
        index: "01",
        title: "Add a table",
        body: "Click \u201cAdd Table\u201d in the toolbar to drop a new table onto the canvas. Drag its header to move it around.",
    },
    {
        index: "02",
        title: "Define columns",
        body: "Use \u201cAdd column\u201d inside a table, then mark it PK (primary key), UQ (unique), or NN (not null) with the row buttons. Double-click a table name to rename it.",
    },
    {
        index: "03",
        title: "Connect a foreign key",
        body: "Drag from the dot on the right edge of a column to a column marked PK or UQ on another table \u2014 only those columns can be referenced.",
    },
    {
        index: "04",
        title: "Configure the relationship",
        body: "Click the badge on a connection line to toggle it between REQUIRED and OPTIONAL. Select a line to reveal a delete button.",
    },
    {
        index: "05",
        title: "Generate SQL",
        body: "Open \u201cSQL Preview\u201d to see live DDL for your schema. Switch dialects, then copy or download the .sql file.",
    },
];

function SchemaHelpModal({ onClose }) {
    return (
        <div
            className="schema-help-overlay"
            onMouseDown={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="How to use Schema Builder"
        >
            <div
                className="schema-help-panel"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="schema-help-header">
                    <div>
                        <div className="schema-help-kicker">GUIDE</div>
                        <h2>How Schema Builder works</h2>
                    </div>

                    <button
                        type="button"
                        className="schema-help-close"
                        onClick={onClose}
                        aria-label="Close help"
                    >
                        <FiX />
                    </button>
                </div>

                <div className="schema-help-content">
                    {STEPS.map((step) => (
                        <div className="help-step" key={step.index}>
                            <span>{step.index}</span>

                            <div>
                                <strong>{step.title}</strong>
                                <p>{step.body}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="schema-help-footer">
                    <FiKey />
                    <p>
                        Tip: a foreign key can only target a column marked PK
                        or UQ \u2014 Schema Builder enforces this directly on
                        the canvas, so an invalid connection can't be made
                        in the first place.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SchemaHelpModal;