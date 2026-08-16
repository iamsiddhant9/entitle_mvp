"""
Document quality checks + AI field extraction.

Blur detection uses the classic variance-of-Laplacian measure (Pillow +
numpy, no OpenCV needed). Field extraction is delegated to Gemini Vision via
apps.explain.services.gemini_client. Both steps are best-effort: a failure
never blocks the upload, it just leaves the corresponding flags empty.
"""
import datetime
import io
import logging

from apps.explain.services.gemini_client import extract_document_fields

logger = logging.getLogger(__name__)

# Variance-of-Laplacian below this on a 0-255 grayscale image reads as blurry.
BLUR_THRESHOLD = 100.0


def check_blur(file_bytes):
    """
    Returns (is_blurry, score). score is None when the file is not a readable
    image or Pillow/numpy are unavailable — in that case we do not flag it.
    """
    try:
        import numpy as np
        from PIL import Image

        image = Image.open(io.BytesIO(file_bytes)).convert("L")
        image.thumbnail((1024, 1024))
        pixels = np.asarray(image, dtype=np.float64)
        if pixels.shape[0] < 3 or pixels.shape[1] < 3:
            return False, None
        # 4-neighbour Laplacian via array shifts (no scipy dependency).
        laplacian = (
            pixels[:-2, 1:-1] + pixels[2:, 1:-1] + pixels[1:-1, :-2] + pixels[1:-1, 2:] - 4 * pixels[1:-1, 1:-1]
        )
        score = float(laplacian.var())
        return score < BLUR_THRESHOLD, round(score, 2)
    except Exception:
        logger.info("Blur check skipped (not an image or Pillow/numpy missing)")
        return False, None


def check_expiry(extracted_fields, today=None):
    """True if the extracted expiry_date is a past date."""
    raw = (extracted_fields or {}).get("expiry_date")
    if not raw:
        return False
    today = today or datetime.date.today()
    try:
        expiry = datetime.date.fromisoformat(str(raw)[:10])
        return expiry < today
    except ValueError:
        return False


def process_document(file_bytes, mime_type, doc_type):
    """
    Full pipeline for one uploaded file. Returns a dict with
    extracted_fields, is_blurry, blur_score and is_expired.
    """
    is_blurry, blur_score = check_blur(file_bytes)
    extracted = {} if is_blurry else extract_document_fields(file_bytes, mime_type, doc_type)
    return {
        "extracted_fields": extracted,
        "is_blurry": is_blurry,
        "blur_score": blur_score,
        "is_expired": check_expiry(extracted),
    }
