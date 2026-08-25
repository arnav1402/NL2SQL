import { useCallback, useMemo, useState } from "react";

import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    MarkerType,
    addEdge,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
} from "@xyflow/react";

import {
    FiDatabase,
    FiHelpCircle,
    FiMaximize2,
    FiPlus,
    FiX,
} from "react-icons/fi";

import "@xyflow/react/dist/style.css";

import TableNode from "./TableNode";
import RelationEdge from "./RelationEdge";
import SQLPreview from "./SQLPreview";
import SchemaPreview from "./SchemaPreview";
import SchemaToolbar from "./SchemaToolbar";
import { generateSQL } from "../../utils/generateSQL";

import "./SchemaBuilder.css";

const nodeTypes = { table: TableNode };
const edgeTypes = { relation: RelationEdge };

const createColumn = (tableId, index = 1) => ({
    id: `${tableId}_column_${Date.now()}_${index}`,
    name: `column_${index}`,
    type: "TEXT",
    isPrimaryKey: false,
    isNullable: true,
    isUnique: false,
    autoIncrement: false,
});

const initialNodes = [
    {
        id: "users",
        type: "table",
        position: { x: 120, y: 100 },
        data: {
            tableName: "users",
            columns: [
                {
                    id: "users_id",
                    name: "id",
                    type: "INTEGER",
                    isPrimaryKey: true,
                    isNullable: false,
                    isUnique: true,
                    autoIncrement: true,
                },
                {
                    id: "users_name",
                    name: "name",
                    type: "VARCHAR",
                    length: 100,
                    isPrimaryKey: false,
                    isNullable: false,
                    isUnique: false,
                    autoIncrement: false,
                },
                {
                    id: "users_email",
                    name: "email",
                    type: "VARCHAR",
                    length: 255,
                    isPrimaryKey: false,
                    isNullable: true,
                    isUnique: true,
                    autoIncrement: false,
                },
            ],
        },
    },
    {
        id: "orders",
        type: "table",
        position: { x: 620, y: 120 },
        data: {
            tableName: "orders",
            columns: [
                {
                    id: "orders_id",
                    name: "id",
                    type: "INTEGER",
                    isPrimaryKey: true,
                    isNullable: false,
                    isUnique: true,
                    autoIncrement: true,
                },
                {
                    id: "orders_user_id",
                    name: "user_id",
                    type: "INTEGER",
                    isPrimaryKey: false,
                    isNullable: false,
                    isUnique: false,
                    autoIncrement: false,
                },
                {
                    id: "orders_amount",
                    name: "amount",
                    type: "DECIMAL",
                    precision: 10,
                    scale: 2,
                    isPrimaryKey: false,
                    isNullable: false,
                    isUnique: false,
                    autoIncrement: false,
                },
            ],
        },
    },
];

const initialEdges = [
    {
        id: "orders-user",
        source: "orders",
        sourceHandle: "orders_user_id",
        target: "users",
        targetHandle: "users_id",
        type: "relation",
        data: {
            relation: "required",
            onDelete: "CASCADE",
        },
    },
];

const findColumn = (nodes, nodeId, columnId) => {
    const node = nodes.find((item) => item.id === nodeId);
    return node?.data?.columns?.find((column) => column.id === columnId) || null;
};

const getUniqueTableName = (nodes, baseName) => {
    const names = new Set(
        nodes.map((node) => String(node.data?.tableName || node.id).toLowerCase())
    );

    if (!names.has(baseName.toLowerCase())) {
        return baseName;
    }

    let index = 2;
    while (names.has(`${baseName}_${index}`.toLowerCase())) {
        index += 1;
    }

    return `${baseName}_${index}`;
};

function SchemaBuilder({ isOpen = true, onClose }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [dialect, setDialect] = useState("postgresql");
    const [sqlPreviewOpen, setSqlPreviewOpen] = useState(true);
    const [schemaPreviewOpen, setSchemaPreviewOpen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const handleNodesChange = useCallback(
        (changes) => {
            const removedNodeIds = changes
                .filter((change) => change.type === "remove")
                .map((change) => change.id);

            if (removedNodeIds.length) {
                setEdges((currentEdges) =>
                    currentEdges.filter(
                        (edge) =>
                            !removedNodeIds.includes(edge.source) &&
                            !removedNodeIds.includes(edge.target)
                    )
                );
            }

            onNodesChange(changes);
        },
        [onNodesChange, setEdges]
    );

    const updateTable = useCallback((nodeId, patch) => {
        setNodes((currentNodes) =>
            currentNodes.map((node) =>
                node.id === nodeId
                    ? {
                          ...node,
                          data: {
                              ...node.data,
                              ...patch,
                          },
                      }
                    : node
            )
        );
    }, [setNodes]);

    const handleAddColumn = useCallback((nodeId) => {
        setNodes((currentNodes) =>
            currentNodes.map((node) => {
                if (node.id !== nodeId) {
                    return node;
                }

                const columns = node.data?.columns || [];
                return {
                    ...node,
                    data: {
                        ...node.data,
                        columns: [
                            ...columns,
                            createColumn(node.id, columns.length + 1),
                        ],
                    },
                };
            })
        );
    }, [setNodes]);

    const handleDeleteColumn = useCallback((nodeId, columnId) => {
        setNodes((currentNodes) =>
            currentNodes.map((node) => {
                if (node.id !== nodeId) {
                    return node;
                }

                const columns = node.data?.columns || [];
                if (columns.length <= 1) {
                    return node;
                }

                return {
                    ...node,
                    data: {
                        ...node.data,
                        columns: columns.filter((column) => column.id !== columnId),
                    },
                };
            })
        );

        setEdges((currentEdges) =>
            currentEdges.filter(
                (edge) =>
                    !(edge.source === nodeId && edge.sourceHandle === columnId) &&
                    !(edge.target === nodeId && edge.targetHandle === columnId)
            )
        );
    }, [setNodes, setEdges]);

    const handleRenameTable = useCallback((nodeId) => {
        const node = nodes.find((item) => item.id === nodeId);
        if (!node) return;

        const currentName = node.data?.tableName || node.id;
        const nextName = window.prompt("Table name", currentName);

        if (nextName === null) return;

        const trimmedName = nextName.trim();
        if (!trimmedName) {
            window.alert("Table name cannot be empty.");
            return;
        }

        const duplicate = nodes.some(
            (item) =>
                item.id !== nodeId &&
                String(item.data?.tableName || item.id).toLowerCase() ===
                    trimmedName.toLowerCase()
        );

        if (duplicate) {
            window.alert("A table with that name already exists.");
            return;
        }

        updateTable(nodeId, { tableName: trimmedName });
    }, [nodes, updateTable]);

    const handleDeleteTable = useCallback((nodeId) => {
        const node = nodes.find((item) => item.id === nodeId);
        if (!node) return;

        const tableName = node.data?.tableName || node.id;
        const confirmed = window.confirm(`Delete table "${tableName}"?`);
        if (!confirmed) return;

        setNodes((currentNodes) =>
            currentNodes.filter((item) => item.id !== nodeId)
        );

        setEdges((currentEdges) =>
            currentEdges.filter(
                (edge) => edge.source !== nodeId && edge.target !== nodeId
            )
        );
    }, [nodes, setNodes, setEdges]);

    const handleNodeMenu = useCallback((nodeId) => {
        const action = window.prompt(
            "Table action: rename or delete",
            "rename"
        );

        if (!action) return;

        if (action.trim().toLowerCase() === "rename") {
            handleRenameTable(nodeId);
        }

        if (action.trim().toLowerCase() === "delete") {
            handleDeleteTable(nodeId);
        }
    }, [handleDeleteTable, handleRenameTable]);

    const onConnect = useCallback((connection) => {
        if (
            !connection?.source ||
            !connection?.target ||
            !connection?.sourceHandle ||
            !connection?.targetHandle
        ) {
            return;
        }

        const sourceColumn = findColumn(
            nodes,
            connection.source,
            connection.sourceHandle
        );
        const targetColumn = findColumn(
            nodes,
            connection.target,
            connection.targetHandle
        );

        if (!sourceColumn || !targetColumn) return;
        if (!targetColumn.isPrimaryKey && !targetColumn.isUnique) return;
        if (sourceColumn.id === targetColumn.id && connection.source === connection.target) return;

        const duplicate = edges.some(
            (edge) =>
                edge.source === connection.source &&
                edge.sourceHandle === connection.sourceHandle &&
                edge.target === connection.target &&
                edge.targetHandle === connection.targetHandle
        );

        if (duplicate) return;

        const relation = sourceColumn.isNullable === false ? "required" : "optional";
        const onDelete = sourceColumn.isNullable === false ? "NO ACTION" : "SET NULL";

        setEdges((currentEdges) =>
            addEdge(
                {
                    id: `relation-${Date.now()}`,
                    source: connection.source,
                    sourceHandle: connection.sourceHandle,
                    target: connection.target,
                    targetHandle: connection.targetHandle,
                    type: "relation",
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 18,
                        height: 18,
                        color: "#5274D8",
                    },
                    data: {
                        relation,
                        onDelete,
                        onUpdate: "NO ACTION",
                    },
                },
                currentEdges
            )
        );
    }, [edges, nodes, setEdges]);

    const sql = useMemo(() => {
        try {
            return generateSQL(nodes, edges, dialect);
        } catch (error) {
            console.error("SQL generation failed:", error);
            return "-- Unable to generate SQL.";
        }
    }, [nodes, edges, dialect]);

    const handleAddTable = useCallback(() => {
        const tableId = `table_${Date.now()}`;
        const tableName = getUniqueTableName(nodes, "table");
        const index = nodes.length;

        const newTable = {
            id: tableId,
            type: "table",
            position: {
                x: 120 + (index % 3) * 430,
                y: 100 + Math.floor(index / 3) * 300,
            },
            data: {
                tableName,
                columns: [
                    {
                        id: `${tableId}_id`,
                        name: "id",
                        type: "INTEGER",
                        isPrimaryKey: true,
                        isNullable: false,
                        isUnique: true,
                        autoIncrement: true,
                    },
                ],
            },
        };

        setNodes((currentNodes) => [...currentNodes, newTable]);
    }, [nodes, setNodes]);

    const handleClear = useCallback(() => {
        if (!window.confirm("Clear the entire database design?")) return;
        setNodes([]);
        setEdges([]);
    }, [setNodes, setEdges]);

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose();
            return;
        }
        window.history.back();
    }, [onClose]);

    const flowNodes = useMemo(
        () =>
            nodes.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    updateTable,
                    onAddColumn: handleAddColumn,
                    onDeleteColumn: handleDeleteColumn,
                    onMenu: handleNodeMenu,
                    onDeleteTable: handleDeleteTable,
                },
            })),
        [
            nodes,
            updateTable,
            handleAddColumn,
            handleDeleteColumn,
            handleNodeMenu,
            handleDeleteTable,
        ]
    );

    if (!isOpen) return null;

    return (
        <div className="schema-builder">
            <header className="schema-builder-header">
                <div className="schema-builder-brand">
                    <FiDatabase className="schema-brand-icon" />
                    <span>NL2SQL</span>
                    <i>.</i>
                </div>

                <div className="schema-builder-heading">
                    <span className="schema-builder-eyebrow">DATABASE DESIGN</span>
                    <span className="schema-builder-title">Schema Builder</span>
                </div>

                <div className="schema-builder-header-actions">
                    <button type="button" className="schema-header-icon" title="Fullscreen" aria-label="Fullscreen">
                        <FiMaximize2 />
                    </button>
                    <button
                        type="button"
                        className="schema-header-icon"
                        title="Help"
                        aria-label="Help"
                        onClick={() => setShowHelp(true)}
                    >
                        <FiHelpCircle />
                    </button>
                    <button
                        type="button"
                        className="schema-builder-close"
                        onClick={handleClose}
                        aria-label="Close schema builder"
                        title="Close"
                    >
                        <FiX />
                    </button>
                </div>
            </header>

            <SchemaToolbar
                onAddTable={handleAddTable}
                onClear={handleClear}
                dialect={dialect}
                onDialectChange={setDialect}
                sqlPreviewOpen={sqlPreviewOpen}
                onToggleSQLPreview={() => setSqlPreviewOpen((value) => !value)}
                onHelp={() => setShowHelp(true)}
                onBack={handleClose}
            />

            <main className="schema-builder-content">
                <section className={`schema-canvas ${sqlPreviewOpen ? "with-sql" : ""}`}>
                    <ReactFlow
                        nodes={flowNodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onNodesChange={handleNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        deleteKeyCode={["Backspace", "Delete"]}
                        fitView
                        fitViewOptions={{ padding: 0.12, maxZoom: 1.15 }}
                        minZoom={0.25}
                        maxZoom={2}
                        defaultEdgeOptions={{
                            type: "relation",
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                width: 18,
                                height: 18,
                                color: "#5274D8",
                            },
                        }}
                        connectionLineStyle={{ stroke: "#5274D8", strokeWidth: 1.8 }}
                        snapToGrid
                        snapGrid={[16, 16]}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background
                            id="schema-grid"
                            variant={BackgroundVariant.Cross}
                            gap={24}
                            size={3}
                            color="#222B3B"
                        />
                        <Controls showInteractive={false} position="bottom-left" />
                        <MiniMap
                            position="bottom-right"
                            pannable
                            zoomable
                            nodeColor="#3654A6"
                            maskColor="rgba(5, 8, 14, 0.72)"
                            style={{ background: "#0B0F17" }}
                        />
                    </ReactFlow>

                    {nodes.length === 0 && (
                        <div className="schema-empty-state">
                            <div className="schema-empty-icon">
                                <FiDatabase />
                            </div>
                            <div className="schema-empty-kicker">SCHEMA DESIGNER</div>
                            <h3>Build your database</h3>
                            <p>Add a table to start designing your schema.</p>
                            <button type="button" onClick={handleAddTable}>
                                <FiPlus />
                                Add your first table
                            </button>
                        </div>
                    )}
                </section>

                {sqlPreviewOpen && (
                    <aside className="schema-sql-panel">
                        <SQLPreview sql={sql} dialect={dialect} />
                    </aside>
                )}
            </main>

            {schemaPreviewOpen && (
                <div className="schema-preview-overlay">
                    <div className="schema-preview-modal">
                        <button
                            type="button"
                            className="schema-preview-close"
                            onClick={() => setSchemaPreviewOpen(false)}
                            aria-label="Close schema preview"
                        >
                            <FiX />
                        </button>
                        <SchemaPreview nodes={nodes} edges={edges} dialect={dialect} />
                    </div>
                </div>
            )}

            {showHelp && (
                <div className="schema-help-overlay" onClick={() => setShowHelp(false)}>
                    <div className="schema-help-panel" onClick={(event) => event.stopPropagation()}>
                        <div className="schema-help-header">
                            <div>
                                <span className="schema-help-kicker">SCHEMA BUILDER</span>
                                <h2>How to design your database</h2>
                            </div>
                            <button
                                type="button"
                                className="schema-help-close"
                                onClick={() => setShowHelp(false)}
                                aria-label="Close help"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="schema-help-content">
                            <div className="help-step">
                                <span>01</span>
                                <div>
                                    <strong>Add a table</strong>
                                    <p>Create tables and place them anywhere on the canvas.</p>
                                </div>
                            </div>
                            <div className="help-step">
                                <span>02</span>
                                <div>
                                    <strong>Define columns</strong>
                                    <p>Add columns and configure their data types and constraints.</p>
                                </div>
                            </div>
                            <div className="help-step">
                                <span>03</span>
                                <div>
                                    <strong>Create relationships</strong>
                                    <p>Drag from a foreign-key column to a primary-key or unique column.</p>
                                </div>
                            </div>
                            <div className="help-step">
                                <span>04</span>
                                <div>
                                    <strong>Edit relationships</strong>
                                    <p>Select a relationship to change its options or delete it.</p>
                                </div>
                            </div>
                            <div className="help-step">
                                <span>05</span>
                                <div>
                                    <strong>Generate SQL</strong>
                                    <p>Select your target database and inspect the generated DDL.</p>
                                </div>
                            </div>
                        </div>

                        <div className="schema-help-footer">
                            <span>TIP</span>
                            <p>Connect foreign-key columns directly to PK or unique columns.</p>
                        </div>
                    </div>
                </div>
            )}

            <footer className="schema-builder-footer">
                <div className="schema-builder-status">
                    <span className="schema-status-dot" />
                    <span>SCHEMA DESIGNER</span>
                    <span className="schema-status-divider" />
                    <span>{nodes.length} TABLE{nodes.length === 1 ? "" : "S"}</span>
                    <span className="schema-status-divider" />
                    <span>{edges.length} RELATION{edges.length === 1 ? "" : "S"}</span>
                </div>
                <div className="schema-builder-dialect">
                    TARGET <strong>{dialect.toUpperCase()}</strong>
                </div>
            </footer>
        </div>
    );
}

export default SchemaBuilder;