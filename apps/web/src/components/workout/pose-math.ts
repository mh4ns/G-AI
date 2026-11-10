/**
 * Pure pose maths for the AI Live PT studio: joint angles, rep counting and
 * form scoring. No DOM, no MediaPipe import, so it is unit-testable and cheap
 * to run on every video frame.
 */

export interface PosePoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** One exercise as the studio uses it (from the backend or the built-in defaults). */
export interface StudioExercise {
  code: string;
  name: string;
  /** Short coaching cue, spoken and shown in the HUD. */
  cue: string;
  /** Human-readable target, e.g. "Góc gối 80°–100°". */
  criteria: string;
  /** Three MediaPipe landmark indices; the angle is measured at the middle one. */
  joints: [number, number, number];
  targetMin: number;
  targetMax: number;
  /** Reps to finish the exercise, or seconds to hold when `holdSeconds` is true. */
  targetCount: number;
  holdSeconds: boolean;
}

/** Minimum landmark visibility for an angle to be trusted. */
export const MIN_VISIBILITY = 0.5;
/** Degrees the angle must move back out of the zone before a rep counts (noise guard). */
export const REP_EXIT_MARGIN = 12;
/** Frames the angle must stay in the zone before the rep is "armed". */
export const REP_MIN_ZONE_FRAMES = 3;
/** Frames within this many degrees of the zone count as the working phase for scoring. */
export const WORKING_PHASE_MARGIN = 30;

const toDeg = 180 / Math.PI;

/** Angle ABC in degrees (0–180), measured at B, in the image plane. */
export function jointAngle(a: PosePoint, b: PosePoint, c: PosePoint): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return NaN;
  const cos = (abx * cbx + aby * cby) / (magAB * magCB);
  return Math.acos(Math.min(1, Math.max(-1, cos))) * toDeg;
}

/**
 * MediaPipe body landmarks from 11 up come in left/right pairs: odd = left,
 * the next even index = the same joint on the right.
 */
export function mirrorJoints(joints: readonly [number, number, number]): [number, number, number] | null {
  if (!joints.every((j) => j >= 11 && j <= 32)) return null;
  return joints.map((j) => (j % 2 === 1 ? j + 1 : j - 1)) as [number, number, number];
}

function sideVisibility(landmarks: readonly PosePoint[], joints: readonly number[]): number {
  let min = 1;
  for (const j of joints) {
    const p = landmarks[j];
    if (!p) return 0;
    min = Math.min(min, p.visibility ?? 1);
  }
  return min;
}

/**
 * Measures the exercise angle on whichever body side the camera sees best.
 * Returns null when neither side is visible enough.
 */
export function measureExerciseAngle(
  landmarks: readonly PosePoint[],
  joints: readonly [number, number, number]
): { angle: number; joints: [number, number, number] } | null {
  const candidates: [number, number, number][] = [[...joints] as [number, number, number]];
  const mirrored = mirrorJoints(joints);
  if (mirrored) candidates.push(mirrored);

  let best: { vis: number; joints: [number, number, number] } | null = null;
  for (const c of candidates) {
    const vis = sideVisibility(landmarks, c);
    if (vis >= MIN_VISIBILITY && (!best || vis > best.vis)) best = { vis, joints: c };
  }
  if (!best) return null;
  const [a, b, c] = best.joints;
  const angle = jointAngle(landmarks[a]!, landmarks[b]!, landmarks[c]!);
  return Number.isFinite(angle) ? { angle, joints: best.joints } : null;
}

export type ZonePosition = "below" | "in" | "above";

export function zonePosition(angle: number, min: number, max: number): ZonePosition {
  if (angle < min) return "below";
  if (angle > max) return "above";
  return "in";
}

/** Distance in degrees from the target zone (0 when inside). */
export function distanceFromZone(angle: number, min: number, max: number): number {
  if (angle < min) return min - angle;
  if (angle > max) return angle - max;
  return 0;
}

export interface TrackerUpdate {
  /** A full rep was completed on this frame. */
  repCompleted: boolean;
  zone: ZonePosition;
  /** The frame is near or inside the zone, i.e. it counts towards the form score. */
  working: boolean;
}

/**
 * Counts reps as "enter the target zone, then leave it again", with a short
 * dwell and an exit margin so jitter at the zone edge does not double-count.
 * Also tracks the form score: the share of working-phase frames that are
 * inside the zone.
 */
export class RepTracker {
  private zoneFrames = 0;
  private armed = false;
  private workingFrames = 0;
  private inZoneFrames = 0;

  constructor(
    private readonly min: number,
    private readonly max: number
  ) {}

  update(angle: number): TrackerUpdate {
    const zone = zonePosition(angle, this.min, this.max);
    const dist = distanceFromZone(angle, this.min, this.max);
    const working = dist <= WORKING_PHASE_MARGIN;

    if (working) {
      this.workingFrames++;
      if (zone === "in") this.inZoneFrames++;
    }

    let repCompleted = false;
    if (zone === "in") {
      this.zoneFrames++;
      if (this.zoneFrames >= REP_MIN_ZONE_FRAMES) this.armed = true;
    } else {
      this.zoneFrames = 0;
      if (this.armed && dist >= REP_EXIT_MARGIN) {
        this.armed = false;
        repCompleted = true;
      }
    }
    return { repCompleted, zone, working };
  }

  /** 0–100, or null before any working-phase frame was seen. */
  get formScore(): number | null {
    if (this.workingFrames === 0) return null;
    return Math.round((this.inZoneFrames / this.workingFrames) * 100);
  }

  get frames(): { working: number; inZone: number } {
    return { working: this.workingFrames, inZone: this.inZoneFrames };
  }
}

/** Weighted mean of per-exercise frame counts → overall form score, or null without data. */
export function overallFormScore(parts: readonly { working: number; inZone: number }[]): number | null {
  let working = 0;
  let inZone = 0;
  for (const p of parts) {
    working += p.working;
    inZone += p.inZone;
  }
  return working === 0 ? null : Math.round((inZone / working) * 100);
}

/**
 * Rough active-calorie estimate for low-impact bodyweight training
 * (≈4.5 MET at 65 kg). Shown as an estimate, never as a measurement.
 */
export function estimateCalories(durationSec: number): number {
  const kcalPerMinute = (4.5 * 3.5 * 65) / 200;
  return Math.max(0, Math.round((durationSec / 60) * kcalPerMinute));
}

/** Backend exercise shape (see apps/backend/app/schemas/workout.py). */
export interface ApiExerciseLike {
  code: string;
  name: string;
  description: string;
  instructions: string[];
  landmark_joints: number[];
  target_angle_min: number | null;
  target_angle_max: number | null;
}

/**
 * Converts backend exercises into studio exercises, dropping any the camera
 * cannot score (missing joints or angle range).
 */
export function exercisesFromApi(
  rows: readonly ApiExerciseLike[],
  repsByCode: Readonly<Record<string, number>> = {},
  defaultReps = 10
): StudioExercise[] {
  const out: StudioExercise[] = [];
  for (const r of rows) {
    const j = r.landmark_joints;
    if (!Array.isArray(j) || j.length !== 3 || !j.every((n) => Number.isInteger(n) && n >= 0 && n <= 32)) continue;
    if (r.target_angle_min == null || r.target_angle_max == null) continue;
    const min = Math.min(r.target_angle_min, r.target_angle_max);
    const max = Math.max(r.target_angle_min, r.target_angle_max);
    const reps = repsByCode[r.code];
    out.push({
      code: r.code,
      name: r.name,
      cue: r.instructions?.[1] ?? r.instructions?.[0] ?? r.description,
      criteria: `Góc khớp mục tiêu ${Math.round(min)}°–${Math.round(max)}°`,
      joints: [j[0]!, j[1]!, j[2]!],
      targetMin: min,
      targetMax: max,
      targetCount: reps && reps > 0 ? Math.min(reps, 50) : defaultReps,
      holdSeconds: false,
    });
  }
  return out;
}

/** Used when the backend is unreachable. Joint indices follow MediaPipe Pose. */
export const DEFAULT_EXERCISES: StudioExercise[] = [
  {
    code: "squat",
    name: "Squat Căn Chỉnh Trục Hông",
    cue: "Đẩy hông ra sau như ngồi vào ghế, giữ ngực mở và lưng thẳng tự nhiên.",
    criteria: "Góc gối 80°–100° ở điểm thấp nhất",
    joints: [23, 25, 27],
    targetMin: 80,
    targetMax: 100,
    targetCount: 10,
    holdSeconds: false,
  },
  {
    code: "plank",
    name: "Plank Siết Cơ Ngang Bụng",
    cue: "Gồng chắc cơ bụng, thở đều, giữ một đường thẳng từ vai đến gót chân.",
    criteria: "Vai–hông–gót thẳng hàng 165°–180° (đặt camera nhìn ngang)",
    joints: [11, 23, 27],
    targetMin: 165,
    targetMax: 180,
    targetCount: 30,
    holdSeconds: true,
  },
  {
    code: "wall_angel",
    name: "Mở Vai & Sửa Gù Lưng Trên",
    cue: "Ép sát bả vai, từ từ trượt cánh tay lên cao rồi hạ xuống chậm.",
    criteria: "Tay nâng qua đầu: góc khuỷu–vai–hông 140°–180°",
    joints: [13, 11, 23],
    targetMin: 140,
    targetMax: 180,
    targetCount: 8,
    holdSeconds: false,
  },
];

/** Skeleton edges to draw (subset of MediaPipe POSE_CONNECTIONS, body only). */
export const BODY_CONNECTIONS: readonly [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 31],
  [28, 32],
  [27, 29],
  [28, 30],
];
