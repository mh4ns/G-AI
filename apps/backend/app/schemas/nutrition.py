from datetime import date, datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

FoodSource = Literal["curated", "user", "usda", "openfoodfacts"]
MealType = Literal["breakfast", "lunch", "dinner", "snack"]


class FoodItemCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    brand: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=64)
    default_serving_g: float = Field(100.0, gt=0.0, le=10000.0)
    calories_per_100g: int = Field(..., ge=0, le=10000)
    protein_g_100g: float = Field(0.0, ge=0.0, le=100.0)
    carbs_g_100g: float = Field(0.0, ge=0.0, le=100.0)
    fat_g_100g: float = Field(0.0, ge=0.0, le=100.0)


class FoodItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    canonical_name: str
    brand: Optional[str] = None
    barcode: Optional[str] = None
    source: str
    default_serving_g: float
    calories_per_100g: int
    protein_g_100g: float
    carbs_g_100g: float
    fat_g_100g: float
    is_active: bool
    created_at: datetime


class MealLogCreateRequest(BaseModel):
    food_item_id: int = Field(..., ge=1)
    meal_type: MealType = "lunch"
    serving_grams: float = Field(..., gt=0.0, le=10000.0)
    logged_at: Optional[datetime] = None

    @field_validator("logged_at")
    @classmethod
    def _ensure_tz_aware(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


class MealLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    food_item_id: Optional[int] = None
    meal_type: str
    food_name_snapshot: str
    serving_grams: float
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    local_date: date
    logged_at: datetime
    created_at: datetime
