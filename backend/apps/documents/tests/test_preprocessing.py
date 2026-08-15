"""Image preparation for Gemini Vision: orientation, transparency, resizing."""

import io

from django.test import SimpleTestCase
from PIL import Image

from apps.documents.services.preprocessing import (
    EXTRACTION_LONGEST_SIDE,
    EXTRACTION_MIME_TYPE,
    prepare_for_extraction,
)

from .fixtures import png_bytes, sharp_document_bytes

#: EXIF tag 274 is Orientation; value 6 means "rotate 90° clockwise to display".
EXIF_ORIENTATION_TAG = 274


def _jpeg_with_orientation(width: int, height: int, orientation: int) -> bytes:
    image = Image.new("RGB", (width, height), "white")
    exif = image.getexif()
    exif[EXIF_ORIENTATION_TAG] = orientation
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", exif=exif.tobytes())
    return buffer.getvalue()


def _size_of(data: bytes):
    return Image.open(io.BytesIO(data)).size


class PreprocessingTests(SimpleTestCase):
    def test_returns_jpeg(self):
        data, mime_type = prepare_for_extraction(sharp_document_bytes())
        self.assertEqual(mime_type, EXTRACTION_MIME_TYPE)
        self.assertEqual(Image.open(io.BytesIO(data)).format, "JPEG")

    def test_exif_orientation_is_applied(self):
        """A sideways phone photo must be uprighted before OCR."""
        original = _jpeg_with_orientation(400, 200, orientation=6)
        self.assertEqual(_size_of(original), (400, 200))

        prepared, _ = prepare_for_extraction(original)
        self.assertEqual(
            _size_of(prepared), (200, 400), "orientation tag 6 should transpose the image"
        )

    def test_upright_image_is_unchanged_in_orientation(self):
        original = _jpeg_with_orientation(400, 200, orientation=1)
        prepared, _ = prepare_for_extraction(original)
        self.assertEqual(_size_of(prepared), (400, 200))

    def test_image_without_exif_is_handled(self):
        image = Image.new("RGB", (300, 150), "white")
        buffer = io.BytesIO()
        image.save(buffer, "JPEG")
        prepared, _ = prepare_for_extraction(buffer.getvalue())
        self.assertEqual(_size_of(prepared), (300, 150))

    def test_large_image_is_downscaled(self):
        image = Image.new("RGB", (4000, 3000), "white")
        buffer = io.BytesIO()
        image.save(buffer, "JPEG")

        prepared, _ = prepare_for_extraction(buffer.getvalue())
        width, height = _size_of(prepared)
        self.assertEqual(max(width, height), EXTRACTION_LONGEST_SIDE)
        # Aspect ratio preserved.
        self.assertAlmostEqual(width / height, 4000 / 3000, places=2)

    def test_small_image_is_not_upscaled(self):
        image = Image.new("RGB", (320, 240), "white")
        buffer = io.BytesIO()
        image.save(buffer, "JPEG")
        prepared, _ = prepare_for_extraction(buffer.getvalue())
        self.assertEqual(_size_of(prepared), (320, 240))

    def test_transparency_is_flattened_onto_white_not_black(self):
        """A transparent PNG scan must not become unreadable dark-on-dark."""
        image = Image.new("RGBA", (300, 300), (0, 0, 0, 0))
        buffer = io.BytesIO()
        image.save(buffer, "PNG")

        prepared, _ = prepare_for_extraction(buffer.getvalue())
        flattened = Image.open(io.BytesIO(prepared)).convert("RGB")
        self.assertEqual(flattened.getpixel((10, 10)), (255, 255, 255))

    def test_png_input_is_accepted(self):
        prepared, mime_type = prepare_for_extraction(png_bytes())
        self.assertEqual(mime_type, EXTRACTION_MIME_TYPE)
        self.assertGreater(len(prepared), 0)

    def test_output_is_smaller_than_a_large_original(self):
        original = sharp_document_bytes()
        prepared, _ = prepare_for_extraction(original)
        self.assertLessEqual(max(_size_of(prepared)), EXTRACTION_LONGEST_SIDE)
