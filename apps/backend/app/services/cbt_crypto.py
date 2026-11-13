import base64
import binascii
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_KEY_BYTES = 32
_NONCE_BYTES = 12
_TAG_BYTES = 16


def _decode_aes256_key(key_b64: str) -> bytes:
    if not isinstance(key_b64, str) or not key_b64.strip():
        raise ValueError("CBT encryption key must be a non-empty base64 string")
    raw = key_b64.strip()
    try:
        key = base64.urlsafe_b64decode(raw.encode("ascii"))
    except (binascii.Error, ValueError, UnicodeEncodeError) as exc:
        raise ValueError("CBT encryption key is not valid urlsafe base64") from exc
    if len(key) != _KEY_BYTES:
        raise ValueError(f"CBT encryption key must decode to {_KEY_BYTES} bytes, got {len(key)}")
    return key


def generate_cbt_key() -> str:
    """Return a newly generated 256-bit key encoded as urlsafe base64."""
    return base64.urlsafe_b64encode(os.urandom(_KEY_BYTES)).decode("ascii")


def encrypt_cbt_content(
    plaintext: str,
    key_b64: str,
    key_version: int = 1,
    *,
    aad: bytes = b"",
) -> tuple[bytes, int]:
    """Encrypt CBT message plaintext with AES-256-GCM.

    Returns `(nonce || ciphertext || tag, key_version)`.
    """
    if key_version < 1:
        raise ValueError("key_version must be >= 1")
    key = _decode_aes256_key(key_b64)
    nonce = os.urandom(_NONCE_BYTES)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), aad)
    return nonce + ciphertext, key_version


def decrypt_cbt_content(
    ciphertext: bytes,
    keys_by_version: dict[int, str],
    key_version: int,
    *,
    aad: bytes = b"",
) -> str:
    """Decrypt a CBT message blob produced by `encrypt_cbt_content`."""
    if key_version not in keys_by_version:
        raise ValueError(f"Missing CBT encryption key for key_version={key_version}")
    if not isinstance(ciphertext, (bytes, bytearray)) or len(ciphertext) < _NONCE_BYTES + _TAG_BYTES:
        raise ValueError("Invalid CBT ciphertext payload")

    key = _decode_aes256_key(keys_by_version[key_version])
    blob = bytes(ciphertext)
    nonce, encrypted = blob[:_NONCE_BYTES], blob[_NONCE_BYTES:]
    try:
        plaintext_bytes = AESGCM(key).decrypt(nonce, encrypted, aad)
    except InvalidTag as exc:
        raise ValueError("Failed to authenticate or decrypt CBT ciphertext") from exc

    try:
        return plaintext_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError("Decrypted CBT content is not valid UTF-8") from exc


def retention_cutoff(now: Optional[datetime] = None, days: int = 90) -> datetime:
    """Return the UTC cutoff timestamp for purging expired CBT messages."""
    if days < 0:
        raise ValueError("days must be >= 0")
    if now is None:
        anchor = datetime.now(timezone.utc)
    elif now.tzinfo is None:
        anchor = now.replace(tzinfo=timezone.utc)
    else:
        anchor = now.astimezone(timezone.utc)
    return anchor - timedelta(days=days)
