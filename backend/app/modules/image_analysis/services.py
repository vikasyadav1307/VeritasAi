"""Image analysis services — preprocessing, OCR extraction, text normalization, and inference orchestration."""

from __future__ import annotations

import asyncio
import os
import re
import shutil
from typing import Any, BinaryIO

import structlog
from PIL import Image, ImageEnhance, ImageOps

from app.config import settings
from app.modules.analysis.services import AnalysisService
from app.modules.image_analysis.security import (
    read_bounded_image_bytes,
    sanitize_filename,
    validate_and_open_image,
)

logger = structlog.get_logger(__name__)

# ── Limits & Thresholds ──

MIN_OCR_TEXT_LENGTH: int = 15
MAX_OCR_TEXT_LENGTH: int = 50_000


# ── Exceptions ──


class OcrError(Exception):
    """Base exception for OCR processing failures."""

    pass


class OcrUnavailableError(OcrError):
    """Raised when Tesseract binary is not installed or cannot be executed."""

    pass


class InsufficientOcrTextError(OcrError):
    """Raised when no readable or sufficient text could be extracted from the image."""

    pass


# ── Preprocessor ──


class ImagePreprocessor:
    """Prepares raw uploaded images for optimal Tesseract OCR extraction.

    Applies:
    1. EXIF orientation correction.
    2. Alpha-channel flattening onto white background.
    3. Grayscale conversion.
    4. Upscaling for small images (< 800px).
    5. Adaptive contrast enhancement.
    """

    def preprocess(self, image: Image.Image) -> Image.Image:
        """Preprocess PIL image in-memory for OCR.

        Args:
            image: Validated PIL Image.

        Returns:
            Enhanced, preprocessed PIL Image.
        """
        # 1. EXIF orientation
        try:
            image = ImageOps.exif_transpose(image) or image
        except Exception as exc:
            logger.debug("exif_transpose_skipped", error=str(exc))

        # 2. Flatten alpha / transparency onto white background
        if image.mode in ("RGBA", "LA", "P"):
            try:
                rgb_img = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "P":
                    image = image.convert("RGBA")
                mask = image.split()[-1] if "A" in image.mode else None
                rgb_img.paste(image, mask=mask)
                image = rgb_img
            except Exception:
                image = image.convert("RGB")

        # 3. Grayscale conversion
        gray_img = image.convert("L")

        # 4. Upscale small images to improve character edge recognition
        width, height = gray_img.size
        min_dim = min(width, height)
        if min_dim < 800 and min_dim > 0:
            scale_factor = min(800.0 / min_dim, 3.0)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            gray_img = gray_img.resize(
                (new_width, new_height),
                resample=Image.Resampling.LANCZOS,
            )
            logger.debug(
                "image_upscaled_for_ocr",
                original_size=(width, height),
                new_size=(new_width, new_height),
                scale_factor=round(scale_factor, 2),
            )

        # 5. Contrast enhancement
        try:
            enhancer = ImageEnhance.Contrast(gray_img)
            enhanced = enhancer.enhance(1.5)
            return enhanced
        except Exception:
            return gray_img


# ── OCR Engine ──


class OcrEngine:
    """Wrapper around Tesseract OCR binary and pytesseract."""

    def __init__(self) -> None:
        self._configured_binary: str | None = None
        self._checked_availability: bool = False
        self._is_available: bool = False

    def find_tesseract_binary(self) -> str | None:
        """Discover Tesseract binary path dynamically across OS environments."""
        candidates = [
            settings.tesseract_cmd,
            os.environ.get("TESSERACT_CMD"),
            shutil.which("tesseract"),
            # Common Windows installation directories
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
            # Linux standard paths
            "/usr/bin/tesseract",
            "/usr/local/bin/tesseract",
        ]

        for candidate in candidates:
            if candidate and os.path.isfile(candidate):
                return os.path.abspath(candidate)

        return None

    def is_available(self) -> bool:
        """Check whether Tesseract binary is available on the host system."""
        if self._checked_availability:
            return self._is_available

        import pytesseract

        binary = self.find_tesseract_binary()
        if not binary:
            logger.warning("tesseract_binary_not_found")
            self._checked_availability = True
            self._is_available = False
            return False

        try:
            pytesseract.pytesseract.tesseract_cmd = binary
            # Validate by checking version
            _ = pytesseract.get_tesseract_version()
            self._configured_binary = binary
            self._is_available = True
            logger.info("tesseract_binary_configured", binary=binary)
        except Exception as exc:
            logger.warning("tesseract_binary_validation_failed", binary=binary, error=str(exc))
            self._is_available = False

        self._checked_availability = True
        return self._is_available

    def extract_text(self, image: Image.Image) -> str:
        """Execute OCR extraction on a PIL Image.

        Args:
            image: Preprocessed PIL Image.

        Returns:
            Extracted text string.

        Raises:
            OcrUnavailableError: If Tesseract binary is not installed or execution fails.
        """
        if not self.is_available():
            raise OcrUnavailableError("Image text extraction is temporarily unavailable.")

        import pytesseract

        try:
            # Determine available languages
            languages = "eng"
            try:
                available_langs = pytesseract.get_languages(config="")
                if "hin" in available_langs:
                    languages = "eng+hin"
            except Exception:
                pass

            extracted = pytesseract.image_to_string(
                image,
                lang=languages,
                config="--psm 3",
                timeout=20,
            )
            return extracted or ""

        except pytesseract.TesseractNotFoundError as exc:
            logger.error("tesseract_not_found_on_exec", error=str(exc))
            self._is_available = False
            raise OcrUnavailableError("Image text extraction is temporarily unavailable.") from exc

        except RuntimeError as exc:
            if "timeout" in str(exc).lower():
                logger.warning("ocr_timeout_exceeded", error=str(exc))
                raise OcrUnavailableError("OCR processing timed out. Image may be too complex or distorted.") from exc
            logger.error("ocr_runtime_error", error=str(exc))
            raise OcrUnavailableError("Image text extraction failed.") from exc

        except Exception as exc:
            logger.error("ocr_extraction_error", error=str(exc))
            raise OcrUnavailableError("Image text extraction is temporarily unavailable.") from exc


# ── Text Cleaner ──


class TextCleaner:
    """Cleans, normalizes, and validates text extracted via OCR."""

    def clean_and_validate(self, raw_text: str) -> str:
        """Normalize extracted text and enforce quality and length limits.

        Args:
            raw_text: Raw string returned by OCR engine.

        Returns:
            Cleaned and normalized text string.

        Raises:
            InsufficientOcrTextError: If text is empty or below minimum character threshold.
        """
        if not raw_text:
            raise InsufficientOcrTextError("No readable text could be extracted from this image.")

        # Strip control characters (except newline, tab)
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", " ", raw_text)

        # Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Collapse excessive blank lines
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Collapse horizontal whitespace
        text = re.sub(r"[ \t]+", " ", text)

        text = text.strip()

        # Check for meaningful alphanumeric content
        alphanumeric_chars = sum(1 for c in text if c.isalnum())
        if len(text) < MIN_OCR_TEXT_LENGTH or alphanumeric_chars < 10:
            raise InsufficientOcrTextError("No readable text could be extracted from this image.")

        # Truncate if exceeding maximum length
        if len(text) > MAX_OCR_TEXT_LENGTH:
            text = text[:MAX_OCR_TEXT_LENGTH].rsplit(" ", 1)[0]

        return text


# ── Image Analysis Orchestrator ──


class ImageAnalysisService:
    """Orchestrates image upload verification, preprocessing, OCR, and AI inference."""

    def __init__(
        self,
        preprocessor: ImagePreprocessor | None = None,
        ocr_engine: OcrEngine | None = None,
        text_cleaner: TextCleaner | None = None,
        analysis_service: AnalysisService | None = None,
    ) -> None:
        self.preprocessor = preprocessor or ImagePreprocessor()
        self.ocr_engine = ocr_engine or OcrEngine()
        self.text_cleaner = text_cleaner or TextCleaner()
        self.analysis_service = analysis_service or AnalysisService()

    async def analyze_image(
        self,
        file_stream: BinaryIO | Any,
        filename: str | None = None,
        content_type: str | None = None,
    ) -> dict[str, Any]:
        """Perform end-to-end image text extraction and credibility/sentiment analysis.

        Args:
            file_stream: Image binary upload stream.
            filename: Client-supplied filename.
            content_type: Client-supplied MIME type.

        Returns:
            Dictionary containing extracted OCR text, detected language,
            credibility predictions, and sentiment predictions.
        """
        # 1. Sanitize filename
        safe_filename = sanitize_filename(filename)

        # 2. Read stream with bounded size guard
        image_bytes = await read_bounded_image_bytes(file_stream)

        # 3. Security validation and Pillow open
        pil_image = validate_and_open_image(image_bytes)

        # Determine MIME type
        detected_fmt = (pil_image.format or "JPEG").lower()
        if detected_fmt == "jpeg":
            mime_type = "image/jpeg"
        elif detected_fmt == "png":
            mime_type = "image/png"
        elif detected_fmt == "webp":
            mime_type = "image/webp"
        else:
            mime_type = content_type or "image/jpeg"

        # 4. Preprocess image
        preprocessed_img = self.preprocessor.preprocess(pil_image)

        # 5. Extract text via OCR in threadpool
        raw_text = await asyncio.to_thread(self.ocr_engine.extract_text, preprocessed_img)

        # 6. Clean and validate extracted text
        cleaned_text = self.text_cleaner.clean_and_validate(raw_text)

        # 7. Language detection
        from app.modules.translation.detector import LanguageDetector

        lang_res = LanguageDetector.detect_language(cleaned_text)
        detected_lang = lang_res.code

        # 8. Model inference (credibility + sentiment)
        ai_results = await self.analysis_service.analyze_text(cleaned_text)

        return {
            "filename": safe_filename,
            "content_type": mime_type,
            "ocr_text": cleaned_text,
            "detected_language": detected_lang,
            "character_count": len(cleaned_text),
            "credibility": ai_results["credibility"],
            "sentiment": ai_results["sentiment"],
        }
