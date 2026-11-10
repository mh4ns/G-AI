"""store catalog v1: the website's catalog (p1..p8) becomes the source of truth

Data-only and idempotent: inserts missing products, refreshes descriptive fields of existing ones
without touching their stock, and deactivates (never deletes) products that are not in the catalog,
such as the old `ga-*` demo seed. The data is frozen in the JSON file next to this migration;
later catalog edits go through `python -m app.services.catalog`, not by editing this file.

Revision ID: c3f1a9d2b8e4
Revises: 5a2e7c91d4b0
Create Date: 2026-11-10 15:20:00

"""
import json
from pathlib import Path
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3f1a9d2b8e4"
down_revision: Union[str, Sequence[str], None] = "5a2e7c91d4b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DATA_FILE = Path(__file__).with_name("c3f1a9d2b8e4_store_catalog_v1.json")
_FIELDS = (
    "name", "subtitle", "category", "subcategory", "activity", "description", "discipline", "material",
    "price", "original_price", "color_name", "color_hex", "rating", "review_count", "badge",
    "image_front", "image_hover", "sizes_available",
)

_TYPES = {
    "price": sa.Float,
    "original_price": sa.Float,
    "rating": sa.Float,
    "review_count": sa.Integer,
    "sizes_available": sa.JSON,
}

products = sa.table(
    "products",
    sa.column("id", sa.String),
    *(sa.column(f, _TYPES.get(f, sa.String)) for f in _FIELDS),
    sa.column("stock_quantity", sa.Integer),
    sa.column("is_active", sa.Boolean),
)


def _catalog():
    return json.loads(_DATA_FILE.read_text(encoding="utf-8"))["products"]


def upgrade() -> None:
    bind = op.get_bind()
    catalog = _catalog()
    ids = [p["id"] for p in catalog]
    existing = {row.id for row in bind.execute(sa.select(products.c.id))}

    for item in catalog:
        values = {f: item.get(f) for f in _FIELDS}
        if item["id"] in existing:
            bind.execute(products.update().where(products.c.id == item["id"]).values(is_active=True, **values))
        else:
            bind.execute(
                products.insert().values(
                    id=item["id"],
                    stock_quantity=item["initial_stock"],
                    is_active=True,
                    **values,
                )
            )

    bind.execute(products.update().where(products.c.id.not_in(ids)).values(is_active=False))


def downgrade() -> None:
    # Data is not deleted on downgrade (orders may reference it); the catalog rows are only hidden.
    bind = op.get_bind()
    ids = [p["id"] for p in _catalog()]
    bind.execute(products.update().where(products.c.id.in_(ids)).values(is_active=False))
