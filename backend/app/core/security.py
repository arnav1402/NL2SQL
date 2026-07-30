from __future__ import annotations

try:
    from cryptography.fernet import Fernet
except ImportError:  # pragma: no cover - optional dependency
    Fernet = None


def encrypt_value(value: str, key: str | None = None) -> str:
    if Fernet is None:
        raise ImportError("The 'cryptography' package is required for credential encryption. Please install it with 'pip install cryptography'.")
    if not key:
        key = "default-secret-key"
    cipher = Fernet(key.encode("utf-8").ljust(32, b"0")[:32])
    return cipher.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(value: str, key: str | None = None) -> str:
    if Fernet is None:
        raise ImportError("The 'cryptography' package is required for credential encryption. Please install it with 'pip install cryptography'.")
    if not key:
        key = "default-secret-key"
    cipher = Fernet(key.encode("utf-8").ljust(32, b"0")[:32])
    return cipher.decrypt(value.encode("utf-8")).decode("utf-8")
