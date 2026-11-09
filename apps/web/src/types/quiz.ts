export type Gender = 'female' | 'male';

export type AthleticArchetype = 'female_pilates' | 'male_strength';

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

export type BodyFocusArea = 
  | 'belly' 
  | 'thighs' 
  | 'glutes' 
  | 'back' 
  | 'arms' 
  | 'chest'
  | 'full_body';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';

export type DietPreference = 'balanced' | 'vegetarian' | 'low_carb' | 'intermittent_fasting' | 'high_protein';

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
