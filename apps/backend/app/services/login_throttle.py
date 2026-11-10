"""
Failed sign-in throttling, stored in the database so it holds across restarts and instances.

Three fixed-window counters are kept per attempt:
- email + IP (tight): stops guessing one account's password from one place;
- email (looser): stops spreading guesses for one account across many IPs;
- IP (loosest): stops one IP spraying many accounts.
When any counter reaches its limit, the key is locked for one window and login answers 429
with Retry-After, without checking the password. A successful login clears the email + IP counter only,
so an attacker cannot reset the other counters by signing into their own account.
"""

import hashlib
import hmac
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import AuthThrottle


@dataclass(frozen=True)
class ThrottleKey:
    key: str
    limit: int


def _digest(value: str) -> str:
    # Keyed hash: the table holds no plaintext emails/IPs and cannot be reversed by brute force offline.
    return hmac.new(settings.SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()[:40]


def login_keys(email: str, ip: str) -> List[ThrottleKey]:
    email = email.strip().lower()
    return [
        ThrottleKey(f"email_ip:{_digest(email + '|' + ip)}", settings.LOGIN_MAX_FAILURES_PER_EMAIL_IP),
        ThrottleKey(f"email:{_digest(email)}", settings.LOGIN_MAX_FAILURES_PER_EMAIL),
        ThrottleKey(f"ip:{_digest(ip)}", settings.LOGIN_MAX_FAILURES_PER_IP),
    ]


def password_change_keys(user_id: int) -> List[ThrottleKey]:
    return [ThrottleKey(f"pwchange:{user_id}", settings.LOGIN_MAX_FAILURES_PER_EMAIL_IP)]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: Optional[datetime]) -> Optional[datetime]:
    # SQLite returns naive datetimes even for timezone=True columns.
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


async def retry_after_seconds(db: AsyncSession, keys: List[ThrottleKey]) -> int:
    """Seconds until the caller may try again, or 0 if no key is locked."""
    now = _now()
    wait = 0
    for k in keys:
        row = await db.get(AuthThrottle, k.key)
        locked_until = _aware(row.locked_until) if row else None
        if locked_until and locked_until > now:
            wait = max(wait, int((locked_until - now).total_seconds()) + 1)
    return wait


async def record_failure(db: AsyncSession, keys: List[ThrottleKey]) -> None:
    """Counts one failure against every key (caller commits)."""
    now = _now()
    window = timedelta(seconds=settings.LOGIN_WINDOW_SECONDS)
    for k in keys:
        row = await db.get(AuthThrottle, k.key)
        if row is None:
            row = AuthThrottle(key=k.key, failures=0, window_started_at=now)
            db.add(row)
        elif _aware(row.window_started_at) + window <= now:
            row.failures, row.window_started_at, row.locked_until = 0, now, None
        row.failures += 1
        if row.failures >= k.limit:
            row.locked_until = now + window
    # Opportunistic cleanup keeps the table small without a scheduled job. Flush first (autoflush
    # is off) so rows reset above are not seen with their old window and deleted underneath us.
    await db.flush()
    await db.execute(
        delete(AuthThrottle)
        .where(AuthThrottle.window_started_at < now - 2 * window)
        .execution_options(synchronize_session=False)
    )


async def clear(db: AsyncSession, key: ThrottleKey) -> None:
    await db.execute(delete(AuthThrottle).where(AuthThrottle.key == key.key))
