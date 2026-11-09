"""
Database Initialization & Seed Script for G-AI
Creates all SQLite/PostgreSQL tables asynchronously and populates foundation data.
"""
import asyncio
import datetime
import sys
import io

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from sqlalchemy import select
from app.core.database import engine, Base, async_session_maker
from app.core.config import settings
from app.core.security import hash_password
from app.api.v1.endpoints.today import local_today
from app.services.plan_calculator import PlanInputs, calculate_plan
from app.models import (
    User,
    QuizAssessment,
    PersonalizedPlan,
    Exercise,
    WorkoutRoutine,
    WorkoutLog,
    DailyMetric,
    Product,
    Order,
)

async def init_and_seed():
    if settings.ENVIRONMENT == "production":
        raise SystemExit("Refusing to seed: this script DROPS ALL TABLES and creates a demo account.")
    print("[1/3] Creating all database tables asynchronously...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("[+] Tables created successfully.")

    print("[2/3] Seeding foundation dataset...")
    async with async_session_maker() as session:
        # 1. Demo User
        demo_user = User(
            email="demo@g-ai.health",
            hashed_password=hash_password("PilatesPass2026!"),
            full_name="Ngọc Hân",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            is_active=True,
            is_superuser=False,
        )
        session.add(demo_user)
        await session.flush()  # To get demo_user.id

        # 2. Foundation Exercises for AI PT Live Pose Detection
        exercises = [
            Exercise(
                code="pilates_squat",
                name="Deep Alignment Squat",
                category="Pilates Sculpt",
                primary_muscle="Quadriceps & Glutes",
                difficulty="beginner",
                description="Hạ hông xuống song song sàn, giữ lưng thẳng tự nhiên và đầu gối không vượt quá mũi chân.",
                instructions=[
                    "Đứng hai chân rộng bằng vai, mũi chân mở góc nhẹ 15 độ.",
                    "Hít sâu, siết cơ bụng dưới và hạ trọng tâm như đang ngồi vào ghế.",
                    "Giữ góc đầu gối ở khoảng 90 độ, đùi song song với mặt sàn.",
                    "Thở ra, ấn gót chân và đứng thẳng trở về vị trí ban đầu."
                ],
                landmark_joints=[23, 25, 27],  # MediaPipe Hip -> Knee -> Ankle
                target_angle_min=80.0,
                target_angle_max=100.0,
                thumbnail_url="https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80",
            ),
            Exercise(
                code="glute_bridge",
                name="Pelvic Glute Bridge",
                category="Pilates Core",
                primary_muscle="Glutes & Hamstrings",
                difficulty="beginner",
                description="Nằm ngửa nâng xương chậu từng đốt sống, kích hoạt chuỗi cơ sau và ổn định vùng thắt lưng.",
                instructions=[
                    "Nằm ngửa, co hai đầu gối, bàn chân đặt bằng phẳng cách hông một gang tay.",
                    "Hít vào chuẩn bị, siết cơ sàn chậu và cơ mông.",
                    "Thở ra và cuộn xương chậu nâng từng đốt sống rời khỏi sàn.",
                    "Giữ cơ thể thành một đường thẳng từ vai đến đầu gối trong 2 giây rồi hạ chậm."
                ],
                landmark_joints=[11, 23, 25],  # Shoulder -> Hip -> Knee
                target_angle_min=165.0,
                target_angle_max=180.0,
                thumbnail_url="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
            ),
            Exercise(
                code="wall_pushup",
                name="Isometric Wall Push-up",
                category="Upper Body Tone",
                primary_muscle="Pectorals & Triceps",
                difficulty="beginner",
                description="Chống tay lên tường với góc nghiêng an toàn, bảo vệ khớp cổ tay và khớp vai tối đa.",
                instructions=[
                    "Đứng cách tường một cánh tay, đặt hai lòng bàn tay ngang tầm vai.",
                    "Hít vào, gập khuỷu tay 45 độ đưa ngực lại gần tường.",
                    "Thở ra và dùng lực cơ ngực đẩy thẳng tay trở lại."
                ],
                landmark_joints=[11, 13, 15],  # Shoulder -> Elbow -> Wrist
                target_angle_min=85.0,
                target_angle_max=105.0,
                thumbnail_url="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80",
            ),
            Exercise(
                code="bird_dog",
                name="Quadruped Bird Dog",
                category="Core Stability",
                primary_muscle="Erector Spinae & Core",
                difficulty="intermediate",
                description="Tư thế bò 4 điểm, duỗi thẳng tay đối diện chân để rèn luyện độ cân bằng và chống xoay cột sống.",
                instructions=[
                    "Chống tay và đầu gối xuống thảm (cổ tay dưới vai, gối dưới hông).",
                    "Siết cơ bụng, từ từ duỗi tay phải về phía trước và chân trái ra sau.",
                    "Giữ cột sống trung tính không võng lưng trong 3 giây.",
                    "Đổi bên nhịp nhàng theo hơi thở."
                ],
                landmark_joints=[11, 23, 27],
                target_angle_min=170.0,
                target_angle_max=180.0,
                thumbnail_url="https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80",
            ),
        ]
        session.add_all(exercises)

        # 3. Workout Routine
        routine = WorkoutRoutine(
            slug="pilates-core-revive-day-1",
            title="Khởi Động & Đốt Mỡ Vùng Bụng 15 Phút",
            duration_min=15,
            calorie_burn_est=120,
            intensity="Low-Impact",
            exercises_sequence=[
                {"exercise_code": "glute_bridge", "reps": 15, "duration_sec": 180, "rest_sec": 30},
                {"exercise_code": "pilates_squat", "reps": 12, "duration_sec": 240, "rest_sec": 45},
                {"exercise_code": "bird_dog", "reps": 10, "duration_sec": 240, "rest_sec": 30},
                {"exercise_code": "wall_pushup", "reps": 15, "duration_sec": 180, "rest_sec": 30},
            ],
            is_featured=True,
        )
        session.add(routine)

        # 4. Assessment Quiz & 28-Day Plan for Demo User
        assessment = QuizAssessment(
            user_id=demo_user.id,
            session_id="session-demo-001",
            age=32,
            age_group="30-39",
            gender="female",
            height_cm=162.0,
            current_weight_kg=62.5,
            target_weight_kg=54.0,
            primary_goal="weight_loss",
            focus_areas=["core", "glutes", "lower_back"],
            obstacles=["lack_time", "desk_job"],
            fitness_level="beginner",
            activity_level="lightly_active",
        )
        session.add(assessment)
        await session.flush()

        metrics = calculate_plan(
            PlanInputs(
                is_male=False,
                age=assessment.age,
                height_cm=assessment.height_cm,
                current_weight_kg=assessment.current_weight_kg,
                target_weight_kg=assessment.target_weight_kg,
                activity_level=assessment.activity_level,
            )
        )
        plan = PersonalizedPlan(
            assessment_id=assessment.id,
            user_id=demo_user.id,
            bmi=metrics.bmi,
            bmr=metrics.bmr,
            tdee=metrics.tdee,
            daily_calorie_target=metrics.daily_calorie_target,
            daily_water_target_ml=metrics.daily_water_target_ml,
            estimated_duration_weeks=metrics.estimated_weeks,
            projected_weight_milestones=metrics.projected_milestones,
            focus_routine="Pilates Core & Posture",
            recommended_diet_type="Balanced, protein-forward whole foods",
            is_active=True,
        )
        session.add(plan)

        # 5. Today's Metric for Demo User
        today = local_today()
        daily_metric = DailyMetric(
            user_id=demo_user.id,
            date=today,
            calories_consumed=1350,
            calories_burned=320,
            water_intake_ml=1250,
            fasting_minutes=840,  # 14 hours
            fasting_state="fasting",
            habits_completed=["morning_stretch", "vitamins", "posture_alignment"],
            notes="Hoàn thành bài tập 15 phút buổi sáng với AI PT form accuracy 94.5%.",
        )
        session.add(daily_metric)

        # 6. E-Commerce Store Products (Matching apps/web/src/data/mockStoreData.ts)
        store_products = [
            Product(
                id="ga-sculpt-01",
                name="Sculpt-Fit Compression Bodysuit",
                subtitle="Ultralight matte compression knit with ergonomic lumbar posture guide.",
                category="Apparel",
                discipline="Reformer Pilates",
                material="82% Recycled Polyamide, 18% Elastane",
                price=88.0,
                original_price=110.0,
                color_name="Obsidian Black",
                color_hex="#1A1817",
                rating=4.9,
                review_count=142,
                badge="Best Seller",
                image_front="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
                image_hover="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
                sizes_available=["XS", "S", "M", "L", "XL"],
                stock_quantity=150,
                is_active=True,
            ),
            Product(
                id="ga-sculpt-02",
                name="Ribbed High-Waist Movement Legging",
                subtitle="Double-bonded high waistband with zero slip during inversion sets.",
                category="Apparel",
                discipline="Mat Sculpt",
                material="78% Regenerated Nylon, 22% Lycra",
                price=72.0,
                original_price=90.0,
                color_name="Stone Ecru",
                color_hex="#E8E2D9",
                rating=4.8,
                review_count=98,
                badge="New Colorway",
                image_front="https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80",
                image_hover="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
                sizes_available=["XS", "S", "M", "L"],
                stock_quantity=80,
                is_active=True,
            ),
            Product(
                id="ga-sculpt-03",
                name="Seamless Asymmetrical Longline Bra",
                subtitle="Medium-compression support with ventilating open-scapula design.",
                category="Apparel",
                discipline="Barre & Stretch",
                material="80% MicroModal, 20% Spandex",
                price=54.0,
                original_price=None,
                color_name="Terracotta",
                color_hex="#C85A32",
                rating=4.9,
                review_count=64,
                badge=None,
                image_front="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
                image_hover="https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=800&q=80",
                sizes_available=["XS", "S", "M", "L"],
                stock_quantity=110,
                is_active=True,
            ),
            Product(
                id="ga-apparatus-01",
                name="Studio Foldable Mini Reformer",
                subtitle="Aerospace-grade aluminum rail with 4 dual-rate silicone springs.",
                category="Apparatus",
                discipline="Reformer Pilates",
                material="Anodized Aluminum & Natural Rubber",
                price=640.0,
                original_price=750.0,
                color_name="Brushed Silver / Ecru",
                color_hex="#D4D0C8",
                rating=5.0,
                review_count=41,
                badge="Signature Gear",
                image_front="https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80",
                image_hover="https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=800&q=80",
                sizes_available=["One Size"],
                stock_quantity=25,
                is_active=True,
            ),
            Product(
                id="ga-apparatus-02",
                name="Biometric Alignment Mat (8mm)",
                subtitle="Laser-etched trajectory guides engineered for webcam AI posture tracking.",
                category="Apparatus",
                discipline="Mat Sculpt",
                material="100% Tree-Tapped Natural Rubber",
                price=95.0,
                original_price=115.0,
                color_name="Basalt Grey",
                color_hex="#3A3836",
                rating=4.9,
                review_count=215,
                badge="AI Optimized",
                image_front="https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80",
                image_hover="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
                sizes_available=["Standard (183x68cm)"],
                stock_quantity=300,
                is_active=True,
            ),
            Product(
                id="ga-apparatus-03",
                name="Calibrated Resistance Ring",
                subtitle="Dual-grip fiberglass core calibrated for adductor and pelvic floor tone.",
                category="Apparatus",
                discipline="Pilates Ring",
                material="Spring Steel Core, EVA Molded Foam",
                price=42.0,
                original_price=None,
                color_name="Deep Olive",
                color_hex="#4A4E44",
                rating=4.7,
                review_count=77,
                badge=None,
                image_front="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
                image_hover="https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
                sizes_available=["14 inch (35cm)"],
                stock_quantity=200,
                is_active=True,
            ),
        ]
        session.add_all(store_products)

        # 7. Demo Order
        sample_order = Order(
            id="ORD-20261103-001",
            user_id=demo_user.id,
            customer_email="demo@g-ai.health",
            customer_name="Ngọc Hân",
            total_amount=160.0,
            shipping_address="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
            payment_status="pending",
            order_status="awaiting_payment",
            items=[
                {
                    "product_id": "ga-sculpt-01",
                    "name": "Sculpt-Fit Compression Bodysuit",
                    "size": "S",
                    "unit_price": 88.0,
                    "quantity": 1,
                    "image": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
                },
                {
                    "product_id": "ga-sculpt-02",
                    "name": "Ribbed High-Waist Movement Legging",
                    "size": "M",
                    "unit_price": 72.0,
                    "quantity": 1,
                    "image": "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80",
                }
            ],
        )
        session.add(sample_order)

        await session.commit()
    print("[3/3] Database seed complete! All tables initialized and verified.")

if __name__ == "__main__":
    asyncio.run(init_and_seed())
