/**
 * Backend coaching, Today, nutrition, quiz, and workout API contracts (`/api/v1`),
 * snake_case as sent on the wire.
 * Generated schema: ../openapi/backend-v1.json (`python -m app.export_openapi` in apps/backend).
 * Keep in sync with apps/backend/app/schemas/{daily_metric,nutrition,quiz,workout}.py.
 */

import type { ActivityLevel, AthleticArchetype, Gender } from '../index';

// --- Today & Daily Metrics ----------------------------------------------------

export type FastingProtocol = '14:10' | '16:8' | '18:6' | '20:4';
export type FastingState = 'idle' | 'fasting' | 'eating_window';

/** GET /today, POST /today/{water,calories,fasting,habits/toggle} */
export interface DailyMetricDTO {
  id: number;
  date: string; // YYYY-MM-DD
  calories_consumed: number;
  calories_burned: number;
  water_intake_ml: number;
  fasting_minutes: number;
  fasting_state: FastingState;
  fasting_started_at: string | null;
  fasting_protocol: FastingProtocol;
  habits_completed: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaterUpdateRequest {
  /** Amount in ml to add (negative to undo); server defaults to 250 (-2000..2000). */
  amount_ml?: number;
}

export interface CaloriesUpdateRequest {
  /** Calories eaten to add (negative to undo, -5000..5000). */
  amount_kcal: number;
}

export interface FastingUpdateRequest {
  fasting_state: FastingState;
  fasting_minutes?: number | null;
  fasting_started_at?: string | null;
  fasting_protocol?: FastingProtocol | null;
}

export interface HabitToggleRequest {
  /** Pattern: ^[a-z][a-z0-9_]{1,49}$ (e.g. water, workout, mindfulness). */
  habit_key: string;
}

export interface TodaySummaryDayDTO {
  date: string;
  calories_consumed: number;
  calories_burned: number;
  water_intake_ml: number;
  habits_count: number;
  fasting_state: string;
  active: boolean;
}

/** GET /today/summary */
export interface TodaySummaryDTO {
  today: DailyMetricDTO;
  streak_days: number;
  best_streak_days: number;
  history_7d: TodaySummaryDayDTO[];
}

// --- Nutrition ----------------------------------------------------------------

export type FoodSource = 'curated' | 'user' | 'usda' | 'openfoodfacts';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItemCreateRequest {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  default_serving_g?: number;
  calories_per_100g: number;
  protein_g_100g?: number;
  carbs_g_100g?: number;
  fat_g_100g?: number;
}

/** GET /nutrition/foods, POST /nutrition/foods (201) */
export interface FoodItemDTO {
  id: number;
  name: string;
  canonical_name: string;
  brand: string | null;
  barcode: string | null;
  source: FoodSource | (string & {});
  default_serving_g: number;
  calories_per_100g: number;
  protein_g_100g: number;
  carbs_g_100g: number;
  fat_g_100g: number;
  is_active: boolean;
  created_at: string;
}

export interface MealLogCreateRequest {
  food_item_id: number;
  meal_type?: MealType;
  serving_grams: number;
  logged_at?: string | null;
}

/** POST /nutrition/meals (201) */
export interface MealLogDTO {
  id: number;
  food_item_id: number | null;
  meal_type: MealType | (string & {});
  food_name_snapshot: string;
  serving_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  local_date: string;
  logged_at: string;
  created_at: string;
}

/** GET /nutrition/meals */
export interface MealLogDayDTO {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meals: MealLogDTO[];
}

// --- Quiz & Personalized Plan -------------------------------------------------

export type AgeGroup = '18-29' | '30-39' | '40-49' | '50+';

export interface QuizSubmitRequest {
  session_id: string;
  archetype?: AthleticArchetype | null;
  gender?: Gender;
  age?: number | null;
  age_group?: AgeGroup | null;
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg: number;
  activity_level?: ActivityLevel | null;
  primary_goal: string;
  focus_areas?: string[];
  obstacles?: string[];
  fitness_level?: string;
}

export interface ProjectedWeightMilestone {
  week: number;
  weight: number;
}

/** GET /quiz/plans/me */
export interface PersonalizedPlanDTO {
  id: number;
  assessment_id: number;
  bmi: number;
  bmr: number;
  tdee: number;
  daily_calorie_target: number;
  daily_water_target_ml: number;
  estimated_duration_weeks: number;
  projected_weight_milestones: ProjectedWeightMilestone[];
  focus_routine: string;
  recommended_diet_type: string;
  is_active: boolean;
  created_at: string;
}

/** POST /quiz/submit (201), GET /quiz/assessments/me */
export interface QuizAssessmentDTO {
  id: number;
  session_id: string;
  age: number | null;
  age_group: string;
  gender: Gender | (string & {});
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg: number;
  activity_level: ActivityLevel | (string & {}) | null;
  primary_goal: string;
  focus_areas: string[];
  obstacles: string[];
  fitness_level: string;
  created_at: string;
  plan?: PersonalizedPlanDTO | null;
}

// --- Workouts -----------------------------------------------------------------

/** GET /workouts/exercises */
export interface ExerciseDTO {
  id: number;
  code: string;
  name: string;
  category: string;
  primary_muscle: string;
  difficulty: string;
  description: string;
  instructions: string[];
  /** Three MediaPipe Pose landmark indices; the angle is measured at the middle one. */
  landmark_joints: number[];
  target_angle_min: number | null;
  target_angle_max: number | null;
  thumbnail_url: string | null;
}

export interface WorkoutRoutineExerciseStep {
  exercise_code?: string;
  reps?: number;
  duration_sec?: number;
  rest_sec?: number;
}

/** GET /workouts/routines */
export interface WorkoutRoutineDTO {
  id: number;
  slug: string;
  title: string;
  duration_min: number;
  calorie_burn_est: number;
  intensity: string;
  exercises_sequence: WorkoutRoutineExerciseStep[];
  is_featured: boolean;
}

export interface WorkoutLogCreateRequest {
  routine_id?: number | null;
  duration_sec: number;
  calories_burned: number;
  reps_completed?: number;
  /** 0-100 from camera tracking; null when the session ran without the camera. */
  form_accuracy_pct?: number | null;
}

/** POST /workouts/logs (201), GET /workouts/logs/me */
export interface WorkoutLogDTO {
  id: number;
  routine_id: number | null;
  duration_sec: number;
  calories_burned: number;
  reps_completed: number;
  form_accuracy_pct: number | null;
  completed_at: string;
}

// --- Validation Errors --------------------------------------------------------

export interface ValidationErrorItem {
  loc: Array<string | number>;
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface HTTPValidationError {
  detail: ValidationErrorItem[];
}
