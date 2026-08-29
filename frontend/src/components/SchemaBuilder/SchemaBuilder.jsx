import { useCallback, useMemo, useState } from "react";
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FiDatabase, FiPlus, FiX } from "react-icons/fi";

import TableNode from "./TableNode";
import RelationEdge from "./RelationEdge";
import SchemaToolbar from "./SchemaToolbar";
import SchemaPreview from "./SchemaPreview";
import SchemaHelpModal from "./SchemaHelpModal";
import { generateSQL } from "./sqlGenerator";

import "./SchemaBuilder.css";

const nodeTypes = { table: TableNode };
const edgeTypes = { relation: RelationEdge };

let tableCounter = 0;
let columnCounter = 0;

function nextTableId() {
    tableCounter += 1;
    return `table_${Date.now()}_${tableCounter}`;
}

function nextColumnId() {
    columnCounter += 1;
    return `col_${Date.now()}_${columnCounter}`;
}

function SchemaBuilderInner({ onClose }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [dialect, setDialect] = useState("postgresql");
    const [sqlPreviewOpen, setSqlPreviewOpen] = useState(true);
    const [helpOpen, setHelpOpen] = useState(false);

    const updateTable = useCallback(
        (id, updates) => {
            setNodes((current) =>
                current.map((node) =>
                    node.id === id
                        ? { ...node, data: { ...node.data, ...updates } }
                        : node
                )
            );
        },
        [setNodes]
    );

    const onAddColumn = useCallback(
        (id) => {
            setNodes((current) =>
                current.map((node) => {
                    if (node.id !== id) return node;

                    const columns = Array.isArray(node.data?.columns)
                        ? node.data.columns
                        : [];

                    const newColumn = {
                        id: nextColumnId(),
                        name: "column",
                        type: "TEXT",
                        isPrimaryKey: false,
                        isUnique: false,
                        isNullable: true,
                    };

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            columns: [...columns, newColumn],
                        },
                    };
                })
            );
        },
        [setNodes]
    );

    const onDeleteColumn = useCallback(
        (id, columnId) => {
            setNodes((current) =>
                current.map((node) => {
                    if (node.id !== id) return node;

                    const columns = (node.data?.columns || []).filter(
                        (column) => column.id !== columnId
                    );

                    return { ...node, data: { ...node.data, columns } };
                })
            );

            setEdges((current) =>
                current.filter(
                    (edge) =>
                        !(edge.source === id && edge.sourceHandle === columnId) &&
                        !(edge.target === id && edge.targetHandle === columnId)
                )
            );
        },
        [setNodes, setEdges]
    );

    const handleTableMenu = useCallback(
        (id) => {
            const node = nodes.find((item) => item.id === id);
            const name = node?.data?.tableName || "this table";

            if (
                typeof window !== "undefined" &&
                !window.confirm(
                    `Delete table "${name}"? This also removes any relationships connected to it.`
                )
            ) {
                return;
            }

            setNodes((current) => current.filter((item) => item.id !== id));
            setEdges((current) =>
                current.filter((edge) => edge.source !== id && edge.target !== id)
            );
        },
        [nodes, setNodes, setEdges]
    );

    const addTable = useCallback(() => {
        setNodes((current) => {
            const index = current.length;
            const id = nextTableId();

            const newNode = {
                id,
                type: "table",
                position: {
                    x: 80 + (index % 3) * 440,
                    y: 80 + Math.floor(index / 3) * 340,
                },
                data: {
                    tableName: `table_${index + 1}`,
                    columns: [
                        {
                            id: nextColumnId(),
                            name: "id",
                            type: "INTEGER",
                            isPrimaryKey: true,
                            isUnique: true,
                            isNullable: false,
                        },
                    ],
                    updateTable,
                    onAddColumn,
                    onDeleteColumn,
                    onMenu: handleTableMenu,
                },
            };

            return [...current, newNode];
        });
    }, [setNodes, updateTable, onAddColumn, onDeleteColumn, handleTableMenu]);

    const handleClear = useCallback(() => {
        if (nodes.length === 0 && edges.length === 0) return;

        if (
            typeof window !== "undefined" &&
            !window.confirm(
                "Clear all tables and relationships? This cannot be undone."
            )
        ) {
            return;
        }

        setNodes([]);
        setEdges([]);
    }, [nodes.length, edges.length, setNodes, setEdges]);

    const onConnect = useCallback(
        (connection) => {
            if (!connection.source || !connection.target) return;

            if (
                connection.source === connection.target &&
                connection.sourceHandle === connection.targetHandle
            ) {
                return;
            }

            setEdges((current) =>
                addEdge(
                    {
                        ...connection,
                        type: "relation",
                        data: {
                            relation: "required",
                            cardinality: "1:N",
                            onDelete: "NO ACTION",
                            onUpdate: "NO ACTION",
                        },
                    },
                    current
                )
            );
        },
        [setEdges]
    );

    const sql = useMemo(
        () => generateSQL(nodes, edges, dialect),
        [nodes, edges, dialect]
    );

    return (
        <div className="schema-builder">
            <header className="schema-builder-header">
                <div className="schema-builder-brand">
                    <FiDatabase className="schema-brand-icon" />
                    <span>
                        schema<i>builder</i>
                    </span>
                </div>

                <div className="schema-builder-heading">
                    <span className="schema-builder-eyebrow">
                        VISUAL DATABASE DESIGNER
                    </span>
                    <span className="schema-builder-title">
                        {nodes.length} table{nodes.length === 1 ? "" : "s"} ·{" "}
                        {edges.length} relationship
                        {edges.length === 1 ? "" : "s"}
                    </span>
                </div>

                <div className="schema-builder-header-actions">
                    <button
                        type="button"
                        className="schema-builder-close"
                        onClick={onClose}
                        aria-label="Close Schema Builder"
                        title="Close Schema Builder"
                    >
                        <FiX />
                    </button>
                </div>
            </header>

            <SchemaToolbar
                onAddTable={addTable}
                onClear={handleClear}
                dialect={dialect}
                onDialectChange={setDialect}
                sqlPreviewOpen={sqlPreviewOpen}
                onToggleSQLPreview={() =>
                    setSqlPreviewOpen((value) => !value)
                }
                onHelp={() => setHelpOpen(true)}
                onBack={onClose}
            />

            <div className="schema-builder-content">
                <div className="schema-canvas">
                    {nodes.length === 0 && (
                        <div className="schema-empty-state">
                            <div className="schema-empty-icon">
                                <FiDatabase />
                            </div>

                            <div className="schema-empty-kicker">
                                EMPTY CANVAS
                            </div>

                            <h3>Start your schema</h3>

                            <p>
                                Add a table to begin designing your database
                                visually.
                            </p>

                            <button type="button" onClick={addTable}>
                                <FiPlus />
                                Add Table
                            </button>
                        </div>
                    )}

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        proOptions={{ hideAttribution: true }}
                        fitView
                        minZoom={0.25}
                        maxZoom={1.6}
                    >
                        <Background
                            gap={22}
                            size={1}
                            color="rgba(255,255,255,0.05)"
                        />
                        <Controls showInteractive={false} />
                        <MiniMap
                            pannable
                            zoomable
                            style={{ background: "#0a0f17" }}
                        />
                    </ReactFlow>
                </div>

                {sqlPreviewOpen && (
                    <div className="schema-sql-panel">
                        <SchemaPreview
                            nodes={nodes}
                            edges={edges}
                            dialect={dialect}
                            sql={sql}
                        />
                    </div>
                )}
            </div>

            <footer className="schema-builder-footer">
                <div className="schema-builder-status">
                    <span className="schema-status-dot" />
                    <span>
                        {nodes.length} TABLES · {edges.length} RELATIONSHIPS
                    </span>
                </div>

                <div className="schema-builder-dialect">
                    TARGET: <strong>{dialect.toUpperCase()}</strong>
                </div>
            </footer>

            {helpOpen && <SchemaHelpModal onClose={() => setHelpOpen(false)} />}
        </div>
    );
}

function SchemaBuilder({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <ReactFlowProvider>
            <SchemaBuilderInner onClose={onClose} />
        </ReactFlowProvider>
    );
}

export default SchemaBuilder;