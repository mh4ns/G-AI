import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXERCISES,
  RepTracker,
  estimateCalories,
  exercisesFromApi,
  jointAngle,
  measureExerciseAngle,
  mirrorJoints,
  overallFormScore,
  type PosePoint,
} from "../pose-math";

test("jointAngle measures the angle at the middle point", () => {
  assert.equal(Math.round(jointAngle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })), 90);
  assert.equal(Math.round(jointAngle({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })), 180);
  assert.ok(Number.isNaN(jointAngle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })));
});

test("mirrorJoints swaps left/right body landmarks", () => {
  assert.deepEqual(mirrorJoints([23, 25, 27]), [24, 26, 28]);
  assert.deepEqual(mirrorJoints([13, 11, 23]), [14, 12, 24]);
  assert.equal(mirrorJoints([0, 11, 23]), null);
});

function pose(points: Record<number, PosePoint>): PosePoint[] {
  const out: PosePoint[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  for (const [k, v] of Object.entries(points)) out[Number(k)] = v;
  return out;
}

test("measureExerciseAngle uses the better-visible side and rejects hidden joints", () => {
  const p = pose({
    23: { x: 0.4, y: 0.5, visibility: 0.2 },
    25: { x: 0.4, y: 0.7, visibility: 0.2 },
    27: { x: 0.4, y: 0.9, visibility: 0.2 },
    24: { x: 0.6, y: 0.5, visibility: 0.9 },
    26: { x: 0.6, y: 0.7, visibility: 0.9 },
    28: { x: 0.8, y: 0.7, visibility: 0.9 },
  });
  const m = measureExerciseAngle(p, [23, 25, 27]);
  assert.ok(m);
  assert.deepEqual(m.joints, [24, 26, 28]);
  assert.equal(Math.round(m.angle), 90);
  assert.equal(measureExerciseAngle(pose({}), [23, 25, 27]), null);
});

test("RepTracker counts enter-then-leave cycles and ignores edge jitter", () => {
  const t = new RepTracker(80, 100);
  const run = (angles: number[]) => angles.reduce((n, a) => n + (t.update(a).repCompleted ? 1 : 0), 0);
  // Two clean squats: stand (170) → bottom (90) → stand.
  assert.equal(run([170, 140, 110, 95, 90, 88, 92, 120, 170, 130, 95, 90, 90, 115, 170]), 2);
  // A single noisy frame in the zone does not count.
  assert.equal(run([170, 95, 170]), 0);
  // Jitter just outside the zone edge does not complete a rep.
  assert.equal(run([90, 90, 90, 104, 96, 105, 95]), 0);
  assert.equal(run([140]), 1);
});

test("RepTracker form score is the share of working-phase frames inside the zone", () => {
  const t = new RepTracker(80, 100);
  assert.equal(t.formScore, null);
  [170, 175].forEach((a) => t.update(a)); // resting, not scored
  assert.equal(t.formScore, null);
  [90, 90, 90, 125].forEach((a) => t.update(a)); // 3 in zone, 1 working but outside
  assert.equal(t.formScore, 75);
  assert.equal(overallFormScore([t.frames, { working: 4, inZone: 1 }]), 50);
  assert.equal(overallFormScore([]), null);
});

test("exercisesFromApi keeps scorable exercises and applies routine reps", () => {
  const list = exercisesFromApi(
    [
      {
        code: "pilates_squat",
        name: "Squat",
        description: "d",
        instructions: ["a", "b"],
        landmark_joints: [23, 25, 27],
        target_angle_min: 100,
        target_angle_max: 80,
      },
      { code: "x", name: "X", description: "d", instructions: [], landmark_joints: [1, 2], target_angle_min: 1, target_angle_max: 2 },
      { code: "y", name: "Y", description: "d", instructions: [], landmark_joints: [11, 23, 25], target_angle_min: null, target_angle_max: 2 },
    ],
    { pilates_squat: 12 }
  );
  assert.equal(list.length, 1);
  assert.equal(list[0]!.targetMin, 80);
  assert.equal(list[0]!.targetMax, 100);
  assert.equal(list[0]!.targetCount, 12);
  assert.equal(list[0]!.cue, "b");
});

test("defaults and calorie estimate are sane", () => {
  assert.ok(DEFAULT_EXERCISES.length >= 3);
  for (const e of DEFAULT_EXERCISES) assert.ok(e.targetMin < e.targetMax && e.joints.length === 3);
  assert.equal(estimateCalories(0), 0);
  assert.ok(estimateCalories(600) > 30 && estimateCalories(600) < 80);
});
