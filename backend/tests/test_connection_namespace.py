from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.connection.connection_manager import ConnectionManager


def test_build_namespace_uses_database_and_schema_names() -> None:
    manager = ConnectionManager()

    namespace = manager._build_namespace("Brazil_DB", "Sales")

    assert namespace.startswith("ns-brazil-db-sales-")
    assert " " not in namespace
