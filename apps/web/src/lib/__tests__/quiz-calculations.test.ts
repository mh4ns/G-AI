import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SAMPLE_PLAN,
  calculatePersonalizedPlan,
  formatCalorieGap,
  milestoneIndexForDay,
  projectMilestoneWeights,
  todayPresetForPlan,
} from "../quiz-calculations";
import type { QuizResponses } from "@/types/quiz";

const BASE_FEMALE_QUIZ: QuizResponses = {
  archetype: "female_pilates",
  gender: "female",
  goal: "lose_weight",
  focusAreas: ["belly", "glutes"],
  age: 26,
  heightCm: 165,
  currentWeightKg: 60,
  targetWeightKg: 52,
  activityLevel: "lightly_active",
  dietPreference: "balanced",
  obstacles: ["sweet_cravings"],
  equipmentAccess: "home",
  injuries: ["lower_back"],
};

test("calculatePersonalizedPlan accepts deterministic clock and applies injury exclusions & routines", () => {
  const fixedNow = new Date("2026-01-01T00:00:00Z");
  const femalePlan = calculatePersonalizedPlan(BASE_FEMALE_QUIZ, fixedNow);
  assert.equal(femalePlan.bmr, 1340);
  assert.ok(femalePlan.excludedExercises.includes("Barbell Deadlift"));
  assert.ok(femalePlan.weeklyRoutine[0]?.title.includes("Thảm:"));
  assert.ok(femalePlan.estimatedTargetDate.includes("2026"));

  const malePlan = calculatePersonalizedPlan(
    {
      ...BASE_FEMALE_QUIZ,
      archetype: "male_strength",
      gender: "male",
      goal: "hypertrophy",
      age: 28,
      heightCm: 178,
      currentWeightKg: 75,
      targetWeightKg: 80,
      activityLevel: "moderately_active",
      equipmentAccess: "gym",
      injuries: ["knee"],
    },
    fixedNow
  );
  assert.equal(malePlan.bmr, 1728);
  assert.ok(malePlan.dailyCalorieTarget > malePlan.tdee);
  assert.ok(malePlan.excludedExercises.includes("Jump Squat"));
  assert.ok(malePlan.weeklyRoutine[0]?.title.includes("Thân trên:"));
});

test("projectMilestoneWeights computes loss (7700), gain (5500), maintenance, and missing inputs", () => {
  assert.equal(milestoneIndexForDay(0), 0);
  assert.equal(milestoneIndexForDay(7), 1);
  assert.equal(milestoneIndexForDay(14), 2);
  assert.equal(milestoneIndexForDay(28), 3);

  const loss = projectMilestoneWeights({
    currentWeightKg: 60,
    targetWeightKg: 58,
    dailyCalorieGapKcal: 500,
  });
  assert.equal(loss.hasProjection, true);
  // 500 * 7 / 7700 ~= 0.4545 kg -> 59.545 kg
  assert.ok(loss.byDay[7].projectedWeightKg < 60 && loss.byDay[7].projectedWeightKg > 59);
  // Clamped to 2 kg total loss at Day 28 (500 * 28 / 7700 = 1.818)
  assert.ok(loss.byDay[28].projectedChangeKg <= 2);

  const gain = projectMilestoneWeights({
    currentWeightKg: 60,
    targetWeightKg: 61,
    dailyCalorieGapKcal: 350,
  });
  // 350 * 28 / 5500 = 1.78 -> clamped to 1 kg target gain
  assert.equal(gain.byDay[28].projectedWeightKg, 61);
  assert.equal(gain.byDay[28].remainingKg, 0);

  const maintain = projectMilestoneWeights({
    currentWeightKg: 60,
    targetWeightKg: 60,
    dailyCalorieGapKcal: 0,
  });
  assert.equal(maintain.hasProjection, false);
  assert.equal(maintain.byDay[28].projectedWeightKg, 60);

  const noWeight = projectMilestoneWeights({});
  assert.equal(noWeight.hasWeight, false);
  assert.equal(noWeight.hasProjection, false);
});

test("formatCalorieGap formats deficit, surplus, and <10 kcal maintenance consistently", () => {
  const deficit = formatCalorieGap(2000, 1600);
  assert.equal(deficit.direction, "deficit");
  assert.equal(deficit.predictionLine, "1600 kcal/ngày (ít hơn mức tiêu hao khoảng 400 kcal)");
  assert.ok(deficit.todayGoalLine.includes("giảm cân"));

  const surplus = formatCalorieGap(2000, 2350);
  assert.equal(surplus.direction, "surplus");
  assert.equal(surplus.predictionLine, "2350 kcal/ngày (nhiều hơn mức tiêu hao khoảng 350 kcal)");
  assert.ok(surplus.todayGoalLine.includes("tăng cân"));

  const maint = formatCalorieGap(2000, 1995);
  assert.equal(maint.direction, "maintenance");
  assert.equal(maint.predictionLine, "1995 kcal/ngày (giữ mức tiêu hao)");
  assert.equal(maint.todayGoalLine, "Ăn bằng mức tiêu hao để giữ cân.");
});

test("todayPresetForPlan adapts workout copy for archetype and fasting window for protocol", () => {
  const femaleDefault = todayPresetForPlan(DEFAULT_SAMPLE_PLAN, "16:8");
  assert.equal(DEFAULT_SAMPLE_PLAN.recommendedWaterMl, 2100);
  assert.equal(femaleDefault.workoutTitle, "Pilates siết cơ bụng & thẳng vai");
  assert.equal(femaleDefault.fastingHabitTitle, "Không ăn vặt sau 20:00 tối");
  assert.equal(
    femaleDefault.describeFasting(new Date(2026, 10, 25, 14, 30)),
    "Nhịn ăn 16:8 · trong giờ ăn, còn 5h 30m · khung ăn 12:00–20:00"
  );

  const malePlan = { ...DEFAULT_SAMPLE_PLAN, archetype: "male_strength" as const };
  const male186 = todayPresetForPlan(malePlan, "18:6");
  assert.equal(male186.workoutTitle, "Sức mạnh thân trên & cơ lõi");
  assert.equal(male186.workoutHabitTitle, "Hoàn thành 18 phút bài tập sức mạnh");
  assert.equal(male186.fastingHabitTitle, "Không ăn vặt sau 18:00");
  assert.equal(
    male186.describeFasting(new Date(2026, 10, 25, 20, 0)),
    "Nhịn ăn 18:6 · đã nhịn 2h 00m / 18 giờ · khung ăn 12:00–18:00"
  );
});
