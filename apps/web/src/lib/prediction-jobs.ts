import crypto from "crypto";
import {
  MILESTONE_DAYS,
  MilestoneDay,
  signedMilestoneUrl,
} from "./prediction-storage";

export const PROMPT_VERSION = "v3.1-goal-aware";

const GENERIC_GENERATION_MESSAGE =
  "Không thể sinh ảnh dự đoán lúc này. Vui lòng thử lại sau ít phút.";

/**
 * `message` is for server logs (may contain operator hints such as API-key or
 * model configuration); only `userMessage` is ever shown to end users.
 */
export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly code: "SAFETY" | "QUOTA" | "CONFIG" | "UPSTREAM",
    public readonly userMessage: string = GENERIC_GENERATION_MESSAGE
  ) {
    super(message);
    this.name = "GenerationError";
  }

  get isSafetyFilter(): boolean {
    return this.code === "SAFETY";
  }
}

export type PredictionGoalDirection = "lose" | "gain" | "maintain";

export interface BiometricDeltas {
  bodyFatChangePct: number;
  waistChangeCm: number;
  leanMassGainKg?: number;
  muscleChanges: string;
}

export interface MilestoneSpec {
  day: number;
  week: number;
  title: string;
  goalDirection: PredictionGoalDirection;
  deltas: BiometricDeltas;
}

export interface PhotoQualityAssessment {
  isValid: boolean;
  onePerson: boolean;
  isNearFullBody: boolean;
  goodLighting: boolean;
  detectedGender: "male" | "female" | "uncertain";
  genderMismatchWarning?: string;
  errorMessage?: string;
}

export type JobStatus = "queued" | "running" | "done" | "failed";

export interface PredictionJob {
  jobId: string;
  createdAt: number;
  updatedAt: number;
  status: JobStatus;
  progress: {
    current: number;
    total: number;
    percent: number;
    stageMessage: string;
  };
  detectedGender: "male" | "female" | "uncertain";
  genderMismatchWarning?: string;
  /** Secret returned once to the creator; required to poll or delete the job. */
  accessToken: string;
  cacheKey: string;
  completedDays: MilestoneDay[];
  prompts: Record<number, string>;
  error?: {
    code: string;
    message: string;
    isSafetyFilter?: boolean;
  };
  cached: boolean;
}

// In-memory job repository. Jobs live for JOB_TTL_MS; the images themselves stay in
// private storage until the user deletes them.
// NOTE: this only works on a single long-lived Node process (`next start`).
// Serverless deployments need the durable job store planned in docs/adr/0002.
const JOB_TTL_MS = 60 * 60 * 1000;
const globalForJobs = globalThis as unknown as {
  __gAiJobs?: Map<string, PredictionJob>;
  __gAiPredictionRateLimit?: Map<string, { count: number; resetAt: number }>;
};
const globalJobs = (globalForJobs.__gAiJobs ??= new Map<string, PredictionJob>());

function pruneExpiredJobs(now: number = Date.now()) {
  for (const [id, job] of globalJobs) {
    if (now - job.updatedAt > JOB_TTL_MS) globalJobs.delete(id);
  }
}

// Rate limiter: IP/Session tracking (max 5 generation calls per 10 minutes),
// persisted on globalThis so Next.js HMR / chunk reloads do not reset quotas.
const rateLimiterStore = (globalForJobs.__gAiPredictionRateLimit ??= new Map<
  string,
  { count: number; resetAt: number }
>());

/**
 * Best-effort client identifier for rate limiting. Prefers trusted platform/proxy
 * headers (`x-vercel-forwarded-for` when running on Vercel, `x-real-ip`, or the
 * rightmost `x-forwarded-for` hop only when `TRUST_PROXY=1`) so client-spoofed
 * leftmost `x-forwarded-for` hops cannot bypass rate limits.
 */
export function getClientId(headers: Headers): string {
  const vercelIp = process.env.VERCEL
    ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : undefined;
  const realIp = headers.get("x-real-ip")?.trim();
  const trustedForwarded =
    process.env.TRUST_PROXY === "1"
      ? headers
          .get("x-forwarded-for")
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .at(-1)
      : undefined;

  return (vercelIp || realIp || trustedForwarded || "anonymous").slice(0, 128);
}

export function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  if (rateLimiterStore.size > 10_000) {
    for (const [key, entry] of rateLimiterStore) {
      if (now > entry.resetAt) rateLimiterStore.delete(key);
    }
  }
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 5;

  const record = rateLimiterStore.get(clientId);
  if (!record || now > record.resetAt) {
    rateLimiterStore.set(clientId, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}

// Rule-based delta calculations with realistic 28-day ceilings
export function calculateMilestoneDeltas(
  currentWeight: number,
  targetWeight: number,
  isMale: boolean
): Record<number, MilestoneSpec> {
  if (targetWeight > currentWeight) {
    const gainDelta = targetWeight - currentWeight;
    const factor = Math.min(1.4, Math.max(0.6, gainDelta / 4.0));

    return {
      7: {
        day: 7,
        week: 1,
        title: "Tuần 1: Kích hoạt cơ bắp & Cân bằng tư thế",
        goalDirection: "gain",
        deltas: {
          bodyFatChangePct: 0,
          waistChangeCm: 0,
          leanMassGainKg: Number((0.3 * factor).toFixed(1)),
          muscleChanges:
            "slightly fuller muscle glycogen volume, upright relaxed shoulders and activated core support",
        },
      },
      14: {
        day: 14,
        week: 2,
        title: "Tuần 2: Tăng độ đầy cơ & Vững khung thân",
        goalDirection: "gain",
        deltas: {
          bodyFatChangePct: 0,
          waistChangeCm: 0,
          leanMassGainKg: Number((0.7 * factor).toFixed(1)),
          muscleChanges: isMale
            ? "subtly fuller upper chest, shoulders and arms with stronger upright torso alignment"
            : "subtly firmer glutes, toned legs and balanced core with improved upright posture",
        },
      },
      28: {
        day: 28,
        week: 4,
        title: "Tuần 4: Tăng cơ nạc khỏe khoắn & Trục thẳng 0°",
        goalDirection: "gain",
        deltas: {
          bodyFatChangePct: 0,
          waistChangeCm: 0,
          leanMassGainKg: Number((1.3 * factor).toFixed(1)),
          muscleChanges: isMale
            ? "fuller lean muscle across pectorals, deltoids, arms and upper back with broad upright posture and firm core"
            : "firmer lifted glutes, sculpted toned legs, balanced shoulders and upright elongated posture with healthy athletic fullness",
        },
      },
    };
  }

  if (targetWeight === currentWeight) {
    return {
      7: {
        day: 7,
        week: 1,
        title: "Tuần 1: Căn chỉnh trục cột sống & Giảm căng vai cổ",
        goalDirection: "maintain",
        deltas: {
          bodyFatChangePct: 0,
          waistChangeCm: 0,
          muscleChanges: "released upper trapezius tension and subtly steadier upright core posture",
        },
      },
      14: {
        day: 14,
        week: 2,
        title: "Tuần 2: Săn chắc cơ lõi & Giữ cân khỏe mạnh",
        goalDirection: "maintain",
        deltas: {
          bodyFatChangePct: 0.4,
          waistChangeCm: 0.5,
          muscleChanges: "engaged deep abdominal core, balanced shoulder alignment and subtle muscle tone",
        },
      },
      28: {
        day: 28,
        week: 4,
        title: "Tuần 4: Tái cân bằng cơ – mỡ & Tư thế vững vàng",
        goalDirection: "maintain",
        deltas: {
          bodyFatChangePct: 0.8,
          waistChangeCm: 1.0,
          muscleChanges: isMale
            ? "balanced athletic muscle tone, open chest, retracted scapulae and firm core at a healthy steady weight"
            : "balanced toned silhouette, upright elongated neck and firm core at a healthy steady weight",
        },
      },
    };
  }

  const totalWeightDelta = Math.max(0, currentWeight - targetWeight);
  const factor = Math.min(1.4, Math.max(0.6, totalWeightDelta / 4.0));

  return {
    7: {
      day: 7,
      week: 1,
      title: "Tuần 1: Giảm phù nề & Kích hoạt cơ hoành",
      goalDirection: "lose",
      deltas: {
        bodyFatChangePct: Number((0.6 * factor).toFixed(1)),
        waistChangeCm: Number((1.0 * factor).toFixed(1)),
        muscleChanges:
          "slightly flatter lower abdomen from lymphatic drainage, released upper trapezius tension",
      },
    },
    14: {
      day: 14,
      week: 2,
      title: "Tuần 2: Căn chỉnh cột sống & Siết cơ ngang bụng",
      goalDirection: "lose",
      deltas: {
        bodyFatChangePct: Number((1.4 * factor).toFixed(1)),
        waistChangeCm: Number((2.0 * factor).toFixed(1)),
        muscleChanges:
          "visibly cinched transverse abdominal core, shoulders relaxed and retracted backward, subtle abdominal contour",
      },
    },
    28: {
      day: 28,
      week: 4,
      title: "Tuần 4: Vóc dáng chuẩn mực & Trục thẳng 0°",
      goalDirection: "lose",
      deltas: {
        bodyFatChangePct: Number((2.5 * factor).toFixed(1)),
        waistChangeCm: Number((3.5 * factor).toFixed(1)),
        muscleChanges: isMale
          ? "sculpted natural waistline, open chest, retracted scapulae with 0 degree thoracic slouch, firm core and lateral latissimus dorsi"
          : "sculpted hourglass waistline, upright elongated neck line with zero hunching, lifted gluteal contour and firm core",
      },
    },
  };
}

// Build standardized rule-based prompt string
export function buildImageEditPrompt(spec: MilestoneSpec): string {
  const { deltas, week, goalDirection } = spec;
  let bodyChangeClause: string;
  if (goalDirection === "gain") {
    bodyChangeClause = `about ${deltas.leanMassGainKg ?? 0.5} kg fuller lean muscle mass, ${deltas.muscleChanges}`;
  } else if (goalDirection === "maintain") {
    bodyChangeClause =
      deltas.bodyFatChangePct > 0
        ? `${deltas.bodyFatChangePct}% subtle body recomposition, ${deltas.muscleChanges}`
        : deltas.muscleChanges;
  } else {
    bodyChangeClause = `${deltas.bodyFatChangePct}% lower body fat, waist about ${deltas.waistChangeCm} cm smaller, ${deltas.muscleChanges}`;
  }

  return `Edit this photo of the same person. Keep the face, identity, gender, skin tone, hairstyle, pose, clothing, background, camera angle and lighting EXACTLY the same. Change ONLY the body shape: ${bodyChangeClause}. The result must look realistic and natural for ${week} weeks of training, subtle to moderate, no exaggeration, no airbrushing, no added muscle definition beyond what is described. Do not change the person's age, ethnicity or gender.`;
}

// Cache key over the FULL photo plus every input that affects the output.
// (Hashing only a prefix let two different photos with the same JPEG header and
// length share a key, i.e. one user could be served another user's images.)
export function computePredictionHash(
  rawBase64: string,
  archetype: string,
  weight: number,
  targetWeight: number,
  planSummary: string,
  modelName: string
): string {
  return crypto
    .createHash("sha256")
    .update(rawBase64)
    .update("\u0000")
    .update(JSON.stringify([archetype, weight, targetWeight, planSummary, PROMPT_VERSION, modelName]))
    .digest("hex");
}

// Job store management
export function createPredictionJob(
  cacheKey: string,
  detectedGender: "male" | "female" | "uncertain",
  genderMismatchWarning: string | undefined,
  prompts: Record<number, string>
): PredictionJob {
  pruneExpiredJobs();
  const now = Date.now();
  const job: PredictionJob = {
    jobId: `job_${crypto.randomUUID()}`,
    accessToken: crypto.randomBytes(32).toString("hex"),
    cacheKey,
    createdAt: now,
    updatedAt: now,
    status: "queued",
    progress: {
      current: 0,
      total: 3,
      percent: 0,
      stageMessage: "Đang xếp hàng khởi tạo...",
    },
    detectedGender,
    genderMismatchWarning,
    completedDays: [],
    prompts,
    cached: false,
  };

  globalJobs.set(job.jobId, job);
  return job;
}

export function getPredictionJob(jobId: string): PredictionJob | null {
  const job = globalJobs.get(jobId);
  if (!job) return null;
  if (Date.now() - job.updatedAt > JOB_TTL_MS) {
    globalJobs.delete(jobId);
    return null;
  }
  return job;
}

export function deletePredictionJob(jobId: string): void {
  globalJobs.delete(jobId);
}

export function updatePredictionJob(jobId: string, patch: Partial<PredictionJob>): PredictionJob | null {
  const existing = globalJobs.get(jobId);
  if (!existing) return null;

  const updated: PredictionJob = {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  };

  globalJobs.set(jobId, updated);
  return updated;
}

/** Day -> short-lived signed image URL, for the job's finished milestones. */
export function signedMilestones(job: Pick<PredictionJob, "cacheKey" | "completedDays">): Record<number, string> {
  const out: Record<number, string> = {};
  for (const day of MILESTONE_DAYS) {
    if (job.completedDays.includes(day)) out[day] = signedMilestoneUrl(job.cacheKey, day);
  }
  return out;
}

/** Public view of a job: never includes the access token, cache key or prompts. */
export function serializeJob(job: PredictionJob) {
  return {
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    detectedGender: job.detectedGender,
    genderMismatchWarning: job.genderMismatchWarning,
    completedMilestones: signedMilestones(job),
    error: job.error,
    cached: job.cached,
    updatedAt: job.updatedAt,
  };
}
