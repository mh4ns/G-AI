"""
Request throttling, stored in the database so it holds across restarts and instances.

Three fixed-window counters are kept per login attempt:
- email + IP (tight): stops guessing one account's password from one place;
- email (looser): stops spreading guesses for one account across many IPs;
- IP (loosest): stops one IP spraying many accounts.
When any counter reaches its limit, the key is locked for one window and login answers 429
with Retry-After, without checking the password. A successful login clears the email + IP counter only,
so an attacker cannot reset the other counters by signing into their own account.

Store order attempts reuse the same fixed-window counter table with `order_*` prefixes.
"""

import hashlib
import hmac
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
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


def order_keys(email: str, ip: str, user_id: Optional[int] = None) -> List[ThrottleKey]:
    email = email.strip().lower()
    keys = [
        ThrottleKey(f"order_ip:{_digest(ip)}", settings.ORDER_MAX_ATTEMPTS_PER_IP),
        ThrottleKey(f"order_email:{_digest(email)}", settings.ORDER_MAX_ATTEMPTS_PER_EMAIL),
    ]
    if user_id is not None:
        keys.append(ThrottleKey(f"order_user:{user_id}", settings.ORDER_MAX_ATTEMPTS_PER_EMAIL))
    return keys


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


def _bump_row(row: AuthThrottle, k: ThrottleKey, now: datetime, window: timedelta) -> None:
    if _aware(row.window_started_at) + window <= now:
        row.failures, row.window_started_at, row.locked_until = 0, now, None
    row.failures += 1
    if row.failures >= k.limit:
        row.locked_until = now + window


async def record_attempt(db: AsyncSession, keys: List[ThrottleKey], *, window_seconds: int) -> None:
    """Counts one attempt against every key using savepoints on insert (caller commits)."""
    now = _now()
    window = timedelta(seconds=window_seconds)
    for k in keys:
        row = await db.get(AuthThrottle, k.key)
        if row is None:
            try:
                async with db.begin_nested():
                    row = AuthThrottle(
                        key=k.key,
                        failures=1,
                        window_started_at=now,
                        locked_until=(now + window if 1 >= k.limit else None),
                    )
                    db.add(row)
                    await db.flush()
            except IntegrityError:
                row = await db.get(AuthThrottle, k.key)
                if row is not None:
                    _bump_row(row, k, now, window)
        else:
            _bump_row(row, k, now, window)
    # Opportunistic cleanup keeps the table small without a scheduled job. Flush first (autoflush
    # is off) so rows reset above are not seen with their old window and deleted underneath us.
    await db.flush()
    await db.execute(
        delete(AuthThrottle)
        .where(AuthThrottle.window_started_at < now - 2 * window)
        .execution_options(synchronize_session=False)
    )


async def record_failure(db: AsyncSession, keys: List[ThrottleKey]) -> None:
    """Counts one failure against every key (caller commits)."""
    await record_attempt(db, keys, window_seconds=settings.LOGIN_WINDOW_SECONDS)


async def clear(db: AsyncSession, key: ThrottleKey) -> None:
    await db.execute(delete(AuthThrottle).where(AuthThrottle.key == key.key))
