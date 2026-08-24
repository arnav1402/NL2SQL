import "./TableNode.css";
import { useCallback } from "react";
import {
    Handle,
    Position,
    useReactFlow,
} from "@xyflow/react";

function TableNode({ id, data }) {
    const { setNodes } = useReactFlow();

    const columns = data?.columns || [];

    const updateTable = useCallback(
        (updates) => {
            setNodes((currentNodes) =>
                currentNodes.map((node) =>
                    node.id === id
                        ? {
                              ...node,
                              data: {
                                  ...node.data,
                                  ...updates,
                              },
                          }
                        : node
                )
            );
        },
        [id, setNodes]
    );

    const updateColumn = useCallback(
        (columnId, updates) => {
            const updatedColumns = columns.map((column) =>
                column.id === columnId
                    ? {
                          ...column,
                          ...updates,
                      }
                    : column
            );

            updateTable({
                columns: updatedColumns,
            });
        },
        [columns, updateTable]
    );

    const addColumn = useCallback(() => {
        const newColumn = {
            id: `${id}_column_${Date.now()}`,
            name: "new_column",
            type: "VARCHAR",
            length: 255,
            precision: 10,
            scale: 2,
            isPrimaryKey: false,
            isNullable: true,
            isUnique: false,
            autoIncrement: false,
        };

        updateTable({
            columns: [...columns, newColumn],
        });
    }, [columns, id, updateTable]);

    const removeColumn = useCallback(
        (columnId) => {
            if (columns.length <= 1) {
                return;
            }

            const updatedColumns = columns.filter(
                (column) => column.id !== columnId
            );

            updateTable({
                columns: updatedColumns,
            });
        },
        [columns, updateTable]
    );

    const handleTableNameChange = useCallback(
        (event) => {
            updateTable({
                tableName: event.target.value,
            });
        },
        [updateTable]
    );

    const handleKeyChange = useCallback(
        (column) => {
            const isPrimaryKey = !column.isPrimaryKey;

            updateColumn(column.id, {
                isPrimaryKey,
                isUnique: isPrimaryKey
                    ? true
                    : column.isUnique,
                isNullable: isPrimaryKey
                    ? false
                    : column.isNullable,
            });
        },
        [updateColumn]
    );

    const handleNullableChange = useCallback(
        (column) => {
            if (column.isPrimaryKey) {
                return;
            }

            updateColumn(column.id, {
                isNullable: !column.isNullable,
            });
        },
        [updateColumn]
    );

    return (
        <div className="table-node">
            <div className="table-node-header">
                <input
                    type="text"
                    className="table-node-name nodrag"
                    value={data.tableName || ""}
                    onChange={handleTableNameChange}
                    onMouseDown={(event) =>
                        event.stopPropagation()
                    }
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                    onKeyDown={(event) =>
                        event.stopPropagation()
                    }
                    aria-label="Table name"
                />

                <span
                    className="table-node-menu"
                    aria-hidden="true"
                >
                    ⋮
                </span>
            </div>

            <div className="table-node-columns">
                {columns.map((column) => (
                    <div
                        className="table-column"
                        key={column.id}
                    >
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={column.id}
                            isConnectable={true}
                            className="column-handle column-handle-target"
                            aria-label={`Target ${column.name}`}
                        />

                        <Handle
                            type="source"
                            position={Position.Right}
                            id={column.id}
                            isConnectable={true}
                            className="column-handle column-handle-source"
                            aria-label={`Source ${column.name}`}
                        />

                        <div className="column-key">
                            {column.isPrimaryKey && (
                                <span>PK</span>
                            )}
                        </div>

                        <input
                            type="text"
                            className="column-name nodrag"
                            value={column.name || ""}
                            onChange={(event) =>
                                updateColumn(
                                    column.id,
                                    {
                                        name: event.target.value,
                                    }
                                )
                            }
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                            onKeyDown={(event) =>
                                event.stopPropagation()
                            }
                            aria-label={`Column name for ${column.name}`}
                        />

                        <select
                            className="column-type nodrag"
                            value={column.type || "VARCHAR"}
                            onChange={(event) =>
                                updateColumn(
                                    column.id,
                                    {
                                        type: event.target.value,
                                    }
                                )
                            }
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                            aria-label={`Data type for ${column.name}`}
                        >
                            <option value="INTEGER">
                                INTEGER
                            </option>
                            <option value="BIGINT">
                                BIGINT
                            </option>
                            <option value="VARCHAR">
                                VARCHAR
                            </option>
                            <option value="TEXT">
                                TEXT
                            </option>
                            <option value="BOOLEAN">
                                BOOLEAN
                            </option>
                            <option value="DATE">
                                DATE
                            </option>
                            <option value="TIMESTAMP">
                                TIMESTAMP
                            </option>
                            <option value="DECIMAL">
                                DECIMAL
                            </option>
                            <option value="FLOAT">
                                FLOAT
                            </option>
                        </select>

                        <button
                            type="button"
                            className={`column-property nodrag ${
                                column.isPrimaryKey
                                    ? "active"
                                    : ""
                            }`}
                            title="Primary Key"
                            aria-label={`Toggle primary key for ${column.name}`}
                            onClick={() =>
                                handleKeyChange(column)
                            }
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            PK
                        </button>

                        <button
                            type="button"
                            className={`column-property nodrag ${
                                column.isUnique
                                    ? "active"
                                    : ""
                            }`}
                            title="Unique"
                            aria-label={`Toggle unique for ${column.name}`}
                            onClick={() =>
                                updateColumn(
                                    column.id,
                                    {
                                        isUnique:
                                            !column.isUnique,
                                    }
                                )
                            }
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            UQ
                        </button>

                        <button
                            type="button"
                            className={`column-property nodrag ${
                                !column.isNullable
                                    ? "active"
                                    : ""
                            }`}
                            title="Not Null"
                            aria-label={`Toggle not null for ${column.name}`}
                            onClick={() =>
                                handleNullableChange(
                                    column
                                )
                            }
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            NN
                        </button>

                        <button
                            type="button"
                            className="column-delete nodrag"
                            title="Delete column"
                            aria-label={`Delete ${column.name}`}
                            disabled={
                                columns.length <= 1
                            }
                            onClick={() =>
                                removeColumn(column.id)
                            }
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                className="add-column nodrag"
                onClick={addColumn}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <span>+</span>
                Add column
            </button>
        </div>
    );
}

export default TableNode;