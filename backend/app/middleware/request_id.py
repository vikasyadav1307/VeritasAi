"""Request ID middleware.

Injects a unique X-Request-ID into every request for distributed tracing.
If the client sends an X-Request-ID header, it is reused; otherwise a new
UUID is generated. The ID is also bound to structlog context vars so all
log entries within the request include it.
"""

import uuid

import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Assigns a unique request ID to every request."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Reuse client-provided ID or generate a new one
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

        # Store on request state for access in route handlers
        request.state.request_id = request_id

        # Bind to structlog context for automatic log inclusion
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        # Process request and add ID to response headers
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response
