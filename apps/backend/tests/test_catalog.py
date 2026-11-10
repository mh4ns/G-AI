import os
import re
import sqlite3
import subprocess
import sys
from pathlib import Path

from sqlalchemy import select

from app.core.database import async_session_maker
from app.models import Product
from app.services.catalog import CATALOG_PATH, load_catalog, sync_catalog

BACKEND = Path(__file__).resolve().parent.parent


async def _sync():
    async with async_session_maker() as session:
        report = await sync_catalog(session, load_catalog())
        await session.commit()
    return report


async def test_sync_inserts_then_is_idempotent(client):
    first = await _sync()
    assert first["inserted"] == [f"p{i}" for i in range(1, 9)]
    second = await _sync()
    assert second["inserted"] == second["updated"] == second["deactivated"] == []
    assert len(second["unchanged"]) == 8

    products = (await client.get("/api/v1/store/products")).json()
    assert [p["id"] for p in products] == [f"p{i}" for i in range(1, 9)]


async def test_sync_updates_fields_keeps_stock_and_retires_unknown(client, products):
    first = await _sync()
    assert first["deactivated"] == ["ga-test-01"]  # ga-test-02 was already inactive
    async with async_session_maker() as session:
        p1 = await session.get(Product, "p1")
        p1.stock_quantity = 7
        p1.price = 1.0
        p1.is_active = False
        await session.commit()

    report = await _sync()
    assert report["updated"] == ["p1"]
    assert report["deactivated"] == []

    async with async_session_maker() as session:
        p1 = await session.get(Product, "p1")
        assert (p1.price, p1.stock_quantity, p1.is_active) == (99.0, 7, True)
        legacy = await session.get(Product, "ga-test-01")
        assert legacy is not None and legacy.is_active is False


def test_catalog_file_is_valid():
    """app/data/store_catalog.json is the only source of truth; check what checkout depends on."""
    products = load_catalog()
    assert products, "catalog is empty"
    for p in products:
        assert re.fullmatch(r"[a-z0-9-]{1,50}", p["id"]), p["id"]
        assert p["price"] > 0 and (p["original_price"] is None or p["original_price"] > 0)
        assert p["sizes_available"] and all(isinstance(s, str) and 0 < len(s) <= 20 for s in p["sizes_available"])
        assert p["category"] in {"apparel", "equipment", "device", "supplement"}
        assert p["activity"] in {"pilates", "gym", "running", "lounge", "yoga"}
        assert p["image_front"].startswith("https://") and p["image_hover"].startswith("https://")
        assert isinstance(p["initial_stock"], int) and p["initial_stock"] >= 0


def test_migration_seeds_catalog_and_retires_demo_products(tmp_path):
    db = tmp_path / "migrate.db"
    env = {**os.environ, "DATABASE_URL": f"sqlite+aiosqlite:///{db}"}

    def alembic(*args):
        subprocess.run([sys.executable, "-m", "alembic", *args], cwd=BACKEND, env=env, check=True, capture_output=True)

    alembic("upgrade", "ae6bddef5c1d")
    with sqlite3.connect(db) as conn:
        conn.execute(
            "INSERT INTO products (id, name, subtitle, category, discipline, material, price, color_name, color_hex,"
            " rating, review_count, image_front, image_hover, sizes_available, stock_quantity, is_active)"
            " VALUES ('ga-sculpt-01', 'Old', 'Old', 'Apparel', 'd', 'm', 88, 'c', '#000', 4.9, 1, 'f', 'h', '[\"M\"]', 5, 1)"
        )
    alembic("upgrade", "head")
    with sqlite3.connect(db) as conn:
        conn.execute("UPDATE products SET stock_quantity = 3 WHERE id = 'p2'")
    alembic("downgrade", "5a2e7c91d4b0")
    alembic("upgrade", "head")  # re-running the data migration is safe

    with sqlite3.connect(db) as conn:
        rows = dict(conn.execute("SELECT id, is_active FROM products").fetchall())
        stock = conn.execute("SELECT stock_quantity FROM products WHERE id = 'p2'").fetchone()[0]
    assert rows.pop("ga-sculpt-01") == 0
    assert rows == {f"p{i}": 1 for i in range(1, 9)}
    assert stock == 3


def test_migration_snapshot_is_the_initial_catalog():
    frozen = BACKEND / "alembic" / "versions" / "c3f1a9d2b8e4_store_catalog_v1.json"
    assert {p["id"] for p in load_catalog(frozen)} <= {p["id"] for p in load_catalog(CATALOG_PATH)}
