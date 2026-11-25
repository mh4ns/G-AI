import datetime
from typing import List, Optional

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import DailyMetric, FoodItem, MealLog, User
from app.schemas.nutrition import (
    FoodItemCreateRequest,
    FoodItemResponse,
    MealLogCreateRequest,
    MealLogDayResponse,
    MealLogResponse,
)
from app.services import daily_metrics
from app.services.nutrition import canonicalize_food_name, compute_meal_macros

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])


@router.get("/foods", response_model=List[FoodItemResponse])
async def search_foods(
    q: str = Query("", max_length=120),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Search active curated and user-owned foods with diacritic-insensitive matching."""
    capped_limit = min(max(limit, 1), 50)
    stmt = select(FoodItem).where(
        FoodItem.is_active.is_(True),
        or_(FoodItem.owner_user_id.is_(None), FoodItem.owner_user_id == user.id),
    )
    canonical_q = canonicalize_food_name(q)
    if canonical_q:
        stmt = stmt.where(FoodItem.canonical_name.contains(canonical_q))

    stmt = stmt.order_by(
        sa.case((FoodItem.owner_user_id.isnot(None), 0), else_=1),
        FoodItem.name.asc(),
    ).limit(capped_limit)
    return list((await db.scalars(stmt)).all())


@router.post("/foods", response_model=FoodItemResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_food(
    payload: FoodItemCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a custom food owned by the current user."""
    cleaned_name = payload.name.strip()
    canonical = canonicalize_food_name(cleaned_name)
    if not canonical:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tên món ăn không hợp lệ.",
        )

    food = FoodItem(
        owner_user_id=user.id,
        name=cleaned_name,
        canonical_name=canonical,
        brand=payload.brand.strip() if payload.brand else None,
        barcode=payload.barcode.strip() if payload.barcode else None,
        source="user",
        default_serving_g=payload.default_serving_g,
        calories_per_100g=payload.calories_per_100g,
        protein_g_100g=payload.protein_g_100g,
        carbs_g_100g=payload.carbs_g_100g,
        fat_g_100g=payload.fat_g_100g,
        is_active=True,
    )
    db.add(food)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Món ăn này đã tồn tại trong danh sách của bạn.",
        )
    await db.refresh(food)
    return food


@router.get("/meals", response_model=MealLogDayResponse)
async def get_meals_for_day(
    day: Optional[datetime.date] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List meal logs and macro totals for a given local date (defaults to today)."""
    target_day = day or daily_metrics.local_today(user.timezone)
    stmt = (
        select(MealLog)
        .where(MealLog.user_id == user.id, MealLog.local_date == target_day)
        .order_by(MealLog.logged_at.asc(), MealLog.id.asc())
    )
    meals = list((await db.scalars(stmt)).all())
    return MealLogDayResponse(
        date=target_day,
        total_calories=sum(m.calories for m in meals),
        total_protein_g=round(sum(m.protein_g for m in meals), 2),
        total_carbs_g=round(sum(m.carbs_g for m in meals), 2),
        total_fat_g=round(sum(m.fat_g for m in meals), 2),
        meals=meals,
    )


@router.post("/meals", response_model=MealLogResponse, status_code=status.HTTP_201_CREATED)
async def log_meal(
    payload: MealLogCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Log a meal entry and increment DailyMetric.calories_consumed for its local date."""
    food = await db.scalar(
        select(FoodItem).where(
            FoodItem.id == payload.food_item_id,
            FoodItem.is_active.is_(True),
            or_(FoodItem.owner_user_id.is_(None), FoodItem.owner_user_id == user.id),
        )
    )
    if food is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy món ăn.")

    macros = compute_meal_macros(food, payload.serving_grams)
    logged_at = payload.logged_at or daily_metrics.now_utc()
    meal_date = daily_metrics.local_date_for(logged_at, user.timezone)

    meal = MealLog(
        user_id=user.id,
        food_item_id=food.id,
        meal_type=payload.meal_type,
        food_name_snapshot=food.name,
        serving_grams=payload.serving_grams,
        calories=int(macros["calories"]),
        protein_g=float(macros["protein_g"]),
        carbs_g=float(macros["carbs_g"]),
        fat_g=float(macros["fat_g"]),
        local_date=meal_date,
        logged_at=logged_at,
    )
    db.add(meal)

    metric = await daily_metrics.get_or_create_metric_for_date(db, user.id, meal_date)
    daily_metrics.apply_calories_consumed(metric, meal.calories)

    await db.commit()
    await db.refresh(meal)
    return meal


@router.delete("/meals/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal(
    meal_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a user's meal log and subtract its calories from DailyMetric."""
    meal = await db.scalar(
        select(MealLog).where(MealLog.id == meal_id, MealLog.user_id == user.id)
    )
    if meal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhật ký bữa ăn.")

    metric = await db.scalar(
        select(DailyMetric).where(
            DailyMetric.user_id == user.id, DailyMetric.date == meal.local_date
        )
    )
    if metric is not None:
        daily_metrics.apply_calories_consumed(metric, -meal.calories)

    await db.delete(meal)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
