import crypto from "crypto";
import {
  MILESTONE_DAYS,
  MilestoneDay,
  signedMilestoneUrl,
} from "./prediction-storage";

export const PROMPT_VERSION = "v3.0-identity-preserving";

export interface BiometricDeltas {
  bodyFatChangePct: number;
  waistChangeCm: number;
  muscleChanges: string;
}

export interface MilestoneSpec {
  day: number;
  week: number;
  title: string;
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
const globalForJobs = globalThis as unknown as { __gAiJobs?: Map<string, PredictionJob> };
const globalJobs = (globalForJobs.__gAiJobs ??= new Map<string, PredictionJob>());

function pruneExpiredJobs(now: number = Date.now()) {
  for (const [id, job] of globalJobs) {
    if (now - job.updatedAt > JOB_TTL_MS) globalJobs.delete(id);
  }
}

// Rate limiter: IP/Session tracking (max 5 generation calls per 10 minutes)
const rateLimiterStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Best-effort client identifier for rate limiting. On Vercel and behind a
 * correctly configured reverse proxy, x-real-ip is set by the platform; the
 * first x-forwarded-for hop is client-controlled and only used as a fallback.
 * Per-user limits replace this once generation moves behind authentication.
 */
export function getClientId(headers: Headers): string {
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anonymous"
  );
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
  const totalWeightDelta = Math.max(0, currentWeight - targetWeight);
  const factor = Math.min(1.4, Math.max(0.6, totalWeightDelta / 4.0));

  return {
    7: {
      day: 7,
      week: 1,
      title: "Tuần 1: Giảm phù nề & Kích hoạt cơ hoành",
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
  const { deltas, week } = spec;
  return `Edit this photo of the same person. Keep the face, identity, gender, skin tone, hairstyle, pose, clothing, background, camera angle and lighting EXACTLY the same. Change ONLY the body shape: ${deltas.bodyFatChangePct}% lower body fat, waist about ${deltas.waistChangeCm} cm smaller, ${deltas.muscleChanges}. The result must look realistic and natural for ${week} weeks of training, subtle to moderate, no exaggeration, no airbrushing, no added muscle definition beyond what is described. Do not change the person's age, ethnicity or gender.`;
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

// Step 4: Validate Day 0 Photo (Quality, 1 person, lighting, and gender consistency)
export async function assessPhotoQualityAndGender(
  apiKey: string,
  visionModel: string,
  rawBase64: string,
  mimeType: string,
  quizArchetype: "female_pilates" | "male_strength"
): Promise<PhotoQualityAssessment> {
  const quizGender = quizArchetype === "male_strength" ? "male" : "female";

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    // Graceful offline assessment for dev environments
    return {
      isValid: true,
      onePerson: true,
      isNearFullBody: true,
      goodLighting: true,
      detectedGender: quizGender,
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${visionModel}:generateContent`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an AI biometric intake validator for a body adaptation fitness app. Analyze this photo and respond ONLY with a JSON object:
{
  "onePerson": boolean (true if exactly one adult is in the frame),
  "isNearFullBody": boolean (true if visible at least from mid-thigh up),
  "goodLighting": boolean (true if lighting and focus are clear without severe blur or dark shadows),
  "detectedGender": "male" | "female" | "uncertain" (perceived biological gender presentation of the person in the photo),
  "safetyOk": boolean (true if apparel is appropriate athletic wear and not violating safety policies)
}`,
              },
              {
                inlineData: {
                  mimeType,
                  data: rawBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          if (!parsed.onePerson) {
            return {
              isValid: false,
              onePerson: false,
              isNearFullBody: parsed.isNearFullBody ?? true,
              goodLighting: parsed.goodLighting ?? true,
              detectedGender: parsed.detectedGender || "uncertain",
              errorMessage: "Ảnh cần có đúng 1 người. Vui lòng chụp một mình để AI nhận diện vóc dáng chính xác.",
            };
          }

          if (!parsed.isNearFullBody) {
            return {
              isValid: false,
              onePerson: true,
              isNearFullBody: false,
              goodLighting: parsed.goodLighting ?? true,
              detectedGender: parsed.detectedGender || "uncertain",
              errorMessage: "Ảnh chưa thấy đủ vóc dáng (cần thấy từ đùi trở lên hoặc toàn thân). Vui lòng đứng lùi xa hơn.",
            };
          }

          if (!parsed.goodLighting) {
            return {
              isValid: false,
              onePerson: true,
              isNearFullBody: true,
              goodLighting: false,
              detectedGender: parsed.detectedGender || "uncertain",
              errorMessage: "Ảnh quá tối hoặc bị mờ. Vui lòng chụp ở nơi đủ ánh sáng và đứng vững.",
            };
          }

          // Check gender mismatch
          let genderMismatchWarning: string | undefined = undefined;
          if (
            parsed.detectedGender &&
            parsed.detectedGender !== "uncertain" &&
            parsed.detectedGender !== quizGender
          ) {
            genderMismatchWarning = `Thông tin quiz (${
              quizGender === "female" ? "Nữ" : "Nam"
            }) và người trong ảnh (${
              parsed.detectedGender === "female" ? "Nữ" : "Nam"
            }) có vẻ không khớp. Mô hình sẽ giữ nguyên giới tính của người trong ảnh để đảm bảo hình ảnh tự nhiên nhất.`;
          }

          return {
            isValid: true,
            onePerson: true,
            isNearFullBody: true,
            goodLighting: true,
            detectedGender: parsed.detectedGender || quizGender,
            genderMismatchWarning,
          };
        }
      }
    }
  } catch (err) {
    console.warn("[Prediction Intake] Photo validation warning:", err);
  }

  // Fallback to valid if network fails
  return {
    isValid: true,
    onePerson: true,
    isNearFullBody: true,
    goodLighting: true,
    detectedGender: quizGender,
  };
}

// Image-to-Image editing via Gemini API with retry & timeout
export async function callGeminiImageToImage(
  apiKey: string,
  modelName: string,
  base64Image: string,
  mimeType: string,
  promptText: string,
  maxRetries: number = 2
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, attempt - 1)));
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Image,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE"],
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch {
          // ignore
        }

        // 1. Quota exceeded on Free Tier
        if (res.status === 429 || errMsg.includes("Quota exceeded") || errMsg.includes("free_tier")) {
          const quotaErr: any = new Error(
            "Tài khoản Google Gemini của bạn đang ở gói Miễn phí (Free Tier), Google quy định hạn mức tạo sinh ảnh là 0 lượt/ngày. Vui lòng kích hoạt thanh toán (Pay-as-you-go) tại aistudio.google.com/app/plan_information."
          );
          quotaErr.isQuotaFilter = true;
          throw quotaErr;
        }

        // 2. Unregistered caller / Missing API key
        if (res.status === 403 && (errMsg.includes("unregistered callers") || errMsg.includes("API Key"))) {
          throw new Error(
            "Chưa nhận diện được Gemini API Key (Lỗi 403 unregistered caller). Hãy kiểm tra GEMINI_API_KEY trong .env.local và khởi động lại server Next.js (Ctrl+C rồi npm run dev)."
          );
        }

        // 3. Model not found or deprecated
        if (res.status === 404) {
          throw new Error(
            `Mô hình ${modelName} không tồn tại hoặc đã ngừng hỗ trợ. Vui lòng kiểm tra biến IMAGE_MODEL trong file .env.local.`
          );
        }

        // 4. Content Safety Filter
        if (res.status === 400 && (errText.includes("SAFETY") || errMsg.includes("safety"))) {
          const safetyErr: any = new Error(
            "Ảnh không đáp ứng tiêu chuẩn an toàn nội dung. Vui lòng chọn ảnh trang phục thể thao kín đáo hơn."
          );
          safetyErr.isSafetyFilter = true;
          throw safetyErr;
        }

        throw new Error(`Gemini API error [${res.status}]: ${errMsg.slice(0, 200)}`);
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || "image/jpeg";
          return `data:${outMime};base64,${part.inlineData.data}`;
        }
      }

      throw new Error("Mô hình phản hồi nhưng không chứa dữ liệu ảnh kết quả.");
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      if (err?.isSafetyFilter) break; // Don't retry safety blocks
    }
  }

  throw lastError || new Error("Thao tác tạo sinh ảnh vượt quá thời gian chờ.");
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
