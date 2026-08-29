import { useState } from "react";

import WorkspaceSidebar from "./WorkspaceSidebar";
import ChatView from "./ChatView";
import DatabaseVisualizer from "./DatabaseVisualizer";
import DatabaseSelector from "./DatabaseSelector";

import "./Workspace.css";

export default function Workspace({
    database,
    onExit,
}) {
    const [activeView, setActiveView] = useState("chat");

    const [databaseSelectorOpen, setDatabaseSelectorOpen] =
        useState(false);

    /*
    ========================================================
    DATABASE CONNECTION
    ========================================================
    */

    const [connection, setConnection] =
        useState(database || null);

    const [connectionError, setConnectionError] =
        useState(null);

    /*
    ========================================================
    SESSION STATUS
    ========================================================

    This is deliberately kept separately from `connection`.

    `connection` tells us what connection we have.

    `sessionStatus` tells us whether that connection
    is currently usable.
    */

    const [sessionStatus, setSessionStatus] =
        useState(
            database?.status === "connected"
                ? "connected"
                : "disconnected"
        );

    /*
    ========================================================
    NEW CHAT
    ========================================================
    */

    const handleNewChat = () => {
        setConnectionError(null);
        setDatabaseSelectorOpen(true);
    };

    /*
    ========================================================
    ONGOING CHAT
    ========================================================
    */

    const handleOngoingChat = () => {
        setActiveView("chat");
    };

    /*
    ========================================================
    DATABASE VISUALIZATION
    ========================================================
    */

    const handleVisualizeDatabase = () => {
        setActiveView("database");
    };

    /*
    ========================================================
    DATABASE CONNECTED
    ========================================================
    */

    const handleDatabaseConnected = (result) => {
        console.log(
            "Database connected:",
            result
        );

        if (!result?.connection_id) {
            setConnectionError(
                "Backend did not return a connection ID."
            );

            setSessionStatus("error");

            return;
        }

        /*
        Store the new backend connection.
        */

        setConnection(result);

        /*
        A successful /connection response means
        the session is currently connected.
        */

        setSessionStatus("connected");

        setConnectionError(null);
        setDatabaseSelectorOpen(false);
        setActiveView("chat");
    };

    /*
    ========================================================
    CONNECTION STATUS CHANGE
    ========================================================
    */

    const handleConnectionStatusChange = (status) => {
        setSessionStatus(status);
    };

    /*
    ========================================================
    EXIT
    ========================================================
    */

    const handleExit = () => {
        setConnection(null);
        setSessionStatus("disconnected");
        onExit?.();
    };

    return (
        <main className="workspace">

            {/* =================================================
                TOP BAR
            ================================================= */}

            <header className="workspace-topbar">

                <div className="workspace-brand">
                    <span>NL2SQL</span>
                    <i>.</i>
                </div>

                <nav className="workspace-nav">

                    <button
                        type="button"
                        className={
                            activeView === "chat"
                                ? "is-active"
                                : ""
                        }
                        onClick={handleOngoingChat}
                    >
                        ASK
                    </button>

                    <button
                        type="button"
                        className="workspace-nav-disabled"
                    >
                        VALIDATE
                    </button>

                    <button
                        type="button"
                        className="workspace-nav-disabled"
                    >
                        EXECUTE
                    </button>

                </nav>

            </header>

            {/* =================================================
                WORKSPACE BODY
            ================================================= */}

            <div className="workspace-body">

                <WorkspaceSidebar
                    activeView={activeView}
                    connection={connection}
                    onNewChat={handleNewChat}
                    onOngoingChat={handleOngoingChat}
                    onVisualizeDatabase={
                        handleVisualizeDatabase
                    }
                    onExit={handleExit}
                />

                <section className="workspace-main">

                    {connectionError && (
                        <div className="workspace-connection-error">
                            {connectionError}
                        </div>
                    )}

                    {/* =================================================
                        CHAT
                    ================================================= */}

                    {activeView === "chat" && (
                        <ChatView
                            connectionId={
                                connection?.connection_id
                            }
                            sessionStatus={sessionStatus}
                            onConnectionStatusChange={
                                handleConnectionStatusChange
                            }
                        />
                    )}

                    {/* =================================================
                        DATABASE — real schema visualizer, wired to
                        GET /schema/{connection_id}
                    ================================================= */}

                    {activeView === "database" && (
                        <DatabaseVisualizer
                            connectionId={
                                connection?.connection_id
                            }
                        />
                    )}

                </section>

            </div>

            {/* =================================================
                DATABASE SELECTOR
            ================================================= */}

            <DatabaseSelector
                isOpen={databaseSelectorOpen}
                onClose={() =>
                    setDatabaseSelectorOpen(false)
                }
                onConnect={handleDatabaseConnected}
            />

        </main>
    );
}