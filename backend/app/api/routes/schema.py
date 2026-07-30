from __future__ import annotations

from fastapi import APIRouter, HTTPException

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
