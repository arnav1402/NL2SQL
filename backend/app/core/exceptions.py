class ConnectionNotFoundError(Exception):
    """Raised when a requested connection is not present in the in-memory registry."""


class InvalidCredentialsError(Exception):
    """Raised when database credentials are invalid or authentication fails."""


class UnsupportedDialectError(Exception):
    """Raised when the requested database dialect is not supported."""


class UnsafeSQLError(Exception):
    """Raised when the generated SQL is not safe to execute."""


class LLMGenerationError(Exception):
    """Raised when an LLM or external SQL generation service fails."""


class VectorStoreError(Exception):
    """Raised when an external vector store operation fails."""


class DatabaseExecutionError(Exception):
    """Raised when execution against the target database fails."""


class AmbiguousQuestionError(Exception):
    """Raised when the question is too ambiguous to reliably ground to schema."""
