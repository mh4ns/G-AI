/**
 * Typed client for the FastAPI backend.
 *
 * Requests go to the same-origin `/api/v1/*` path, which next.config.mjs
 * rewrites to BACKEND_URL. Being same-origin lets the backend's httpOnly
 * session cookie work without exposing the token to JavaScript.
 */

export const API_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail;
    const message = typeof detail === "string" ? detail : `Request failed (${res.status})`;
    throw new ApiError(res.status, message, detail);
  }
  return body as T;
}

const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) });

// --- Types mirroring app/schemas (see apps/backend/app/schemas) ---------------

export interface ApiUser {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ApiDailyMetric {
  id: number;
  date: string;
  calories_consumed: number;
  calories_burned: number;
  water_intake_ml: number;
  fasting_minutes: number;
  fasting_state: "idle" | "fasting" | "eating_window";
  habits_completed: string[];
  notes: string | null;
}

export interface ApiQuizSubmit {
  session_id: string;
  archetype?: "female_pilates" | "male_strength";
  gender: "female" | "male";
  age: number;
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg: number;
  activity_level?: "sedentary" | "lightly_active" | "moderately_active" | "very_active";
  primary_goal: string;
  focus_areas: string[];
  obstacles: string[];
}

export interface ApiWorkoutLogCreate {
  duration_sec: number;
  calories_burned: number;
  reps_completed: number;
  form_accuracy_pct: number;
  routine_id?: number;
}

// --- Endpoints ----------------------------------------------------------------

export const api = {
  auth: {
    me: () => request<ApiUser>("/auth/me"),
    login: (email: string, password: string) => post<{ user: ApiUser }>("/auth/login", { email, password }),
    register: (email: string, password: string, full_name: string) =>
      post<{ user: ApiUser }>("/auth/register", { email, password, full_name }),
    logout: () => post<void>("/auth/logout"),
  },
  quiz: {
    submit: (payload: ApiQuizSubmit) => post<{ id: number }>("/quiz/submit", payload),
  },
  today: {
    get: () => request<ApiDailyMetric>("/today"),
    addWater: (amount_ml: number) => post<ApiDailyMetric>("/today/water", { amount_ml }),
    addCalories: (amount_kcal: number) => post<ApiDailyMetric>("/today/calories", { amount_kcal }),
    toggleHabit: (habit_key: string) => post<ApiDailyMetric>("/today/habits/toggle", { habit_key }),
  },
  workouts: {
    log: (payload: ApiWorkoutLogCreate) => post<{ id: number }>("/workouts/logs", payload),
  },
};

/** Returns the signed-in user, or null for guests and when the backend is unreachable. */
export async function getSessionUser(): Promise<ApiUser | null> {
  try {
    return await api.auth.me();
  } catch {
    return null;
  }
}

/**
 * Saves a finished quiz to the signed-in user's account. Guests are skipped on
 * purpose: their answers stay in this browser instead of becoming anonymous
 * health records on the server.
 */
export async function syncQuizForSignedInUser(responses: {
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
}): Promise<boolean> {
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
