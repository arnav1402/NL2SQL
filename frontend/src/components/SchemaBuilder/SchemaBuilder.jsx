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
FiArrowLeft,
FiCode,
FiDatabase,
FiHelpCircle,
FiMaximize2,
FiPlus,
FiTrash2,
FiX,
} from "react-icons/fi";

import "@xyflow/react/dist/style.css";

import TableNode from "./TableNode";
import RelationEdge from "./RelationEdge";
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

/* =========================================================
INITIAL DEMO SCHEMA
========================================================= */

const initialNodes = [
{
    id: "users",
    type: "table",
    position: {
    x: 120,
    y: 100,
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
    y: 120,
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
    sourceHandle: "orders_user_id-source",
    target: "users",
    targetHandle: "users_id-target",
    type: "relation",
    data: {
    relation: "required",
    onDelete: "CASCADE",
    },
},
];

/* =========================================================
HELPERS
========================================================= */

const getColumnIdFromHandle = (handleId) => {
if (!handleId) {
    return null;
}

return handleId
    .replace(/-source$/, "")
    .replace(/-target$/, "");
};

const findColumn = (nodes, nodeId, handleId) => {
const node = nodes.find((item) => item.id === nodeId);

if (!node) {
    return null;
}

const columnId = getColumnIdFromHandle(handleId);

return (
    node.data?.columns?.find(
    (column) => column.id === columnId
    ) || null
);
};

/* =========================================================
COMPONENT
========================================================= */

function SchemaBuilder({
isOpen = true,
onClose,
}) {
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

const [showHelp, setShowHelp] =
    useState(false);

/* =======================================================
    CONNECTION HANDLER
======================================================= */

const onConnect = useCallback(
    (connection) => {
    if (
        !connection?.source ||
        !connection?.target ||
        !connection?.sourceHandle ||
        !connection?.targetHandle
    ) {
        return;
    }

    /*
    * React Flow should normally give us:
    *
    * FK column -> source handle
    * PK column -> target handle
    *
    * This fallback also protects against older TableNode
    * versions where the handles were reversed.
    */

    let source = connection.source;
    let target = connection.target;
    let sourceHandle = connection.sourceHandle;
    let targetHandle = connection.targetHandle;

    const sourceIsTargetHandle =
        sourceHandle.endsWith("-target");

    const targetIsSourceHandle =
        targetHandle.endsWith("-source");

    if (
        sourceIsTargetHandle &&
        targetIsSourceHandle
    ) {
        source = connection.target;
        target = connection.source;

        sourceHandle = connection.targetHandle;
        targetHandle = connection.sourceHandle;
    }

    const sourceColumn = findColumn(
        nodes,
        source,
        sourceHandle
    );

    const targetColumn = findColumn(
        nodes,
        target,
        targetHandle
    );

    if (!sourceColumn || !targetColumn) {
        return;
    }

    /*
    * A relationship should terminate at a PK or UNIQUE
    * column. This prevents accidental connections.
    */

    if (
        !targetColumn.isPrimaryKey &&
        !targetColumn.isUnique
    ) {
        return;
    }

    /*
    * Prevent self-linking the same column.
    */

    if (
        source === target &&
        sourceHandle === targetHandle
    ) {
        return;
    }

    /*
    * Prevent duplicate relationships.
    */

    const duplicate = edges.some(
        (edge) =>
        edge.source === source &&
        edge.sourceHandle === sourceHandle &&
        edge.target === target &&
        edge.targetHandle === targetHandle
    );

    if (duplicate) {
        return;
    }

    const newEdge = {
        id: `relation-${Date.now()}`,
        source,
        sourceHandle,
        target,
        targetHandle,
        type: "relation",

        /*
        * Keep the marker here as a fallback.
        * RelationEdge also renders its own marker.
        */

        markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: "#5274D8",
        },

        data: {
        relation:
            sourceColumn.isNullable === false
            ? "required"
            : "optional",

        onDelete:
            sourceColumn.isNullable === false
            ? "CASCADE"
            : "SET NULL",
        },
    };

    setEdges((currentEdges) =>
        addEdge(newEdge, currentEdges)
    );
    },
    [edges, nodes, setEdges]
);

/* =======================================================
    SQL
======================================================= */

const sql = useMemo(() => {
    try {
    return generateSQL(
        nodes,
        edges,
        dialect
    );
    } catch (error) {
    console.error(
        "SQL generation failed:",
        error
    );

    return "-- Unable to generate SQL.";
    }
}, [nodes, edges, dialect]);

/* =======================================================
    ADD TABLE
======================================================= */

const handleAddTable = useCallback(() => {
    const tableNumber =
    nodes.length + 1;

    const tableId =
    `table_${Date.now()}`;

    const columnsPerRow = 3;

    const newTable = {
    id: tableId,
    type: "table",

    position: {
        x:
        120 +
        (nodes.length % columnsPerRow) *
            430,

        y:
        100 +
        Math.floor(
            nodes.length /
            columnsPerRow
        ) *
            300,
    },

    data: {
        tableName:
        `table_${tableNumber}`,

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

/* =======================================================
    CLEAR
======================================================= */

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

/* =======================================================
    CLOSE
======================================================= */

const handleClose = useCallback(() => {
    if (onClose) {
    onClose();
    return;
    }

    window.history.back();
}, [onClose]);

/* =======================================================
    HELP
======================================================= */

const handleOpenHelp = useCallback(() => {
    setShowHelp(true);
}, []);

const handleCloseHelp = useCallback(() => {
    setShowHelp(false);
}, []);

if (!isOpen) {
    return null;
}

/* =======================================================
    RENDER
======================================================= */

return (
    <div className="schema-builder">

    {/* ===================================================
        HEADER
    =================================================== */}

    <header className="schema-builder-header">

        <div className="schema-builder-brand">
        <FiDatabase
            className="schema-brand-icon"
        />

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

        <div className="schema-builder-header-actions">

        <button
            type="button"
            className="schema-header-icon"
            title="Fullscreen"
            aria-label="Fullscreen"
        >
            <FiMaximize2 />
        </button>

        <button
            type="button"
            className="schema-header-icon"
            title="Help"
            aria-label="Help"
            onClick={handleOpenHelp}
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

    {/* ===================================================
        TOOLBAR
    =================================================== */}

    <div className="schema-toolbar">

        <div className="schema-toolbar-left">

        <button
            type="button"
            className="schema-toolbar-button primary"
            onClick={handleAddTable}
        >
            <FiPlus />
            <span>Add Table</span>
        </button>

        <div className="toolbar-divider" />

        <button
            type="button"
            className="schema-toolbar-button"
            onClick={handleClose}
        >
            <FiArrowLeft />
            <span>Back</span>
        </button>

        <button
            type="button"
            className="schema-toolbar-button danger"
            onClick={handleClear}
        >
            <FiTrash2 />
            <span>Clear</span>
        </button>

        </div>

        <div className="schema-toolbar-center">

        <div className="dialect-selector">

            <span className="dialect-label">
            TARGET
            </span>

            <select
            value={dialect}
            onChange={(event) =>
                setDialect(event.target.value)
            }
            >
            <option value="postgresql">
                PostgreSQL
            </option>

            <option value="mysql">
                MySQL
            </option>

            <option value="sqlite">
                SQLite
            </option>
            </select>

        </div>

        </div>

        <div className="schema-toolbar-right">

        <button
            type="button"
            className={`schema-toolbar-button sql-button ${
            sqlPreviewOpen
                ? "active"
                : ""
            }`}
            onClick={() =>
            setSqlPreviewOpen(
                (value) => !value
            )
            }
        >
            <FiCode />
            <span>SQL Preview</span>
        </button>

        <button
            type="button"
            className="schema-help-button"
            onClick={handleOpenHelp}
            aria-label="Schema builder help"
        >
            <FiHelpCircle />
        </button>

        </div>

    </div>

    {/* ===================================================
        WORKSPACE
    =================================================== */}

    <main className="schema-builder-content">

        <section
        className={`schema-canvas ${
            sqlPreviewOpen
            ? "with-sql"
            : ""
        }`}
        >

        <ReactFlow
            nodes={nodes}
            edges={edges}

            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}

            onNodesChange={
            onNodesChange
            }

            onEdgesChange={
            onEdgesChange
            }

            onConnect={onConnect}

            fitView

            fitViewOptions={{
            padding: 0.12,
            maxZoom: 1.15,
            }}

            minZoom={0.25}
            maxZoom={2}

            defaultEdgeOptions={{
            type: "relation",

            markerEnd: {
                type:
                MarkerType.ArrowClosed,
                width: 18,
                height: 18,
                color: "#5274D8",
            },
            }}

            connectionLineStyle={{
            stroke: "#5274D8",
            strokeWidth: 1.8,
            }}

            snapToGrid
            snapGrid={[16, 16]}

            proOptions={{
            hideAttribution: true,
            }}
        >

            <Background
            id="schema-grid"
            variant={BackgroundVariant.Cross}
            gap={24}
            size={3}
            color="#222B3B"
            />

            <Controls
            showInteractive={false}
            position="bottom-left"
            />

            <MiniMap
            position="bottom-right"
            pannable
            zoomable

            nodeColor="#3654A6"

            maskColor="rgba(5, 8, 14, 0.72)"

            style={{
                background:
                "#0B0F17",
            }}
            />

        </ReactFlow>

        {/* EMPTY STATE */}

        {nodes.length === 0 && (
            <div className="schema-empty-state">

            <div className="schema-empty-icon">
                <FiDatabase />
            </div>

            <div className="schema-empty-kicker">
                SCHEMA DESIGNER
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
                <FiPlus />
                Add your first table
            </button>

            </div>
        )}

        </section>

        {/* =================================================
            SQL PREVIEW
        ================================================= */}

        {sqlPreviewOpen && (
        <aside className="schema-sql-panel">

            <SQLPreview
            sql={sql}
            dialect={dialect}
            />

        </aside>
        )}

    </main>

    {/* ===================================================
        SCHEMA PREVIEW
    =================================================== */}

    {schemaPreviewOpen && (
        <div className="schema-preview-overlay">

        <div className="schema-preview-modal">

            <button
            type="button"
            className="schema-preview-close"
            onClick={() =>
                setSchemaPreviewOpen(
                false
                )
            }
            aria-label="Close schema preview"
            >
            <FiX />
            </button>

            <SchemaPreview
            nodes={nodes}
            edges={edges}
            dialect={dialect}
            />

        </div>

        </div>
    )}

    {/* ===================================================
        HELP
    =================================================== */}

    {showHelp && (
        <div
        className="schema-help-overlay"
        onClick={handleCloseHelp}
        >

        <div
            className="schema-help-panel"
            onClick={(event) =>
            event.stopPropagation()
            }
        >

            <div className="schema-help-header">

            <div>
                <span className="schema-help-kicker">
                SCHEMA BUILDER
                </span>

                <h2>
                How to design your database
                </h2>
            </div>

            <button
                type="button"
                className="schema-help-close"
                onClick={handleCloseHelp}
                aria-label="Close help"
            >
                <FiX />
            </button>

            </div>

            <div className="schema-help-content">

            <div className="help-step">
                <span>01</span>

                <div>
                <strong>
                    Add a table
                </strong>

                <p>
                    Create tables and place
                    them anywhere on the
                    canvas.
                </p>
                </div>
            </div>

            <div className="help-step">
                <span>02</span>

                <div>
                <strong>
                    Define columns
                </strong>

                <p>
                    Add columns and configure
                    their data types and
                    constraints.
                </p>
                </div>
            </div>

            <div className="help-step">
                <span>03</span>

                <div>
                <strong>
                    Create relationships
                </strong>

                <p>
                    Drag from a foreign-key
                    column to a primary-key
                    or unique column.
                </p>
                </div>
            </div>

            <div className="help-step">
                <span>04</span>

                <div>
                <strong>
                    Required / optional
                </strong>

                <p>
                    Click a relationship
                    label to switch its
                    cardinality requirement.
                </p>
                </div>
            </div>

            <div className="help-step">
                <span>05</span>

                <div>
                <strong>
                    Generate SQL
                </strong>

                <p>
                    Select your target
                    database and inspect
                    the generated DDL.
                </p>
                </div>
            </div>

            </div>

            <div className="schema-help-footer">

            <span>TIP</span>

            <p>
                Connect foreign-key columns
                directly to PK or unique
                columns.
            </p>

            </div>

        </div>

        </div>
    )}

    {/* ===================================================
        FOOTER
    =================================================== */}

    <footer className="schema-builder-footer">

        <div className="schema-builder-status">

        <span className="schema-status-dot" />

        <span>
            SCHEMA DESIGNER
        </span>

        <span className="schema-status-divider" />

        <span>
            {nodes.length} TABLE
            {nodes.length === 1
            ? ""
            : "S"}
        </span>

        <span className="schema-status-divider" />

        <span>
            {edges.length} RELATION
            {edges.length === 1
            ? ""
            : "S"}
        </span>

        </div>

        <div className="schema-builder-dialect">

        TARGET{" "}

        <strong>
            {dialect.toUpperCase()}
        </strong>

        </div>

    </footer>

    </div>
);
}

export default SchemaBuilder;