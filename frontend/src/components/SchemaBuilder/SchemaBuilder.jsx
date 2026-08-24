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

import "@xyflow/react/dist/style.css";

import TableNode from "./TableNode";
import RelationEdge from "./RelationEdge";
import SchemaToolbar from "./SchemaToolbar";
import SQLPreview from "./SQLPreview";
import SchemaPreview from "./SchemaPreview";

import { generateSQL } from "../../utils/generateSQL";

import "./SchemaBuilder.css";

const nodeTypes = {
table: TableNode,
};

const edgeTypes = {
relation: RelationEdge,
};

const initialNodes = [
{
    id: "users",
    type: "table",
    position: {
    x: 120,
    y: 120,
    },
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
    position: {
    x: 620,
    y: 220,
    },
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
    markerEnd: {
    type: MarkerType.ArrowClosed,
    },
    data: {
    relation: "required",
    onDelete: "NO ACTION",
    },
},
];

function SchemaBuilder({ isOpen = true, onClose }) {
const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

const [dialect, setDialect] =
    useState("postgresql");

const [sqlPreviewOpen, setSqlPreviewOpen] =
    useState(true);

const [schemaPreviewOpen, setSchemaPreviewOpen] =
    useState(false);

const [helpOpen, setHelpOpen] =
    useState(false);

const onConnect = useCallback(
    (connection) => {
    if (
        !connection.source ||
        !connection.target ||
        !connection.sourceHandle ||
        !connection.targetHandle
    ) {
        return;
    }

    if (
        connection.source === connection.target &&
        connection.sourceHandle === connection.targetHandle
    ) {
        return;
    }

    setEdges((currentEdges) => {
        const duplicate = currentEdges.some(
        (edge) =>
            edge.source === connection.source &&
            edge.sourceHandle === connection.sourceHandle &&
            edge.target === connection.target &&
            edge.targetHandle === connection.targetHandle
        );

        if (duplicate) {
        return currentEdges;
        }

        const newEdge = {
        ...connection,
        id: `relation-${Date.now()}`,
        type: "relation",
        markerEnd: {
            type: MarkerType.ArrowClosed,
        },
        data: {
            relation: "required",
            onDelete: "NO ACTION",
        },
        };

        return addEdge(newEdge, currentEdges);
    });
    },
    [setEdges]
);

const sql = useMemo(() => {
    try {
    return generateSQL(nodes, edges, dialect);
    } catch (error) {
    console.error("SQL generation failed:", error);
    return "-- Unable to generate SQL.";
    }
}, [nodes, edges, dialect]);

const handleAddTable = useCallback(() => {
    const tableNumber = nodes.length + 1;
    const tableId = `table_${Date.now()}`;

    const newTable = {
    id: tableId,
    type: "table",
    position: {
        x: 120 + (nodes.length % 3) * 420,
        y: 100 + Math.floor(nodes.length / 3) * 280,
    },
    data: {
        tableName: `table_${tableNumber}`,
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

    setNodes((currentNodes) => [
    ...currentNodes,
    newTable,
    ]);
}, [nodes.length, setNodes]);

const handleClear = useCallback(() => {
    const confirmed = window.confirm(
    "Clear the entire database design?"
    );

    if (!confirmed) {
    return;
    }

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

// const handleBack = useCallback(() => {
//     window.history.back();
// }, []);

if (!isOpen) {
    return null;
}

return (
    <div className="schema-builder">

    {/* =====================================================
        HEADER
    ===================================================== */}

    <header className="schema-builder-header">

        <div className="schema-builder-brand">
        <span>NL2SQL</span>
        <i>.</i>
        </div>

        <div className="schema-builder-heading">
        <span className="schema-builder-eyebrow">
            DATABASE DESIGN
        </span>

        <span className="schema-builder-title">
            Schema Builder
        </span>
        </div>

        <button
        type="button"
        className="schema-builder-close"
        onClick={handleClose}
        aria-label="Close schema builder"
        title="Close"
        >
        ×
        </button>

    </header>


    {/* =====================================================
        TOOLBAR
    ===================================================== */}

    <SchemaToolbar
        onAddTable={handleAddTable}
        onClear={handleClear}
        dialect={dialect}
        onDialectChange={setDialect}
        sqlPreviewOpen={sqlPreviewOpen}
        onToggleSQLPreview={() =>
        setSqlPreviewOpen((value) => !value)
        }
        onHelp={() => setHelpOpen(true)}
    />


    {/* =====================================================
        MAIN WORKSPACE
    ===================================================== */}

    <main className="schema-builder-content">

        <section
        className={`schema-canvas ${
            sqlPreviewOpen ? "with-sql" : ""
        }`}
        >

        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={{
            padding: 0.2,
            maxZoom: 1.1,
            }}
            minZoom={0.2}
            maxZoom={2}
            defaultEdgeOptions={{
            type: "relation",
            markerEnd: {
                type: MarkerType.ArrowClosed,
            },
            }}
            connectionLineStyle={{
            strokeWidth: 1.5,
            }}
        >

            <Background
            id="schema-cross-background"
            variant={BackgroundVariant.Cross}
            gap={24}
            size={5}
            color="#d7dce5"
            />

            <Controls
            showInteractive={false}
            />

            <MiniMap
            pannable
            zoomable
            />

        </ReactFlow>


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {nodes.length === 0 && (
            <div className="schema-empty-state">

            <div className="schema-empty-icon">
                +
            </div>

            <h3>
                Build your database
            </h3>

            <p>
                Add a table to start
                designing your schema.
            </p>

            <button
                type="button"
                onClick={handleAddTable}
            >
                Add your first table
                <span>↗</span>
            </button>

            </div>
        )}

        </section>


        {/* ===================================================
            SQL PREVIEW
        =================================================== */}

        {sqlPreviewOpen && (
        <aside
            className="schema-sql-panel"
            aria-label="SQL preview"
        >
            <SQLPreview
            sql={sql}
            dialect={dialect}
            />
        </aside>
        )}

    </main>


    {/* =====================================================
        FOOTER
    ===================================================== */}

    <footer className="schema-builder-footer">

        <div className="schema-builder-status">

        <span className="schema-status-dot" />

        <span>
            SCHEMA DESIGNER
        </span>

        <span className="schema-status-divider" />

        <span>
            {nodes.length} TABLE
            {nodes.length === 1 ? "" : "S"}
        </span>

        <span className="schema-status-divider" />

        <span>
            {edges.length} RELATION
            {edges.length === 1 ? "" : "S"}
        </span>

        </div>

        <div className="schema-builder-dialect">
        TARGET{" "}
        <strong>
            {dialect.toUpperCase()}
        </strong>
        </div>

    </footer>


    {/* =====================================================
        SCHEMA PREVIEW MODAL
    ===================================================== */}

    {schemaPreviewOpen && (
        <div
        className="schema-preview-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Schema preview"
        onMouseDown={(event) => {
            if (
            event.target === event.currentTarget
            ) {
            setSchemaPreviewOpen(false);
            }
        }}
        >

        <div className="schema-preview-modal">

            <button
            type="button"
            className="schema-preview-close"
            onClick={() =>
                setSchemaPreviewOpen(false)
            }
            aria-label="Close schema preview"
            title="Close"
            >
            ×
            </button>

            <SchemaPreview
            nodes={nodes}
            edges={edges}
            dialect={dialect}
            />

        </div>

        </div>
    )}


    {/* =====================================================
        HELP MODAL
    ===================================================== */}

    {helpOpen && (
        <div
        className="schema-help-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Schema Builder help"
        onMouseDown={(event) => {
            if (
            event.target === event.currentTarget
            ) {
            setHelpOpen(false);
            }
        }}
        >

        <div className="schema-help-modal">

            <div className="schema-help-header">

            <div>
                <span className="schema-help-eyebrow">
                SCHEMA BUILDER
                </span>

                <h2>
                How it works
                </h2>
            </div>

            <button
                type="button"
                className="schema-help-close"
                onClick={() =>
                setHelpOpen(false)
                }
                aria-label="Close help"
            >
                ×
            </button>

            </div>


            <div className="schema-help-content">

            <div className="schema-help-item">

                <span className="schema-help-number">
                01
                </span>

                <div>
                <strong>
                    Add tables
                </strong>

                <p>
                    Use Add Table to create a
                    new database table.
                </p>
                </div>

            </div>


            <div className="schema-help-item">

                <span className="schema-help-number">
                02
                </span>

                <div>
                <strong>
                    Define columns
                </strong>

                <p>
                    Edit column names, data
                    types and constraints directly
                    inside each table.
                </p>
                </div>

            </div>


            <div className="schema-help-item">

                <span className="schema-help-number">
                03
                </span>

                <div>
                <strong>
                    Create relationships
                </strong>

                <p>
                    Drag from a column handle
                    to another table column to
                    create a relationship.
                </p>
                </div>

            </div>


            <div className="schema-help-item">

                <span className="schema-help-number">
                04
                </span>

                <div>
                <strong>
                    Generate SQL
                </strong>

                <p>
                    Choose your target dialect
                    and inspect the generated
                    DDL in SQL Preview.
                </p>
                </div>

            </div>

            </div>


            <div className="schema-help-footer">

            <span>
                SUPPORTED DIALECTS
            </span>

            <div>
                PostgreSQL · MySQL · SQLite
            </div>

            </div>

        </div>

        </div>
    )}

    </div>
);
}

export default SchemaBuilder;