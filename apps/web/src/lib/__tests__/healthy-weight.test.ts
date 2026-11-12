import test from "node:test";
import assert from "node:assert";
import { healthyWeightRangeKg, minSafeTargetWeightKg } from "../quiz-calculations";

test("healthy range at 165 cm is 51-67 kg (BMI 18.5-24.9)", () => {
  assert.deepStrictEqual(healthyWeightRangeKg(165), { min: 51, max: 67 });
});

test("the target floor never falls below BMI 18.5", () => {
  for (const h of [140, 150, 162, 165, 175, 190, 210]) {
    const floor = minSafeTargetWeightKg(h);
    assert.ok(floor / (h / 100) ** 2 >= 18.5, `${h} cm -> ${floor} kg`);
    // ...and is the lowest whole kilogram that satisfies it.
    assert.ok((floor - 1) / (h / 100) ** 2 < 18.5, `${h} cm floor is not minimal`);
  }
});

test("the old quiz default (50 kg at 165 cm) is below the floor", () => {
  assert.ok(50 < minSafeTargetWeightKg(165));
});
