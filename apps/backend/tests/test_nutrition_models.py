from datetime import date

import pytest
from pydantic import ValidationError
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models import FoodItem, MealLog, User
from app.schemas.nutrition import (
    FoodItemCreateRequest,
    FoodItemResponse,
    MealLogCreateRequest,
    MealLogResponse,
)
from app.services.nutrition import canonicalize_food_name, compute_meal_macros


def test_canonicalize_food_name_normalizes_vietnamese():
    assert canonicalize_food_name("Phở Bò  Tái ") == "pho bo tai"
    assert canonicalize_food_name("Đậu hũ sốt cà chua") == "dau hu sot ca chua"
    assert canonicalize_food_name("BÁNH MÌ   ĐẶC BIỆT") == "banh mi dac biet"
    assert canonicalize_food_name("   Cơm\tTấm\nSườn   ") == "com tam suon"
    assert canonicalize_food_name("   ") == ""


def test_compute_meal_macros():
    food = FoodItem(
        name="Phở bò tái",
        canonical_name="pho bo tai",
        calories_per_100g=120,
        protein_g_100g=8.5,
        carbs_g_100g=14.2,
        fat_g_100g=3.1,
    )
    macros = compute_meal_macros(food, 350.0)
    assert macros == {
        "calories": 420,
        "protein_g": 29.75,
        "carbs_g": 49.7,
        "fat_g": 10.85,
    }

    with pytest.raises(ValueError, match="serving_grams"):
        compute_meal_macros(food, 0.0)

    with pytest.raises(ValueError, match="serving_grams"):
        compute_meal_macros(food, -50.0)


async def test_global_and_user_food_dedup():
    async with async_session_maker() as session:
        alice = User(
            email="alice-food@example.com",
            hashed_password=hash_password("correct-horse-1"),
            full_name="Alice",
        )
        bob = User(
            email="bob-food@example.com",
            hashed_password=hash_password("correct-horse-1"),
            full_name="Bob",
        )
        session.add_all([alice, bob])
        await session.flush()

        # Global curated food item
        global_pho = FoodItem(
            owner_user_id=None,
            name="Phở bò tái",
            canonical_name=canonicalize_food_name("Phở bò tái"),
            barcode="8930001000011",
            source="curated",
            calories_per_100g=120,
            protein_g_100g=8.0,
            carbs_g_100g=15.0,
            fat_g_100g=3.0,
        )
        session.add(global_pho)
        await session.commit()

    # Duplicate active global canonical_name fails
    async with async_session_maker() as session:
        dup_global = FoodItem(
            owner_user_id=None,
            name="Pho bo tai",
            canonical_name="pho bo tai",
            source="curated",
            calories_per_100g=130,
        )
        session.add(dup_global)
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()

    # Duplicate global barcode fails
    async with async_session_maker() as session:
        dup_barcode = FoodItem(
            owner_user_id=None,
            name="Bún bò Huế",
            canonical_name="bun bo hue",
            barcode="8930001000011",
            source="openfoodfacts",
            calories_per_100g=140,
        )
        session.add(dup_barcode)
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()

    # Two different users can create items with the same canonical_name (even matching global)
    async with async_session_maker() as session:
        alice_id = await session.scalar(select(User.id).where(User.email == "alice-food@example.com"))
        bob_id = await session.scalar(select(User.id).where(User.email == "bob-food@example.com"))
        assert alice_id is not None and bob_id is not None

        session.add_all(
            [
                FoodItem(
                    owner_user_id=alice_id,
                    name="Phở bò tái nhà làm",
                    canonical_name="pho bo tai",
                    source="user",
                    calories_per_100g=110,
                ),
                FoodItem(
                    owner_user_id=bob_id,
                    name="Phở bò tái",
                    canonical_name="pho bo tai",
                    source="user",
                    calories_per_100g=125,
                ),
                # Soft-disabled global food with another canonical name should not block an active one
                FoodItem(
                    owner_user_id=None,
                    name="Cơm tấm cũ",
                    canonical_name="com tam",
                    source="curated",
                    calories_per_100g=180,
                    is_active=False,
                ),
                FoodItem(
                    owner_user_id=None,
                    name="Cơm tấm",
                    canonical_name="com tam",
                    source="curated",
                    calories_per_100g=190,
                    is_active=True,
                ),
            ]
        )
        await session.commit()

    # Duplicate active canonical_name for the SAME owner_user_id fails
    async with async_session_maker() as session:
        alice_id = await session.scalar(select(User.id).where(User.email == "alice-food@example.com"))
        session.add(
            FoodItem(
                owner_user_id=alice_id,
                name="Pho Bo Tai",
                canonical_name="pho bo tai",
                source="user",
                calories_per_100g=115,
            )
        )
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()


async def test_meal_log_survives_food_deletion_and_cascades_on_user_delete():
    async with async_session_maker() as session:
        user = User(
            email="meal-cascade@example.com",
            hashed_password=hash_password("correct-horse-1"),
            full_name="Meal User",
        )
        session.add(user)
        await session.flush()

        global_food = FoodItem(
            owner_user_id=None,
            name="Ức gà luộc",
            canonical_name="uc ga luoc",
            source="curated",
            calories_per_100g=165,
            protein_g_100g=31.0,
            carbs_g_100g=0.0,
            fat_g_100g=3.6,
        )
        custom_food = FoodItem(
            owner_user_id=user.id,
            name="Sinh tố bơ",
            canonical_name="sinh to bo",
            source="user",
            calories_per_100g=160,
            protein_g_100g=2.0,
            carbs_g_100g=8.5,
            fat_g_100g=14.7,
        )
        session.add_all([global_food, custom_food])
        await session.flush()

        macros = compute_meal_macros(custom_food, 200.0)
        meal = MealLog(
            user_id=user.id,
            food_item_id=custom_food.id,
            meal_type="snack",
            food_name_snapshot=custom_food.name,
            serving_grams=200.0,
            local_date=date(2026, 11, 12),
            **macros,
        )
        session.add(meal)
        await session.commit()

        user_id = user.id
        custom_food_id = custom_food.id
        global_food_id = global_food.id
        meal_id = meal.id

    # Deleting the FoodItem preserves MealLog snapshot with food_item_id = NULL
    async with async_session_maker() as session:
        await session.execute(delete(FoodItem).where(FoodItem.id == custom_food_id))
        await session.commit()

    async with async_session_maker() as session:
        preserved_meal = await session.scalar(select(MealLog).where(MealLog.id == meal_id))
        assert preserved_meal is not None
        assert preserved_meal.food_item_id is None
        assert preserved_meal.food_name_snapshot == "Sinh tố bơ"
        assert preserved_meal.calories == 320
        assert preserved_meal.protein_g == 4.0

        # Add another custom food item to also verify User deletion cascades to custom food_items & meal_logs
        second_custom = FoodItem(
            owner_user_id=user_id,
            name="Yến mạch",
            canonical_name="yen mach",
            source="user",
            calories_per_100g=389,
        )
        session.add(second_custom)
        await session.commit()
        second_custom_id = second_custom.id

    async with async_session_maker() as session:
        await session.execute(delete(User).where(User.id == user_id))
        await session.commit()

    async with async_session_maker() as session:
        assert await session.scalar(select(MealLog).where(MealLog.id == meal_id)) is None
        assert await session.scalar(select(FoodItem).where(FoodItem.id == second_custom_id)) is None
        assert await session.scalar(select(FoodItem).where(FoodItem.id == global_food_id)) is not None


def test_nutrition_schemas_validation_and_user_id_exclusion():
    food_req = FoodItemCreateRequest(
        name="Trứng gà luộc",
        calories_per_100g=155,
        protein_g_100g=13.0,
        carbs_g_100g=1.1,
        fat_g_100g=11.0,
        user_id=999,
        owner_user_id=999,
    )
    assert "user_id" not in food_req.model_dump()
    assert "owner_user_id" not in food_req.model_dump()

    meal_req = MealLogCreateRequest(
        food_item_id=1,
        meal_type="breakfast",
        serving_grams=120.0,
        user_id=999,
    )
    assert "user_id" not in meal_req.model_dump()

    with pytest.raises(ValidationError):
        FoodItemCreateRequest(name="Bad", calories_per_100g=-1)

    with pytest.raises(ValidationError):
        MealLogCreateRequest(food_item_id=1, meal_type="midnight", serving_grams=100.0)

    with pytest.raises(ValidationError):
        MealLogCreateRequest(food_item_id=1, meal_type="lunch", serving_grams=0.0)

    assert "user_id" not in MealLogResponse.model_fields
    assert "owner_user_id" not in FoodItemResponse.model_fields
