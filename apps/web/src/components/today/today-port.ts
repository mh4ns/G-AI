import {
  api,
  type ApiDailyMetric,
  type ApiMealLog,
  type ApiMealLogDay,
  type ApiTodaySummary,
  type ApiUser,
  type ApiWorkoutLogCreate,
  type FastingProtocol,
  getSessionUser,
} from "@/lib/api-client";
import { planSessionStore } from "@/lib/plan-session-store";
import { DEFAULT_SAMPLE_PLAN } from "@/lib/quiz-calculations";
import type { WorkoutSummaryData } from "@/components/workout/workout-session-engine";
import type { PersonalizedPlanResult } from "@/types/quiz";

export const CHECKLIST_KEYS = ["water", "workout", "mindfulness", "fasting"] as const;
export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];
export type ChecklistState = Record<ChecklistKey, boolean>;

export type SessionStatus = "loading" | "guest" | "authenticated" | "error";

export interface TodayPort {
  getSessionUser: () => Promise<ApiUser | null>;
  loadLocalPlan: () => PersonalizedPlanResult | null;
  loadServerPlan: () => Promise<PersonalizedPlanResult | null>;
  getTodaySummary: () => Promise<ApiTodaySummary>;
  getTodayMetric: () => Promise<ApiDailyMetric>;
  getMeals: () => Promise<ApiMealLogDay>;
  addWater: (amountMl: number) => Promise<ApiDailyMetric>;
  toggleHabit: (habitKey: string) => Promise<ApiDailyMetric>;
  updateFasting: (payload: {
    fasting_state: ApiDailyMetric["fasting_state"];
    fasting_protocol: FastingProtocol;
    fasting_started_at?: string | null;
    fasting_minutes?: number;
  }) => Promise<ApiDailyMetric>;
  logWorkout: (payload: ApiWorkoutLogCreate) => Promise<{ id: number }>;
}

export function createBrowserTodayPort(): TodayPort {
  return {
    getSessionUser: () => getSessionUser(),
    loadLocalPlan: () => planSessionStore.loadPlan(),
    loadServerPlan: () => planSessionStore.loadActivePlanForSignedInUser(),
    getTodaySummary: () => api.today.summary(),
    getTodayMetric: () => api.today.get(),
    getMeals: () => api.nutrition.getMeals(),
    addWater: (amountMl) => api.today.addWater(amountMl),
    toggleHabit: (habitKey) => api.today.toggleHabit(habitKey),
    updateFasting: (payload) => api.today.updateFasting(payload),
    logWorkout: (payload) => api.workouts.log(payload),
  };
}

export function checklistFromMetric(metric: ApiDailyMetric): ChecklistState {
  return {
    water: metric.habits_completed.includes("water"),
    workout: metric.habits_completed.includes("workout"),
    mindfulness: metric.habits_completed.includes("mindfulness"),
    fasting: metric.habits_completed.includes("fasting"),
  };
}

export function sumMealMacros(meals: ApiMealLog[]): {
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
} {
  return {
    totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
    totalProteinG: Math.round(meals.reduce((sum, m) => sum + m.protein_g, 0) * 10) / 10,
    totalCarbsG: Math.round(meals.reduce((sum, m) => sum + m.carbs_g, 0) * 10) / 10,
    totalFatG: Math.round(meals.reduce((sum, m) => sum + m.fat_g, 0) * 10) / 10,
  };
}

export function removeMealById(
  meals: ApiMealLog[],
  mealId: number
): { meals: ApiMealLog[]; removed: ApiMealLog | undefined } {
  const removed = meals.find((m) => m.id === mealId);
  return {
    meals: removed ? meals.filter((m) => m.id !== mealId) : meals,
    removed,
  };
}

/**
 * Ensures `habitKey` is marked completed on the server without toggling it OFF
 * if already present. Always serialize calls through `createMutationQueue()` to
 * prevent concurrent GET -> POST toggle races.
 */
export async function ensureHabitCompleted(
  port: Pick<TodayPort, "getTodayMetric" | "toggleHabit">,
  habitKey: ChecklistKey,
  knownMetric?: ApiDailyMetric
): Promise<ApiDailyMetric> {
  const current = knownMetric ?? (await port.getTodayMetric());
  if (current.habits_completed.includes(habitKey)) {
    return current;
  }
  return port.toggleHabit(habitKey);
}

export interface MutationQueue {
  enqueue<T>(task: () => Promise<T>): Promise<T>;
}

export function createMutationQueue(): MutationQueue {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    enqueue<T>(task: () => Promise<T>): Promise<T> {
      const next = tail.then(task, task);
      tail = next.catch(() => undefined);
      return next;
    },
  };
}

export interface TodayBootstrapResult {
  sessionStatus: Exclude<SessionStatus, "loading">;
  sessionUser: ApiUser | null;
  plan: PersonalizedPlanResult;
  hasCustomPlan: boolean;
  summary: ApiTodaySummary | null;
  meals: ApiMealLog[];
  syncError: string | null;
}

export async function bootstrapTodaySession(port: TodayPort): Promise<TodayBootstrapResult> {
  const localPlan = port.loadLocalPlan();
  let user: ApiUser | null = null;
  try {
    user = await port.getSessionUser();
  } catch {
    return {
      sessionStatus: "error",
      sessionUser: null,
      plan: localPlan ?? DEFAULT_SAMPLE_PLAN,
      hasCustomPlan: Boolean(localPlan),
      summary: null,
      meals: [],
      syncError: "Không kiểm tra được phiên đăng nhập với máy chủ.",
    };
  }

  if (!user) {
    return {
      sessionStatus: "guest",
      sessionUser: null,
      plan: localPlan ?? DEFAULT_SAMPLE_PLAN,
      hasCustomPlan: Boolean(localPlan),
      summary: null,
      meals: [],
      syncError: null,
    };
  }

  try {
    const [summary, mealDay, serverPlan] = await Promise.all([
      port.getTodaySummary(),
      port.getMeals(),
      localPlan ? Promise.resolve(null) : port.loadServerPlan().catch(() => null),
    ]);
    const activePlan = localPlan ?? serverPlan;
    return {
      sessionStatus: "authenticated",
      sessionUser: user,
      plan: activePlan ?? DEFAULT_SAMPLE_PLAN,
      hasCustomPlan: Boolean(activePlan),
      summary,
      meals: mealDay.meals,
      syncError: null,
    };
  } catch {
    return {
      sessionStatus: "authenticated",
      sessionUser: user,
      plan: localPlan ?? DEFAULT_SAMPLE_PLAN,
      hasCustomPlan: Boolean(localPlan),
      summary: null,
      meals: [],
      syncError: "Không tải được số liệu hôm nay từ máy chủ.",
    };
  }
}

export function performAddWater(
  port: Pick<TodayPort, "addWater" | "getTodayMetric" | "toggleHabit">,
  queue: MutationQueue,
  recommendedWaterMl: number,
  amountMl: number = 250
): Promise<ApiDailyMetric> {
  return queue.enqueue(async () => {
    const metric = await port.addWater(amountMl);
    if (metric.water_intake_ml >= recommendedWaterMl) {
      return ensureHabitCompleted(port, "water", metric);
    }
    return metric;
  });
}

export function performToggleChecklist(
  port: Pick<TodayPort, "toggleHabit">,
  queue: MutationQueue,
  key: ChecklistKey
): Promise<ApiDailyMetric> {
  return queue.enqueue(() => port.toggleHabit(key));
}

export function performFinishWorkout(
  port: Pick<TodayPort, "logWorkout" | "getTodayMetric" | "toggleHabit">,
  queue: MutationQueue,
  summary: WorkoutSummaryData
): Promise<ApiDailyMetric> {
  return queue.enqueue(async () => {
    await port.logWorkout({
      duration_sec: Math.max(1, Math.round(summary.durationMinutes * 60)),
      calories_burned: Math.max(0, Math.round(summary.caloriesBurned)),
      reps_completed: Math.max(0, Math.round(summary.repsCompleted)),
      // Camera off = nothing measured: send null rather than a fake 0%.
      form_accuracy_pct:
        summary.averageFormScore == null ? null : Math.min(100, Math.max(0, summary.averageFormScore)),
    });
    return ensureHabitCompleted(port, "workout");
  });
}
