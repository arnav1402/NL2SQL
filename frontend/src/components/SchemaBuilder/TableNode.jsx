import { Handle, Position } from "@xyflow/react";
import {
FiMoreVertical,
FiPlus,
FiChevronDown,
FiKey,
} from "react-icons/fi";
import { HiOutlineTable } from "react-icons/hi";

import "./TableNode.css";

function SchemaTableNode({ id, data }) {
const tableName = data?.tableName || "table";
const columns = data?.columns || [];

const updateTable = data?.updateTable;
const onAddColumn = data?.onAddColumn;
const onDeleteColumn = data?.onDeleteColumn;

const toggleColumnProperty = (columnId, property) => {
    if (!updateTable) return;

    const nextColumns = columns.map((column) => {
    if (column.id !== columnId) return column;

    const nextValue = !column[property];

    const updated = {
        ...column,
        [property]: nextValue,
    };

    if (property === "isPrimaryKey" && nextValue) {
        updated.isNullable = false;
    }

    return updated;
    });

    updateTable(id, {
    columns: nextColumns,
    });
};

return (
    <div className="schema-table-node">
    {/* RIGHT SOURCE HANDLE */}
    <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="schema-node-handle schema-node-handle-right"
    />

    {/* LEFT TARGET HANDLE */}
    <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="schema-node-handle schema-node-handle-left"
    />

    {/* TOP TARGET */}
    <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="schema-node-handle schema-node-handle-top"
    />

    {/* BOTTOM SOURCE */}
    <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="schema-node-handle schema-node-handle-bottom"
    />

    <div className="schema-table-header">
        <div className="schema-table-title">
        <HiOutlineTable className="schema-table-icon" />

        <span>{tableName}</span>
        </div>

        <button
        type="button"
        className="schema-table-menu"
        onClick={(event) => {
            event.stopPropagation();
            data?.onMenu?.(id);
        }}
        >
        <FiMoreVertical />
        </button>
    </div>

    <div className="schema-table-columns">
        {columns.map((column) => (
        <div
            className="schema-column-row"
            key={column.id}
        >
            <div className="schema-column-name">
            {column.isPrimaryKey && (
                <FiKey className="schema-column-key" />
            )}

            <span title={column.name}>
                {column.name || "column"}
            </span>
            </div>

            <div className="schema-column-type">
            {column.type || "TEXT"}

            <FiChevronDown />
            </div>

            <div className="schema-column-actions">
            <button
                type="button"
                className={
                column.isPrimaryKey
                    ? "column-action active"
                    : "column-action"
                }
                onClick={(event) => {
                event.stopPropagation();
                toggleColumnProperty(
                    column.id,
                    "isPrimaryKey"
                );
                }}
                title="Primary key"
            >
                PK
            </button>

            <button
                type="button"
                className={
                column.isUnique
                    ? "column-action active"
                    : "column-action"
                }
                onClick={(event) => {
                event.stopPropagation();
                toggleColumnProperty(
                    column.id,
                    "isUnique"
                );
                }}
                title="Unique"
            >
                UQ
            </button>

            <button
                type="button"
                className={
                column.isNullable === false
                    ? "column-action active"
                    : "column-action"
                }
                onClick={(event) => {
                event.stopPropagation();

                if (!updateTable) return;

                updateTable(id, {
                    columns: columns.map((item) =>
                    item.id === column.id
                        ? {
                            ...item,
                            isNullable:
                            item.isNullable === false,
                        }
                        : item
                    ),
                });
                }}
                title="Not nullable"
            >
                NN
            </button>

            <button
                type="button"
                className="column-delete"
                onClick={(event) => {
                event.stopPropagation();
                onDeleteColumn?.(id, column.id);
                }}
                title="Delete column"
            >
                ×
            </button>
            </div>

            {/* COLUMN-LEVEL CONNECTION POINTS */}
            <Handle
            id={column.id}
            type="source"
            position={Position.Right}
            className="column-handle column-handle-source"
            />

            <Handle
            id={column.id}
            type="target"
            position={Position.Left}
            className="column-handle column-handle-target"
            />
        </div>
        ))}

        <button
        type="button"
        className="schema-add-column"
        onClick={(event) => {
            event.stopPropagation();
            onAddColumn?.(id);
        }}
        >
        <FiPlus />
        <span>Add column</span>
        </button>
    </div>
    </div>
);
}

export default SchemaTableNode;