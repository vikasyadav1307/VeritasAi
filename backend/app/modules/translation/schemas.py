"""Pydantic V2 schemas for translation and supported languages."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SupportedLanguageItem(BaseModel):
    """Metadata for a supported language."""

    code: str = Field(..., description="Standard ISO 639-1 two-letter language code.", examples=["hi"])
    name: str = Field(..., description="English name of the language.", examples=["Hindi"])
    native_name: str = Field(..., description="Autonym / native script name of the language.", examples=["हिन्दी"])
    is_rtl: bool = Field(default=False, description="True if language is written right-to-left.")
    is_supported_for_analysis: bool = Field(default=True, description="Supported for model analysis.")
    is_verified_translation: bool = Field(default=True, description="Verified translation pairing.")


class LanguagesResponse(BaseModel):
    """Response containing list of supported languages."""

    languages: list[SupportedLanguageItem] = Field(..., description="Supported languages catalog.")
    total_supported: int = Field(default=0, description="Total count of supported languages.")
    default_target: str = Field(default="en", description="Default target translation language.")


class TranslateRequest(BaseModel):
    """Request payload for on-demand presentation translation."""

    model_config = {"populate_by_name": True}

    text: str = Field(
        ...,
        min_length=10,
        max_length=50_000,
        description="Text to translate (10–50,000 characters).",
        examples=["यह एक महत्वपूर्ण समाचार रिपोर्ट है।"],
    )
    source_language: str = Field(
        default="auto",
        alias="source_lang",
        description="Source ISO 639-1 code or 'auto' for automatic language detection.",
        examples=["auto", "hi"],
    )
    target_language: str = Field(
        default="en",
        alias="target_lang",
        description="Target ISO 639-1 code for translation presentation.",
        examples=["en"],
    )


class TranslateResponse(BaseModel):
    """Response payload for on-demand presentation translation."""

    source_language: str = Field(..., description="Detected or specified source language code.", examples=["hi"])
    source_language_name: str = Field(..., description="Human-readable source language name.", examples=["Hindi"])
    target_language: str = Field(..., description="Target language code.", examples=["en"])
    target_language_name: str = Field(..., description="Human-readable target language name.", examples=["English"])
    original_text: str = Field(..., description="The original unedited input text.", examples=["यह एक महत्वपूर्ण समाचार रिपोर्ट है।"])
    translated_text: str = Field(..., description="The translated presentation text.", examples=["This is an important news report."])
    latency_ms: float = Field(..., ge=0.0, description="Translation execution latency in milliseconds.", examples=[245.5])
    provider: str = Field(..., description="Translation provider engine used.", examples=["mymemory"])
    is_cached: bool = Field(default=False, description="Whether the translated text was served from in-memory cache.")
    character_count: int = Field(default=0, description="Character count of original input text.")
    disclaimer: str = Field(
        default=(
            "Translation is for display/presentation only. Model credibility, sentiment, "
            "and token explainability were evaluated on the original text."
        ),
        description="Educational disclaimer clarifying that translation does not alter model predictions.",
    )
