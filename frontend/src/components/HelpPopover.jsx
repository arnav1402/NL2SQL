import { useEffect, useRef } from "react";
import "./HelpPopover.css";

function HelpPopover({ open, onClose }) {
const popoverRef = useRef(null);

useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
    if (event.key === "Escape") {
        onClose();
    }
    };

    const handlePointerDown = (event) => {
    if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
    ) {
        onClose();
    }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("pointerdown", handlePointerDown);
    };
}, [open, onClose]);

if (!open) return null;

return (
    <div
    ref={popoverRef}
    className="help-popover"
    role="dialog"
    aria-label="How NL2SQL works"
    >
    <div className="help-popover-header">
        <div>
        <span className="help-popover-kicker">QUICK START</span>
        <h3>Talk to your database.</h3>
        </div>

        <button
        className="help-popover-close"
        onClick={onClose}
        aria-label="Close help"
        >
        ×
        </button>
    </div>

    <div className="help-demo">
        <div className="help-demo-button">
        <span>Connect your Database</span>
        <span>↗</span>
        </div>

        <div className="help-cursor">
        <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            aria-hidden="true"
        >
            <path
            d="M5.5 2.5L18.8 15l-6.1.8 3.7 5.2-2.1 1.5-3.7-5.2-3.1 5.2z"
            fill="white"
            stroke="#0a0d12"
            strokeWidth="1.4"
            strokeLinejoin="round"
            />
        </svg>
        </div>

        <span className="help-click-ring" />
    </div>

    <div className="help-steps">
        <div className="help-step">
        <span className="help-step-number">01</span>

        <div>
            <strong>Connect your database</strong>
            <p>
            Enter the database information requested during setup.
            </p>
        </div>
        </div>

        <div className="help-step">
        <span className="help-step-number">02</span>

        <div>
            <strong>Ask in plain English</strong>
            <p>
            Once connected, describe what you want to know in your own words.
            </p>
        </div>
        </div>

        <div className="help-step">
        <span className="help-step-number">03</span>

        <div>
            <strong>Get executable SQL</strong>
            <p>
            NL2SQL understands your schema, generates the query, and validates
            it before execution.
            </p>
        </div>
        </div>
    </div>

    <div className="help-popover-footer">
        <span className="help-status-dot" />
        <span>READY TO CONNECT</span>
    </div>
    </div>
);
}

export default HelpPopover;