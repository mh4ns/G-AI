from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings
from app.core.security import hash_password, verify_password
from tests.conftest import bearer, register


async def test_register_login_me_flow(client):
    reg = await register(client, "Mixed@Example.com")
    assert reg["user"]["email"] == "mixed@example.com"
    assert "hashed_password" not in reg["user"]

    login = await client.post("/api/v1/auth/login", json={"email": "MIXED@example.com", "password": "correct-horse-1"})
    assert login.status_code == 200
    assert settings.AUTH_COOKIE_NAME in login.cookies

    me = await client.get("/api/v1/auth/me", headers=bearer(login.json()))
    assert me.status_code == 200
    assert me.json()["email"] == "mixed@example.com"


async def test_cookie_session_authenticates(client):
    await register(client)
    # httpx keeps the Set-Cookie from register; no Authorization header is sent.
    me = await client.get("/api/v1/auth/me")
    assert me.status_code == 200


async def test_duplicate_email_rejected(client):
    await register(client, "dup@example.com")
    res = await client.post(
        "/api/v1/auth/register", json={"email": "DUP@example.com", "full_name": "Other", "password": "another-pass-1"}
    )
    assert res.status_code == 409


async def test_wrong_password_and_unknown_email_look_identical(client):
    await register(client, "real@example.com")
    wrong = await client.post("/api/v1/auth/login", json={"email": "real@example.com", "password": "nope-nope-1"})
    unknown = await client.post("/api/v1/auth/login", json={"email": "ghost@example.com", "password": "nope-nope-1"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


async def test_rejects_missing_tampered_and_expired_tokens(client):
    assert (await client.get("/api/v1/auth/me")).status_code == 401

    forged = jwt.encode({"sub": "1", "type": "access", "exp": 9999999999}, "attacker-controlled-secret-that-is-long-enough!!", algorithm="HS256")
    res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {forged}"})
    assert res.status_code == 401

    reg = await register(client)
    client.cookies.clear()
    expired = jwt.encode(
        {"sub": str(reg["user"]["id"]), "type": "access", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired}"})
    assert res.status_code == 401


async def test_logout_clears_cookie(client):
    await register(client)
    res = await client.post("/api/v1/auth/logout")
    assert res.status_code == 204
    assert (await client.get("/api/v1/auth/me")).status_code == 401


def test_password_hash_roundtrip_and_legacy_format():
    hashed = hash_password("s3cret-pass")
    assert hashed.startswith("pbkdf2_sha256$600000$")
    assert verify_password("s3cret-pass", hashed)
    assert not verify_password("wrong", hashed)

    # Hashes written before this change: salt_hex$hash_hex with 100k iterations.
    import hashlib

    salt = bytes(16)
    legacy = f"{salt.hex()}${hashlib.pbkdf2_hmac('sha256', b'old-pass', salt, 100_000).hex()}"
    assert verify_password("old-pass", legacy)
    assert not verify_password("anything", "garbage")
