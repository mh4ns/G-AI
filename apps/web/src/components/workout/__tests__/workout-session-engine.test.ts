import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WorkoutSessionEngine,
  VoiceCoach,
  zoneHint,
  WorkoutSummaryData,
} from "../workout-session-engine";
import { createSaveOnceGuard } from "../LiveWorkoutStudio";
import { DEFAULT_EXERCISES, StudioExercise, PosePoint } from "../pose-math";

describe("VoiceCoach", () => {
  it("initializes with mute state and updates", () => {
    const coach = new VoiceCoach(false);
    coach.setMuted(true);
    // In headless Node without window.speechSynthesis, speak() exits safely without throwing
    assert.doesNotThrow(() => coach.speak("Sẵn sàng"));
  });
});

describe("WorkoutSessionEngine", () => {
  it("initializes with default exercises and clean snapshot", () => {
    const engine = new WorkoutSessionEngine();
    const snap = engine.getSnapshot();

    assert.equal(snap.exerciseIndex, 0);
    assert.equal(snap.count, 0);
    assert.equal(snap.isPaused, false);
    assert.equal(snap.isMuted, false);
    assert.equal(snap.cameraState, "off");
    assert.equal(snap.formScore, null);
    assert.equal(snap.summary, null);
    assert.equal(snap.exercises.length, DEFAULT_EXERCISES.length);
    assert.equal(snap.currentExercise.code, DEFAULT_EXERCISES[0]!.code);

    engine.dispose();
  });

  it("notifies subscribers when state changes", () => {
    const engine = new WorkoutSessionEngine();
    let updates = 0;
    const unsubscribe = engine.subscribe(() => {
      updates++;
    });

    // subscribe immediately fires initial snapshot
    assert.equal(updates, 1);

    engine.addCount(1);
    assert.equal(updates, 2);
    assert.equal(engine.getSnapshot().count, 1);

    engine.pause();
    assert.equal(updates, 3);
    assert.equal(engine.getSnapshot().isPaused, true);

    engine.resume();
    assert.equal(updates, 4);
    assert.equal(engine.getSnapshot().isPaused, false);

    unsubscribe();
    engine.addCount(1);
    // No more updates after unsubscribe
    assert.equal(updates, 4);

    engine.dispose();
  });

  it("advances exercises and completes routine upon reaching target counts", () => {
    const testExercises: StudioExercise[] = [
      {
        code: "test_1",
        name: "Test Exercise 1",
        cue: "Cue 1",
        criteria: "Criteria 1",
        targetCount: 2,
        holdSeconds: false,
        joints: [11, 13, 15],
        targetMin: 60,
        targetMax: 100,
      },
      {
        code: "test_2",
        name: "Test Exercise 2",
        cue: "Cue 2",
        criteria: "Criteria 2",
        targetCount: 1,
        holdSeconds: false,
        joints: [12, 14, 16],
        targetMin: 70,
        targetMax: 110,
      },
    ];

    let completedSummary: WorkoutSummaryData | null = null;
    const engine = new WorkoutSessionEngine({
      exercises: testExercises,
      onSummary: (summary) => {
        completedSummary = summary;
      },
    });

    assert.equal(engine.getSnapshot().exerciseIndex, 0);

    // Rep 1 of exercise 1
    engine.addCount(1);
    assert.equal(engine.getSnapshot().count, 1);
    assert.equal(engine.getSnapshot().exerciseIndex, 0);

    // Rep 2 reaches targetCount -> advances to exercise 2
    engine.addCount(1);
    assert.equal(engine.getSnapshot().exerciseIndex, 1);
    assert.equal(engine.getSnapshot().count, 0);
    assert.equal(engine.getSnapshot().currentExercise.code, "test_2");

    // Rep 1 of exercise 2 reaches targetCount -> completes workout!
    engine.addCount(1);
    const snap = engine.getSnapshot();
    assert.notEqual(snap.summary, null);
    assert.equal(snap.summary?.repsCompleted, 3);
    const summaryCaptured = completedSummary as unknown as WorkoutSummaryData;
    assert.equal(summaryCaptured?.repsCompleted, 3);
    assert.ok(snap.summary?.caloriesBurned !== undefined && snap.summary.caloriesBurned >= 0);

    engine.dispose();
  });

  it("processPoseFrame headlessly updates live angle and form score without DOM/camera", () => {
    const engine = new WorkoutSessionEngine();

    // Create a synthetic 33-point pose landmark set
    const syntheticPose: PosePoint[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));

    // DEFAULT_EXERCISES[0] is squat with joints [23, 25, 27] (hip, knee, ankle)
    // Position hip (23), knee (25), ankle (27) for a 90-degree right angle
    syntheticPose[23] = { x: 0.5, y: 0.3, z: 0, visibility: 0.95 };
    syntheticPose[25] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
    syntheticPose[27] = { x: 0.7, y: 0.5, z: 0, visibility: 0.95 };

    engine.processPoseFrame(syntheticPose, 1000);
    const snap = engine.getSnapshot();

    assert.equal(snap.liveAngle, 90);
    assert.ok(snap.formStatus.length > 0);

    engine.dispose();
  });

  it("zoneHint provides descriptive coaching text for target ranges", () => {
    const ex = DEFAULT_EXERCISES[0]!;
    assert.equal(zoneHint(ex, "in", true), "Chuẩn! Đang trong vùng góc mục tiêu");
    assert.ok(zoneHint(ex, "below", true).includes("Góc nhỏ hơn mục tiêu"));
    assert.ok(zoneHint(ex, "above", true).includes("Góc lớn hơn mục tiêu"));
  });

  it("completeWorkout invokes onSummary at most once even if triggered repeatedly", () => {
    let summaryCalls = 0;
    const engine = new WorkoutSessionEngine({
      onSummary: () => {
        summaryCalls++;
      },
    });

    engine.completeWorkout();
    engine.completeWorkout();
    assert.equal(summaryCalls, 1);
    assert.ok(engine.getSnapshot().summary !== null);
    engine.dispose();
  });

  it("completed single-exercise session keeps summary even when exerciseIndex and count are 0", () => {
    const oneExercise: StudioExercise[] = [
      {
        code: "single_plank",
        name: "Plank",
        cue: "Hold",
        criteria: "Straight back",
        targetCount: 10,
        holdSeconds: true,
        joints: [11, 23, 25],
        targetMin: 165,
        targetMax: 185,
      },
    ];
    const engine = new WorkoutSessionEngine({ exercises: oneExercise });
    engine.nextExercise();
    const snap = engine.getSnapshot();
    assert.equal(snap.exerciseIndex, 0);
    assert.equal(snap.count, 0);
    assert.ok(snap.summary !== null);
    engine.dispose();
  });
});

describe("createSaveOnceGuard", () => {
  it("invokes onSave at most once per completed workout and resets only for a new session", () => {
    const guard = createSaveOnceGuard();
    const saved: WorkoutSummaryData[] = [];
    const summary: WorkoutSummaryData = {
      caloriesBurned: 95,
      averageFormScore: 88,
      durationMinutes: 12,
      repsCompleted: 40,
    };

    assert.equal(guard.trySave<WorkoutSummaryData>(null, (s) => saved.push(s)), false);
    assert.equal(guard.trySave(summary, (s) => saved.push(s)), true);
    assert.equal(guard.trySave(summary, (s) => saved.push(s)), false);
    assert.equal(saved.length, 1);

    guard.reset();
    assert.equal(guard.trySave(summary, (s) => saved.push(s)), true);
    assert.equal(saved.length, 2);
  });
});
