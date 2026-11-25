from datetime import datetime, timezone

from tests.conftest import bearer, register


async def test_nutrition_requires_auth(client):
    assert (await client.get("/api/v1/nutrition/foods")).status_code == 401
    assert (await client.get("/api/v1/nutrition/meals")).status_code == 401
    assert (await client.post("/api/v1/nutrition/foods", json={})).status_code == 401
    assert (await client.post("/api/v1/nutrition/meals", json={})).status_code == 401
    assert (await client.delete("/api/v1/nutrition/meals/1")).status_code == 401


async def test_search_curated_foods_vietnamese_diacritic_insensitive(client, curated_foods):
    me = await register(client, "pho@example.com")
    res = await client.get("/api/v1/nutrition/foods?q=pho", headers=bearer(me))
    assert res.status_code == 200, res.text
    items = res.json()
    assert any(item["name"] == "Phở bò tái" and item["source"] == "curated" for item in items)


async def test_custom_food_creation_duplicate_and_isolation(client):
    alice = await register(client, "alice-nutri@example.com")
    client.cookies.clear()
    bob = await register(client, "bob-nutri@example.com")
    client.cookies.clear()

    payload = {
        "name": "Sinh tố bơ chuối",
        "default_serving_g": 250,
        "calories_per_100g": 110,
        "protein_g_100g": 2.5,
        "carbs_g_100g": 14.0,
        "fat_g_100g": 5.0,
    }
    created = await client.post("/api/v1/nutrition/foods", json=payload, headers=bearer(alice))
    assert created.status_code == 201, created.text
    assert created.json()["canonical_name"] == "sinh to bo chuoi"
    assert created.json()["source"] == "user"

    # Duplicate canonical name for same user returns 409.
    dup = await client.post(
        "/api/v1/nutrition/foods",
        json={**payload, "name": "SINH TỐ BƠ  CHUỐI"},
        headers=bearer(alice),
    )
    assert dup.status_code == 409

    # Bob cannot see or log Alice's custom food.
    bob_search = await client.get("/api/v1/nutrition/foods?q=sinh to bo", headers=bearer(bob))
    assert bob_search.status_code == 200
    assert bob_search.json() == []

    bob_log = await client.post(
        "/api/v1/nutrition/meals",
        json={"food_item_id": created.json()["id"], "meal_type": "snack", "serving_grams": 200},
        headers=bearer(bob),
    )
    assert bob_log.status_code == 404


async def test_log_and_delete_meal_syncs_daily_metrics(client, curated_foods):
    me = await register(client, "meals@example.com")
    foods = (await client.get("/api/v1/nutrition/foods?q=pho", headers=bearer(me))).json()
    pho = next(item for item in foods if item["name"] == "Phở bò tái")

    logged_at = datetime(2026, 11, 20, 5, 0, tzinfo=timezone.utc).isoformat()
    log_res = await client.post(
        "/api/v1/nutrition/meals",
        json={
            "food_item_id": pho["id"],
            "meal_type": "lunch",
            "serving_grams": 400,
            "logged_at": logged_at,
        },
        headers=bearer(me),
    )
    assert log_res.status_code == 201, log_res.text
    meal = log_res.json()
    expected_kcal = round(pho["calories_per_100g"] * 4)
    assert meal["calories"] == expected_kcal
    assert meal["local_date"] == "2026-11-20"

    day_meals = await client.get("/api/v1/nutrition/meals?day=2026-11-20", headers=bearer(me))
    assert day_meals.status_code == 200
    body = day_meals.json()
    assert body["total_calories"] == expected_kcal
    assert len(body["meals"]) == 1

    # Verify DailyMetric updated on the meal's local_date when today matches or via deleting.
    # Add a meal for actual today so GET /today reflects it directly.
    today_log = await client.post(
        "/api/v1/nutrition/meals",
        json={"food_item_id": pho["id"], "meal_type": "dinner", "serving_grams": 200},
        headers=bearer(me),
    )
    assert today_log.status_code == 201
    today_meal = today_log.json()

    today_before = (await client.get("/api/v1/today", headers=bearer(me))).json()
    assert today_before["calories_consumed"] == today_meal["calories"]

    # Other user cannot delete my meal.
    client.cookies.clear()
    stranger = await register(client, "stranger-nutri@example.com")
    client.cookies.clear()
    forbidden = await client.delete(f"/api/v1/nutrition/meals/{today_meal['id']}", headers=bearer(stranger))
    assert forbidden.status_code == 404

    deleted = await client.delete(f"/api/v1/nutrition/meals/{today_meal['id']}", headers=bearer(me))
    assert deleted.status_code == 204

    today_after = (await client.get("/api/v1/today", headers=bearer(me))).json()
    assert today_after["calories_consumed"] == 0


async def test_search_foods_is_read_only_on_empty_db(client):
    from sqlalchemy import func, select

    from app.core.database import async_session_maker
    from app.models import FoodItem

    me = await register(client, "empty-foods@example.com")
    res = await client.get("/api/v1/nutrition/foods", headers=bearer(me))
    assert res.status_code == 200
    assert res.json() == []

    async with async_session_maker() as session:
        count = await session.scalar(select(func.count(FoodItem.id)))
    assert count == 0


async def test_sync_food_catalog_is_idempotent_and_updates_fields():
    from app.core.database import async_session_maker
    from app.services.nutrition import load_food_catalog, sync_food_catalog

    entries = load_food_catalog()
    async with async_session_maker() as session:
        first = await sync_food_catalog(session, entries)
        await session.commit()
        assert len(first["inserted"]) == len(entries)
        assert first["updated"] == []

        second = await sync_food_catalog(session, entries)
        await session.commit()
        assert second["inserted"] == []
        assert second["updated"] == []
        assert len(second["unchanged"]) == len(entries)

        modified = [dict(e) for e in entries]
        modified[0]["calories_per_100g"] = entries[0]["calories_per_100g"] + 15
        dropped = modified[:-1]
        third = await sync_food_catalog(session, dropped)
        await session.commit()
        assert len(third["updated"]) == 1
        assert len(third["deactivated"]) == 1
