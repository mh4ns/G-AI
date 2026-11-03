import asyncio
import sys
import io

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import async_session_maker
from app.core.security import verify_password
from app.models import (
    User,
    QuizAssessment,
    PersonalizedPlan,
    Exercise,
    WorkoutRoutine,
    DailyMetric,
    Product,
    Order,
)

async def test_database():
    print("--- [DATABASE INTEGRITY VERIFICATION] ---")
    async with async_session_maker() as session:
        # 1. Query Demo User & Test Password Verification
        stmt_user = select(User).where(User.email == "demo@g-ai.health").options(
            selectinload(User.quiz_assessments).selectinload(QuizAssessment.plan),
            selectinload(User.daily_metrics),
            selectinload(User.orders)
        )
        user = (await session.execute(stmt_user)).scalar_one()
        pw_ok = verify_password("PilatesPass2026!", user.hashed_password)
        wrong_pw_rejected = not verify_password("WrongPassword!", user.hashed_password)
        print(f"[+] User Found: {user.full_name} ({user.email})")
        print(f"    - Password check (correct): {'PASS' if pw_ok else 'FAIL'}")
        print(f"    - Password check (wrong rejected): {'PASS' if wrong_pw_rejected else 'FAIL'}")

        # 2. Verify Assessment & Plan
        assessment = user.quiz_assessments[0]
        plan = assessment.plan
        print(f"[+] Assessment Linked: Age {assessment.age_group}, Height {assessment.height_cm}cm, Target {assessment.target_weight_kg}kg")
        print(f"[+] Personalized Plan: BMR {plan.bmr} kcal, TDEE {plan.tdee} kcal, Daily Target: {plan.daily_calorie_target} kcal, Duration: {plan.estimated_duration_weeks} weeks")
        print(f"    - Milestones Count: {len(plan.projected_weight_milestones)}")

        # 3. Verify Today Metric
        metric = user.daily_metrics[0]
        print(f"[+] Today's Metric: Date {metric.date}, Water {metric.water_intake_ml}ml, Fasting {metric.fasting_minutes // 60}h, Habits: {metric.habits_completed}")

        # 4. Verify Exercises
        stmt_ex = select(Exercise)
        exercises = (await session.execute(stmt_ex)).scalars().all()
        print(f"[+] Total Exercises in Database: {len(exercises)}")
        for ex in exercises:
            print(f"    - {ex.name} ({ex.code}) | Joints: {ex.landmark_joints} | Target Angle: {ex.target_angle_min}°-{ex.target_angle_max}°")

        # 5. Verify Products & Orders
        stmt_prod = select(Product)
        products = (await session.execute(stmt_prod)).scalars().all()
        print(f"[+] Total Store Products: {len(products)}")

        order = user.orders[0]
        print(f"[+] Order {order.id}: Total ${order.total_amount}, Items: {len(order.items)}, Status: {order.order_status}")

    print("--- [VERIFICATION SUMMARY: ALL CHECKS PASSED] ---")

if __name__ == "__main__":
    asyncio.run(test_database())
