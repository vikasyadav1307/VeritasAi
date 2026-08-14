"""Application-wide constants."""

# ── API ──
API_V1_PREFIX = "/api/v1"

# ── Supported Languages ──
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
    "ar": "Arabic",
}

# ── Input Limits ──
MIN_TEXT_LENGTH = 20
MAX_TEXT_LENGTH = 50_000
MAX_URL_LENGTH = 2048
MAX_IMAGE_SIZE_MB = 10
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# ── Cache ──
ANALYSIS_CACHE_TTL_SECONDS = 86_400  # 24 hours

# ── Pagination ──
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# ── Model Defaults ──
DEFAULT_MAX_SEQUENCE_LENGTH = 512
