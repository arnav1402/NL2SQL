from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import inspect

from app.connection import connection_manager
from app.core.exceptions import ConnectionNotFoundError

router = APIRouter(prefix="/schema", tags=["schema"])


@router.post("/refresh/{connection_id}")
def refresh_schema(connection_id: str) -> dict:
    try:
        metadata = connection_manager.refresh_schema(connection_id)
    except ConnectionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": "refreshed", "connection_id": connection_id, "schema_version": metadata.schema_version}

@router.get("/{connection_id}")
def get_schema(connection_id : str) -> dict :
    try :
        metadata = connection_manager.get_connection(connection_id)
    except ConnectionNotFoundError as exc :
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if metadata.engine is None:
        raise HTTPException(
            status_code=503,
            detail="Database engine is unavailable. Reconnect to database",
        )

    inspector = inspect(metadata.engine)
    tables = []

    for table in inspector.get_table_names():
        columns = []
        for col in inspector.get_columns(table):
            columns.append(
                {
                    "name" : col["name"],
                    "type" : str(col.get("type")),
                    "nullable" : col.get("nullable"),
                    "default" : str(col.get("default"))
                    if col.get("default") is not None
                    else None,
                }
            )

        pk = inspector.get_pk_constraint(table)
        fk = inspector.get_foreign_keys(table)

        tables.append(
            {
                "name" : table,
                "columns" : columns,
                "primary_key" : {
                    "name" : pk.get("name"),
                    "columns" : pk.get("constrained_columns", []),
                },
                "foreign_keys" : [
                    {
                        "name" : f.get("name"),
                        "columns" : f.get("constrained_columns", []),
                        "referenced_table" : f.get("referred_table"),
                        "referenced_columns" : f.get(
                            "referred_columns", []
                        ),
                    }
                    for f in fk
                ], 
                "indexes" : inspector.get_indexes(table),
                "unique_constraints" : inspector.get_unique_constraints(table),
            }
        )

    connection_manager.update_last_used(connection_id)

    return {
        "connection_id": metadata.connection_id,
        "database_name": metadata.database_name,
        "db_type": metadata.db_type,
        "dialect": metadata.dialect,
        "schema_version": metadata.schema_version,
        "tables": tables,
    }
