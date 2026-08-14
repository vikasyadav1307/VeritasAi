"""Shared enums and type aliases used across modules.

These map directly to PostgreSQL ENUMs defined in 04_DATABASE_DESIGN.md §4.
"""

from enum import StrEnum


class UserRole(StrEnum):
    """User roles for RBAC."""

    USER = "user"
    ADMIN = "admin"


class InputType(StrEnum):
    """Types of analysis input."""

    TEXT = "text"
    URL = "url"
    IMAGE = "image"


class CredibilityLabel(StrEnum):
    """Credibility classification labels."""

    REAL = "real"
    FAKE = "fake"
    UNCERTAIN = "uncertain"


class SentimentLabel(StrEnum):
    """Sentiment classification labels."""

    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class ModelTask(StrEnum):
    """AI model task types."""

    DETECTION = "detection"
    SENTIMENT = "sentiment"
    TRANSLATION = "translation"
    SUMMARIZATION = "summarization"
    OCR = "ocr"
