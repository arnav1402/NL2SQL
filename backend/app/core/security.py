from __future__ import annotations

import os
from app.config import APP_SECRET_KEY
import re
from typing import Any

try:
    from cryptography.fernet import Fernet
except ImportError:  # pragma: no cover - optional dependency
    Fernet = None


def get_secret_key(env_name: str = "APP_SECRET_KEY", default: str | None = None) -> bytes:
    secret = os.getenv(env_name, default)
    if not secret:
        raise RuntimeError(
            f"Missing secret key: {env_name}. Set it in the environment before starting the app."
        )

    key = secret.encode("utf-8")
    if len(key) < 32:
        key = key.ljust(32, b"0")
    return key[:32]


def _make_cipher(key: str | None = None) -> Fernet:
    if Fernet is None:
        raise ImportError(
            "The 'cryptography' package is required for credential encryption. "
            "Install it with: pip install cryptography"
        )

    final_key = key or os.getenv("APP_SECRET_KEY")
    if not final_key:
        raise RuntimeError(
            "APP_SECRET_KEY is required for encrypting/decrypting sensitive backend values."
        )

    normalized = final_key.encode("utf-8")
    if len(normalized) < 32:
        normalized = normalized.ljust(32, b"0")
    normalized = normalized[:32]

    return Fernet(base64_url_encode(normalized))


def base64_url_encode(raw: bytes) -> bytes:
    import base64
    return base64.urlsafe_b64encode(raw)


def encrypt_value(value: str, key: str | None = None) -> str:
    if value is None:
        raise ValueError("Cannot encrypt None value")
    cipher = _make_cipher(key)
    return cipher.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(value: str, key: str | None = None) -> str:
    if value is None:
        raise ValueError("Cannot decrypt None value")
    cipher = _make_cipher(key)
    return cipher.decrypt(value.encode("utf-8")).decode("utf-8")


def sanitize_string(value: Any, *, max_length: int = 2000, allow_empty: bool = False) -> str:
    if value is None:
        if allow_empty:
            return ""
        raise ValueError("Value cannot be empty")

    text = str(value).strip()

    if not text and not allow_empty:
        raise ValueError("Value cannot be blank")

    if len(text) > max_length:
        raise ValueError(f"Value exceeds maximum allowed length of {max_length}")

    text = text.replace("\x00", "")
    text = "".join(ch for ch in text if ch.isprintable() or ch in "\n\t")

    if not allow_empty and not text:
        raise ValueError("Value cannot be blank after sanitization")

    return text


def redact_sensitive_data(data: dict[str, Any]) -> dict[str, Any]:
    redacted = {}
    for key, value in data.items():
        lowered = str(key).lower()
        if any(token in lowered for token in ["password", "secret", "token", "key", "api_key"]):
            redacted[key] = "***REDACTED***"
        else:
            redacted[key] = value
    return redacted


def validate_connection_payload(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Connection payload must be a dictionary")

    safe_payload = {}

    safe_payload["db_type"] = sanitize_string(payload.get("db_type", ""), max_length=50)
    safe_payload["host"] = sanitize_string(payload.get("host", "localhost"), max_length=255)
    safe_payload["port"] = str(payload.get("port", 5432))
    safe_payload["database"] = sanitize_string(payload.get("database", ""), max_length=255)
    safe_payload["username"] = sanitize_string(payload.get("username", ""), max_length=255)
    safe_payload["password"] = sanitize_string(payload.get("password", ""), max_length=255, allow_empty=True)

    if not re.fullmatch(r"[A-Za-z0-9_.-]+", safe_payload["db_type"]):
        raise ValueError("Invalid database type")
    if not re.fullmatch(r"[A-Za-z0-9.-]+", safe_payload["host"]):
        raise ValueError("Invalid host format")

    try:
        port = int(safe_payload["port"])
        if port < 1 or port > 65535:
            raise ValueError("Port out of range")
    except ValueError as exc:
        raise ValueError("Port must be an integer between 1 and 65535") from exc

    return safe_payload