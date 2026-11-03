import asyncio
import sys
import io

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from httpx import AsyncClient, ASGITransport
from app.main import app

async def run_api_tests():
    print("--- [STARTING FASTAPI + DATABASE API INTEGRATION TESTS] ---")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/healthz")
        assert res.status_code == 200
        print("[+] GET /healthz =>", res.json())

        # 2. Store Products List
        res = await client.get("/api/v1/store/products")
        assert res.status_code == 200
        products = res.json()
        print(f"[+] GET /api/v1/store/products => {len(products)} products found.")
        assert len(products) >= 6

        # 3. Store Order Creation
        order_payload = {
            "customer_email": "test@g-ai.health",
            "customer_name": "Minh Test",
            "shipping_address": "789 Le Duan, Da Nang",
            "items": [
                {
                    "product_id": "ga-sculpt-01",
                    "name": "Sculpt-Fit Compression Bodysuit",
                    "size": "M",
                    "price": 88.0,
                    "quantity": 1,
                    "image": "https://images.unsplash.com/photo-1518611012118-696072aa579a"
                }
            ]
        }
        res = await client.post("/api/v1/store/orders", json=order_payload)
        assert res.status_code == 201
        order = res.json()
        print(f"[+] POST /api/v1/store/orders => Order {order['id']} created with total ${order['total_amount']}")

        # 4. Exercises List
        res = await client.get("/api/v1/workouts/exercises")
        assert res.status_code == 200
        exercises = res.json()
        print(f"[+] GET /api/v1/workouts/exercises => {len(exercises)} exercises loaded with pose landmarks.")

        # 5. Quiz Submit & Biometric Plan Generation (UC-1.1 & UC-1.2)
        quiz_payload = {
            "session_id": "client-test-session-999",
            "age_group": "18-29",
            "gender": "female",
            "height_cm": 165.0,
            "current_weight_kg": 58.0,
            "target_weight_kg": 52.0,
            "primary_goal": "weight_loss",
            "focus_areas": ["core", "glutes"],
            "obstacles": ["lack_time"],
            "fitness_level": "beginner"
        }
        res = await client.post("/api/v1/quiz/submit", json=quiz_payload)
        assert res.status_code == 201
        quiz_res = res.json()
        plan = quiz_res["plan"]
        print(f"[+] POST /api/v1/quiz/submit => Assessment ID: {quiz_res['id']}")
        print(f"    - BMI: {plan['bmi']}, BMR: {plan['bmr']} kcal, Daily Calorie: {plan['daily_calorie_target']} kcal")
        print(f"    - Milestones: {len(plan['projected_weight_milestones'])} milestone check-ins generated.")

        # 6. Today Metric & Water Increment
        # Demo user ID is 1
        res = await client.get("/api/v1/today/1")
        assert res.status_code == 200
        metric = res.json()
        current_water = metric["water_intake_ml"]
        print(f"[+] GET /api/v1/today/1 => Current water: {current_water}ml")

        res = await client.post("/api/v1/today/water", json={"user_id": 1, "amount_ml": 250})
        assert res.status_code == 200
        updated_metric = res.json()
        assert updated_metric["water_intake_ml"] == current_water + 250
        print(f"[+] POST /api/v1/today/water (+250ml) => Updated water: {updated_metric['water_intake_ml']}ml")

    print("--- [ALL API INTEGRATION TESTS COMPLETED SUCCESSFULLY!] ---")

if __name__ == "__main__":
    asyncio.run(run_api_tests())
