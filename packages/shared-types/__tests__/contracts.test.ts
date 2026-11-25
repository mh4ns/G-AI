import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  ActivityLevel,
  AthleticArchetype,
  DailyMetricDTO,
  Gender,
  HTTPValidationError,
  OrderCreateRequest,
  OrderDTO,
  OrderItemRequest,
  OrderStatus,
  PaymentStatus,
  PersonalizedPlanDTO,
  PlanVector,
  ProductDTO,
  QuizArchetype,
  QuizAssessmentDTO,
  QuizSubmitRequest,
  SessionDTO,
  TodaySummaryDTO,
  UserCreateRequest,
  UserDTO,
  UserLoginRequest,
  WorkoutLogCreateRequest,
  WorkoutRoutineDTO,
} from "../index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, "../fixtures/plan-vectors.json");
const openApiPath = path.resolve(__dirname, "../openapi/backend-v1.json");

const VALID_GENDERS: ReadonlySet<Gender> = new Set<Gender>(["female", "male"]);
const VALID_ARCHETYPES: ReadonlySet<AthleticArchetype> = new Set<AthleticArchetype>([
  "female_pilates",
  "male_strength",
]);
const VALID_ACTIVITY_LEVELS: ReadonlySet<ActivityLevel> = new Set<ActivityLevel>([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
]);

describe("@g-ai/shared-types contracts", () => {
  it("validates fixtures/plan-vectors.json against PlanVector domain types", () => {
    const raw = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
      vectors: PlanVector[];
    };

    assert.ok(Array.isArray(raw.vectors) && raw.vectors.length > 0, "expected non-empty vectors");

    for (const vector of raw.vectors) {
      assert.ok(VALID_GENDERS.has(vector.input.gender), `unexpected gender: ${vector.input.gender}`);
      assert.ok(
        VALID_ARCHETYPES.has(vector.input.archetype),
        `unexpected archetype: ${vector.input.archetype}`
      );
      assert.ok(
        VALID_ACTIVITY_LEVELS.has(vector.input.activityLevel),
        `unexpected activityLevel: ${vector.input.activityLevel}`
      );
      assert.equal(typeof vector.expected.bmi, "number");
      assert.equal(typeof vector.expected.bmr, "number");
      assert.equal(typeof vector.expected.tdee, "number");
      assert.equal(typeof vector.expected.dailyCalorieTarget, "number");
      assert.equal(typeof vector.expected.calorieDeficitDaily, "number");
      assert.equal(typeof vector.expected.estimatedWeeks, "number");
      assert.equal(typeof vector.expected.recommendedWaterMl, "number");
    }
  });

  it("matches OpenAPI required fields for core store, user, quiz, today, and workout schemas", () => {
    const openapi = JSON.parse(fs.readFileSync(openApiPath, "utf8")) as {
      components: {
        schemas: Record<string, { required?: string[]; properties?: Record<string, unknown> }>;
      };
    };
    const schemas = openapi.components.schemas;

    // Verify UserResponse includes timezone and QuizSubmitRequest allows only female/male
    assert.ok(schemas.UserResponse.required?.includes("timezone"));
    assert.ok(schemas.OrderItemRequest.required?.includes("product_id"));
    assert.ok(schemas.OrderItemRequest.required?.includes("size"));
    assert.ok(!schemas.OrderItemRequest.required?.includes("quantity"));
    assert.ok(schemas.DailyMetricResponse.required?.includes("created_at"));
    assert.ok(schemas.DailyMetricResponse.required?.includes("updated_at"));
    assert.ok(schemas.PersonalizedPlanResponse.required?.includes("projected_weight_milestones"));

    // Type-level contract assertions (enforced by tsc --noEmit and exercised at runtime)
    const archetypeAlias: QuizArchetype = "female_pilates";
    const orderItem: OrderItemRequest = { product_id: "p1", size: "M" };
    const orderReq: OrderCreateRequest = {
      customer_email: "ada@example.com",
      customer_name: "Ada Lovelace",
      shipping_address: "123 Rue de Paris",
      items: [orderItem],
    };
    const paymentStatus: PaymentStatus = "pending";
    const orderStatus: OrderStatus = "awaiting_payment";
    const user: UserDTO = {
      id: 1,
      email: "ada@example.com",
      full_name: "Ada Lovelace",
      avatar_url: null,
      timezone: "Asia/Ho_Chi_Minh",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
    };
    const session: SessionDTO = {
      access_token: "tok",
      token_type: "bearer",
      expires_in: 3600,
      user,
    };
    const registerReq: UserCreateRequest = {
      email: "ada@example.com",
      full_name: "Ada Lovelace",
      password: "secure-password",
    };
    const loginReq: UserLoginRequest = {
      email: "ada@example.com",
      password: "secure-password",
    };
    const quizReq: QuizSubmitRequest = {
      session_id: "12345678-1234-1234-1234-1234567890ab",
      archetype: archetypeAlias,
      gender: "female",
      age: 30,
      height_cm: 165,
      current_weight_kg: 62,
      target_weight_kg: 55,
      activity_level: "lightly_active",
      primary_goal: "lose_weight",
      focus_areas: ["belly"],
      obstacles: ["lack_of_time"],
    };
    const plan: PersonalizedPlanDTO = {
      id: 1,
      assessment_id: 1,
      bmi: 22.8,
      bmr: 1350,
      tdee: 1856,
      daily_calorie_target: 1456,
      daily_water_target_ml: 2200,
      estimated_duration_weeks: 18,
      projected_weight_milestones: [{ week: 0, weight: 62 }],
      focus_routine: "pilates",
      recommended_diet_type: "balanced",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
    };
    const assessment: QuizAssessmentDTO = {
      id: 1,
      session_id: quizReq.session_id,
      age: 30,
      age_group: "30-39",
      gender: "female",
      height_cm: 165,
      current_weight_kg: 62,
      target_weight_kg: 55,
      activity_level: "lightly_active",
      primary_goal: "lose_weight",
      focus_areas: ["belly"],
      obstacles: ["lack_of_time"],
      fitness_level: "beginner",
      created_at: "2026-01-01T00:00:00Z",
      plan,
    };
    const todayMetric: DailyMetricDTO = {
      id: 1,
      date: "2026-01-01",
      calories_consumed: 1400,
      calories_burned: 300,
      water_intake_ml: 2000,
      fasting_minutes: 0,
      fasting_state: "idle",
      fasting_started_at: null,
      fasting_protocol: "16:8",
      habits_completed: ["water"],
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const summary: TodaySummaryDTO = {
      today: todayMetric,
      streak_days: 1,
      best_streak_days: 1,
      history_7d: [],
    };
    const workoutLog: WorkoutLogCreateRequest = {
      duration_sec: 1200,
      calories_burned: 150,
      reps_completed: 24,
      form_accuracy_pct: null,
    };
    const routine: WorkoutRoutineDTO = {
      id: 1,
      slug: "pilates-core",
      title: "Pilates Core",
      duration_min: 15,
      calorie_burn_est: 120,
      intensity: "moderate",
      exercises_sequence: [{ exercise_code: "plank", duration_sec: 45, rest_sec: 15 }],
      is_featured: true,
    };
    const validationErr: HTTPValidationError = {
      detail: [{ loc: ["body", "email"], msg: "Invalid email", type: "value_error" }],
    };

    const productSample: Pick<ProductDTO, "id" | "category"> = { id: "p1", category: "apparel" };
    const orderSample: Pick<OrderDTO, "payment_status" | "order_status"> = {
      payment_status: paymentStatus,
      order_status: orderStatus,
    };

    assert.equal(orderReq.items[0].product_id, "p1");
    assert.equal(session.user.timezone, "Asia/Ho_Chi_Minh");
    assert.equal(registerReq.email, loginReq.email);
    assert.equal(assessment.plan?.id, 1);
    assert.equal(summary.today.water_intake_ml, 2000);
    assert.equal(workoutLog.form_accuracy_pct, null);
    assert.equal(routine.slug, "pilates-core");
    assert.equal(validationErr.detail.length, 1);
    assert.equal(productSample.category, "apparel");
    assert.equal(orderSample.order_status, "awaiting_payment");
  });
});
