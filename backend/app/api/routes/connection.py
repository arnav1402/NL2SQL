from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.models.connection import (
    ConnectionMetadataResponse,
    ConnectionResponse,
    MySQLConnectionRequest,
    PostgreSQLConnectionRequest,
    SQLiteConnectionRequest,
)
from app.connection import connection_manager
from app.core.exceptions import ConnectionNotFoundError, UnsupportedDialectError
from app.utils.logger import connection_logger, logger

router = APIRouter(prefix="/connection", tags=["connection"])


def _build_request_model(payload: dict) -> BaseModel:
    db_type = payload.get("db_type")
    if db_type == "postgresql":
        return PostgreSQLConnectionRequest(**payload)
    if db_type == "mysql":
        return MySQLConnectionRequest(**payload)
    if db_type == "sqlite":
        return SQLiteConnectionRequest(**payload)
    raise ValueError("Unsupported db_type")


@router.post("", response_model=ConnectionResponse)
def create_connection(payload: dict[str, Any]) -> ConnectionResponse:
    try:
        request_model = _build_request_model(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if request_model.db_type == "postgresql":
        params = {
            "host": request_model.host,
            "port": request_model.port,
            "username": request_model.username,
            "password": request_model.password,
            "database": request_model.database,
            "schema": request_model.schema,
        }
    elif request_model.db_type == "mysql":
        params = {
            "host": request_model.host,
            "port": request_model.port,
            "username": request_model.username,
            "password": request_model.password,
            "database": request_model.database,
        }
    else:
        params = {"sqlite_path": request_model.sqlite_path}

    try:
        connection_id = connection_manager.create_connection(request_model.db_type, **params)
    except UnsupportedDialectError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    metadata = connection_manager.get_connection(connection_id)
    tables_indexed = len(getattr(metadata.engine, "table_names", lambda: [])())
    logger.info(
        "Connection created",
        extra={
            "connection_id": connection_id,
            "db_type": request_model.db_type,
            "database_name": metadata.database_name,
            "tables_indexed": tables_indexed,
            "params": {"host": params.get("host"), "port": params.get("port"), "database": params.get("database"), "sqlite_path": params.get("sqlite_path")},
        },
    )
    connection_logger.info(
        "Connection created",
        extra={
            "connection_id": connection_id,
            "db_type": request_model.db_type,
            "database_name": metadata.database_name,
            "tables_indexed": tables_indexed,
        },
    )
    return ConnectionResponse(connection_id=connection_id, status="connected", tables_indexed=tables_indexed)


@router.get("", response_model=list[ConnectionMetadataResponse])
def list_connections() -> list[ConnectionMetadataResponse]:
    connections = connection_manager.list_connections()
    return [ConnectionMetadataResponse(**metadata.to_dict()) for metadata in connections]


@router.delete("/{connection_id}")
def delete_connection(connection_id: str) -> dict:
    try:
        connection_manager.remove_connection(connection_id)
    except ConnectionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": "deleted", "connection_id": connection_id}


@router.get("/{connection_id}", response_model=ConnectionMetadataResponse)
def get_connection(connection_id: str) -> ConnectionMetadataResponse:
    try:
        metadata = connection_manager.get_connection(connection_id)
    except ConnectionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ConnectionMetadataResponse(**metadata.to_dict())
