import { useEffect, useRef, useState } from "react";

import ChatMessage from "./ChatMessage";
import ChatSkeleton from "./ChatSkeleton";
import SessionStatus from "./SessionStatus";

import "./ChatView.css";

import { runQuery } from "../api";

const THINKING_STEPS = [
    "Thinking",
    "Researching",
    "Understanding schema",
    "Elaborating",
    "Preparing query",
    "Running query",
    "Validating SQL",
    "Checking results",
];

export default function ChatView({
    connectionId,
    sessionStatus,
    onConnectionStatusChange,
}) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [thinkingText, setThinkingText] =
        useState("Thinking");

    const messagesEndRef = useRef(null);
    const thinkingTimer = useRef(null);

    /*
    ========================================================
    AUTO SCROLL
    ========================================================
    */

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    /*
    ========================================================
    CLEANUP
    ========================================================
    */

    useEffect(() => {
        return () => {
            clearInterval(
                thinkingTimer.current
            );
        };
    }, []);

    /*
    ========================================================
    THINKING ANIMATION
    ========================================================
    */

    const startThinkingAnimation = () => {
        let currentIndex = 0;

        setThinkingText(
            THINKING_STEPS[currentIndex]
        );

        clearInterval(
            thinkingTimer.current
        );

        thinkingTimer.current = setInterval(() => {
            currentIndex =
                (currentIndex + 1) %
                THINKING_STEPS.length;

            setThinkingText(
                THINKING_STEPS[currentIndex]
            );
        }, 750);
    };

    const stopThinkingAnimation = () => {
        clearInterval(
            thinkingTimer.current
        );
    };

    /*
    ========================================================
    DETECT CONNECTION ERROR
    ========================================================
    */

    const isConnectionError = (error) => {
        const message =
            error?.message ||
            error?.detail ||
            error?.error ||
            "";

        const normalized =
            String(message).toLowerCase();

        return (
            normalized.includes(
                "connectionnotfound"
            ) ||
            normalized.includes(
                "connection not found"
            ) ||
            normalized.includes(
                "connection does not exist"
            ) ||
            normalized.includes(
                "no active connection"
            )
        );
    };

    /*
    ========================================================
    SEND MESSAGE
    ========================================================
    */

    const sendMessage = async () => {
        const question = input.trim();

        if (!question || loading) {
            return;
        }

        /*
        ----------------------------------------------------
        NO CONNECTION
        ----------------------------------------------------
        */

        if (!connectionId) {
            onConnectionStatusChange?.(
                "disconnected"
            );

            setMessages((previous) => [
                ...previous,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    type: "error",
                    content:
                        "No database connection is active. Please connect a database first.",
                },
            ]);

            return;
        }

        /*
        ----------------------------------------------------
        USER MESSAGE
        ----------------------------------------------------
        */

        setMessages((previous) => [
            ...previous,
            {
                id: crypto.randomUUID(),
                role: "user",
                content: question,
            },
        ]);

        setInput("");
        setLoading(true);

        startThinkingAnimation();

        /*
        ----------------------------------------------------
        QUERY
        ----------------------------------------------------
        */

        try {
            console.log(
                "Running query:",
                {
                    connection_id:
                        connectionId,
                    question,
                }
            );

            const result = await runQuery(
                connectionId,
                question
            );

            console.log(
                "Backend query response:",
                result
            );

            /*
            A successful query proves that the
            backend connection is currently usable.
            */

            onConnectionStatusChange?.(
                "connected"
            );

            const assistantMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                type:
                    result?.type ||
                    "sql_result",
                ...result,
            };

            setMessages((previous) => [
                ...previous,
                assistantMessage,
            ]);
        } catch (error) {
            console.error(
                "Query execution failed:",
                error
            );

            /*
            ------------------------------------------------
            CONNECTION LOST
            ------------------------------------------------
            */

            if (isConnectionError(error)) {
                onConnectionStatusChange?.(
                    "disconnected"
                );
            } else {
                /*
                The connection may still exist,
                but something else failed.
                */

                onConnectionStatusChange?.(
                    "error"
                );
            }

            /*
            ------------------------------------------------
            ERROR MESSAGE
            ------------------------------------------------
            */

            setMessages((previous) => [
                ...previous,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    type: "error",
                    content:
                        error?.message ||
                        "Unable to process the query.",
                },
            ]);
        } finally {
            stopThinkingAnimation();
            setLoading(false);
        }
    };

    /*
    ========================================================
    KEYBOARD
    ========================================================
    */

    const handleKeyDown = (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            sendMessage();
        }
    };

    return (
        <section className="chat-view">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="chat-view-header">

                <div className="chat-view-header-left">

                    <div className="chat-view-eyebrow">
                        ONGOING CHAT
                    </div>

                    <h1>
                        Ask your database
                    </h1>

                    <p>
                        Ask questions in natural language
                        and get executable SQL with an
                        explanation.
                    </p>

                </div>

                <div className="chat-view-header-right">

                    <SessionStatus
                        status={sessionStatus}
                    />

                </div>

            </header>

            {/* =================================================
                MESSAGES
            ================================================= */}

            <div className="chat-messages">

                <div className="chat-thread">

                    {messages.length === 0 && (
                        <div className="chat-empty">

                            <div className="chat-empty-mark">
                                ?
                            </div>

                            <h2>
                                What would you like to know?
                            </h2>

                            <p>
                                Ask a question about the
                                data in your connected
                                database.
                            </p>

                        </div>
                    )}

                    {messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                        />
                    ))}

                    {loading && (
                        <ChatSkeleton
                            status={thinkingText}
                        />
                    )}

                    <div
                        ref={messagesEndRef}
                        className="chat-thread-end"
                    />

                </div>

            </div>

            {/* =================================================
                COMPOSER
            ================================================= */}

            <div className="chat-composer-wrapper">

                <div className="chat-composer-inner">

                    <div className="chat-composer">

                        <textarea
                            value={input}
                            onChange={(event) =>
                                setInput(
                                    event.target.value
                                )
                            }
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder={
                                "Ask your database a question..."
                            }
                            rows={1}
                            aria-label={
                                "Ask your database a question"
                            }
                        />

                        <button
                            type="button"
                            className="chat-send"
                            onClick={sendMessage}
                            disabled={
                                loading ||
                                !input.trim() ||
                                !connectionId
                            }
                            aria-label="Send message"
                        >

                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M5 19L19 5M19 5H9M19 5V15"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>

                        </button>

                    </div>

                    <div className="chat-composer-hint">

                        <span>
                            ENTER TO SEND
                        </span>

                        <span className="chat-hint-divider" />

                        <span>
                            SHIFT + ENTER FOR NEW LINE
                        </span>

                    </div>

                </div>

            </div>

        </section>
    );
}