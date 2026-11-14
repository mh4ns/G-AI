import math
import re
from typing import Optional

PROGRESS_PHOTOS_BUCKET = "progress-photos"

_ALLOWED_PHOTO_EXTENSIONS = ("webp", "jpeg", "jpg", "png")
_PHOTO_TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")

# Upper exclusive bounds for ACE body fat percentage categories before "obese".
_ACE_THRESHOLDS: dict[str, tuple[tuple[float, str], ...]] = {
    "male": (
        (6.0, "essential"),
        (14.0, "athlete"),
        (18.0, "fitness"),
        (25.0, "average"),
    ),
    "female": (
        (14.0, "essential"),
        (21.0, "athlete"),
        (25.0, "fitness"),
        (32.0, "average"),
    ),
}


def _classify_ace_body_fat(gender: str, body_fat_pct: float) -> str:
    for upper_bound, category in _ACE_THRESHOLDS[gender]:
        if body_fat_pct < upper_bound:
            return category
    return "obese"


def calculate_us_navy_body_fat(
    gender: str,
    height_cm: float,
    neck_cm: float,
    waist_cm: float,
    hip_cm: Optional[float] = None,
) -> tuple[float, str]:
    """Calculate US Navy metric body fat percentage (rounded to 1 decimal) and ACE category."""
    normalized_gender = gender.strip().lower()
    if normalized_gender not in _ACE_THRESHOLDS:
        raise ValueError("gender must be 'male' or 'female'")

    if height_cm <= 0 or neck_cm <= 0 or waist_cm <= 0:
        raise ValueError("height_cm, neck_cm, and waist_cm must be positive")

    if normalized_gender == "male":
        if waist_cm <= neck_cm:
            raise ValueError("waist_cm must be greater than neck_cm for male")
        denominator = (
            1.0324
            - 0.19077 * math.log10(waist_cm - neck_cm)
            + 0.15456 * math.log10(height_cm)
        )
    else:
        if hip_cm is None or hip_cm <= 0:
            raise ValueError("hip_cm must be provided and positive for female")
        if waist_cm + hip_cm <= neck_cm:
            raise ValueError("waist_cm + hip_cm must be greater than neck_cm for female")
        denominator = (
            1.29579
            - 0.35004 * math.log10(waist_cm + hip_cm - neck_cm)
            + 0.22100 * math.log10(height_cm)
        )

    if denominator <= 0:
        raise ValueError("Invalid anthropometric geometry for US Navy formula")

    raw_pct = 495.0 / denominator - 450.0
    clamped_pct = round(min(75.0, max(2.0, raw_pct)), 1)
    category = _classify_ace_body_fat(normalized_gender, clamped_pct)
    return clamped_pct, category


def build_progress_photo_path(user_id: int, photo_uuid: str, ext: str) -> str:
    """Build a PII-free Supabase Storage object path for a user's progress photo."""
    if isinstance(user_id, bool) or not isinstance(user_id, int) or user_id <= 0:
        raise ValueError("user_id must be a positive integer")

    if not isinstance(photo_uuid, str) or not _PHOTO_TOKEN_RE.fullmatch(photo_uuid):
        raise ValueError("photo_uuid must be a clean alphanumeric/hyphen/underscore token")

    normalized_ext = ext.strip().lower() if isinstance(ext, str) else ""
    if normalized_ext not in _ALLOWED_PHOTO_EXTENSIONS:
        raise ValueError(f"ext must be one of {_ALLOWED_PHOTO_EXTENSIONS}")

    return f"users/{user_id}/{photo_uuid}.{normalized_ext}"
