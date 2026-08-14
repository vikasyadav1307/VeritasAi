"""Global exception handler middleware.

Catches all VeritasError subclasses and unhandled exceptions,
converting them into the standard JSON error response envelope.
Stack traces are logged server-side but never exposed to clients.
"""

from datetime import datetime

import structlog
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.exceptions import VeritasError

logger = structlog.get_logger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Converts exceptions into standard JSON error responses."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        try:
            return await call_next(request)
        except VeritasError as exc:
            # Known application errors — return structured response
            request_id = getattr(request.state, "request_id", "unknown")
            logger.warning(
                "Application error",
                error_code=exc.error_code,
                status_code=exc.status_code,
                message=exc.message,
                request_id=request_id,
                path=str(request.url.path),
            )
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "success": False,
                    "error": {
                        "code": exc.error_code,
                        "message": exc.message,
                        "details": exc.details,
                    },
                    "meta": {
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                    },
                },
            )
        except Exception as exc:
            # Unexpected errors — log full traceback, return generic 500
            request_id = getattr(request.state, "request_id", "unknown")
            logger.exception(
                "Unhandled exception",
                request_id=request_id,
                path=str(request.url.path),
                error=str(exc),
            )
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": "An unexpected error occurred.",
                        "details": {},
                    },
                    "meta": {
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                    },
                },
            )
