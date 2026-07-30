from __future__ import annotations

from app.connection import connection_manager


def cleanup_expired_connections(timeout_minutes: int = 30) -> list[str]:
    return connection_manager.cleanup_expired(timeout_minutes=timeout_minutes)
