import os
import hashlib
import hmac
from typing import Tuple

def hash_password(password: str) -> str:
    """
    Secure password hashing using PBKDF2-HMAC-SHA256 with 100,000 iterations and a 16-byte random salt.
    Format: salt_hex$hash_hex
    """
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100_000
    )
    return f"{salt.hex()}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored PBKDF2 hash using constant-time comparison.
    """
    try:
        salt_hex, key_hex = hashed_password.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        computed_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            100_000
        )
        return hmac.compare_digest(computed_key, expected_key)
    except Exception:
        return False
