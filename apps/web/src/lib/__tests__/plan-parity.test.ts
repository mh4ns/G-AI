import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { calculatePersonalizedPlan } from "../quiz-calculations";
import type { QuizResponses } from "@/types/quiz";

// Same fixture is asserted by apps/backend/tests/test_quiz_and_plan.py.
const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../../../../packages/shared-types/fixtures/plan-vectors.json"), "utf8")
);

for (const { input, expected } of fixture.vectors) {
  test(`plan maths parity: ${input.gender}, ${input.age}y, ${input.currentWeightKg}->${input.targetWeightKg}kg`, () => {
    const r = calculatePersonalizedPlan({
      ...input,
      goal: "lose_weight",
      focusAreas: [],
      dietPreference: "balanced",
      obstacles: [],
      equipmentAccess: "home",
      injuries: [],
    } as QuizResponses);
    assert.deepStrictEqual(
      {
        bmi: r.bmi,
        bmr: r.bmr,
        tdee: r.tdee,
        dailyCalorieTarget: r.dailyCalorieTarget,
        calorieDeficitDaily: r.calorieDeficitDaily,
        estimatedWeeks: r.estimatedWeeks,
        recommendedWaterMl: r.recommendedWaterMl,
      },
      expected
    );
  });
}
