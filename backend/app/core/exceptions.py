class ConnectionNotFoundError(Exception):
    """Raised when a requested connection is not present in the in-memory registry."""


class InvalidCredentialsError(Exception):
    """Raised when database credentials are invalid or authentication fails."""


class UnsupportedDialectError(Exception):
    """Raised when the requested database dialect is not supported."""


class UnsafeSQLError(Exception):
    """Raised when the generated SQL is not safe to execute."""
