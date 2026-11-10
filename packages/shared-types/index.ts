/**
 * Shared Domain Types across Web, Mobile, and Backend
 */

export type Gender = 'male' | 'female' | 'other';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type BodyArea = 'abs' | 'thighs' | 'butt' | 'back' | 'arms' | 'full_body';

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

export interface Exercise {
  id: string;
  name: string;
  videoUrl: string;
  durationSeconds: number;
  targetMuscle: string;
  repTarget?: number;
  formInstructions: string[];
}

export interface FormDeviationEvent {
  timestampMs: number;
  exerciseId: string;
  errorType: 'SPINE_SAG' | 'KNEE_PAST_TOES' | 'INSUFFICIENT_DEPTH' | 'ASYMMETRY';
  angleDeviation: number;
  suggestedCorrection: string;
}

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
