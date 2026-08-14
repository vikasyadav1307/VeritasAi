"""Custom exception hierarchy for VeritasAI.

All exceptions include an `error_code` string that maps to the
standard error codes defined in 05_API_SPECIFICATION.md.
The global error handler (middleware/error_handler.py) converts
these exceptions into JSON error responses.
"""


class VeritasError(Exception):
    """Base exception for all VeritasAI errors."""

    def __init__(
        self,
        message: str = "An unexpected error occurred.",
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: dict | None = None,  # noqa: UP007
    ) -> None:
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(VeritasError):
    """400 — Input validation failed."""

    def __init__(
        self,
        message: str = "Validation error.",
        error_code: str = "VALIDATION_ERROR",
        details: dict | None = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=400,
            details=details,
        )


class AuthenticationError(VeritasError):
    """401 — Authentication failed (missing/invalid credentials)."""

    def __init__(
        self,
        message: str = "Authentication required.",
        error_code: str = "AUTH_INVALID_CREDENTIALS",
        details: dict | None = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=401,
            details=details,
        )


class ForbiddenError(VeritasError):
    """403 — Insufficient permissions."""

    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
        error_code: str = "FORBIDDEN",
        details: dict | None = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=403,
            details=details,
        )


class NotFoundError(VeritasError):
    """404 — Resource not found."""

    def __init__(
        self,
        message: str = "Resource not found.",
        error_code: str = "NOT_FOUND",
        details: dict | None = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=404,
            details=details,
        )


class ConflictError(VeritasError):
    """409 — Resource conflict (duplicate)."""

    def __init__(
        self,
        message: str = "Resource already exists.",
        error_code: str = "CONFLICT",
        details: dict | None = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=409,
            details=details,
        )


class ProcessingError(VeritasError):
    """422 — Processing failed (OCR, scraping, model inference)."""

    def __init__(
        self,
        message: str = "Processing failed.",
        error_code: str = "PROCESSING_ERROR",
        details: dict | None = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=422,
            details=details,
        )


class RateLimitError(VeritasError):
    """429 — Rate limit exceeded."""

    def __init__(
        self,
        message: str = "Rate limit exceeded. Please try again later.",
        error_code: str = "RATE_LIMIT_EXCEEDED",
        details: dict | None = None,
    ) -> None:
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=429,
            details=details,
        )
