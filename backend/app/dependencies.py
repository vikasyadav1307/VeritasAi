"""Shared FastAPI dependencies used across modules."""

from fastapi import Request


async def get_request_id(request: Request) -> str:
    """Extract the request ID from request state.

    Injected by RequestIDMiddleware before this dependency runs.
    """
    return getattr(request.state, "request_id", "unknown")
