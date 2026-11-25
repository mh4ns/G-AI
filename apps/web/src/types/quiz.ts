import type {
  ActivityLevel,
  AthleticArchetype,
  BodyFocusArea,
  DietPreference,
  EquipmentAccess,
  FitnessObstacle,
  Gender,
  JointInjury,
  PrimaryGoal,
} from "@g-ai/shared-types";

export type {
  ActivityLevel,
  AthleticArchetype,
  BodyFocusArea,
  DietPreference,
  EquipmentAccess,
  FitnessObstacle,
  Gender,
  JointInjury,
  PrimaryGoal,
};

export interface QuizResponses {
  archetype: AthleticArchetype;
  gender: Gender;
  goal: PrimaryGoal;
  focusAreas: BodyFocusArea[];
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  dietPreference: DietPreference;
  obstacles: FitnessObstacle[];
  equipmentAccess: EquipmentAccess;
  injuries: JointInjury[];
  userPhotoBase64?: string;
}

export interface MacroSplit {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface PlannedWorkoutDay {
  dayNumber: number;
  title: string;
  durationMin: number;
  target: string;
  intensity: 'low' | 'moderate' | 'high';
  exerciseCount: number;
}

export interface PersonalizedPlanResult {
  archetype: AthleticArchetype;
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  calorieDeficitDaily: number;
  macroSplit: MacroSplit;
  estimatedWeeks: number;
  estimatedTargetDate: string;
  recommendedWaterMl: number;
  weeklyWorkoutsCount: number;
  focusHighlights: string[];
  safetyNotes: string[];
  excludedExercises: string[];
  weeklyRoutine: PlannedWorkoutDay[];
  userPhotoBase64?: string;
  customTwinMilestones?: string[];
}
