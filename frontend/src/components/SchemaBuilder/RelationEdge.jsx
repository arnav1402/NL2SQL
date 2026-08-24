import {
BaseEdge,
EdgeLabelRenderer,
MarkerType,
getSmoothStepPath,
useReactFlow,
} from "@xyflow/react";

function RelationEdge({
id,
sourceX,
sourceY,
sourcePosition,
targetX,
targetY,
targetPosition,
data,
}) {
const { setEdges } = useReactFlow();

const relation = data?.relation || "required";
const isOptional = relation === "optional";

const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    offset: 18,
});

const toggleRelation = () => {
    setEdges((currentEdges) =>
    currentEdges.map((edge) => {
        if (edge.id !== id) {
        return edge;
        }

        return {
        ...edge,
        data: {
            ...edge.data,
            relation: isOptional ? "required" : "optional",
        },
        };
    })
    );
};

return (
    <>
    <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={{
        type: MarkerType.ArrowClosed,
        color: "#3654A6",
        width: 18,
        height: 18,
        }}
        style={{
        stroke: "#3654A6",
        strokeWidth: 1.8,
        strokeDasharray: isOptional ? "6 5" : undefined,
        }}
    />

    <EdgeLabelRenderer>
        <button
        type="button"
        className={`relation-edge-label ${
            isOptional ? "optional" : "required"
        }`}
        style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        }}
        onClick={(event) => {
            event.stopPropagation();
            toggleRelation();
        }}
        title="Click to toggle relationship type"
        aria-label={`Relationship is ${
            isOptional ? "optional" : "required"
        }. Click to toggle.`}
        >
        <span className="relation-edge-dot" />

        <span className="relation-edge-text">
            {isOptional ? "OPTIONAL" : "REQUIRED"}
        </span>
        </button>
    </EdgeLabelRenderer>
    </>
);
}

export default RelationEdge;