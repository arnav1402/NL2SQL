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
    duckdb_path: str | None = None
    source_csv_path: str | None = None
    table_name: str | None = None
    sample_rows: int = 2
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
            "duckdb_path": self.duckdb_path,
            "source_csv_path": self.source_csv_path,
            "table_name": self.table_name,
            "sample_rows": self.sample_rows,
            "created_at": self.created_at.isoformat(),
            "last_used_at": self.last_used_at.isoformat(),
            "schema_version": self.schema_version,
        }
