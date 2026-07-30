from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class ConnectionMetadata:
    connection_id: str
    db_type: str
    engine: Any
    dialect: str
    namespace: str
    database_name: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_used_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    schema_version: int = 1

    def to_dict(self) -> dict:
        return {
            "connection_id": self.connection_id,
            "db_type": self.db_type,
            "dialect": self.dialect,
            "namespace": self.namespace,
            "database_name": self.database_name,
            "created_at": self.created_at.isoformat(),
            "last_used_at": self.last_used_at.isoformat(),
            "schema_version": self.schema_version,
        }
