"""Blur / quality detection."""

from django.test import SimpleTestCase, override_settings

from apps.documents.services.quality import (
    STATUS_BLURRY,
    STATUS_OK,
    STATUS_TOO_SMALL,
    STATUS_UNKNOWN,
    assess_image_quality,
    blur_threshold,
)

from .fixtures import (
    blank_image_bytes,
    blurred_document_bytes,
    large_blank_bytes,
    not_an_image_bytes,
    sharp_document_bytes,
)


class QualityAssessmentTests(SimpleTestCase):
    def test_sharp_document_is_ok(self):
        result = assess_image_quality(sharp_document_bytes())
        self.assertEqual(result.status, STATUS_OK)
        self.assertFalse(result.is_blurry)
        self.assertGreater(result.laplacian_variance, blur_threshold())

    def test_blurred_document_is_flagged(self):
        result = assess_image_quality(blurred_document_bytes())
        self.assertEqual(result.status, STATUS_BLURRY)
        self.assertTrue(result.is_blurry)
        self.assertLess(result.laplacian_variance, blur_threshold())

    def test_blank_page_is_flagged(self):
        """The previous implementation scored a blank page at 2473 against a
        threshold of 20, so it could never detect one. This must score ~0."""
        result = assess_image_quality(large_blank_bytes())
        self.assertEqual(result.status, STATUS_BLURRY)
        self.assertLess(result.laplacian_variance, 1.0)

    def test_sharp_and_blurred_are_well_separated(self):
        sharp = assess_image_quality(sharp_document_bytes()).laplacian_variance
        blurred = assess_image_quality(blurred_document_bytes()).laplacian_variance
        self.assertGreater(sharp, blurred * 100)

    def test_small_image_reports_too_small_not_blurry(self):
        result = assess_image_quality(blank_image_bytes(100, 100))
        self.assertEqual(result.status, STATUS_TOO_SMALL)
        self.assertFalse(result.is_blurry)

    def test_invalid_image_reports_unknown_and_is_not_blurry(self):
        result = assess_image_quality(not_an_image_bytes())
        self.assertEqual(result.status, STATUS_UNKNOWN)
        self.assertIsNone(result.laplacian_variance)
        self.assertFalse(result.is_blurry)

    def test_measurement_is_deterministic(self):
        data = sharp_document_bytes()
        first = assess_image_quality(data).laplacian_variance
        second = assess_image_quality(data).laplacian_variance
        self.assertEqual(first, second)

    def test_resolution_normalisation_keeps_scores_comparable(self):
        """A document scanned at very different sizes must land in the same band."""
        import io

        from PIL import Image

        from .fixtures import _document_image

        def score(width, height):
            buffer = io.BytesIO()
            _document_image().resize((width, height), Image.LANCZOS).save(buffer, "JPEG")
            return assess_image_quality(buffer.getvalue()).laplacian_variance

        small = score(620, 877)
        large = score(2480, 3508)
        self.assertGreater(small, blur_threshold())
        self.assertGreater(large, blur_threshold())
        # Within one order of magnitude of each other.
        self.assertLess(max(small, large) / min(small, large), 10)

    @override_settings(DOCUMENT_BLUR_THRESHOLD=10_000_000)
    def test_threshold_is_configurable(self):
        result = assess_image_quality(sharp_document_bytes())
        self.assertEqual(result.status, STATUS_BLURRY)

    def test_degenerate_sizes_do_not_raise(self):
        """The 3x3 kernel must not blow up on images smaller than itself."""
        import io

        from PIL import Image

        for width, height in ((1, 1), (2, 2), (3, 3), (10000, 5), (1, 500)):
            buffer = io.BytesIO()
            Image.new("RGB", (width, height), "white").save(buffer, "PNG")
            result = assess_image_quality(buffer.getvalue())
            self.assertEqual(
                result.status, STATUS_TOO_SMALL, f"{width}x{height} should not be assessable"
            )

    def test_exotic_colour_modes_do_not_raise(self):
        import io

        from PIL import Image

        for mode, fmt in (("L", "PNG"), ("P", "PNG"), ("CMYK", "JPEG"), ("1", "PNG")):
            buffer = io.BytesIO()
            Image.new(mode, (300, 300), "white").save(buffer, fmt)
            result = assess_image_quality(buffer.getvalue())
            self.assertIn(result.status, (STATUS_OK, STATUS_BLURRY))
