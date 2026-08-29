import { Handle, Position } from "@xyflow/react";
import { FiKey, FiLink, FiCircle } from "react-icons/fi";
import { HiOutlineTable } from "react-icons/hi";
import "./SchemaTableNode.css";

const HEADER_HEIGHT = 42;
const ROW_HEIGHT = 30;

function SchemaTableNode({ data }) {
const { tableName, columns = [] } = data;

return (
    <div className="schema-view-node">
    {/* handles positioned per-row — same fix as the schema builder */}
    {columns.map((column, index) => {
        const top = HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2;
        return (
        <div key={`handles-${column.name}`}>
            <Handle
            id={column.name}
            type="target"
            position={Position.Left}
            style={{ top }}
            className="schema-view-handle"
            />
            <Handle
            id={column.name}
            type="source"
            position={Position.Right}
            style={{ top }}
            className="schema-view-handle"
            />
        </div>
        );
    })}

    <div className="schema-view-header">
        <HiOutlineTable className="schema-view-icon" />
        <span title={tableName}>{tableName}</span>
    </div>

    <div className="schema-view-columns">
        {columns.map((column) => (
        <div
            key={column.name}
            className={[
            "schema-view-row",
            column.isPrimaryKey ? "is-pk" : "",
            column.isForeignKey ? "is-fk" : "",
            ].filter(Boolean).join(" ")}
        >
            <span className="schema-view-row-icon">
            {column.isPrimaryKey ? <FiKey /> : column.isForeignKey ? <FiLink /> : <FiCircle />}
            </span>
            <span className="schema-view-row-name">{column.name}</span>
            <span className="schema-view-row-type">{column.type}</span>
        </div>
        ))}
    </div>
    </div>
);
}

export default SchemaTableNode;