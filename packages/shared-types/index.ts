/**
 * Shared Domain Types across Web, Mobile, and Backend.
 * Canonical terms follow root GLOSSARY.md and fixtures/plan-vectors.json.
 */

export type Gender = 'female' | 'male';

/** Training persona picked first in onboarding; drives theme, copy and default plan. */
export type AthleticArchetype = 'female_pilates' | 'male_strength';

/** Alias kept for consumers referring to the onboarding archetype choice. */
export type QuizArchetype = AthleticArchetype;

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active';

export type BodyFocusArea =
  | 'belly'
  | 'thighs'
  | 'glutes'
  | 'back'
  | 'arms'
  | 'chest'
  | 'full_body';

export type EquipmentAccess = 'home' | 'gym';

export type JointInjury = 'lower_back' | 'knee' | 'neck_shoulder';

export type PrimaryGoal =
  | 'lose_weight'
  | 'tone_muscle'
  | 'improve_posture'
  | 'boost_energy'
  | 'tone_glutes'
  | 'fix_posture'
  | 'mindful_flexibility'
  | 'hypertrophy'
  | 'explosive_power'
  | 'cardio_stamina';

export type DietPreference =
  | 'balanced'
  | 'vegetarian'
  | 'low_carb'
  | 'intermittent_fasting'
  | 'high_protein';

export type FitnessObstacle =
  | 'stress_eating'
  | 'lack_of_time'
  | 'low_motivation'
  | 'sore_back'
  | 'sweet_cravings'
  | 'busy_schedule'
  | 'lack_of_motivation'
  | 'joint_fatigue'
  | 'irregular_sleep';

/** Shape of `fixtures/plan-vectors.json` parity cases. */
export interface PlanVectorInput {
  gender: Gender;
  archetype: AthleticArchetype;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
}

export interface PlanVectorExpected {
  bmi: number;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  calorieDeficitDaily: number;
  estimatedWeeks: number;
  recommendedWaterMl: number;
}

export interface PlanVector {
  input: PlanVectorInput;
  expected: PlanVectorExpected;
}

// --- Legacy draft types (kept temporarily for non-breaking compatibility) -----

/** @deprecated Prefer `QuizResponses` / `QuizSubmitRequest`. */
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

/** @deprecated Prefer `BodyFocusArea`. */
export type BodyArea = 'abs' | 'thighs' | 'butt' | 'back' | 'arms' | 'full_body';

/** @deprecated Prefer `UserDTO` and `PersonalizedPlanDTO`. */
export interface UserProfile {
  id: string;
  email: string;
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  fitnessLevel: FitnessLevel;
  focusAreas: BodyArea[];
  bmr: number;
  tdee: number;
  dailyTargetCalories: number;
  createdAt: string;
}

/** @deprecated Prefer `ExerciseDTO`. */
export interface Exercise {
  id: string;
  name: string;
  videoUrl: string;
  durationSeconds: number;
  targetMuscle: string;
  repTarget?: number;
  formInstructions: string[];
}

/** @deprecated Unused draft type. */
export interface FormDeviationEvent {
  timestampMs: number;
  exerciseId: string;
  errorType: 'SPINE_SAG' | 'KNEE_PAST_TOES' | 'INSUFFICIENT_DEPTH' | 'ASYMMETRY';
  angleDeviation: number;
  suggestedCorrection: string;
}

/** @deprecated Prefer `MealLogDTO`. */
export interface MealRecord {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export * from './api/store';
export * from './api/coaching';
