import unicodedata

from app.models.nutrition import FoodItem


def canonicalize_food_name(name: str) -> str:
    """Normalize Vietnamese/Unicode food names into lowercase ASCII with collapsed spaces."""
    replaced = name.replace("đ", "d").replace("Đ", "d")
    decomposed = unicodedata.normalize("NFKD", replaced)
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return " ".join(stripped.lower().split())


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
