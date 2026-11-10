import os
import tempfile

# Configure an isolated database before the app (and its engine) is imported.
_DB_FILE = os.path.join(tempfile.mkdtemp(prefix="g_ai_test_"), "test.db")
# TEST_DATABASE_URL runs the suite against another database, e.g. a throwaway local Postgres.
# Every test drops and recreates all tables there, so never point it at real data.
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL") or f"sqlite+aiosqlite:///{_DB_FILE}"
os.environ["ENVIRONMENT"] = "test"
os.environ["AUTO_CREATE_SCHEMA"] = "false"

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.core.database import Base, async_session_maker, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Product  # noqa: E402


@pytest.fixture(autouse=True)
async def fresh_schema():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Connections are bound to the per-test event loop; drop them between tests.
    await engine.dispose()


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def products():
    async with async_session_maker() as session:
        session.add_all(
            [
                Product(
                    id="ga-test-01",
                    name="Test Legging",
                    subtitle="Sub",
                    category="Apparel",
                    price=72.5,
                    image_front="https://example.com/f.jpg",
                    image_hover="https://example.com/h.jpg",
                    sizes_available=["S", "M"],
                    stock_quantity=3,
                ),
                Product(
                    id="ga-test-02",
                    name="Retired Item",
                    subtitle="Sub",
                    category="Apparel",
                    price=10.0,
                    image_front="https://example.com/f.jpg",
                    image_hover="https://example.com/h.jpg",
                    sizes_available=["M"],
                    stock_quantity=10,
                    is_active=False,
                ),
            ]
        )
        await session.commit()


async def register(client: AsyncClient, email: str = "a@example.com", password: str = "correct-horse-1") -> dict:
    res = await client.post(
        "/api/v1/auth/register", json={"email": email, "full_name": "Test User", "password": password}
    )
    assert res.status_code == 201, res.text
    return res.json()


def bearer(token_response: dict) -> dict:
    return {"Authorization": f"Bearer {token_response['access_token']}"}
