import {
  ApiError,
  type ApiQuizSubmit,
  type ApiUser,
  type PersonalizedPlanDTO,
  type QuizAssessmentDTO,
  type QuizSyncInput,
  api,
  getSessionUser,
} from "./api-client";
import {
  buildWeeklyRoutine,
  calculateMacroSplit,
  getBMICategory,
} from "./quiz-calculations";
import type {
  AthleticArchetype,
  PersonalizedPlanResult,
  QuizResponses,
} from "@/types/quiz";

export const PLAN_STORAGE_KEYS = {
  quiz: "g_ai_user_quiz",
  plan: "g_ai_user_plan",
  twinPhoto: "g_ai_user_twin_photo",
  twinMilestones: "g_ai_twin_milestones",
  predictionPlan: "g_ai_prediction_plan",
  predictionJob: "g_ai_prediction_job",
  photoConsent: "g_ai_ai_photo_consent",
} as const;

export interface PredictionJobRef {
  jobId: string;
  jobToken: string;
}

export interface StoredPredictionPlan {
  workoutType: string;
  weeklySets: string;
  dietStyle: string;
  archetype: AthleticArchetype;
}

export type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface PlanApiPort {
  getSessionUser: () => Promise<ApiUser | null>;
  submitQuiz: (payload: ApiQuizSubmit) => Promise<QuizAssessmentDTO>;
  getMyPlan: () => Promise<PersonalizedPlanDTO>;
  deletePredictionOnServer: (ref: PredictionJobRef) => Promise<boolean>;
}

export interface PlanSessionStoreDeps {
  storage?: StoragePort | (() => StoragePort | null) | null;
  api?: Partial<PlanApiPort>;
  nowMs?: () => number;
  randomUuid?: () => string;
}

function defaultBrowserStorage(): StoragePort | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

async function defaultDeletePredictionOnServer(ref: PredictionJobRef): Promise<boolean> {
  try {
    const res = await fetch("/api/prediction/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ref),
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

/** True when a signed /api/prediction/image URL has passed its expiry. */
export function isSignedUrlExpired(url: string, nowMs: number = Date.now()): boolean {
  // Links from before images moved to private storage no longer resolve.
  if (url.startsWith("/generated/")) return true;
  const match = /[?&]exp=(\d+)/.exec(url);
  if (!match) return !url.startsWith("data:") && url.startsWith("/api/prediction/image/");
  return Number(match[1]) * 1000 <= nowMs;
}

export function personalizedPlanFromDTO(
  dto: PersonalizedPlanDTO,
  opts?: { now?: Date }
): PersonalizedPlanResult {
  const routineLower = (dto.focus_routine || "").toLowerCase();
  const isMale = routineLower.includes("strength") || routineLower.includes("calisthenics");
  const archetype: AthleticArchetype = isMale ? "male_strength" : "female_pilates";

  const milestoneWeight = dto.projected_weight_milestones?.[0]?.weight;
  const inferredWeight =
    typeof milestoneWeight === "number" && milestoneWeight > 0
      ? milestoneWeight
      : Math.round(dto.daily_water_target_ml / 35) || (isMale ? 76 : 58);

  const macroSplit = calculateMacroSplit(inferredWeight, dto.daily_calorie_target, isMale);

  const fallbackNow = opts?.now ?? new Date();
  const parsedCreated = dto.created_at ? new Date(dto.created_at) : fallbackNow;
  const targetDate = new Date(
    Number.isNaN(parsedCreated.getTime()) ? fallbackNow.getTime() : parsedCreated.getTime()
  );
  targetDate.setDate(targetDate.getDate() + dto.estimated_duration_weeks * 7);
  const estimatedTargetDate = targetDate.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    archetype,
    bmi: dto.bmi,
    bmiCategory: getBMICategory(dto.bmi).label,
    bmr: dto.bmr,
    tdee: dto.tdee,
    dailyCalorieTarget: dto.daily_calorie_target,
    calorieDeficitDaily: Math.round(dto.tdee - dto.daily_calorie_target),
    macroSplit,
    estimatedWeeks: dto.estimated_duration_weeks,
    estimatedTargetDate,
    recommendedWaterMl: dto.daily_water_target_ml,
    weeklyWorkoutsCount: 4,
    focusHighlights: [],
    safetyNotes: [],
    excludedExercises: [],
    weeklyRoutine: buildWeeklyRoutine(archetype, "home"),
  };
}

export function createPlanSessionStore(deps: PlanSessionStoreDeps = {}) {
  const getStorage = (): StoragePort | null => {
    if (deps.storage === undefined) return defaultBrowserStorage();
    if (typeof deps.storage === "function") return deps.storage();
    return deps.storage;
  };

  const nowMs = deps.nowMs ?? (() => Date.now());
  const randomUuid =
    deps.randomUuid ??
    (() =>
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const apiPort: PlanApiPort = {
    getSessionUser: deps.api?.getSessionUser ?? (() => getSessionUser()),
    submitQuiz: deps.api?.submitQuiz ?? ((payload) => api.quiz.submit(payload)),
    getMyPlan: deps.api?.getMyPlan ?? (() => api.quiz.myPlan()),
    deletePredictionOnServer:
      deps.api?.deletePredictionOnServer ?? defaultDeletePredictionOnServer,
  };

  const safeGet = (key: string): string | null => {
    try {
      return getStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  };

  const safeSet = (key: string, value: string): void => {
    try {
      getStorage()?.setItem(key, value);
    } catch {
      // Storage quota / private mode
    }
  };

  const safeRemove = (key: string): void => {
    try {
      getStorage()?.removeItem(key);
    } catch {
      // ignore
    }
  };

  const loadJson = <T>(key: string): T | null => {
    const raw = safeGet(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const loadQuiz = (): QuizResponses | null => loadJson<QuizResponses>(PLAN_STORAGE_KEYS.quiz);

  const saveQuiz = (quiz: QuizResponses): void => {
    safeSet(PLAN_STORAGE_KEYS.quiz, JSON.stringify(quiz));
  };

  const loadPlan = (): PersonalizedPlanResult | null =>
    loadJson<PersonalizedPlanResult>(PLAN_STORAGE_KEYS.plan);

  const savePlan = (plan: PersonalizedPlanResult): void => {
    safeSet(PLAN_STORAGE_KEYS.plan, JSON.stringify(plan));
  };

  const loadTwinPhoto = (): string | null => safeGet(PLAN_STORAGE_KEYS.twinPhoto);

  const saveTwinPhoto = (photoBase64: string): void => {
    safeSet(PLAN_STORAGE_KEYS.twinPhoto, photoBase64);
  };

  const clearTwinPhoto = (): void => {
    safeRemove(PLAN_STORAGE_KEYS.twinPhoto);
  };

  const loadMilestones = (): { milestones: string[] | null; expired: boolean } => {
    const parsed = loadJson<unknown>(PLAN_STORAGE_KEYS.twinMilestones);
    if (!Array.isArray(parsed)) {
      return { milestones: null, expired: false };
    }
    const currentNow = nowMs();
    const expired = parsed
      .slice(1)
      .some((u: unknown) => typeof u === "string" && u !== "" && isSignedUrlExpired(u, currentNow));
    if (expired) {
      safeRemove(PLAN_STORAGE_KEYS.twinMilestones);
      return { milestones: null, expired: true };
    }
    return { milestones: parsed.map((v) => (typeof v === "string" ? v : "")), expired: false };
  };

  const saveMilestones = (milestones: string[]): void => {
    safeSet(PLAN_STORAGE_KEYS.twinMilestones, JSON.stringify(milestones));
  };

  const clearMilestones = (): void => {
    safeRemove(PLAN_STORAGE_KEYS.twinMilestones);
  };

  const loadPredictionPlan = (): StoredPredictionPlan | null =>
    loadJson<StoredPredictionPlan>(PLAN_STORAGE_KEYS.predictionPlan);

  const savePredictionPlan = (plan: StoredPredictionPlan): void => {
    safeSet(PLAN_STORAGE_KEYS.predictionPlan, JSON.stringify(plan));
  };

  const clearPredictionPlan = (): void => {
    safeRemove(PLAN_STORAGE_KEYS.predictionPlan);
  };

  const saveJobRef = (ref: PredictionJobRef): void => {
    safeSet(PLAN_STORAGE_KEYS.predictionJob, JSON.stringify(ref));
  };

  const loadJobRef = (): PredictionJobRef | null => {
    const parsed = loadJson<Partial<PredictionJobRef>>(PLAN_STORAGE_KEYS.predictionJob);
    return typeof parsed?.jobId === "string" && typeof parsed?.jobToken === "string"
      ? { jobId: parsed.jobId, jobToken: parsed.jobToken }
      : null;
  };

  const clearJobRef = (): void => {
    safeRemove(PLAN_STORAGE_KEYS.predictionJob);
  };

  const hasPhotoConsent = (): boolean => safeGet(PLAN_STORAGE_KEYS.photoConsent) === "1";

  const setPhotoConsent = (accepted: boolean): void => {
    if (accepted) safeSet(PLAN_STORAGE_KEYS.photoConsent, "1");
    else safeRemove(PLAN_STORAGE_KEYS.photoConsent);
  };

  const saveQuizAndPlan = (quiz: QuizResponses, plan: PersonalizedPlanResult): void => {
    saveQuiz(quiz);
    savePlan(plan);
    if (quiz.userPhotoBase64) {
      saveTwinPhoto(quiz.userPhotoBase64);
    } else {
      clearTwinPhoto();
      setPhotoConsent(false);
    }
    // New quiz results supersede any prior /prediction preset or cached milestones.
    clearPredictionPlan();
    clearMilestones();
  };

  const deletePredictionOnServer = async (): Promise<boolean> => {
    const ref = loadJobRef();
    if (!ref) return true;
    const ok = await apiPort.deletePredictionOnServer(ref);
    if (ok) {
      clearJobRef();
    }
    return ok;
  };

  const clearPhotoAndPrediction = async (): Promise<boolean> => {
    const deleted = await deletePredictionOnServer();
    clearJobRef();
    clearTwinPhoto();
    clearMilestones();
    setPhotoConsent(false);
    const quiz = loadQuiz();
    if (quiz && typeof quiz === "object" && !Array.isArray(quiz) && "userPhotoBase64" in quiz) {
      const nextQuiz = { ...quiz };
      delete nextQuiz.userPhotoBase64;
      saveQuiz(nextQuiz);
    }
    const plan = loadPlan();
    if (plan && typeof plan === "object" && !Array.isArray(plan) && "userPhotoBase64" in plan) {
      const nextPlan = { ...plan };
      delete nextPlan.userPhotoBase64;
      savePlan(nextPlan);
    }
    return deleted;
  };

  const syncQuizForSignedInUser = async (responses: QuizSyncInput): Promise<boolean> => {
    const user = await apiPort.getSessionUser();
    if (!user) return false;
    await apiPort.submitQuiz({
      session_id: randomUuid(),
      archetype: responses.archetype,
      gender: responses.gender,
      age: responses.age,
      height_cm: responses.heightCm,
      current_weight_kg: responses.currentWeightKg,
      target_weight_kg: responses.targetWeightKg,
      activity_level: responses.activityLevel,
      primary_goal: responses.goal,
      focus_areas: responses.focusAreas,
      obstacles: responses.obstacles,
    });
    return true;
  };

  const loadActivePlanForSignedInUser = async (): Promise<PersonalizedPlanResult | null> => {
    try {
      const dto = await apiPort.getMyPlan();
      const mapped = personalizedPlanFromDTO(dto, { now: new Date(nowMs()) });
      savePlan(mapped);
      return mapped;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  };

  return {
    loadQuiz,
    saveQuiz,
    loadPlan,
    savePlan,
    saveQuizAndPlan,
    loadTwinPhoto,
    saveTwinPhoto,
    clearTwinPhoto,
    loadMilestones,
    saveMilestones,
    clearMilestones,
    loadPredictionPlan,
    savePredictionPlan,
    saveJobRef,
    loadJobRef,
    clearJobRef,
    hasPhotoConsent,
    setPhotoConsent,
    deletePredictionOnServer,
    clearPhotoAndPrediction,
    syncQuizForSignedInUser,
    loadActivePlanForSignedInUser,
  };
}

export type PlanSessionStore = ReturnType<typeof createPlanSessionStore>;

export const planSessionStore = createPlanSessionStore();
