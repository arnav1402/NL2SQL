import {
    BaseEdge,
    EdgeLabelRenderer,
    MarkerType,
    Position,
    getSmoothStepPath,
    useReactFlow,
    useInternalNode,
} from "@xyflow/react";

import "./RelationEdge.css";
import { TABLE_HEADER_HEIGHT, COLUMN_ROW_HEIGHT } from "./TableNode";

function getHandleY(node, handleId, fallbackY) {
    const columns = Array.isArray(node?.data?.columns)
        ? node.data.columns
        : [];

    const index = columns.findIndex((column) => column.id === handleId);

    if (index === -1) {
        return fallbackY;
    }

    const nodeTop =
        node?.internals?.positionAbsolute?.y ??
        node?.position?.y ??
        0;

    return (
        nodeTop +
        TABLE_HEADER_HEIGHT +
        index * COLUMN_ROW_HEIGHT +
        COLUMN_ROW_HEIGHT / 2
    );
}

function getNodeBox(node, fallbackX, fallbackWidth = 390) {
    const nodeLeft =
        node?.internals?.positionAbsolute?.x ??
        node?.position?.x ??
        fallbackX;

    const width = node?.measured?.width ?? node?.width ?? fallbackWidth;

    return { left: nodeLeft, width, right: nodeLeft + width };
}

function findColumn(node, columnId) {
    const columns = Array.isArray(node?.data?.columns) ? node.data.columns : [];
    return columns.find((column) => column.id === columnId) || null;
}

function RelationEdge({
    id,
    source,
    target,
    sourceHandleId,
    targetHandleId,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
    selected,
}) {
    const { setEdges } = useReactFlow();

    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);

    // Floating edge: recompute which side of each table is actually
    // closer to the other table on every render, instead of trusting
    // the fixed handle side (Left=target, Right=source) baked into
    // TableNode. Without this, an edge whose FK table has been dragged
    // left of its PK table is still forced to leave from the right and
    // enter from the left, forcing getSmoothStepPath to route all the
    // way around both nodes.
    let resolvedSourceX = sourceX;
    let resolvedSourceY = sourceY;
    let resolvedSourcePosition = sourcePosition;
    let resolvedTargetX = targetX;
    let resolvedTargetY = targetY;
    let resolvedTargetPosition = targetPosition;

    if (sourceNode && targetNode) {
        const sourceBox = getNodeBox(sourceNode, sourceX);
        const targetBox = getNodeBox(targetNode, targetX);

        const sourceCenter = sourceBox.left + sourceBox.width / 2;
        const targetCenter = targetBox.left + targetBox.width / 2;

        const sourceOnLeft = sourceCenter <= targetCenter;

        resolvedSourcePosition = sourceOnLeft ? Position.Right : Position.Left;
        resolvedTargetPosition = sourceOnLeft ? Position.Left : Position.Right;

        resolvedSourceX = sourceOnLeft ? sourceBox.right : sourceBox.left;
        resolvedTargetX = sourceOnLeft ? targetBox.left : targetBox.right;

        resolvedSourceY = getHandleY(sourceNode, sourceHandleId, sourceY);
        resolvedTargetY = getHandleY(targetNode, targetHandleId, targetY);
    }

    const relation = data?.relation === "optional" ? "optional" : "required";
    const optional = relation === "optional";

    const cardinality =
        data?.cardinality || (data?.isOneToOne ? "1:1" : "1:N");

    const onDelete = data?.onDelete || "NO ACTION";
    const onUpdate = data?.onUpdate || "NO ACTION";

    // Human-readable description of what this connection means, shown as
    // a native tooltip on the label. The arrowhead always points from the
    // foreign-key column (source) into the primary/unique column it
    // references (target) — this spells that out explicitly rather than
    // leaving the direction implicit in the arrow alone.
    const sourceTableName = sourceNode?.data?.tableName || source;
    const targetTableName = targetNode?.data?.tableName || target;
    const sourceColumnName =
        findColumn(sourceNode, sourceHandleId)?.name || sourceHandleId || "?";
    const targetColumnName =
        findColumn(targetNode, targetHandleId)?.name || targetHandleId || "?";

    const connectionDescription =
        `${sourceTableName}.${sourceColumnName} references ` +
        `${targetTableName}.${targetColumnName} — the arrow points at the ` +
        `referenced (PK/UNIQUE) column.`;

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX: resolvedSourceX,
        sourceY: resolvedSourceY,
        sourcePosition: resolvedSourcePosition,
        targetX: resolvedTargetX,
        targetY: resolvedTargetY,
        targetPosition: resolvedTargetPosition,
        borderRadius: 4,
        offset: 24,
    });

    const updateEdge = (changes) => {
        setEdges((currentEdges) =>
            currentEdges.map((edge) => {
                if (edge.id !== id) {
                    return edge;
                }

                return {
                    ...edge,
                    data: {
                        ...edge.data,
                        ...changes,
                    },
                };
            })
        );
    };

    const toggleRelation = (event) => {
        event.stopPropagation();

        updateEdge({
            relation: optional ? "required" : "optional",
        });
    };

    const deleteRelationship = (event) => {
        event.stopPropagation();

        setEdges((currentEdges) =>
            currentEdges.filter((edge) => edge.id !== id)
        );
    };

    const edgeColor = optional ? "#66758F" : "#4C6FFF";
    const selectedColor = "#6D8CFF";

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                interactionWidth={28}
                markerEnd={{
                    type: MarkerType.ArrowClosed,
                    width: 18,
                    height: 18,
                    color: selected ? selectedColor : edgeColor,
                }}
                style={{
                    stroke: selected ? selectedColor : edgeColor,
                    strokeWidth: selected ? 2 : 1.6,
                    strokeDasharray: optional ? "7 6" : undefined,
                    fill: "none",
                }}
            />

            <EdgeLabelRenderer>
                <div
                    className={[
                        "relation-edge-label",
                        optional
                            ? "relation-edge-label--optional"
                            : "relation-edge-label--required",
                        selected ? "relation-edge-label--selected" : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    style={{
                        transform:
                            `translate(-50%, -50%) ` +
                            `translate(${labelX}px, ${labelY}px)`,
                    }}
                    title={connectionDescription}
                    onMouseDown={(event) => {
                        event.stopPropagation();
                    }}
                    onPointerDown={(event) => {
                        event.stopPropagation();
                    }}
                >
                    <button
                        type="button"
                        className="relation-edge-label-main nodrag nopan"
                        onClick={toggleRelation}
                        title={`${connectionDescription} Click to toggle required/optional.`}
                        aria-label={`Relationship is ${relation}. ${connectionDescription} Click to toggle.`}
                    >
                        <span className="relation-edge-dot" />

                        <span className="relation-edge-label-text">
                            {cardinality}
                        </span>

                        <span className="relation-edge-label-divider">·</span>

                        <span className="relation-edge-label-text">
                            {optional ? "OPTIONAL" : "REQUIRED"}
                        </span>
                    </button>

                    <span
                        className="relation-edge-cascade"
                        title={`On delete: ${onDelete}. On update: ${onUpdate}.`}
                    >
                        {onDelete === "CASCADE" ? "CASCADE" : onDelete}
                    </span>

                    {selected && (
                        <button
                            type="button"
                            className="relation-edge-delete nodrag nopan"
                            onClick={deleteRelationship}
                            title="Delete relationship"
                            aria-label="Delete relationship"
                        >
                            ×
                        </button>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default RelationEdge;