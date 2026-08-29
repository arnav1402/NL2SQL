import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import {
    FiMoreVertical,
    FiPlus,
    FiKey,
    FiCircle,
    FiLink,
} from "react-icons/fi";
import { HiOutlineTable } from "react-icons/hi";

import "./TableNode.css";

function stopFlowEvent(event) {
    event.stopPropagation();
}

// Single source of truth for handle math — RelationEdge imports these
// so the two files can never silently drift out of sync on row height.
export const TABLE_HEADER_HEIGHT = 46;
export const COLUMN_ROW_HEIGHT = 48;

// Real dropdown of common SQL types. "Custom…" drops into a text field
// for anything not on this list (dialect-specific types, sizes, etc.).
const COLUMN_TYPE_OPTIONS = [
    "INTEGER",
    "BIGINT",
    "SMALLINT",
    "SERIAL",
    "TEXT",
    "VARCHAR(255)",
    "BOOLEAN",
    "DATE",
    "TIMESTAMP",
    "DECIMAL(10,2)",
    "FLOAT",
    "UUID",
    "JSON",
];

const CUSTOM_TYPE_VALUE = "__custom__";

function TableNode({ id, data }) {
    const tableName = data?.tableName || "table";
    const columns = Array.isArray(data?.columns) ? data.columns : [];

    const updateTable = data?.updateTable;
    const onAddColumn = data?.onAddColumn;
    const onDeleteColumn = data?.onDeleteColumn;
    const onMenu = data?.onMenu;

    const [isRenamingTable, setIsRenamingTable] = useState(false);
    const [tableDraft, setTableDraft] = useState(tableName);

    // Tracks which single cell (a column's name or type field) is being
    // edited right now, so only one input renders at a time per table.
    const [editingCell, setEditingCell] = useState(null); // { columnId, field }
    const [cellDraft, setCellDraft] = useState("");
    const [typeCustomMode, setTypeCustomMode] = useState(false);

    const commitTableRename = () => {
        const nextName = tableDraft.trim();

        if (updateTable && nextName && nextName !== tableName) {
            updateTable(id, { tableName: nextName });
        }

        setIsRenamingTable(false);
    };

    const startTableRename = () => {
        setTableDraft(tableName);
        setIsRenamingTable(true);
    };

    const applyColumnField = (columnId, field, rawValue) => {
        const trimmed = String(rawValue || "").trim();
        if (!updateTable || !trimmed) return;

        const nextValue = field === "type" ? trimmed.toUpperCase() : trimmed;

        const nextColumns = columns.map((column) =>
            column.id === columnId ? { ...column, [field]: nextValue } : column
        );

        updateTable(id, { columns: nextColumns });
    };

    const startNameEdit = (columnId, currentValue) => {
        setEditingCell({ columnId, field: "name" });
        setCellDraft(currentValue || "");
    };

    const startTypeEdit = (columnId, currentValue) => {
        const upper = String(currentValue || "TEXT").toUpperCase();
        const isKnown = COLUMN_TYPE_OPTIONS.includes(upper);

        setEditingCell({ columnId, field: "type" });
        setCellDraft(upper);
        setTypeCustomMode(!isKnown);
    };

    const cancelCellEdit = () => {
        setEditingCell(null);
        setCellDraft("");
        setTypeCustomMode(false);
    };

    const commitNameEdit = () => {
        if (editingCell) {
            applyColumnField(editingCell.columnId, "name", cellDraft);
        }
        cancelCellEdit();
    };

    const commitCustomTypeEdit = () => {
        if (editingCell) {
            applyColumnField(editingCell.columnId, "type", cellDraft);
        }
        cancelCellEdit();
    };

    const handleTypeSelectChange = (event) => {
        const value = event.target.value;

        if (value === CUSTOM_TYPE_VALUE) {
            setCellDraft("");
            setTypeCustomMode(true);
            return;
        }

        if (editingCell) {
            applyColumnField(editingCell.columnId, "type", value);
        }
        cancelCellEdit();
    };

    const toggleColumnProperty = (columnId, property) => {
        if (!updateTable) return;

        const nextColumns = columns.map((column) => {
            if (column.id !== columnId) {
                return column;
            }

            const nextValue = !column[property];

            return {
                ...column,
                [property]: nextValue,
                ...(property === "isPrimaryKey" && nextValue
                    ? {
                          isNullable: false,
                          isUnique: true,
                      }
                    : {}),
            };
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
            {/* Connection points — always visible, positioned per-row.
                Handles are direct children of the node (position: relative
                on .schema-table-node) so an inline `top` is enough; no
                extra absolutely-positioned wrapper needed. */}
            {columns.map((column, index) => {
                const handleTop =
                    TABLE_HEADER_HEIGHT +
                    index * COLUMN_ROW_HEIGHT +
                    COLUMN_ROW_HEIGHT / 2;

                const canBeReferenced =
                    column.isPrimaryKey === true ||
                    column.isUnique === true;

                return (
                    <div key={`handles-${column.id}`}>
                        <Handle
                            id={column.id}
                            type="target"
                            position={Position.Left}
                            style={{ top: handleTop }}
                            className={[
                                "column-handle",
                                "column-handle-target",
                                canBeReferenced
                                    ? "is-referenceable"
                                    : "is-disabled",
                            ].join(" ")}
                            isConnectable={canBeReferenced}
                            isConnectableEnd={canBeReferenced}
                            title={
                                canBeReferenced
                                    ? `Reference ${tableName}.${column.name}`
                                    : `${column.name || "column"} isn't PK/UNIQUE — can't be referenced`
                            }
                            aria-label={
                                canBeReferenced
                                    ? `Reference ${tableName}.${column.name}`
                                    : `${column.name} cannot be referenced`
                            }
                        />

                        <Handle
                            id={column.id}
                            type="source"
                            position={Position.Right}
                            style={{ top: handleTop }}
                            className="column-handle column-handle-source"
                            isConnectable={true}
                            isConnectableStart={true}
                            title={`Drag to create a foreign key from ${tableName}.${column.name}`}
                            aria-label={`Create foreign key from ${tableName}.${column.name}`}
                        />
                    </div>
                );
            })}

            <div
                className="schema-table-header drag-handle"
                onMouseDown={stopFlowEvent}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    startTableRename();
                }}
            >
                <div className="schema-table-title">
                    <HiOutlineTable className="schema-table-icon" />

                    {isRenamingTable ? (
                        <input
                            className="schema-table-title-input nodrag nopan"
                            value={tableDraft}
                            autoFocus
                            onChange={(event) => setTableDraft(event.target.value)}
                            onMouseDown={stopFlowEvent}
                            onPointerDown={stopFlowEvent}
                            onBlur={commitTableRename}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.currentTarget.blur();
                                } else if (event.key === "Escape") {
                                    setTableDraft(tableName);
                                    setIsRenamingTable(false);
                                }
                            }}
                        />
                    ) : (
                        <span title="Double-click to rename">
                            {tableName}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    className="schema-table-menu nodrag nopan"
                    onPointerDown={stopFlowEvent}
                    onMouseDown={stopFlowEvent}
                    onClick={(event) => {
                        event.stopPropagation();
                        onMenu?.(id);
                    }}
                    aria-label={`Options for ${tableName}`}
                    title={`Delete ${tableName}`}
                >
                    <FiMoreVertical />
                </button>
            </div>

            <div className="schema-table-columns">
                {columns.map((column) => {
                    const isForeignKey =
                        column.isForeignKey === true ||
                        column.foreignKey === true;

                    const isEditingName =
                        editingCell?.columnId === column.id &&
                        editingCell.field === "name";

                    const isEditingType =
                        editingCell?.columnId === column.id &&
                        editingCell.field === "type";

                    return (
                        <div
                            className={[
                                "schema-column-row",
                                "nodrag",
                                column.isPrimaryKey ? "is-pk" : "",
                                isForeignKey ? "is-fk" : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            key={column.id}
                            onMouseDown={stopFlowEvent}
                            onPointerDown={stopFlowEvent}
                        >
                            <div
                                className="schema-column-name"
                                title={
                                    isEditingName
                                        ? undefined
                                        : "Double-click to rename"
                                }
                                onDoubleClick={(event) => {
                                    event.stopPropagation();
                                    startNameEdit(column.id, column.name);
                                }}
                            >
                                <span
                                    className="schema-column-property-icon"
                                    aria-hidden="true"
                                >
                                    {column.isPrimaryKey ? (
                                        <FiKey />
                                    ) : isForeignKey ? (
                                        <FiLink />
                                    ) : (
                                        <FiCircle />
                                    )}
                                </span>

                                {isEditingName ? (
                                    <input
                                        className="schema-column-name-input nodrag nopan"
                                        value={cellDraft}
                                        autoFocus
                                        onChange={(event) =>
                                            setCellDraft(event.target.value)
                                        }
                                        onMouseDown={stopFlowEvent}
                                        onPointerDown={stopFlowEvent}
                                        onBlur={commitNameEdit}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                event.currentTarget.blur();
                                            } else if (
                                                event.key === "Escape"
                                            ) {
                                                cancelCellEdit();
                                            }
                                        }}
                                    />
                                ) : (
                                    <span
                                        className="schema-column-name-text"
                                        title={column.name}
                                    >
                                        {column.name || "column"}
                                    </span>
                                )}
                            </div>

                            <div
                                className="schema-column-type"
                                title={
                                    isEditingType
                                        ? undefined
                                        : "Double-click to change type"
                                }
                                onDoubleClick={(event) => {
                                    event.stopPropagation();
                                    startTypeEdit(column.id, column.type);
                                }}
                            >
                                {isEditingType ? (
                                    typeCustomMode ? (
                                        <input
                                            className="schema-column-type-input nodrag nopan"
                                            value={cellDraft}
                                            autoFocus
                                            placeholder="Custom type"
                                            onChange={(event) =>
                                                setCellDraft(
                                                    event.target.value
                                                )
                                            }
                                            onMouseDown={stopFlowEvent}
                                            onPointerDown={stopFlowEvent}
                                            onBlur={commitCustomTypeEdit}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.currentTarget.blur();
                                                } else if (
                                                    event.key === "Escape"
                                                ) {
                                                    cancelCellEdit();
                                                }
                                            }}
                                        />
                                    ) : (
                                        <select
                                            className="schema-column-type-select nodrag nopan"
                                            value={cellDraft}
                                            autoFocus
                                            onChange={handleTypeSelectChange}
                                            onMouseDown={stopFlowEvent}
                                            onPointerDown={stopFlowEvent}
                                            onBlur={cancelCellEdit}
                                            onKeyDown={(event) => {
                                                if (event.key === "Escape") {
                                                    cancelCellEdit();
                                                }
                                            }}
                                        >
                                            {COLUMN_TYPE_OPTIONS.map(
                                                (type) => (
                                                    <option
                                                        key={type}
                                                        value={type}
                                                    >
                                                        {type}
                                                    </option>
                                                )
                                            )}
                                            <option value={CUSTOM_TYPE_VALUE}>
                                                Custom…
                                            </option>
                                        </select>
                                    )
                                ) : (
                                    <span>{column.type || "TEXT"}</span>
                                )}
                            </div>

                            <div
                                className="schema-column-actions nodrag nopan"
                                onMouseDown={stopFlowEvent}
                                onPointerDown={stopFlowEvent}
                            >
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
                    );
                })}

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