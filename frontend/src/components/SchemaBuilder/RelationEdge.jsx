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
}) {
const { setEdges } = useReactFlow();

const relation =
    data?.relation === "optional"
    ? "optional"
    : "required";

const optional = relation === "optional";

/*
* Keep the routing readable.
*
* Horizontal:
* right -> left
*
* Vertical:
* bottom -> top
*
* Diagonal:
* smooth-step chooses the appropriate route.
*/

const horizontal =
    Math.abs(targetX - sourceX) >
    Math.abs(targetY - sourceY);

const [edgePath, labelX, labelY] =
    getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,

    borderRadius: 12,

    offset: horizontal ? 22 : 26,
    });

const toggleRelation = () => {
    setEdges((currentEdges) =>
    currentEdges.map((edge) =>
        edge.id === id
        ? {
            ...edge,
            data: {
                ...edge.data,
                relation: optional
                ? "required"
                : "optional",
            },
            }
        : edge
    )
    );
};

return (
    <>
    <BaseEdge
        path={edgePath}
        markerEnd={{
        type: MarkerType.ArrowClosed,
        width: 17,
        height: 17,
        color: "#3159b8",
        }}
        style={{
        stroke: "#3159b8",
        strokeWidth: 1.7,
        strokeDasharray: optional
            ? "7 6"
            : undefined,
        }}
    />

    <EdgeLabelRenderer>
        <button
        type="button"
        className={`relation-edge-label ${
            optional
            ? "optional"
            : "required"
        }`}
        style={{
            transform:
            `translate(-50%, -50%) ` +
            `translate(${labelX}px, ${labelY}px)`,
        }}
        onClick={(event) => {
            event.stopPropagation();
            toggleRelation();
        }}
        >
        <span className="relation-edge-dot" />

        <span>
            {optional
            ? "OPTIONAL"
            : "REQUIRED"}
        </span>
        </button>
    </EdgeLabelRenderer>
    </>
);
}

export default RelationEdge;