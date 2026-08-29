import { MarkerType } from "@xyflow/react";

const NODE_WIDTH = 260;
const HEADER_HEIGHT = 42;
const ROW_HEIGHT = 30;
const GAP_X = 70;
const GAP_Y = 50;

export function layoutSchemaGraph(tables = []) {
const laneCount = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(tables.length || 1))));
const laneHeights = new Array(laneCount).fill(0);

const nodes = tables.map((table) => {
    const columnCount = Math.max(table.columns?.length || 0, 1);
    const nodeHeight = HEADER_HEIGHT + columnCount * ROW_HEIGHT + 16;

    let lane = 0;
    for (let i = 1; i < laneCount; i++) {
    if (laneHeights[i] < laneHeights[lane]) lane = i;
    }

    const position = { x: lane * (NODE_WIDTH + GAP_X), y: laneHeights[lane] };
    laneHeights[lane] += nodeHeight + GAP_Y;

    const pkColumns = table.primary_key?.columns || [];
    const fkColumns = new Set(
    (table.foreign_keys || []).flatMap((fk) => fk.columns || [])
    );

    return {
    id: table.name,
    type: "schemaTable",
    position,
    draggable: true,
    data: {
        tableName: table.name,
        columns: (table.columns || []).map((col) => ({
        name: col.name,
        type: col.type,
        isPrimaryKey: pkColumns.includes(col.name),
        isForeignKey: fkColumns.has(col.name),
        })),
    },
    };
});

const edges = [];
tables.forEach((table) => {
    (table.foreign_keys || []).forEach((fk, fkIndex) => {
    const localCols = fk.columns || [];
    const refCols = fk.referenced_columns || [];

    localCols.forEach((localCol, i) => {
        const refCol = refCols[i];
        if (!refCol || !fk.referenced_table) return;

        edges.push({
        id: `${table.name}.${localCol}->${fk.referenced_table}.${refCol}-${fkIndex}`,
        source: table.name,
        sourceHandle: localCol,
        target: fk.referenced_table,
        targetHandle: refCol,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#4C6FFF" },
        style: { stroke: "#4C6FFF", strokeWidth: 1.5 },
        });
    });
    });
});

return { nodes, edges };
}