import { calculatePersonalizedPlan } from '../src/lib/quiz-calculations';
import { QuizResponses } from '../src/types/quiz';

console.log("=== RUNNING QUIZ CALCULATIONS UNIT TESTS ===");

// Test 1: Female Pilates Trainee
const femaleResponses: QuizResponses = {
  archetype: 'female_pilates',
  gender: 'female',
  goal: 'lose_weight',
  focusAreas: ['belly', 'glutes'],
  age: 26,
  heightCm: 165,
  currentWeightKg: 60,
  targetWeightKg: 52,
  activityLevel: 'lightly_active',
  dietPreference: 'balanced',
  obstacles: ['sweet_cravings'],
  equipmentAccess: 'home',
  injuries: ['lower_back']
};

const femalePlan = calculatePersonalizedPlan(femaleResponses);

// Verify Female BMR: 10*60 + 6.25*165 - 5*26 - 161 = 600 + 1031.25 - 130 - 161 = 1340.25 -> 1340
if (femalePlan.bmr !== 1340) {
  throw new Error(`Expected female BMR 1340, got ${femalePlan.bmr}`);
}
if (!femalePlan.macroSplit.proteinG || femalePlan.macroSplit.proteinG <= 0) {
  throw new Error("Protein grams must be calculated");
}
if (!femalePlan.excludedExercises.includes("Barbell Deadlift")) {
  throw new Error("Must exclude Barbell Deadlift for lower_back");
}
if (!femalePlan.safetyNotes.some(n => n.includes("bảo vệ cột sống"))) {
  throw new Error("Must include spine safety note");
}
if (femalePlan.weeklyRoutine.length !== 4) {
  throw new Error("Must generate 4-day weekly routine");
}
if (!femalePlan.weeklyRoutine[0].title.includes("Thảm Mat")) {
  throw new Error("Home equipment must use Mat title");
}

console.log("✓ Test 1: Female Pilates calculation, macro split & spine injury exclusions PASSED!");

// Test 2: Male Strength Trainee
const maleResponses: QuizResponses = {
  archetype: 'male_strength',
  gender: 'male',
  goal: 'hypertrophy',
  focusAreas: ['chest', 'arms'],
  age: 28,
  heightCm: 178,
  currentWeightKg: 75,
  targetWeightKg: 80,
  activityLevel: 'moderately_active',
  dietPreference: 'high_protein',
  obstacles: ['lack_of_time'],
  equipmentAccess: 'gym',
  injuries: ['knee']
};

const malePlan = calculatePersonalizedPlan(maleResponses);

// Verify Male BMR: 10*75 + 6.25*178 - 5*28 + 5 = 750 + 1112.5 - 140 + 5 = 1727.5 -> 1728
if (malePlan.bmr !== 1728) {
  throw new Error(`Expected male BMR 1728, got ${malePlan.bmr}`);
}
if (malePlan.dailyCalorieTarget <= malePlan.tdee) {
  throw new Error("Weight gain target must be surplus over TDEE");
}
if (!malePlan.excludedExercises.includes("Jump Squat")) {
  throw new Error("Must exclude Jump Squat for knee injury");
}
if (!malePlan.safetyNotes.some(n => n.includes("bảo vệ khớp gối"))) {
  throw new Error("Must include knee safety note");
}
if (!malePlan.weeklyRoutine[0].title.includes("Upper Hypertrophy")) {
  throw new Error("Gym equipment must use Gym titles");
}

console.log("✓ Test 2: Male Strength calculation, surplus caloric target & knee injury exclusions PASSED!");

console.log("=== ALL TICKET 1 ASSERTIONS PASSED 100% ===");
