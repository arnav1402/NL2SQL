import { useState } from "react";

import WorkspaceSidebar from "./WorkspaceSidebar";
import ChatView from "./ChatView";
import DatabaseCanvas from "./DatabaseCanvas";
import DatabaseSelector from "./DatabaseSelector";

import "./Workspace.css";

export default function Workspace({
    database,
    onExit,
}) {
    const [activeView, setActiveView] = useState("chat");
    const [databaseSelectorOpen, setDatabaseSelectorOpen] =
        useState(false);

    const [connection, setConnection] =
        useState(database || null);

    const [connectionError, setConnectionError] =
        useState(null);

    const handleNewChat = () => {
        setConnectionError(null);
        setDatabaseSelectorOpen(true);
    };

    const handleOngoingChat = () => {
        setActiveView("chat");
    };

    const handleVisualizeDatabase = () => {
        setActiveView("database");
    };

    const handleDatabaseConnected = (result) => {
        console.log("Database connected:", result);

        if (!result?.connection_id) {
            setConnectionError(
                "Backend did not return a connection ID."
            );
            return;
        }

        setConnection(result);

        setConnectionError(null);
        setDatabaseSelectorOpen(false);
        setActiveView("chat");
    };

    return (
        <main className="workspace">

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

            <div className="workspace-body">

                <WorkspaceSidebar
                    activeView={activeView}
                    connection={connection}
                    onNewChat={handleNewChat}
                    onOngoingChat={handleOngoingChat}
                    onVisualizeDatabase={
                        handleVisualizeDatabase
                    }
                    onExit={onExit}
                />

                <section className="workspace-main">

                    {connectionError && (
                        <div className="workspace-connection-error">
                            {connectionError}
                        </div>
                    )}

                    {activeView === "chat" && (
                        <ChatView
                            connectionId={
                                connection?.connection_id
                            }
                        />
                    )}

                    {activeView === "database" && (
                        <DatabaseCanvas
                            database={connection}
                            connectionId={
                                connection?.connection_id
                            }
                        />
                    )}

                </section>
            </div>

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