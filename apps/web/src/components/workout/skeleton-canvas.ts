/**
 * Canvas drawing for the studio: the live MediaPipe skeleton over the mirrored
 * camera feed, and an animated demo figure when the camera is off.
 * Called from a requestAnimationFrame loop; never touches React state.
 */
import { SEMANTIC_COLORS } from "@/lib/design-tokens";
import { BODY_CONNECTIONS, type PosePoint, type StudioExercise, type ZonePosition } from "./pose-math";

export interface Viewport {
  /** Canvas size in CSS pixels. */
  width: number;
  height: number;
}

type Mapper = (p: PosePoint) => { x: number; y: number };

/**
 * Maps normalized landmarks from the video frame to canvas pixels, matching a
 * mirrored `object-fit: cover` <video> that fills the same box.
 */
export function coverMapper(view: Viewport, videoWidth: number, videoHeight: number): Mapper {
  const scale = Math.max(view.width / videoWidth, view.height / videoHeight);
  const ox = (view.width - videoWidth * scale) / 2;
  const oy = (view.height - videoHeight * scale) / 2;
  return (p) => ({
    x: view.width - (p.x * videoWidth * scale + ox),
    y: p.y * videoHeight * scale + oy,
  });
}

/**
 * Fits a 0–1 square of demo coordinates between the status pill at the top
 * and the camera prompt card at the bottom.
 */
function demoMapper(view: Viewport): Mapper {
  const top = 48;
  const bottom = view.width < 640 ? 150 : 110;
  const box = Math.max(120, Math.min(view.width * 0.92, view.height - top - bottom));
  const ox = (view.width - box) / 2;
  const oy = top;
  return (p) => ({ x: ox + p.x * box, y: oy + p.y * box });
}

const ZONE_COLORS: Record<ZonePosition, string> = {
  in: SEMANTIC_COLORS.success,
  below: SEMANTIC_COLORS.warning,
  above: SEMANTIC_COLORS.warning,
};

export interface DrawOptions {
  color: string;
  /** Joints being measured, highlighted with the live angle. */
  measured?: { joints: [number, number, number]; angle: number; zone: ZonePosition } | null;
  minVisibility?: number;
}

function drawSkeleton(ctx: CanvasRenderingContext2D, landmarks: readonly PosePoint[], map: Mapper, opts: DrawOptions) {
  const minVis = opts.minVisibility ?? 0.35;
  const visible = (i: number) => {
    const p = landmarks[i];
    return !!p && (p.visibility ?? 1) >= minVis;
  };

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = opts.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const [a, b] of BODY_CONNECTIONS) {
    if (!visible(a) || !visible(b)) continue;
    const pa = map(landmarks[a]!);
    const pb = map(landmarks[b]!);
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
  }
  ctx.stroke();

  // Head marker from the nose.
  if (visible(0)) {
    const n = map(landmarks[0]!);
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(n.x, n.y, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = opts.color;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.5;
  for (let i = 11; i <= 28; i++) {
    if (!visible(i)) continue;
    const p = map(landmarks[i]!);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const m = opts.measured;
  if (m) {
    const [a, b, c] = m.joints.map((j) => map(landmarks[j]!)) as [
      { x: number; y: number },
      { x: number; y: number },
      { x: number; y: number },
    ];
    const zoneColor = ZONE_COLORS[m.zone];
    ctx.strokeStyle = zoneColor;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.stroke();

    ctx.fillStyle = zoneColor;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
    ctx.fill();

    const label = `${Math.round(m.angle)}°`;
    ctx.font = "700 15px ui-monospace, SFMono-Regular, Menlo, monospace";
    const tw = ctx.measureText(label).width;
    const lx = b.x + 14;
    const ly = b.y - 14;
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.beginPath();
    ctx.roundRect(lx - 6, ly - 15, tw + 12, 22, 6);
    ctx.fill();
    ctx.fillStyle = zoneColor;
    ctx.fillText(label, lx, ly);
  }
}

export function drawLivePose(
  ctx: CanvasRenderingContext2D,
  view: Viewport,
  landmarks: readonly PosePoint[],
  videoWidth: number,
  videoHeight: number,
  opts: DrawOptions
) {
  drawSkeleton(ctx, landmarks, coverMapper(view, videoWidth, videoHeight), opts);
}

// --- Demo figure (camera off) -------------------------------------------------

const STANDING: Record<number, [number, number]> = {
  0: [0.5, 0.17],
  11: [0.44, 0.27],
  12: [0.56, 0.27],
  13: [0.41, 0.4],
  14: [0.59, 0.4],
  15: [0.4, 0.52],
  16: [0.6, 0.52],
  23: [0.46, 0.52],
  24: [0.54, 0.52],
  25: [0.455, 0.7],
  26: [0.545, 0.7],
  27: [0.45, 0.88],
  28: [0.55, 0.88],
  29: [0.455, 0.895],
  30: [0.545, 0.895],
  31: [0.43, 0.9],
  32: [0.57, 0.9],
};

const PLANK: Record<number, [number, number]> = {
  0: [0.2, 0.5],
  11: [0.28, 0.53],
  12: [0.28, 0.53],
  13: [0.28, 0.66],
  14: [0.28, 0.66],
  15: [0.38, 0.66],
  16: [0.38, 0.66],
  23: [0.55, 0.555],
  24: [0.55, 0.555],
  25: [0.7, 0.58],
  26: [0.7, 0.58],
  27: [0.84, 0.6],
  28: [0.84, 0.6],
  29: [0.86, 0.6],
  30: [0.86, 0.6],
  31: [0.85, 0.66],
  32: [0.85, 0.66],
};

type DemoKind = "squat" | "arms" | "floor";

export function demoKind(ex: StudioExercise): DemoKind {
  const mid = ex.joints[1];
  if (mid === 25 || mid === 26) return "squat";
  if (mid >= 11 && mid <= 16) return "arms";
  return "floor";
}

function demoLandmarks(kind: DemoKind, p: number): PosePoint[] {
  const base = kind === "floor" ? PLANK : STANDING;
  const pts: PosePoint[] = [];
  for (const [k, [x, y]] of Object.entries(base)) pts[Number(k)] = { x, y, visibility: 1 };
  const shift = (i: number, dx: number, dy: number) => {
    const q = pts[i];
    if (q) pts[i] = { ...q, x: q.x + dx, y: q.y + dy };
  };

  if (kind === "squat") {
    for (const i of [0, 11, 12, 13, 14]) shift(i, 0, 0.13 * p);
    for (const i of [23, 24]) shift(i, 0, 0.15 * p);
    shift(25, -0.03 * p, 0.03 * p);
    shift(26, 0.03 * p, 0.03 * p);
    // Arms reach forward to shoulder height.
    shift(15, 0.02 * p, (0.13 - 0.22) * p);
    shift(16, -0.02 * p, (0.13 - 0.22) * p);
  } else if (kind === "arms") {
    shift(13, -0.05 * p, -0.2 * p);
    shift(14, 0.05 * p, -0.2 * p);
    shift(15, -0.03 * p, -0.42 * p);
    shift(16, 0.03 * p, -0.42 * p);
  } else {
    // Small breathing drift of the hips during a hold.
    shift(23, 0, -0.015 * p);
    shift(24, 0, -0.015 * p);
  }
  return pts;
}

export function drawDemo(ctx: CanvasRenderingContext2D, view: Viewport, timeMs: number, ex: StudioExercise, color: string) {
  // Centre guide line.
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(view.width / 2, 16);
  ctx.lineTo(view.width / 2, view.height - 16);
  ctx.stroke();
  ctx.setLineDash([]);

  const p = (Math.sin(timeMs / 600) + 1) / 2;
  drawSkeleton(ctx, demoLandmarks(demoKind(ex), p), demoMapper(view), { color });
}
