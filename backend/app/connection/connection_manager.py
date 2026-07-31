from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from app.connection.engine_factory import build_engine_from_params, test_connection
from app.connection.metadata import ConnectionMetadata
from app.core.exceptions import ConnectionNotFoundError, UnsupportedDialectError
from app.db.connector import get_sqlglot_dialect
from app.db.inspector import get_table_cards
from app.utils.logger import logger
from app.vectordb.pinecone import delete_namespace, upsert_schema_cards


class ConnectionManager:
    def __init__(self) -> None:
        self._registry: dict[str, ConnectionMetadata] = {}
        self._storage_path = Path(__file__).resolve().parents[1] / "data" / "connections.json"
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._load_from_disk()

    def _load_from_disk(self) -> None:
        if not self._storage_path.exists():
            return
        try:
            with self._storage_path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
        except Exception:
            return

        for connection_id, item in payload.items():
            try:
                raw_dialect = item.get("dialect", item.get("db_type", "unknown"))
                try:
                    dialect = get_sqlglot_dialect(raw_dialect)
                except UnsupportedDialectError:
                    dialect = raw_dialect

                metadata = ConnectionMetadata(
                    connection_id=connection_id,
                    db_type=item.get("db_type", "unknown"),
                    engine=None,
                    dialect=dialect,
                    namespace=item.get("namespace", f"ns-{connection_id}"),
                    database_name=item.get("database_name", "unknown"),
                    created_at=datetime.fromisoformat(item.get("created_at", datetime.now(timezone.utc).isoformat())),
                    last_used_at=datetime.fromisoformat(item.get("last_used_at", datetime.now(timezone.utc).isoformat())),
                    schema_version=int(item.get("schema_version", 1)),
                )
                self._registry[connection_id] = metadata
            except Exception:
                continue

    def _save_to_disk(self) -> None:
        payload = {}
        for connection_id, metadata in self._registry.items():
            payload[connection_id] = {
                "db_type": metadata.db_type,
                "dialect": metadata.dialect,
                "namespace": metadata.namespace,
                "database_name": metadata.database_name,
                "created_at": metadata.created_at.isoformat(),
                "last_used_at": metadata.last_used_at.isoformat(),
                "schema_version": metadata.schema_version,
            }
        with self._storage_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)

    def create_connection(self, db_type: str, **params) -> str:
        engine = build_engine_from_params(db_type=db_type, **params)
        test_connection(engine)

        connection_id = str(uuid4())
        namespace = f"ns-{connection_id}"
        dialect = get_sqlglot_dialect(db_type)
        database_name = params.get("database") or params.get("sqlite_path") or db_type
        cards = get_table_cards(engine, sample_rows=2)
        upsert_schema_cards(cards, namespace=namespace)

        metadata = ConnectionMetadata(
            connection_id=connection_id,
            db_type=db_type,
            engine=engine,
            dialect=dialect,
            namespace=namespace,
            database_name=str(database_name),
        )
        self._registry[connection_id] = metadata
        self._save_to_disk()
        return connection_id

    def get_connection(self, connection_id: str) -> ConnectionMetadata:
        metadata = self._registry.get(connection_id)
        if metadata is None:
            raise ConnectionNotFoundError(f"Connection {connection_id} not found")
        return metadata

    def update_last_used(self, connection_id: str) -> None:
        metadata = self.get_connection(connection_id)
        metadata.last_used_at = datetime.now(timezone.utc)
        self._save_to_disk()

    def refresh_schema(self, connection_id: str) -> ConnectionMetadata:
        metadata = self.get_connection(connection_id)
        cards = get_table_cards(metadata.engine, sample_rows=2)
        upsert_schema_cards(cards, namespace=metadata.namespace)
        metadata.schema_version += 1
        self._save_to_disk()
        logger.info(
            "Schema refreshed",
            extra={"connection_id": connection_id, "schema_version": metadata.schema_version},
        )
        return metadata

    def remove_connection(self, connection_id: str) -> None:
        metadata = self.get_connection(connection_id)
        if metadata.engine is not None:
            metadata.engine.dispose()
        try:
            delete_namespace(metadata.namespace)
        except Exception as exc:
            logger.warning(
                "Failed to delete Pinecone namespace during connection removal",
                exc_info=exc,
                extra={"connection_id": connection_id, "namespace": metadata.namespace},
            )
        self._registry.pop(connection_id, None)
        self._save_to_disk()
        logger.info(
            "Connection removed",
            extra={
                "connection_id": connection_id,
                "database_name": metadata.database_name,
                "namespace": metadata.namespace,
            },
        )

    def list_connections(self) -> list[ConnectionMetadata]:
        return list(self._registry.values())

    def cleanup_expired(self, timeout_minutes: int = 30) -> list[str]:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)
        expired_ids = [cid for cid, meta in self._registry.items() if meta.last_used_at < cutoff]
        for cid in expired_ids:
            self.remove_connection(cid)
        return expired_ids
