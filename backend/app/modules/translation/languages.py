"""Central source of truth for supported languages in VeritasAI.

Defines language codes, human-readable names, native script names,
and code normalization mappings.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class LanguageInfo:
    """Metadata for a supported language."""

    code: str
    name: str
    native_name: str
    is_rtl: bool = False


# Central registry of supported languages.
# Bounded to languages verified with langdetect and multilingual XLM-RoBERTa.
SUPPORTED_LANGUAGES: Final[dict[str, LanguageInfo]] = {
    "en": LanguageInfo(code="en", name="English", native_name="English"),
    "hi": LanguageInfo(code="hi", name="Hindi", native_name="हिन्दी"),
    "bn": LanguageInfo(code="bn", name="Bengali", native_name="বাংলা"),
    "ta": LanguageInfo(code="ta", name="Tamil", native_name="தமிழ்"),
    "te": LanguageInfo(code="te", name="Telugu", native_name="తెలుగు"),
    "mr": LanguageInfo(code="mr", name="Marathi", native_name="मराठी"),
    "gu": LanguageInfo(code="gu", name="Gujarati", native_name="ગુજરાતી"),
    "kn": LanguageInfo(code="kn", name="Kannada", native_name="ಕನ್ನಡ"),
    "ml": LanguageInfo(code="ml", name="Malayalam", native_name="മലയാളം"),
    "pa": LanguageInfo(code="pa", name="Punjabi", native_name="ਪੰਜਾਬੀ"),
    "ur": LanguageInfo(code="ur", name="Urdu", native_name="اردو", is_rtl=True),
    "es": LanguageInfo(code="es", name="Spanish", native_name="Español"),
    "fr": LanguageInfo(code="fr", name="French", native_name="Français"),
    "de": LanguageInfo(code="de", name="German", native_name="Deutsch"),
}

# Normalization mapping for common language code variants
LANGUAGE_CODE_ALIASES: Final[dict[str, str]] = {
    "en-us": "en",
    "en-gb": "en",
    "eng": "en",
    "english": "en",
    "hin": "hi",
    "hindi": "hi",
    "ben": "bn",
    "bengali": "bn",
    "tam": "ta",
    "tamil": "ta",
    "tel": "te",
    "telugu": "te",
    "mar": "mr",
    "marathi": "mr",
    "guj": "gu",
    "gujarati": "gu",
    "kan": "kn",
    "kannada": "kn",
    "mal": "ml",
    "malayalam": "ml",
    "pan": "pa",
    "punjabi": "pa",
    "urd": "ur",
    "urdu": "ur",
    "spa": "es",
    "spanish": "es",
    "fre": "fr",
    "fra": "fr",
    "french": "fr",
    "ger": "de",
    "deu": "de",
    "german": "de",
}

UNKNOWN_LANGUAGE: Final[LanguageInfo] = LanguageInfo(
    code="unknown",
    name="Unknown / Undetermined",
    native_name="Unknown",
)


def normalize_language_code(code: str) -> str:
    """Normalize a language code into its standard 2-letter ISO 639-1 code.

    Returns the normalized code if recognized, otherwise the lowercase input.
    """
    clean = code.strip().lower()
    return LANGUAGE_CODE_ALIASES.get(clean, clean)


def is_supported_language(code: str) -> bool:
    """Check whether a language code is in the supported languages registry."""
    normalized = normalize_language_code(code)
    return normalized in SUPPORTED_LANGUAGES


def get_language_info(code: str) -> LanguageInfo:
    """Retrieve LanguageInfo for a language code, returning UNKNOWN_LANGUAGE if unrecognized."""
    normalized = normalize_language_code(code)
    return SUPPORTED_LANGUAGES.get(normalized, UNKNOWN_LANGUAGE)


def get_language_name(code: str) -> str:
    """Retrieve human-readable language name for a code."""
    return get_language_info(code).name


def get_supported_languages_list() -> list[LanguageInfo]:
    """Return an ordered list of supported languages."""
    return list(SUPPORTED_LANGUAGES.values())
