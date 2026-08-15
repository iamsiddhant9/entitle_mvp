"""Image quality assessment (variance of the Laplacian).

Why this is not a one-line PIL filter
-------------------------------------
Two properties of Pillow make the naive implementation meaningless, and both are handled
explicitly here:

1. ``ImageFilter.Kernel`` only supports ``L``/``RGB`` (no float mode), so the convolution
   output is clamped to 0..255. With the stock ``FIND_EDGES`` (``scale=1, offset=0``) every
   negative response collapses to 0 and strong edges saturate, which destroys the metric.
   Using ``scale=16, offset=128`` fixes this: the maximum possible response is
   ``8 * 255 = 2040`` and ``2040 / 16 = 127.5``, so the full signed range fits inside a
   uint8 centred on 128 **without clipping**. The variance is rescaled by ``16**2``
   afterwards to recover the true Laplacian variance.
2. Pillow **copies the outer one-pixel ring** from the source instead of filtering it, so
   a blank white page produces a bright border and a large, entirely artificial variance.
   That ring is cropped before any statistics are computed.

The image is **always** resized to a fixed longest side first — upscaled as well as
downscaled — because Laplacian variance scales with resolution. Downscaling alone is not
enough: a blurred 300x424 image measures 566 natively (above the threshold, so it would
pass) but 32 once normalised. Normalising in both directions is what makes one threshold
portable across a 300px scan and a 12MP phone photo.

Calibration
-----------
Measured with this exact implementation. A synthetic text document, sharp versus Gaussian
blur r=5 scaled proportionally, at each source resolution:

=============  ===============  ===============
Source size    Sharp            Blurred
=============  ===============  ===============
300 x 424               2,420             31.9
400 x 566               9,271             34.1
496 x 701              19,182             33.9
620 x 877              30,453             32.6
744 x 1052             38,811             33.4
992 x 1403             41,421             32.6
1240 x 1754            46,199             30.4
2480 x 3508            42,189             29.9
=============  ===============  ===============

Blank pages (white, black or grey) measure 0.0 at every size.

``DEFAULT_BLUR_THRESHOLD = 300`` sits between the two bands with roughly an 8x margin on
each side: the lowest sharp measurement is 2,420 (8.1x above) and the highest blurred one
is 34.1 (8.8x below). Mildly soft images are allowed through to extraction deliberately —
a failed extraction is now reported honestly, which is a better outcome than refusing a
document that might still be readable.

For contrast, the previous implementation scored a blank white page at 2473 against a
threshold of 20, i.e. it could never detect one. This implementation scores it 0.0.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass

from django.conf import settings
from PIL import Image, ImageFilter, ImageOps

from .preprocessing import to_grayscale

logger = logging.getLogger(__name__)

STATUS_OK = "ok"
STATUS_BLURRY = "blurry"
STATUS_TOO_SMALL = "too_small"
STATUS_UNKNOWN = "unknown"

QUALITY_STATUS_CHOICES = (
    (STATUS_OK, "Acceptable"),
    (STATUS_BLURRY, "Too blurry or blank to read"),
    (STATUS_TOO_SMALL, "Resolution too low to assess"),
    (STATUS_UNKNOWN, "Unable to assess"),
)

#: Longest side, in pixels, that every image is normalised to before measurement.
NORMALIZED_LONGEST_SIDE = 1024

#: Below this shorter-side length the metric is not meaningful. This is a *resolution*
#: defect, not blur: it is reported but never blocks extraction or confirmation.
MIN_ASSESSABLE_SIDE = 200

#: A 3x3 kernel needs at least one interior pixel in each axis to convolve anything. Below
#: this the filter output is entirely copied border, which would be measured as signal.
_MIN_CONVOLVABLE_SIDE = 3

#: Divisor that keeps the signed Laplacian response inside uint8 without clipping.
KERNEL_SCALE = 16

DEFAULT_BLUR_THRESHOLD = 300.0

_LAPLACIAN_KERNEL = ImageFilter.Kernel(
    (3, 3),
    (-1, -1, -1, -1, 8, -1, -1, -1, -1),
    scale=KERNEL_SCALE,
    offset=128,
)


@dataclass(frozen=True)
class QualityResult:
    status: str
    laplacian_variance: float | None
    width: int | None = None
    height: int | None = None

    @property
    def is_blurry(self) -> bool:
        """The API contract's boolean view of the four-state status."""
        return self.status == STATUS_BLURRY


def blur_threshold() -> float:
    return float(getattr(settings, "DOCUMENT_BLUR_THRESHOLD", DEFAULT_BLUR_THRESHOLD))


def normalise_for_measurement(image: Image.Image) -> Image.Image:
    """Upright, greyscale and scale ``image`` to the fixed measurement resolution."""
    grey = ImageOps.exif_transpose(image)
    grey = to_grayscale(grey)

    width, height = grey.size
    longest = max(width, height)
    if longest < 1:
        return grey
    # Always resize, in both directions: measuring a small image natively would apply the
    # threshold to a systematically higher score.
    ratio = NORMALIZED_LONGEST_SIDE / longest
    return grey.resize(
        (max(1, round(width * ratio)), max(1, round(height * ratio))),
        Image.LANCZOS,
    )


def laplacian_variance(image: Image.Image) -> float | None:
    """True variance of the Laplacian of ``image``, resolution-normalised.

    Returns None when the normalised image is too thin to convolve, since the filter
    output would then be entirely unfiltered border copied from the source.
    """
    grey = normalise_for_measurement(image)

    if min(grey.size) < _MIN_CONVOLVABLE_SIDE:
        return None

    filtered = grey.filter(_LAPLACIAN_KERNEL)

    # Drop the unfiltered border ring Pillow copies from the source.
    fw, fh = filtered.size
    filtered = filtered.crop((1, 1, fw - 1, fh - 1))

    # Exact for uint8 data: the histogram is a complete description of the pixel values.
    histogram = filtered.histogram()
    total = sum(histogram)
    if total == 0:
        return None
    mean = sum(value * count for value, count in enumerate(histogram)) / total
    variance = sum(((value - mean) ** 2) * count for value, count in enumerate(histogram)) / total
    return variance * (KERNEL_SCALE**2)


def assess_image_quality(data: bytes) -> QualityResult:
    """Assess an already-validated image's readability."""
    try:
        image = Image.open(io.BytesIO(data))
        image.load()
    except Exception:
        # Upload validation runs first, so this is genuinely unexpected. Report it as
        # unknown rather than silently claiming the image is fine.
        logger.warning("Quality assessment could not decode an already-validated image.")
        return QualityResult(status=STATUS_UNKNOWN, laplacian_variance=None)

    width, height = image.size

    try:
        variance = laplacian_variance(image)
    except Exception:
        logger.warning("Quality assessment failed during Laplacian computation.")
        return QualityResult(STATUS_UNKNOWN, None, width, height)

    # Too thin to convolve even after normalisation (an extreme aspect ratio), so there is
    # no measurement to judge — not a blur verdict.
    if variance is None:
        return QualityResult(STATUS_TOO_SMALL, None, width, height)

    if min(width, height) < MIN_ASSESSABLE_SIDE:
        return QualityResult(STATUS_TOO_SMALL, variance, width, height)

    status = STATUS_BLURRY if variance < blur_threshold() else STATUS_OK
    return QualityResult(status, variance, width, height)
