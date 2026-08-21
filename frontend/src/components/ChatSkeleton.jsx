import "./ChatSkeleton.css";

export default function ChatSkeleton({ status = "Thinking" }) {
return (
    <article className="chat-skeleton">

    <div className="chat-skeleton-row">

        <div className="chat-skeleton-avatar">
        N
        </div>

        <div className="chat-skeleton-content">

        <div className="chat-skeleton-name">
            NL2SQL
        </div>

        <div className="chat-skeleton-status">

            <span className="chat-skeleton-dot" />

            <span>
            {status}
            </span>

            <span className="chat-skeleton-dots">
            <i>.</i>
            <i>.</i>
            <i>.</i>
            </span>

        </div>

        <div className="chat-skeleton-grid">

            {/* SQL SKELETON */}

            <div className="chat-skeleton-card">

            <div className="chat-skeleton-header">
                <span className="skeleton-line skeleton-line--short" />
                <span className="skeleton-line skeleton-line--tiny" />
            </div>

            <div className="chat-skeleton-code">

                <span />
                <span />
                <span />
                <span />
                <span />

            </div>

            <div className="chat-skeleton-result">

                <div className="chat-skeleton-header">
                <span className="skeleton-line skeleton-line--short" />
                <span className="skeleton-line skeleton-line--tiny" />
                </div>

                <div className="chat-skeleton-table">

                <span />
                <span />
                <span />
                <span />

                <span />
                <span />
                <span />
                <span />

                <span />
                <span />
                <span />
                <span />

                </div>

            </div>

            </div>

            {/* ANALYSIS SKELETON */}

            <div className="chat-skeleton-card chat-skeleton-card--analysis">

            <div className="chat-skeleton-header">

                <span className="skeleton-line skeleton-line--short" />

                <span className="skeleton-line skeleton-line--tiny" />

            </div>

            <div className="chat-skeleton-analysis">

                <span />
                <span />
                <span />
                <span className="short" />

            </div>

            </div>

        </div>

        </div>

    </div>

    </article>
);
}