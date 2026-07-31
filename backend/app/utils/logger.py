from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_DIR = Path(__file__).resolve().parents[2] / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "app.log"
CONNECTION_LOG_FILE = LOG_DIR / "connections.log"
QUERY_LOG_FILE = LOG_DIR / "queries.log"

for log_path in (LOG_FILE, CONNECTION_LOG_FILE, QUERY_LOG_FILE):
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.touch(exist_ok=True)

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

logger = logging.getLogger("nl2sql")
logger.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))

file_handler = RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))

if not logger.handlers:
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

connection_logger = logging.getLogger("nl2sql.connections")
connection_logger.setLevel(logging.INFO)
if not connection_logger.handlers:
    connection_file_handler = RotatingFileHandler(CONNECTION_LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")
    connection_file_handler.setLevel(logging.INFO)
    connection_file_handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))
    connection_logger.addHandler(connection_file_handler)
    connection_logger.propagate = False

query_logger = logging.getLogger("nl2sql.queries")
query_logger.setLevel(logging.INFO)
if not query_logger.handlers:
    query_file_handler = RotatingFileHandler(QUERY_LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")
    query_file_handler.setLevel(logging.INFO)
    query_file_handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))
    query_logger.addHandler(query_file_handler)
    query_logger.propagate = False


def mask_sensitive_params(params: dict) -> dict:
    masked = {}
    for key, value in params.items():
        if any(secret_key in key.lower() for secret_key in ("password", "secret", "api_key", "apikey", "token")):
            masked[key] = "***REDACTED***"
        else:
            masked[key] = value
    return masked
