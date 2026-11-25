import json
import unicodedata
from pathlib import Path
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.nutrition import FoodItem

_FOOD_CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "food_catalog.json"

_FOOD_SYNC_FIELDS = (
    "name",
    "canonical_name",
    "default_serving_g",
    "calories_per_100g",
    "protein_g_100g",
    "carbs_g_100g",
    "fat_g_100g",
)


def canonicalize_food_name(name: str) -> str:
    """Normalize Vietnamese/Unicode food names into lowercase ASCII with collapsed spaces."""
    replaced = name.replace("đ", "d").replace("Đ", "d")
    decomposed = unicodedata.normalize("NFKD", replaced)
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return " ".join(stripped.lower().split())


def load_food_catalog(path: Path = _FOOD_CATALOG_PATH) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = json.loads(path.read_text(encoding="utf-8"))
    canonicals = [canonicalize_food_name(entry["name"]) for entry in entries]
    if len(canonicals) != len(set(canonicals)):
        raise ValueError("Duplicate food canonical name in catalog")
    return entries


async def sync_food_catalog(db: AsyncSession, entries: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """Idempotently sync global curated foods (caller commits). Returns canonical names per action."""
    report: Dict[str, List[str]] = {"inserted": [], "updated": [], "unchanged": [], "deactivated": []}
    existing_rows = (
        await db.scalars(select(FoodItem).where(FoodItem.owner_user_id.is_(None)))
    ).all()
    by_canonical: Dict[str, FoodItem] = {}
    for row in existing_rows:
        prev = by_canonical.get(row.canonical_name)
        if prev is None or (row.is_active and not prev.is_active):
            by_canonical[row.canonical_name] = row

    wanted: set[str] = set()
    for entry in entries:
        canonical = canonicalize_food_name(entry["name"])
        wanted.add(canonical)
        values: Dict[str, Any] = {
            "name": entry["name"],
            "canonical_name": canonical,
            "default_serving_g": float(entry.get("default_serving_g", 100.0)),
            "calories_per_100g": int(entry["calories_per_100g"]),
            "protein_g_100g": float(entry["protein_g_100g"]),
            "carbs_g_100g": float(entry["carbs_g_100g"]),
            "fat_g_100g": float(entry["fat_g_100g"]),
        }
        food = by_canonical.get(canonical)
        if food is None:
            db.add(FoodItem(owner_user_id=None, source="curated", is_active=True, **values))
            report["inserted"].append(canonical)
            continue

        changed = not food.is_active
        for field in _FOOD_SYNC_FIELDS:
            if getattr(food, field) != values[field]:
                setattr(food, field, values[field])
                changed = True
        food.is_active = True
        report["updated" if changed else "unchanged"].append(canonical)

    for canonical, food in by_canonical.items():
        if canonical not in wanted and food.source == "curated" and food.is_active:
            food.is_active = False
            report["deactivated"].append(canonical)

    return report


def compute_meal_macros(food: FoodItem, serving_grams: float) -> dict[str, int | float]:
    """Scale a FoodItem's per-100g nutrition values to the given serving size in grams."""
    if serving_grams <= 0:
        raise ValueError("serving_grams must be positive")
    factor = serving_grams / 100.0
    return {
        "calories": round(food.calories_per_100g * factor),
        "protein_g": round(food.protein_g_100g * factor, 2),
        "carbs_g": round(food.carbs_g_100g * factor, 2),
        "fat_g": round(food.fat_g_100g * factor, 2),
    }
