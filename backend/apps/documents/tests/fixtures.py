"""Shared test fixtures for the documents pipeline.

TEST-ONLY. Nothing in this module is importable from application code, and none of the
sample field values here are ever used as a production fallback — the pipeline returns
empty fields plus a failure status when extraction does not succeed.
"""

from __future__ import annotations

import functools
import io
import shutil
import tempfile
from types import SimpleNamespace

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from rest_framework.test import APIClient


class DocumentTestCase(TestCase):
    """Base case that isolates media storage and disables live Gemini calls.

    Without the MEDIA_ROOT override, uploads in tests are written into the real
    ``backend/media/`` directory and left behind. Without the empty GEMINI_API_KEY, a
    developer with a real key in their environment would make the suite hit the network.
    """

    @classmethod
    def setUpClass(cls):
        cls._media_root = tempfile.mkdtemp(prefix="entitle-test-media-")
        cls._settings_override = override_settings(
            MEDIA_ROOT=cls._media_root,
            GEMINI_API_KEY="",
        )
        cls._settings_override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._settings_override.disable()
        shutil.rmtree(cls._media_root, ignore_errors=True)

    def setUp(self):
        self.client = APIClient()


# --- Synthetic images ----------------------------------------------------------------


@functools.lru_cache(maxsize=8)
def _document_image(width: int = 1240, height: int = 1754) -> Image.Image:
    """An A4-ish page of dense black text, standing in for a scanned certificate."""
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    try:
        body = ImageFont.load_default(size=28)
        heading = ImageFont.load_default(size=44)
    except TypeError:  # older Pillow without the size argument
        body = heading = ImageFont.load_default()

    draw.rectangle([40, 40, width - 40, height - 40], outline="black", width=3)
    draw.text((80, 90), "GOVERNMENT OF INDIA", font=heading, fill="black")
    draw.text((80, 150), "INCOME CERTIFICATE", font=heading, fill="black")

    lines = [
        "Certificate No: MH/2026/TEH/0098421",
        "Name: Rekha Devi Sharma",
        "Father / Husband Name: Ramesh Sharma",
        "Address: 14, Shivaji Nagar, Pune, Maharashtra 411005",
        "Annual Income: Rs. 1,50,000 (One Lakh Fifty Thousand Only)",
        "Issued By: Tehsildar Office, Pune",
        "Valid Until: 31/03/2027",
    ]
    y = 240
    for _ in range(6):
        for line in lines:
            draw.text((80, y), line, font=body, fill="black")
            y += 42
        y += 20
    return image


def _to_bytes(image: Image.Image, fmt: str = "JPEG", **kwargs) -> bytes:
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, fmt, **kwargs)
    return buffer.getvalue()


def sharp_document_bytes(fmt: str = "JPEG") -> bytes:
    """A readable document image. Measures ~58,000 variance of the Laplacian."""
    return _to_bytes(_document_image(), fmt)


def blurred_document_bytes() -> bytes:
    """The same document under Gaussian blur r=5. Measures ~39 — decisively unreadable."""
    return _to_bytes(_document_image().filter(ImageFilter.GaussianBlur(5)))


def blank_image_bytes(width: int = 100, height: int = 100) -> bytes:
    """A blank white image, as used by the original test suite."""
    return _to_bytes(Image.new("RGB", (width, height), "white"))


def large_blank_bytes(width: int = 1240, height: int = 1754) -> bytes:
    """A blank page big enough to be assessed: unreadable, so it must flag as blurry."""
    return _to_bytes(Image.new("RGB", (width, height), "white"))


def png_bytes() -> bytes:
    return _to_bytes(_document_image(), "PNG")


def webp_bytes() -> bytes:
    return _to_bytes(_document_image(), "WEBP")


def corrupt_image_bytes() -> bytes:
    """A valid JPEG header followed by garbage."""
    return b"\xff\xd8\xff\xe0" + b"\x00" * 64


def not_an_image_bytes() -> bytes:
    return b"this is definitely not an image file"


def fake_pdf_bytes() -> bytes:
    return b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n%%EOF\n"


def upload_file(data: bytes, name: str = "document.jpg", content_type: str = "image/jpeg"):
    return SimpleUploadedFile(name, data, content_type=content_type)


# --- Fake Gemini responses -----------------------------------------------------------


class FakeResponse:
    """Mimics the parts of ``GenerateContentResponse`` the extractor reads."""

    def __init__(self, *, parsed=None, text=None, block_reason=None, finish_reason=None):
        self.parsed = parsed
        self.text = text
        self.prompt_feedback = SimpleNamespace(block_reason=block_reason)
        self.candidates = [SimpleNamespace(finish_reason=finish_reason)]


class FakeResponseNoCandidates:
    def __init__(self):
        self.parsed = None
        self.text = None
        self.prompt_feedback = SimpleNamespace(block_reason=None)
        self.candidates = []


#: Sample model output. TEST-ONLY — never a production fallback.
SAMPLE_AADHAAR_PAYLOAD = {
    "name": "Rekha Devi Sharma",
    "aadhaar_no": "4321 8765 2109",
    "dob": "12/07/1988",
    "gender": "Female",
    "state": "Maharashtra",
}

SAMPLE_INCOME_PAYLOAD = {
    "name": "Rekha Devi Sharma",
    "annual_income": "Rs. 1,50,000 (One Lakh Fifty Thousand Only)",
    "issued_by": "Tehsildar Office, Pune",
    "valid_until": "31/03/2027",
    "state": "Maharashtra",
}

SAMPLE_LAND_PAYLOAD = {
    "owner_name": "Rekha Devi Sharma",
    "khasra_no": "778/3",
    "area_acres": "1.8 acres",
    "district": "Pune",
    "state": "Maharashtra",
}

#: The exact fabricated values the old implementation returned on failure. Tests assert
#: these never appear, so a regression that reintroduces a fallback is caught.
LEGACY_FABRICATED_VALUES = (
    "Citizen User",
    "XXXX-XXXX-1234",
    "1990-01-01",
    "452/12",
    "Tehsildar Office",
    "2027-03-31",
    "150000",
    "BPL",
)
