from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import select, update

from app.core.config import settings
from app.core.database import async_session_maker
from app.models import AuthThrottle
from tests.conftest import bearer, register

LOGIN = "/api/v1/auth/login"


async def _login(client, email="a@example.com", password="correct-horse-1", ip=None):
    headers = {"X-Forwarded-For": ip} if ip else {}
    return await client.post(LOGIN, json={"email": email, "password": password}, headers=headers)


async def test_login_locks_after_repeated_failures_with_retry_after(client):
    await register(client)
    for _ in range(settings.LOGIN_MAX_FAILURES_PER_EMAIL_IP):
        assert (await _login(client, password="wrong-pass")).status_code == 401
    locked = await _login(client, password="wrong-pass")
    assert locked.status_code == 429
    assert 0 < int(locked.headers["Retry-After"]) <= settings.LOGIN_WINDOW_SECONDS + 1
    # While locked, even the right password is refused: the lock gives no signal about guesses.
    assert (await _login(client)).status_code == 429


async def test_unknown_email_is_throttled_too(client):
    for _ in range(settings.LOGIN_MAX_FAILURES_PER_EMAIL_IP):
        assert (await _login(client, email="ghost@example.com")).status_code == 401
    assert (await _login(client, email="ghost@example.com")).status_code == 429


async def test_success_resets_email_ip_counter(client):
    await register(client)
    for _ in range(settings.LOGIN_MAX_FAILURES_PER_EMAIL_IP - 1):
        await _login(client, password="wrong-pass")
    assert (await _login(client)).status_code == 200
    for _ in range(settings.LOGIN_MAX_FAILURES_PER_EMAIL_IP - 1):
        assert (await _login(client, password="wrong-pass")).status_code == 401
    assert (await _login(client)).status_code == 200


async def test_lock_expires_after_window(client):
    await register(client)
    for _ in range(settings.LOGIN_MAX_FAILURES_PER_EMAIL_IP):
        await _login(client, password="wrong-pass")
    assert (await _login(client)).status_code == 429
    past = datetime.now(timezone.utc) - timedelta(seconds=settings.LOGIN_WINDOW_SECONDS + 5)
    async with async_session_maker() as session:
        await session.execute(update(AuthThrottle).values(window_started_at=past, locked_until=past))
        await session.commit()
    assert (await _login(client)).status_code == 200


async def test_throttle_is_per_ip_and_per_email(client, monkeypatch):
    monkeypatch.setattr(settings, "TRUSTED_PROXY_HOPS", 1)
    monkeypatch.setattr(settings, "LOGIN_MAX_FAILURES_PER_EMAIL", 8)
    await register(client)
    for _ in range(settings.LOGIN_MAX_FAILURES_PER_EMAIL_IP):
        await _login(client, password="wrong-pass", ip="203.0.113.1")
    assert (await _login(client, ip="203.0.113.1")).status_code == 429
    # Another IP is not locked by the email+IP counter...
    assert (await _login(client, ip="203.0.113.2")).status_code == 200
    # ...but guesses spread over many IPs still hit the per-email limit (5 + 3 = 8).
    for i in range(3):
        await _login(client, password="wrong-pass", ip=f"198.51.100.{i}")
    assert (await _login(client, ip="198.51.100.99")).status_code == 429


async def test_throttle_table_stores_no_plaintext(client):
    await _login(client, email="private@example.com", password="wrong-pass")
    async with async_session_maker() as session:
        keys = (await session.scalars(select(AuthThrottle.key))).all()
    assert len(keys) == 3
    assert all("private" not in k and "127.0.0.1" not in k for k in keys)


def test_client_ip_honours_only_trusted_hops(monkeypatch):
    from starlette.requests import Request

    from app.api.deps import client_ip

    def request(xff):
        headers = [(b"x-forwarded-for", xff.encode())] if xff else []
        return Request({"type": "http", "headers": headers, "client": ("10.0.0.9", 1234)})

    monkeypatch.setattr(settings, "TRUSTED_PROXY_HOPS", 0)
    assert client_ip(request("1.1.1.1")) == "10.0.0.9"  # header ignored when no proxy is trusted
    monkeypatch.setattr(settings, "TRUSTED_PROXY_HOPS", 2)
    # Spoofed entry first; Vercel added the real client, Render added Vercel's address.
    assert client_ip(request("6.6.6.6, 1.2.3.4, 76.76.21.1")) == "1.2.3.4"
    assert client_ip(request(None)) == "10.0.0.9"


async def test_logout_revokes_copied_token(client):
    token = await register(client)
    assert (await client.get("/api/v1/auth/me", headers=bearer(token))).status_code == 200
    assert (await client.post("/api/v1/auth/logout")).status_code == 204
    client.cookies.clear()
    assert (await client.get("/api/v1/auth/me", headers=bearer(token))).status_code == 401
    # Signing in again issues a working token.
    fresh = await _login(client)
    assert (await client.get("/api/v1/auth/me", headers=bearer(fresh.json()))).status_code == 200


async def test_change_password_revokes_other_sessions(client):
    first = await register(client)
    other_device = (await _login(client)).json()

    res = await client.post(
        "/api/v1/auth/password",
        json={"current_password": "correct-horse-1", "new_password": "brand-new-pass-2"},
        headers=bearer(first),
    )
    assert res.status_code == 200, res.text
    new_session = res.json()
    client.cookies.clear()

    assert (await client.get("/api/v1/auth/me", headers=bearer(first))).status_code == 401
    assert (await client.get("/api/v1/auth/me", headers=bearer(other_device))).status_code == 401
    assert (await client.get("/api/v1/auth/me", headers=bearer(new_session))).status_code == 200
    assert (await _login(client)).status_code == 401
    assert (await _login(client, password="brand-new-pass-2")).status_code == 200


async def test_change_password_validation_and_throttle(client):
    session = await register(client)
    client.cookies.clear()
    url = "/api/v1/auth/password"
    assert (await client.post(url, json={"current_password": "x", "new_password": "long-enough-1"})).status_code == 401
    same = {"current_password": "correct-horse-1", "new_password": "correct-horse-1"}
    assert (await client.post(url, json=same, headers=bearer(session))).status_code == 400
    short = {"current_password": "correct-horse-1", "new_password": "short"}
    assert (await client.post(url, json=short, headers=bearer(session))).status_code == 422

    wrong = {"current_password": "not-it", "new_password": "long-enough-1"}
    for _ in range(settings.LOGIN_MAX_FAILURES_PER_EMAIL_IP):
        assert (await client.post(url, json=wrong, headers=bearer(session))).status_code == 400
    locked = await client.post(url, json=wrong, headers=bearer(session))
    assert locked.status_code == 429 and "Retry-After" in locked.headers


async def test_tokens_without_version_claim_are_rejected(client):
    reg = await register(client)
    client.cookies.clear()
    legacy = jwt.encode(
        {"sub": str(reg["user"]["id"]), "type": "access", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    assert (await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {legacy}"})).status_code == 401
