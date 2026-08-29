import { useCallback, useEffect, useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MiniMap, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import SchemaTableNode from "./SchemaTableNode.jsx";
import { layoutSchemaGraph } from "./layoutSchemaGraph";
import { getSchemaStructure, refreshSchema } from "../api";
import "./DatabaseVisualizer.css";

const nodeTypes = { schemaTable: SchemaTableNode };

function DatabaseVisualizerInner({ connectionId }) {
const [tables, setTables] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [refreshing, setRefreshing] = useState(false);

const load = useCallback(async () => {
    if (!connectionId) return;
    setLoading(true);
    setError(null);
    try {
    const data = await getSchemaStructure(connectionId);
    setTables(data.tables || []);
    } catch (err) {
    setError(err?.message || "Couldn't load the database schema.");
    } finally {
    setLoading(false);
    }
}, [connectionId]);

useEffect(() => { load(); }, [load]);

const handleRefresh = async () => {
    if (!connectionId) return;
    setRefreshing(true);
    try {
    await refreshSchema(connectionId);
    await load();
    } catch (err) {
    setError(err?.message || "Couldn't refresh the schema.");
    } finally {
    setRefreshing(false);
    }
};

const { nodes, edges } = useMemo(
    () => (tables ? layoutSchemaGraph(tables) : { nodes: [], edges: [] }),
    [tables]
);

return (
    <div className="schema-visualizer">
    <div className="schema-visualizer-header">
        <div>
        <div className="schema-visualizer-eyebrow">DATABASE</div>
        <h1>Visualize Your Database</h1>
        <p>Tables, columns, and relationships in your connected database.</p>
        </div>

        <button
        type="button"
        className="schema-visualizer-refresh"
        onClick={handleRefresh}
        disabled={refreshing || loading}
        >
        {refreshing ? "Refreshing..." : "Refresh Schema"}
        </button>
    </div>

    <div className="schema-visualizer-canvas">
        {loading && <div className="schema-visualizer-state">Loading schema…</div>}

        {!loading && error && (
        <div className="schema-visualizer-state schema-visualizer-state--error">
            {error}
            <button type="button" onClick={load}>Try Again</button>
        </div>
        )}

        {!loading && !error && tables?.length === 0 && (
        <div className="schema-visualizer-state">No tables found in this database.</div>
        )}

        {!loading && !error && tables?.length > 0 && (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable={false}
        >
            <Background gap={24} size={1} color="rgba(255,255,255,0.05)" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable style={{ background: "#0a0d12" }} />
        </ReactFlow>
        )}
    </div>
    </div>
);
}

export default function DatabaseVisualizer(props) {
return (
    <ReactFlowProvider>
    <DatabaseVisualizerInner {...props} />
    </ReactFlowProvider>
);
}