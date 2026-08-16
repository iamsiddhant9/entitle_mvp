"""Image preparation for Gemini Vision, plus the shared colour-mode conversions.

Applied only to the copy sent to the model — the uploaded original is stored untouched.

* EXIF orientation is applied, so a sideways phone photo is uprighted before OCR.
* High bit-depth images are *rescaled* rather than clamped. Pillow's ``I;16 -> L`` and
  ``I;16 -> RGB`` conversions clamp at 255, and since raw 255 is only 0.39% of the 16-bit
  range, a 16-bit greyscale scan would otherwise come out as a blank white page.
* Transparency is flattened onto white, so a PNG scan does not become black-on-black.
* Oversized images are downscaled to a bounded longest side. 1600px keeps printed text on
  an A4 document comfortably legible while avoiding a needless multi-megabyte upload on
  every request.
"""

from __future__ import annotations

import io

from PIL import Image, ImageOps

#: Longest side sent to the model.
EXTRACTION_LONGEST_SIDE = 1600

JPEG_QUALITY = 85

EXTRACTION_MIME_TYPE = "image/jpeg"

#: Modes whose sample values do not fit in 0..255 and so must be rescaled, not clamped.
_HIGH_BIT_DEPTH_MODES = ("I", "F")


def _is_high_bit_depth(image: Image.Image) -> bool:
    return image.mode.startswith("I;16") or image.mode in _HIGH_BIT_DEPTH_MODES


def _rescale_to_8bit(image: Image.Image) -> Image.Image:
    """Map a high bit-depth image into an 8-bit ``L`` image without clamping."""
    source = image.convert("F")
    if image.mode.startswith("I;16"):
        # Fixed, data-independent scaling: 16-bit full scale -> 8-bit full scale.
        return source.point(lambda value: value / 257.0).convert("L")

    low, high = source.getextrema()
    if high <= low:
        return Image.new("L", source.size, 0)
    scale = 255.0 / (high - low)
    return source.point(lambda value: (value - low) * scale).convert("L")


def to_grayscale(image: Image.Image) -> Image.Image:
    """Convert any supported image to 8-bit greyscale, rescaling high bit depths."""
    if _is_high_bit_depth(image):
        return _rescale_to_8bit(image)
    return image.convert("L")


def to_rgb(image: Image.Image) -> Image.Image:
    """Convert any supported image to RGB, flattening transparency onto white."""
    if _is_high_bit_depth(image):
        return _rescale_to_8bit(image).convert("RGB")

    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        background = Image.new("RGB", image.size, (255, 255, 255))
        converted = image.convert("RGBA")
        background.paste(converted, mask=converted.split()[-1])
        return background

    if image.mode != "RGB":
        return image.convert("RGB")
    return image


def prepare_for_extraction(data: bytes) -> tuple[bytes, str]:
    """Return ``(jpeg_bytes, mime_type)`` ready to hand to the model."""
    image = Image.open(io.BytesIO(data))
    image = ImageOps.exif_transpose(image)
    image = to_rgb(image)

    width, height = image.size
    longest = max(width, height)
    if longest > EXTRACTION_LONGEST_SIDE:
        ratio = EXTRACTION_LONGEST_SIDE / longest
        image = image.resize(
            (max(1, round(width * ratio)), max(1, round(height * ratio))),
            Image.LANCZOS,
        )

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buffer.getvalue(), EXTRACTION_MIME_TYPE
