import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt

from app.core.config import settings

# OWASP 2023 guidance for PBKDF2-HMAC-SHA256.
PBKDF2_ITERATIONS = 600_000
_LEGACY_ITERATIONS = 100_000


def _derive(password: str, salt: bytes, iterations: int) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)


def hash_password(password: str) -> str:
    """
    PBKDF2-HMAC-SHA256 with a 16-byte random salt.
    Format: pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
    """
    salt = os.urandom(16)
    key = _derive(password, salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time verification. Also accepts the legacy `salt$hash` format (100k iterations)."""
    try:
        parts = hashed_password.split("$")
        if len(parts) == 4 and parts[0] == "pbkdf2_sha256":
            iterations, salt_hex, key_hex = int(parts[1]), parts[2], parts[3]
        elif len(parts) == 2:
            iterations, (salt_hex, key_hex) = _LEGACY_ITERATIONS, parts
        else:
            return False
        computed = _derive(plain_password, bytes.fromhex(salt_hex), iterations)
        return hmac.compare_digest(computed, bytes.fromhex(key_hex))
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str | int, expires_minutes: Optional[int] = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(subject), "iat": now, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """Returns the subject (user id) of a valid access token, or None."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError:
        return None
    if payload.get("type") != "access":
        return None
    return payload.get("sub")
