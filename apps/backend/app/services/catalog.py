"""
Store catalog sync: makes the `products` table match `app/data/store_catalog.json`.

Safe for production and idempotent:
- products in the file are inserted (with `initial_stock`) or updated in place; stock is never reset;
- products missing from the file are deactivated, never deleted (orders keep their line-item snapshots).

    python -m app.services.catalog            # apply
    python -m app.services.catalog --dry-run  # show what would change
"""

import argparse
import asyncio
import json
from pathlib import Path
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product

CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "store_catalog.json"

# Fields copied from the catalog file on every sync. Stock and activity state are managed separately.
CATALOG_FIELDS = (
    "name",
    "subtitle",
    "category",
    "subcategory",
    "activity",
    "description",
    "discipline",
    "material",
    "price",
    "original_price",
    "color_name",
    "color_hex",
    "rating",
    "review_count",
    "badge",
    "image_front",
    "image_hover",
    "sizes_available",
)


def load_catalog(path: Path = CATALOG_PATH) -> List[Dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    products = data["products"]
    ids = [p["id"] for p in products]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate product id in catalog")
    return products


async def sync_catalog(session: AsyncSession, products: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """Applies the catalog to the session (caller commits). Returns the ids per action."""
    report: Dict[str, List[str]] = {"inserted": [], "updated": [], "unchanged": [], "deactivated": []}
    existing = {p.id: p for p in (await session.scalars(select(Product))).all()}
    wanted_ids = set()

    for item in products:
        wanted_ids.add(item["id"])
        values = {field: item.get(field) for field in CATALOG_FIELDS}
        product = existing.get(item["id"])
        if product is None:
            session.add(Product(id=item["id"], stock_quantity=item.get("initial_stock", 0), is_active=True, **values))
            report["inserted"].append(item["id"])
            continue
        changed = not product.is_active
        for field, value in values.items():
            if getattr(product, field) != value:
                setattr(product, field, value)
                changed = True
        product.is_active = True
        report["updated" if changed else "unchanged"].append(item["id"])

    for pid, product in existing.items():
        if pid not in wanted_ids and product.is_active:
            product.is_active = False
            report["deactivated"].append(pid)
    return report


async def _main(dry_run: bool) -> None:
    from app.core.database import async_session_maker, engine

    try:
        async with async_session_maker() as session:
            report = await sync_catalog(session, load_catalog())
            if dry_run:
                await session.rollback()
            else:
                await session.commit()
    finally:
        await engine.dispose()
    for action, ids in report.items():
        print(f"{action:12} {len(ids):3}  {', '.join(ids)}")
    if dry_run:
        print("(dry run: nothing written)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true")
    asyncio.run(_main(parser.parse_args().dry_run))
