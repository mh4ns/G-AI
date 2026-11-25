/**
 * Typed client for the FastAPI backend.
 *
 * Requests go to the same-origin `/api/v1/*` path, which next.config.mjs
 * rewrites to BACKEND_URL. Being same-origin lets the backend's httpOnly
 * session cookie work without exposing the token to JavaScript.
 */

import { API_BASE, ApiError, createApiRequest } from "@g-ai/ui/api";
import type {
  DailyMetricDTO,
  ExerciseDTO,
  FastingProtocol,
  FoodItemCreateRequest,
  FoodItemDTO,
  MealLogDTO,
  MealLogDayDTO,
  MealType,
  PersonalizedPlanDTO,
  QuizAssessmentDTO,
  QuizSubmitRequest,
  SessionDTO,
  TodaySummaryDTO,
  TodaySummaryDayDTO,
  UserDTO,
  WorkoutLogCreateRequest,
  WorkoutRoutineDTO,
} from "@g-ai/shared-types";

export { API_BASE, ApiError, createApiRequest };

const request = createApiRequest();

const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) });

const del = <T = void>(path: string) => request<T>(path, { method: "DELETE" });

// --- Types mirrored from @g-ai/shared-types -----------------------------------

export type {
  FastingProtocol,
  MealType,
  PersonalizedPlanDTO,
  QuizAssessmentDTO,
  SessionDTO,
};

export type ApiUser = UserDTO;
export type ApiDailyMetric = DailyMetricDTO;
export type ApiTodaySummaryDay = TodaySummaryDayDTO;
export type ApiTodaySummary = TodaySummaryDTO;
export type ApiFoodItem = FoodItemDTO;
export type ApiFoodCreateRequest = FoodItemCreateRequest;
export type ApiMealLog = MealLogDTO;
export type ApiMealLogDay = MealLogDayDTO;
export type ApiQuizSubmit = QuizSubmitRequest;
export type ApiWorkoutLogCreate = WorkoutLogCreateRequest;
export type ApiExercise = ExerciseDTO;
export type ApiWorkoutRoutine = WorkoutRoutineDTO;

// --- Endpoints ----------------------------------------------------------------

export const api = {
  auth: {
    me: () => request<ApiUser>("/auth/me"),
    login: (email: string, password: string) => post<SessionDTO>("/auth/login", { email, password }),
    register: (email: string, password: string, full_name: string) =>
      post<SessionDTO>("/auth/register", { email, password, full_name }),
    logout: () => post<void>("/auth/logout"),
  },
  quiz: {
    submit: (payload: ApiQuizSubmit) => post<QuizAssessmentDTO>("/quiz/submit", payload),
    myPlan: () => request<PersonalizedPlanDTO>("/quiz/plans/me"),
  },
  today: {
    get: () => request<ApiDailyMetric>("/today"),
    summary: () => request<ApiTodaySummary>("/today/summary"),
    addWater: (amount_ml: number) => post<ApiDailyMetric>("/today/water", { amount_ml }),
    addCalories: (amount_kcal: number) => post<ApiDailyMetric>("/today/calories", { amount_kcal }),
    updateFasting: (payload: {
      fasting_state: "idle" | "fasting" | "eating_window";
      fasting_minutes?: number | null;
      fasting_started_at?: string | null;
      fasting_protocol?: FastingProtocol | null;
    }) => post<ApiDailyMetric>("/today/fasting", payload),
    toggleHabit: (habit_key: string) => post<ApiDailyMetric>("/today/habits/toggle", { habit_key }),
  },
  nutrition: {
    searchFoods: (q = "", limit = 20) =>
      request<ApiFoodItem[]>(`/nutrition/foods?q=${encodeURIComponent(q)}&limit=${limit}`),
    createFood: (payload: ApiFoodCreateRequest) => post<ApiFoodItem>("/nutrition/foods", payload),
    getMeals: (day?: string) =>
      request<ApiMealLogDay>(day ? `/nutrition/meals?day=${encodeURIComponent(day)}` : "/nutrition/meals"),
    logMeal: (payload: {
      food_item_id: number;
      meal_type: MealType;
      serving_grams: number;
      logged_at?: string;
    }) => post<ApiMealLog>("/nutrition/meals", payload),
    deleteMeal: (mealId: number) => del<void>(`/nutrition/meals/${mealId}`),
  },
  workouts: {
    log: (payload: ApiWorkoutLogCreate) => post<{ id: number }>("/workouts/logs", payload),
    exercises: (init?: RequestInit) => request<ApiExercise[]>("/workouts/exercises", init),
    routines: (init?: RequestInit) => request<ApiWorkoutRoutine[]>("/workouts/routines", init),
  },
};

/**
 * Returns the signed-in user, or null for guests (`401`).
 * Rethrows `5xx` and network (`status === 0`) errors so callers can distinguish
 * a guest session from a backend outage.
 */
export async function getSessionUser(
  fetchMe: () => Promise<ApiUser> = () => api.auth.me()
): Promise<ApiUser | null> {
  try {
    return await fetchMe();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}

export interface QuizSyncInput {
  archetype: "female_pilates" | "male_strength";
  gender: "female" | "male";
  goal: string;
  focusAreas: string[];
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ApiQuizSubmit["activity_level"];
  obstacles: string[];
}

/**
 * Saves a finished quiz to the signed-in user's account. Guests (`401`) are
 * skipped on purpose: their answers stay in this browser instead of becoming
 * anonymous health records on the server.
 */
export async function syncQuizForSignedInUser(responses: QuizSyncInput): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  await api.quiz.submit({
    session_id: crypto.randomUUID(),
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
}
