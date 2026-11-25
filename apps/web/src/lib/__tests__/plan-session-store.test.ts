import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, getSessionUser, type ApiQuizSubmit, type ApiUser, type PersonalizedPlanDTO, type QuizAssessmentDTO } from "../api-client";
import {
  PLAN_STORAGE_KEYS,
  createPlanSessionStore,
  personalizedPlanFromDTO,
  type PredictionJobRef,
  type StoragePort,
} from "../plan-session-store";
import { calculatePersonalizedPlan } from "../quiz-calculations";
import type { QuizResponses } from "@/types/quiz";

class MemoryStorage implements StoragePort {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

const SAMPLE_QUIZ: QuizResponses = {
  archetype: "female_pilates",
  gender: "female",
  goal: "lose_weight",
  focusAreas: ["belly", "glutes"],
  age: 26,
  heightCm: 165,
  currentWeightKg: 60,
  targetWeightKg: 54,
  activityLevel: "lightly_active",
  dietPreference: "balanced",
  obstacles: ["sweet_cravings"],
  equipmentAccess: "home",
  injuries: [],
  userPhotoBase64: "data:image/jpeg;base64,/9j/4AAQ",
};

const SAMPLE_USER: ApiUser = {
  id: 1,
  email: "tester@example.com",
  full_name: "Tester",
  avatar_url: null,
  timezone: "Asia/Ho_Chi_Minh",
  is_active: true,
  created_at: "2026-11-25T00:00:00Z",
};

const SAMPLE_PLAN_DTO: PersonalizedPlanDTO = {
  id: 12,
  assessment_id: 99,
  bmi: 24.1,
  bmr: 1740,
  tdee: 2697,
  daily_calorie_target: 2197,
  daily_water_target_ml: 2700,
  estimated_duration_weeks: 8,
  projected_weight_milestones: [
    { week: 0, weight: 78 },
    { week: 8, weight: 72 },
  ],
  focus_routine: "Calisthenics & Strength",
  recommended_diet_type: "High protein",
  is_active: true,
  created_at: "2026-11-25T00:00:00Z",
};

test("getSessionUser returns null ONLY on 401 and rethrows 5xx / network errors", async () => {
  const guest = await getSessionUser(async () => {
    throw new ApiError(401, "Unauthorized");
  });
  assert.equal(guest, null);

  await assert.rejects(
    () =>
      getSessionUser(async () => {
        throw new ApiError(500, "Internal Server Error");
      }),
    (err: unknown) => err instanceof ApiError && err.status === 500
  );

  await assert.rejects(
    () =>
      getSessionUser(async () => {
        throw new ApiError(0, "Network request failed");
      }),
    (err: unknown) => err instanceof ApiError && err.status === 0
  );
});

test("PlanSessionStore saves quiz/plan, detects expired milestone URLs, and deletes prediction once", async () => {
  const storage = new MemoryStorage();
  let deleteCalls = 0;
  let deletedRef: PredictionJobRef | null = null;
  let now = 1_700_000_000_000;

  const store = createPlanSessionStore({
    storage,
    nowMs: () => now,
    api: {
      deletePredictionOnServer: async (ref) => {
        deleteCalls++;
        deletedRef = ref;
        return true;
      },
    },
  });

  const plan = calculatePersonalizedPlan(SAMPLE_QUIZ, new Date(now));
  plan.userPhotoBase64 = SAMPLE_QUIZ.userPhotoBase64;
  store.savePredictionPlan({
    workoutType: "Sức mạnh",
    weeklySets: "24 hiệp mỗi tuần",
    dietStyle: "old",
    archetype: "male_strength",
  });
  store.saveQuizAndPlan(SAMPLE_QUIZ, plan);

  assert.equal(store.loadPredictionPlan(), null);
  assert.equal(store.loadQuiz()?.currentWeightKg, 60);
  assert.equal(store.loadPlan()?.dailyCalorieTarget, plan.dailyCalorieTarget);
  assert.equal(store.loadTwinPhoto(), SAMPLE_QUIZ.userPhotoBase64);

  store.saveJobRef({ jobId: "job-1", jobToken: "secret-tok" });
  store.setPhotoConsent(true);
  assert.equal(store.hasPhotoConsent(), true);

  const validExp = Math.floor(now / 1000) + 600;
  store.saveMilestones([
    "data:image/jpeg;base64,AAA",
    `/api/prediction/image/key/7?exp=${validExp}&sig=00`,
    `/api/prediction/image/key/14?exp=${validExp}&sig=00`,
    `/api/prediction/image/key/28?exp=${validExp}&sig=00`,
  ]);
  assert.equal(store.loadMilestones().expired, false);
  assert.equal(store.loadMilestones().milestones?.length, 4);

  // Advance clock past expiry
  now += 700_000;
  const afterExpiry = store.loadMilestones();
  assert.equal(afterExpiry.expired, true);
  assert.equal(afterExpiry.milestones, null);
  assert.equal(storage.getItem(PLAN_STORAGE_KEYS.twinMilestones), null);

  // Single clearPhotoAndPrediction deletes on server once and clears photo, job, consent,
  // and strips userPhotoBase64 from both stored quiz and plan while preserving other fields.
  const deleted = await store.clearPhotoAndPrediction();
  assert.equal(deleted, true);
  assert.equal(deleteCalls, 1);
  assert.deepEqual(deletedRef, { jobId: "job-1", jobToken: "secret-tok" });
  assert.equal(store.loadJobRef(), null);
  assert.equal(store.loadTwinPhoto(), null);
  assert.equal(store.hasPhotoConsent(), false);
  assert.equal(store.loadPlan()?.userPhotoBase64, undefined);
  assert.equal(store.loadQuiz()?.userPhotoBase64, undefined);
  assert.equal(store.loadPlan()?.dailyCalorieTarget, plan.dailyCalorieTarget);
  assert.equal(store.loadPlan()?.archetype, plan.archetype);
  assert.equal(store.loadQuiz()?.currentWeightKg, SAMPLE_QUIZ.currentWeightKg);
  assert.equal(store.loadQuiz()?.goal, SAMPLE_QUIZ.goal);
});

test("PlanSessionStore.loadActivePlanForSignedInUser maps DTO and returns null on 404", async () => {
  const storage = new MemoryStorage();
  let return404 = true;

  const store = createPlanSessionStore({
    storage,
    nowMs: () => Date.UTC(2026, 10, 25),
    api: {
      getMyPlan: async () => {
        if (return404) throw new ApiError(404, "No active plan");
        return SAMPLE_PLAN_DTO;
      },
    },
  });

  const missing = await store.loadActivePlanForSignedInUser();
  assert.equal(missing, null);
  assert.equal(store.loadPlan(), null);

  return404 = false;
  const loaded = await store.loadActivePlanForSignedInUser();
  assert.ok(loaded);
  assert.equal(loaded.archetype, "male_strength");
  assert.equal(loaded.dailyCalorieTarget, 2197);
  assert.equal(loaded.recommendedWaterMl, 2700);
  assert.equal(loaded.macroSplit.proteinG, 156); // 78 * 2.0
  assert.equal(store.loadPlan()?.dailyCalorieTarget, 2197);
});

test("personalizedPlanFromDTO handles female Pilates routine and water-derived weight fallback", () => {
  const dto: PersonalizedPlanDTO = {
    ...SAMPLE_PLAN_DTO,
    focus_routine: "Pilates Core & Posture",
    projected_weight_milestones: [],
    daily_water_target_ml: 2100,
    daily_calorie_target: 1450,
  };
  const mapped = personalizedPlanFromDTO(dto, { now: new Date("2026-11-25T00:00:00Z") });
  assert.equal(mapped.archetype, "female_pilates");
  // 2100 / 35 = 60kg -> 60 * 1.6 = 96g protein
  assert.equal(mapped.macroSplit.proteinG, 96);
});

test("PlanSessionStore.syncQuizForSignedInUser skips guests (null) and submits for signed-in users", async () => {
  const storage = new MemoryStorage();
  const submitted: ApiQuizSubmit[] = [];
  let signedIn = false;

  const store = createPlanSessionStore({
    storage,
    randomUuid: () => "uuid-fixed-1",
    api: {
      getSessionUser: async () => (signedIn ? SAMPLE_USER : null),
      submitQuiz: async (payload) => {
        submitted.push(payload);
        return { id: 1 } as QuizAssessmentDTO;
      },
    },
  });

  assert.equal(await store.syncQuizForSignedInUser(SAMPLE_QUIZ), false);
  assert.equal(submitted.length, 0);

  signedIn = true;
  assert.equal(await store.syncQuizForSignedInUser(SAMPLE_QUIZ), true);
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0]?.session_id, "uuid-fixed-1");
  assert.equal(submitted[0]?.current_weight_kg, 60);
});

test("PlanSessionStore.clearPhotoAndPrediction safely handles corrupt primitive or array JSON in storage", async () => {
  const storage = new MemoryStorage();
  const store = createPlanSessionStore({ storage });

  for (const [quizRaw, planRaw] of [
    ["123", "true"],
    ["[1,2]", '"corrupt-string"'],
  ]) {
    storage.setItem(PLAN_STORAGE_KEYS.quiz, quizRaw);
    storage.setItem(PLAN_STORAGE_KEYS.plan, planRaw);
    const deleted = await store.clearPhotoAndPrediction();
    assert.equal(deleted, true);
    assert.equal(storage.getItem(PLAN_STORAGE_KEYS.quiz), quizRaw);
    assert.equal(storage.getItem(PLAN_STORAGE_KEYS.plan), planRaw);
  }
});

test("PlanSessionStore.saveQuizAndPlan clears stale twinPhoto and photoConsent when quiz has no photo", () => {
  const storage = new MemoryStorage();
  const store = createPlanSessionStore({ storage });

  const initialPlan = calculatePersonalizedPlan(SAMPLE_QUIZ, new Date(1_700_000_000_000));
  store.saveQuizAndPlan(SAMPLE_QUIZ, initialPlan);
  store.setPhotoConsent(true);
  assert.equal(store.loadTwinPhoto(), SAMPLE_QUIZ.userPhotoBase64);
  assert.equal(store.hasPhotoConsent(), true);

  const quizWithoutPhoto: QuizResponses = { ...SAMPLE_QUIZ };
  delete quizWithoutPhoto.userPhotoBase64;
  const nextPlan = calculatePersonalizedPlan(quizWithoutPhoto, new Date(1_700_000_000_000));
  store.saveQuizAndPlan(quizWithoutPhoto, nextPlan);

  assert.equal(store.loadTwinPhoto(), null);
  assert.equal(store.hasPhotoConsent(), false);
  assert.equal(store.loadQuiz()?.userPhotoBase64, undefined);
});
