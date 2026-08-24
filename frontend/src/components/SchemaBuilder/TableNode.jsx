import { Handle, Position } from "@xyflow/react";
import {
    FiMoreVertical,
    FiPlus,
    FiKey,
    FiCircle,
} from "react-icons/fi";
import { HiOutlineTable } from "react-icons/hi";

import "./TableNode.css";

function stopFlowEvent(event) {
    event.stopPropagation();
}

function TableNode({ id, data }) {
    const tableName = data?.tableName || "table";
    const columns = data?.columns || [];

    const updateTable = data?.updateTable;
    const onAddColumn = data?.onAddColumn;
    const onDeleteColumn = data?.onDeleteColumn;

    const toggleColumnProperty = (columnId, property) => {
        if (!updateTable) return;

        const nextColumns = columns.map((column) => {
            if (column.id !== columnId) {
                return column;
            }

            const nextValue = !column[property];

            const updated = {
                ...column,
                [property]: nextValue,
            };

            /*
             * A primary key cannot be nullable.
             */
            if (property === "isPrimaryKey" && nextValue) {
                updated.isNullable = false;
            }

            return updated;
        });

        updateTable(id, {
            columns: nextColumns,
        });
    };

    const toggleNullable = (columnId) => {
        if (!updateTable) return;

        const nextColumns = columns.map((column) => {
            if (column.id !== columnId) {
                return column;
            }

            /*
             * PK is always NOT NULL.
             */
            if (column.isPrimaryKey) {
                return {
                    ...column,
                    isNullable: false,
                };
            }

            return {
                ...column,
                isNullable: column.isNullable === false,
            };
        });

        updateTable(id, {
            columns: nextColumns,
        });
    };

    return (
        <div className="schema-table-node">

            {/* =====================================================
                COLUMN CONNECTION HANDLES
                ===================================================== */}

            {columns.map((column) => (
                <div
                    key={`handles-${column.id}`}
                    className="schema-column-connection"
                >
                    <Handle
                        id={column.id}
                        type="target"
                        position={Position.Left}
                        className="column-handle column-handle-target"
                        isConnectable={true}
                        isConnectableEnd={true}
                    />

                    <Handle
                        id={column.id}
                        type="source"
                        position={Position.Right}
                        className="column-handle column-handle-source"
                        isConnectable={true}
                        isConnectableStart={true}
                    />
                </div>
            ))}

            {/* =====================================================
                TABLE HEADER
                ===================================================== */}

            <div
                className="schema-table-header drag-handle"
                onMouseDown={stopFlowEvent}
            >
                <div className="schema-table-title">
                    <HiOutlineTable className="schema-table-icon" />

                    <span title={tableName}>
                        {tableName}
                    </span>
                </div>

                <button
                    type="button"
                    className="schema-table-menu nodrag nopan"
                    onPointerDown={stopFlowEvent}
                    onMouseDown={stopFlowEvent}
                    onClick={(event) => {
                        event.stopPropagation();
                        data?.onMenu?.(id);
                    }}
                    aria-label={`Options for ${tableName}`}
                >
                    <FiMoreVertical />
                </button>
            </div>

            {/* =====================================================
                COLUMNS
                ===================================================== */}

            <div className="schema-table-columns">

                {columns.map((column) => (
                    <div
                        className="schema-column-row nodrag"
                        key={column.id}
                        onMouseDown={stopFlowEvent}
                        onPointerDown={stopFlowEvent}
                    >

                        {/* COLUMN NAME */}

                        <div
                            className="schema-column-name"
                            title={column.name}
                        >
                            <span className="schema-column-property-icon">
                                {column.isPrimaryKey ? (
                                    <FiKey />
                                ) : (
                                    <FiCircle />
                                )}
                            </span>

                            <span className="schema-column-name-text">
                                {column.name || "column"}
                            </span>
                        </div>

                        {/* TYPE */}

                        <div
                            className="schema-column-type"
                            title={column.type || "TEXT"}
                        >
                            <span>
                                {column.type || "TEXT"}
                            </span>
                        </div>

                        {/* =================================================
                            COLUMN PROPERTY BUTTONS
                            ================================================= */}

                        <div
                            className="schema-column-actions nodrag nopan"
                            onMouseDown={stopFlowEvent}
                            onPointerDown={stopFlowEvent}
                        >

                            {/* PK */}

                            <button
                                type="button"
                                className={
                                    column.isPrimaryKey
                                        ? "column-action pk active"
                                        : "column-action pk"
                                }
                                onPointerDown={stopFlowEvent}
                                onMouseDown={stopFlowEvent}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    toggleColumnProperty(
                                        column.id,
                                        "isPrimaryKey"
                                    );
                                }}
                                title={
                                    column.isPrimaryKey
                                        ? "Remove primary key"
                                        : "Set primary key"
                                }
                                aria-label={
                                    column.isPrimaryKey
                                        ? `Remove primary key from ${column.name}`
                                        : `Set ${column.name} as primary key`
                                }
                                aria-pressed={column.isPrimaryKey}
                            >
                                PK
                            </button>

                            {/* UNIQUE */}

                            <button
                                type="button"
                                className={
                                    column.isUnique
                                        ? "column-action uq active"
                                        : "column-action uq"
                                }
                                onPointerDown={stopFlowEvent}
                                onMouseDown={stopFlowEvent}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    toggleColumnProperty(
                                        column.id,
                                        "isUnique"
                                    );
                                }}
                                title={
                                    column.isUnique
                                        ? "Remove unique constraint"
                                        : "Set unique"
                                }
                                aria-label={
                                    column.isUnique
                                        ? `Remove unique from ${column.name}`
                                        : `Set ${column.name} as unique`
                                }
                                aria-pressed={column.isUnique}
                            >
                                UQ
                            </button>

                            {/* NOT NULL */}

                            <button
                                type="button"
                                className={
                                    column.isNullable === false
                                        ? "column-action nn active"
                                        : "column-action nn"
                                }
                                onPointerDown={stopFlowEvent}
                                onMouseDown={stopFlowEvent}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    toggleNullable(column.id);
                                }}
                                title={
                                    column.isNullable === false
                                        ? "Allow NULL"
                                        : "Set NOT NULL"
                                }
                                aria-label={
                                    column.isNullable === false
                                        ? `Allow null for ${column.name}`
                                        : `Set ${column.name} as not null`
                                }
                                aria-pressed={
                                    column.isNullable === false
                                }
                            >
                                NN
                            </button>

                            {/* DELETE */}

                            <button
                                type="button"
                                className="column-delete nodrag nopan"
                                onPointerDown={stopFlowEvent}
                                onMouseDown={stopFlowEvent}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    onDeleteColumn?.(
                                        id,
                                        column.id
                                    );
                                }}
                                title={`Delete ${column.name}`}
                                aria-label={`Delete ${column.name}`}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}

                {/* =================================================
                    ADD COLUMN
                    ================================================= */}

                <button
                    type="button"
                    className="schema-add-column nodrag nopan"
                    onPointerDown={stopFlowEvent}
                    onMouseDown={stopFlowEvent}
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

export default TableNode;