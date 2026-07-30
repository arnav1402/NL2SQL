from __future__ import annotations

from fastapi import APIRouter

from app.connection import connection_manager

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health() -> dict:
    return {"status": "ok", "active_connections": len(connection_manager.list_connections())}
