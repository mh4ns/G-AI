export type Gender = 'female' | 'male';

export type PrimaryGoal = 
  | 'lose_weight' 
  | 'tone_muscle' 
  | 'improve_posture' 
  | 'boost_energy'
  | 'tone_glutes'
  | 'fix_posture'
  | 'mindful_flexibility';

export type BodyFocusArea = 'belly' | 'thighs' | 'glutes' | 'back' | 'arms' | 'full_body';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';

export type DietPreference = 'balanced' | 'vegetarian' | 'low_carb' | 'intermittent_fasting';

export type FitnessObstacle = 
  | 'stress_eating' 
  | 'lack_of_time' 
  | 'low_motivation' 
  | 'sore_back' 
  | 'sweet_cravings'
  | 'busy_schedule'
  | 'lack_of_motivation';

export interface QuizResponses {
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
}

export interface PersonalizedPlanResult {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  calorieDeficitDaily: number;
  estimatedWeeks: number;
  estimatedTargetDate: string;
  recommendedWaterMl: number;
  weeklyWorkoutsCount: number;
  focusHighlights: string[];
}
