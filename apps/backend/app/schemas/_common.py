from datetime import datetime, timezone
from typing import Optional


def ensure_tz_aware(value: Optional[datetime]) -> Optional[datetime]:
    """Attach UTC to naive datetimes while preserving timezone-aware values and None."""
    if value is not None and (value.tzinfo is None or value.tzinfo.utcoffset(value) is None):
        return value.replace(tzinfo=timezone.utc)
    return value
