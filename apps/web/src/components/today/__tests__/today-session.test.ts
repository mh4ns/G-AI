import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ApiError, type ApiDailyMetric, type ApiMealLog, type ApiTodaySummary, type ApiUser } from "@/lib/api-client";
import { DEFAULT_SAMPLE_PLAN } from "@/lib/quiz-calculations";
import { buildPlaceholderHistory7d } from "../StreakBadge";
import {
  bootstrapTodaySession,
  createMutationQueue,
  ensureHabitCompleted,
  performAddWater,
  performFinishWorkout,
  removeMealById,
  type TodayPort,
} from "../today-port";

function makeMetric(overrides: Partial<ApiDailyMetric> = {}): ApiDailyMetric {
  return {
    id: 1,
    date: "2026-11-25",
    calories_consumed: 0,
    calories_burned: 0,
    water_intake_ml: 0,
    fasting_minutes: 0,
    fasting_state: "idle",
    fasting_started_at: null,
    fasting_protocol: "16:8",
    habits_completed: [],
    notes: null,
    created_at: "2026-11-25T00:00:00Z",
    updated_at: "2026-11-25T00:00:00Z",
    ...overrides,
  };
}

function makeFakePort(opts?: {
  user?: ApiUser | null;
  sessionError?: unknown;
  localPlan?: typeof DEFAULT_SAMPLE_PLAN | null;
  serverPlan?: typeof DEFAULT_SAMPLE_PLAN | null;
  initialMetric?: ApiDailyMetric;
}) {
  let metric = opts?.initialMetric ? { ...opts.initialMetric, habits_completed: [...opts.initialMetric.habits_completed] } : makeMetric();
  let workoutLogCalls = 0;
  const toggleCalls: string[] = [];

  const port: TodayPort = {
    async getSessionUser() {
      if (opts?.sessionError) throw opts.sessionError;
      return opts?.user ?? null;
    },
    loadLocalPlan() {
      return opts?.localPlan ?? null;
    },
    async loadServerPlan() {
      return opts?.serverPlan ?? null;
    },
    async getTodaySummary(): Promise<ApiTodaySummary> {
      return {
        today: metric,
        streak_days: 1,
        best_streak_days: 3,
        history_7d: [],
      };
    },
    async getTodayMetric() {
      await new Promise((r) => setTimeout(r, 5));
      return { ...metric, habits_completed: [...metric.habits_completed] };
    },
    async getMeals() {
      return {
        date: "2026-11-25",
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        meals: [],
      };
    },
    async addWater(amountMl) {
      metric = { ...metric, water_intake_ml: metric.water_intake_ml + amountMl };
      return { ...metric, habits_completed: [...metric.habits_completed] };
    },
    async toggleHabit(habitKey) {
      toggleCalls.push(habitKey);
      const exists = metric.habits_completed.includes(habitKey);
      metric = {
        ...metric,
        habits_completed: exists
          ? metric.habits_completed.filter((k) => k !== habitKey)
          : [...metric.habits_completed, habitKey],
      };
      return { ...metric, habits_completed: [...metric.habits_completed] };
    },
    async updateFasting(payload) {
      metric = {
        ...metric,
        fasting_state: payload.fasting_state,
        fasting_protocol: payload.fasting_protocol,
        fasting_started_at: payload.fasting_started_at ?? null,
        fasting_minutes: payload.fasting_minutes ?? metric.fasting_minutes,
      };
      return { ...metric, habits_completed: [...metric.habits_completed] };
    },
    async logWorkout(payload) {
      workoutLogCalls++;
      metric = { ...metric, calories_burned: metric.calories_burned + payload.calories_burned };
      return { id: workoutLogCalls };
    },
  };

  return {
    port,
    getMetric: () => metric,
    getWorkoutLogCalls: () => workoutLogCalls,
    getToggleCalls: () => toggleCalls,
  };
}

describe("today-port workout & water habit idempotency", () => {
  it("ensureHabitCompleted marks workout once and never flips ON -> OFF on repeat", async () => {
    const { port, getToggleCalls } = makeFakePort({
      initialMetric: makeMetric({ habits_completed: [] }),
    });

    const first = await ensureHabitCompleted(port, "workout");
    assert.equal(first.habits_completed.includes("workout"), true);
    assert.deepEqual(getToggleCalls(), ["workout"]);

    const second = await ensureHabitCompleted(port, "workout");
    assert.equal(second.habits_completed.includes("workout"), true);
    assert.deepEqual(getToggleCalls(), ["workout"]);
  });

  it("serializes concurrent performFinishWorkout calls so toggleHabit('workout') runs at most once", async () => {
    const { port, getWorkoutLogCalls, getToggleCalls, getMetric } = makeFakePort();
    const queue = createMutationQueue();
    const summary = {
      caloriesBurned: 80,
      averageFormScore: 90,
      durationMinutes: 10,
      repsCompleted: 30,
    };

    const [m1, m2] = await Promise.all([
      performFinishWorkout(port, queue, summary),
      performFinishWorkout(port, queue, summary),
    ]);

    assert.equal(getWorkoutLogCalls(), 2);
    assert.deepEqual(getToggleCalls(), ["workout"]);
    assert.equal(m1.habits_completed.includes("workout"), true);
    assert.equal(m2.habits_completed.includes("workout"), true);
    assert.equal(getMetric().calories_burned, 160);
  });

  it("performAddWater completes 'water' habit once upon reaching target and never toggles it off", async () => {
    const { port, getToggleCalls, getMetric } = makeFakePort({
      initialMetric: makeMetric({ water_intake_ml: 1850 }),
    });
    const queue = createMutationQueue();

    const m1 = await performAddWater(port, queue, 2100, 250);
    assert.equal(m1.water_intake_ml, 2100);
    assert.equal(m1.habits_completed.includes("water"), true);

    const m2 = await performAddWater(port, queue, 2100, 250);
    assert.equal(m2.water_intake_ml, 2350);
    assert.equal(m2.habits_completed.includes("water"), true);
    assert.deepEqual(getToggleCalls(), ["water"]);
    assert.equal(getMetric().habits_completed.includes("water"), true);
  });
});

describe("bootstrapTodaySession", () => {
  const sampleUser: ApiUser = {
    id: 7,
    email: "user@example.com",
    full_name: "Test User",
    avatar_url: null,
    timezone: "Asia/Ho_Chi_Minh",
    is_active: true,
    created_at: "2026-11-25T00:00:00Z",
  };

  it("returns guest mode with DEFAULT_SAMPLE_PLAN (2100 ml) when unauthenticated", async () => {
    const { port } = makeFakePort({ user: null });
    const res = await bootstrapTodaySession(port);

    assert.equal(res.sessionStatus, "guest");
    assert.equal(res.sessionUser, null);
    assert.equal(res.hasCustomPlan, false);
    assert.equal(res.plan.recommendedWaterMl, 2100);
    assert.equal(res.syncError, null);
  });

  it("surfaces error status (not guest banner) when getSessionUser rejects with 5xx", async () => {
    const { port } = makeFakePort({
      sessionError: new ApiError(503, "Service Unavailable"),
    });
    const res = await bootstrapTodaySession(port);

    assert.equal(res.sessionStatus, "error");
    assert.equal(res.sessionUser, null);
    assert.ok(res.syncError && res.syncError.length > 0);
  });

  it("loads server plan for signed-in users without a local plan, and keeps DEFAULT_SAMPLE_PLAN on 404", async () => {
    const serverPlan = { ...DEFAULT_SAMPLE_PLAN, recommendedWaterMl: 2400 };
    const withServerPlan = makeFakePort({ user: sampleUser, serverPlan });
    const resWithPlan = await bootstrapTodaySession(withServerPlan.port);
    assert.equal(resWithPlan.sessionStatus, "authenticated");
    assert.equal(resWithPlan.hasCustomPlan, true);
    assert.equal(resWithPlan.plan.recommendedWaterMl, 2400);

    const newAccount = makeFakePort({ user: sampleUser, serverPlan: null });
    const resNewAccount = await bootstrapTodaySession(newAccount.port);
    assert.equal(resNewAccount.sessionStatus, "authenticated");
    assert.equal(resNewAccount.hasCustomPlan, false);
    assert.equal(resNewAccount.plan.recommendedWaterMl, 2100);
  });
});

describe("buildPlaceholderHistory7d", () => {
  it("builds 7 deterministic YYYY-MM-DD entries ending on the provided date", () => {
    const fixed = new Date(2026, 10, 25, 14, 30, 0);
    const history = buildPlaceholderHistory7d(fixed);
    assert.equal(history.length, 7);
    assert.equal(history[0]?.date, "2026-11-19");
    assert.equal(history[6]?.date, "2026-11-25");
    assert.ok(history.every((d) => d.active === false));
  });
});

describe("removeMealById", () => {
  const sampleMeals: ApiMealLog[] = [
    {
      id: 101,
      food_item_id: 1,
      meal_type: "breakfast",
      food_name_snapshot: "Phở bò",
      serving_grams: 450,
      calories: 518,
      protein_g: 35,
      carbs_g: 60,
      fat_g: 13,
      local_date: "2026-11-25",
      logged_at: "2026-11-25T07:00:00Z",
      created_at: "2026-11-25T07:00:00Z",
    },
    {
      id: 102,
      food_item_id: 2,
      meal_type: "lunch",
      food_name_snapshot: "Ức gà",
      serving_grams: 150,
      calories: 248,
      protein_g: 46,
      carbs_g: 0,
      fat_g: 5,
      local_date: "2026-11-25",
      logged_at: "2026-11-25T12:00:00Z",
      created_at: "2026-11-25T12:00:00Z",
    },
  ];

  it("removes the matching meal and returns it without mutating the input array", () => {
    const res = removeMealById(sampleMeals, 101);
    assert.equal(res.removed?.id, 101);
    assert.equal(res.removed?.calories, 518);
    assert.deepEqual(res.meals.map((m) => m.id), [102]);
    assert.equal(sampleMeals.length, 2);
  });

  it("returns the original array reference and undefined when mealId is absent", () => {
    const res = removeMealById(sampleMeals, 999);
    assert.equal(res.removed, undefined);
    assert.equal(res.meals, sampleMeals);
  });
});
