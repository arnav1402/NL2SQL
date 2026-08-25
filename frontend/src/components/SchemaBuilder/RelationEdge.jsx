import {
    BaseEdge,
    EdgeLabelRenderer,
    MarkerType,
    getSmoothStepPath,
    useReactFlow,
} from "@xyflow/react";

import "./RelationEdge.css";

function RelationEdge({
    id,
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

    const relation =
        data?.relation === "optional" ? "optional" : "required";

    const optional = relation === "optional";

    const cardinality =
        data?.cardinality ||
        (data?.isOneToOne ? "1:1" : "1:N");

    const onDelete =
        data?.onDelete || "NO ACTION";

    const onUpdate =
        data?.onUpdate || "NO ACTION";

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
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
                        selected
                            ? "relation-edge-label--selected"
                            : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    style={{
                        transform:
                            `translate(-50%, -50%) ` +
                            `translate(${labelX}px, ${labelY}px)`,
                    }}
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
                        title="Toggle required / optional"
                        aria-label={`Relationship is ${relation}. Click to toggle.`}
                    >
                        <span className="relation-edge-dot" />

                        <span className="relation-edge-label-text">
                            {cardinality}
                        </span>

                        <span className="relation-edge-label-divider">
                            ·
                        </span>

                        <span className="relation-edge-label-text">
                            {optional ? "OPTIONAL" : "REQUIRED"}
                        </span>
                    </button>

                    <span
                        className="relation-edge-cascade"
                        title={`On delete: ${onDelete}. On update: ${onUpdate}.`}
                    >
                        {onDelete === "CASCADE"
                            ? "CASCADE"
                            : onDelete}
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