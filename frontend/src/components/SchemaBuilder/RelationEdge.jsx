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

/*
* React Flow gives us the actual handle positions.
*
* Use a small smooth-step radius so relationships feel
* engineered/sharp rather than like rounded SaaS connectors.
*/
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

const toggleRelation = (event) => {
    event.stopPropagation();

    setEdges((currentEdges) =>
    currentEdges.map((edge) => {
        if (edge.id !== id) {
        return edge;
        }

        return {
        ...edge,
        data: {
            ...edge.data,
            relation: optional ? "required" : "optional",
        },
        };
    })
    );
};

const edgeColor = optional ? "#66758F" : "#4C6FFF";
const selectedColor = "#6D8CFF";

return (
    <>
    <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={24}
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
        <button
        type="button"
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
        onClick={toggleRelation}
        onMouseDown={(event) => {
            event.stopPropagation();
        }}
        aria-label={`Relationship is ${relation}. Click to toggle.`}
        >
        <span className="relation-edge-dot" />

        <span className="relation-edge-label-text">
            {optional ? "OPTIONAL" : "REQUIRED"}
        </span>
        </button>
    </EdgeLabelRenderer>
    </>
);
}

export default RelationEdge;