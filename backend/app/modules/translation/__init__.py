"""Translation module — multilingual support and presentation translation."""

from app.modules.translation.detector import DetectedLanguage, LanguageDetector
from app.modules.translation.languages import (
    SUPPORTED_LANGUAGES,
    LanguageInfo,
    get_language_info,
    get_language_name,
    get_supported_languages_list,
    is_supported_language,
    normalize_language_code,
)
from app.modules.translation.router import router
from app.modules.translation.services import (
    MockTranslationProvider,
    MyMemoryTranslationProvider,
    TranslationProvider,
    TranslationService,
    TranslationUnavailableError,
    UnsupportedLanguageError,
)

__all__ = [
    "DetectedLanguage",
    "LanguageDetector",
    "LanguageInfo",
    "MockTranslationProvider",
    "MyMemoryTranslationProvider",
    "SUPPORTED_LANGUAGES",
    "TranslationProvider",
    "TranslationService",
    "TranslationUnavailableError",
    "UnsupportedLanguageError",
    "get_language_info",
    "get_language_name",
    "get_supported_languages_list",
    "is_supported_language",
    "normalize_language_code",
    "router",
]
