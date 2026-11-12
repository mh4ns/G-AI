import pytest
from pydantic import ValidationError

from app.core.config import INSECURE_DEV_SECRET, Settings


def test_production_rejects_default_secret():
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(ENVIRONMENT="production", SECRET_KEY=INSECURE_DEV_SECRET, AUTO_CREATE_SCHEMA=False, AUTH_COOKIE_SECURE=True)


def test_production_requires_migrations_and_secure_cookie():
    strong = "x" * 48
    with pytest.raises(ValidationError, match="AUTO_CREATE_SCHEMA"):
        Settings(ENVIRONMENT="production", SECRET_KEY=strong, AUTO_CREATE_SCHEMA=True, AUTH_COOKIE_SECURE=True)
    with pytest.raises(ValidationError, match="AUTH_COOKIE_SECURE"):
        Settings(ENVIRONMENT="production", SECRET_KEY=strong, AUTO_CREATE_SCHEMA=False, AUTH_COOKIE_SECURE=False)
    Settings(ENVIRONMENT="production", SECRET_KEY=strong, AUTO_CREATE_SCHEMA=False, AUTH_COOKIE_SECURE=True)


def test_cors_origins_accept_comma_separated_env(monkeypatch):
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://a.example, https://b.example")
    assert Settings().BACKEND_CORS_ORIGINS == ["https://a.example", "https://b.example"]
