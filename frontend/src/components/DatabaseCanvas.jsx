import "./DatabaseCanvas.css";

export default function DatabaseCanvas({ connection }) {
return (
    <section className="database-canvas">

    {/* =====================================================
        CANVAS HEADER
        ===================================================== */}

    <div className="database-canvas__header">

        <div>
        <div className="database-canvas__eyebrow">
            DATABASE STRUCTURE
        </div>

        <h1 className="database-canvas__title">
            Visualize your database
        </h1>

        <p className="database-canvas__description">
            Explore tables, relationships and schema structure.
        </p>
        </div>


        {/* Connection information */}

        <div className="database-canvas__connection">

        <span className="database-canvas__connection-dot" />

        <div>
            <span className="database-canvas__connection-label">
            CONNECTED TO
            </span>

            <span className="database-canvas__connection-name">
            {connection?.database || "Database"}
            </span>
        </div>

        </div>

    </div>


    {/* =====================================================
        EMPTY CANVAS
        ===================================================== */}

    <div className="database-canvas__workspace">

        <div className="database-canvas__empty">

        <div className="database-canvas__empty-icon">

            <svg
            viewBox="0 0 48 48"
            width="34"
            height="34"
            aria-hidden="true"
            >
            <rect
                x="7"
                y="8"
                width="14"
                height="11"
                rx="1"
            />

            <rect
                x="27"
                y="8"
                width="14"
                height="11"
                rx="1"
            />

            <rect
                x="17"
                y="29"
                width="14"
                height="11"
                rx="1"
            />

            <path
                d="M14 19v5h20v-5"
            />

            <path
                d="M24 24v5"
            />

            </svg>

        </div>


        <div className="database-canvas__empty-title">
            Schema visualization
        </div>

        <p className="database-canvas__empty-text">
            Your database structure will appear here.
        </p>

        </div>

    </div>


    {/* =====================================================
        CANVAS STATUS
        ===================================================== */}

    <div className="database-canvas__footer">

        <span className="database-canvas__footer-dot" />

        <span>
        SCHEMA VISUALI  ZER
        </span>

        <span className="database-canvas__footer-divider" />

        <span>
        READY
        </span>

    </div>

    </section>
);
}