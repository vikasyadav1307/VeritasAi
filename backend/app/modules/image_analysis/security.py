"""Security and validation utilities for image upload, decoding, and sanitization.

Defends against oversized files, malformed images, decompression bombs,
MIME-spoofing, path traversal in filenames, and unsupported formats.
"""

from __future__ import annotations

import io
import os
import re
from typing import BinaryIO

from PIL import Image

# ── Configurable Limits ──

# Maximum upload file size: 10 MB
MAX_IMAGE_FILE_BYTES: int = 10 * 1024 * 1024

# Maximum allowed pixel count: 25,000,000 pixels (e.g., 5000 x 5000)
MAX_IMAGE_PIXELS: int = 25_000_000

# Set Pillow's built-in decompression bomb limit
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

# Maximum sanitized filename length
MAX_FILENAME_LENGTH: int = 255

# Supported MIME types and image formats
SUPPORTED_IMAGE_FORMATS: frozenset[str] = frozenset({"JPEG", "PNG", "WEBP"})

# Magic bytes signatures
_JPEG_MAGIC = b"\xff\xd8\xff"
_PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
_WEBP_RIFF = b"RIFF"
_WEBP_HEADER = b"WEBP"

# Prohibited file signatures
_PROHIBITED_SIGNATURES: tuple[tuple[bytes, str], ...] = (
    (b"%PDF", "PDF document"),
    (b"<?xml", "XML/SVG document"),
    (b"<svg", "SVG document"),
    (b"<!doctype html", "HTML document"),
    (b"<html", "HTML document"),
    (b"MZ", "Windows executable/DLL"),
    (b"\x7fELF", "Linux ELF binary"),
    (b"PK\x03\x04", "ZIP/Office archive"),
    (b"Rar!\x1a\x07", "RAR archive"),
    (b"7z\xbc\xaf\x27\x1c", "7-Zip archive"),
    (b"\x1f\x8b", "GZIP archive"),
)


# ── Custom Exceptions ──


class ImageSecurityError(Exception):
    """Base exception for image security and validation failures."""

    pass


class ImageValidationError(ImageSecurityError):
    """Raised when the uploaded file fails basic validation (empty or missing)."""

    pass


class UnsupportedImageFormatError(ImageSecurityError):
    """Raised when the image format or MIME type is not supported."""

    pass


class ImageTooLargeError(ImageSecurityError):
    """Raised when the image file size or total pixel count exceeds allowed limits."""

    pass


class MalformedImageError(ImageSecurityError):
    """Raised when image bytes cannot be safely parsed or are corrupted."""

    pass


class DecompressionBombSecurityError(ImageSecurityError):
    """Raised when an image attempts decompression bomb exhaustion."""

    pass


# ── Bounded Stream Reader ──


async def read_bounded_image_bytes(
    file_stream: BinaryIO | any,
    max_bytes: int = MAX_IMAGE_FILE_BYTES,
    chunk_size: int = 64 * 1024,
) -> bytes:
    """Read bytes from an upload stream up to a strict maximum limit.

    Prevents memory exhaustion by reading in bounded chunks and aborting
    immediately if the cumulative size exceeds ``max_bytes``.

    Args:
        file_stream: Async or sync stream supporting read().
        max_bytes: Maximum allowed bytes.
        chunk_size: Read buffer size per iteration.

    Returns:
        The complete image bytes within limits.

    Raises:
        ImageTooLargeError: If uploaded stream exceeds ``max_bytes``.
        ImageValidationError: If uploaded stream is empty.
    """
    buffer = bytearray()

    while True:
        # Support both async UploadFile.read and sync BinaryIO.read
        chunk = file_stream.read(chunk_size)
        if hasattr(chunk, "__await__"):
            chunk = await chunk

        if not chunk:
            break

        buffer.extend(chunk)

        if len(buffer) > max_bytes:
            raise ImageTooLargeError(
                f"The image is too large to analyze. Maximum allowed size is {max_bytes // (1024 * 1024)} MB."
            )

    if len(buffer) == 0:
        raise ImageValidationError("The uploaded image file is empty.")

    return bytes(buffer)


# ── Magic Byte Verification ──


def verify_image_magic_bytes(data: bytes) -> str:
    """Verify file magic numbers to ensure genuine JPEG, PNG, or WEBP content.

    Rejects files with executable, script, archive, or non-image signatures.
    Does not trust client-supplied Content-Type.

    Args:
        data: The raw file bytes (at least first 32 bytes).

    Returns:
        The detected format name: 'JPEG', 'PNG', or 'WEBP'.

    Raises:
        UnsupportedImageFormatError: If magic bytes do not match supported images
            or match prohibited file formats.
    """
    header = data[:64].lower()

    # Check against prohibited signatures first
    for sig, desc in _PROHIBITED_SIGNATURES:
        if data.startswith(sig) or header.startswith(sig.lower()):
            raise UnsupportedImageFormatError(
                f"This image format is not supported (detected {desc})."
            )

    # Check for JPEG
    if data.startswith(_JPEG_MAGIC):
        return "JPEG"

    # Check for PNG
    if data.startswith(_PNG_MAGIC):
        return "PNG"

    # Check for WEBP: RIFF + length (4 bytes) + WEBP
    if len(data) >= 12 and data.startswith(_WEBP_RIFF) and data[8:12] == _WEBP_HEADER:
        return "WEBP"

    raise UnsupportedImageFormatError(
        "This image format is not supported. Please upload a JPEG, PNG, or WEBP image."
    )


# ── Image Integrity and Pixel Limits ──


def validate_and_open_image(image_bytes: bytes) -> Image.Image:
    """Validate image integrity, enforce pixel limits, and return PIL Image.

    Performs:
    1. Magic byte verification
    2. Pillow `verify()` check for corrupted data
    3. Total pixel count check against ``MAX_IMAGE_PIXELS`` (25,000,000)
    4. Format confirmation against allowed formats (JPEG, PNG, WEBP)

    Args:
        image_bytes: Validated raw bytes.

    Returns:
        Opened and verified PIL Image instance in memory.

    Raises:
        UnsupportedImageFormatError: If format is not in allowed set.
        ImageTooLargeError: If pixel count exceeds ``MAX_IMAGE_PIXELS``.
        MalformedImageError: If the image data is corrupted.
    """
    # 1. Magic bytes check
    verify_image_magic_bytes(image_bytes)

    # 2. Pillow verify (detects truncated or corrupt streams)
    try:
        verify_img = Image.open(io.BytesIO(image_bytes))
        verify_img.verify()
    except Image.DecompressionBombError as exc:
        raise DecompressionBombSecurityError(
            "The image is too large to analyze (decompression bomb detected)."
        ) from exc
    except Exception as exc:
        raise MalformedImageError(
            "The image could not be processed. The file appears to be corrupted."
        ) from exc

    # 3. Re-open to read actual image data (verify() invalidates file pointer)
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        raise MalformedImageError(
            "The image could not be processed. The file appears to be corrupted."
        ) from exc

    # 4. Check format
    fmt = (img.format or "").upper()
    if fmt not in SUPPORTED_IMAGE_FORMATS:
        raise UnsupportedImageFormatError(
            f"This image format ({fmt or 'unknown'}) is not supported."
        )

    # 5. Check dimensions and total pixels
    validate_image_dimensions(img)

    return img


def validate_image_dimensions(image: Image.Image) -> None:
    """Validate that image dimensions and total pixels are within acceptable limits.

    Args:
        image: PIL Image to validate.

    Raises:
        ImageTooLargeError: If pixel count exceeds MAX_IMAGE_PIXELS.
        MalformedImageError: If dimensions are too small (<10x10).
    """
    width, height = image.size
    total_pixels = width * height

    if total_pixels > MAX_IMAGE_PIXELS:
        raise ImageTooLargeError(
            f"The image resolution ({width}x{height} = {total_pixels:,} pixels) "
            f"exceeds the maximum allowed limit of {MAX_IMAGE_PIXELS:,} pixels."
        )

    if width < 10 or height < 10:
        raise MalformedImageError(
            "The image dimensions are too small to contain readable text."
        )


# Alias for read_bounded_image_bytes
validate_image_bytes = read_bounded_image_bytes


# ── Filename Sanitization ──


def sanitize_filename(filename: str | None) -> str:
    """Sanitize user-provided filename to prevent path traversal and injection.

    - Removes path components (directory traversal attacks)
    - Strips control characters and null bytes
    - Enforces maximum length of 255 characters
    - Returns a safe basename

    Args:
        filename: Untrusted client-supplied filename.

    Returns:
        Safe, sanitized filename string.
    """
    if not filename or not filename.strip():
        return "uploaded_image.png"

    # Strip directory path elements (both POSIX and Windows separators)
    clean_name = os.path.basename(filename.replace("\\", "/"))

    # Remove null bytes and control characters
    clean_name = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", clean_name)

    # Allow alphanumeric, hyphens, underscores, spaces, and periods
    clean_name = re.sub(r"[^\w\s\.\-]", "_", clean_name).strip()

    if not clean_name or clean_name.startswith("."):
        clean_name = f"image_{clean_name}" if clean_name else "uploaded_image.png"

    # Limit length preserving extension if possible
    if len(clean_name) > MAX_FILENAME_LENGTH:
        name_part, ext = os.path.splitext(clean_name)
        allowed_name_len = MAX_FILENAME_LENGTH - len(ext)
        clean_name = f"{name_part[:allowed_name_len]}{ext}"

    return clean_name
