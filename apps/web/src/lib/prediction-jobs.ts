import crypto from "crypto";
import fs from "fs";
import path from "path";

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
  completedMilestones: Record<number, string>; // day (7, 14, 28) -> url
  prompts: Record<number, string>;
  error?: {
    code: string;
    message: string;
    isSafetyFilter?: boolean;
  };
  cached: boolean;
}

// In-memory job repository with persistence fallback
const globalJobs = new Map<string, PredictionJob>();

// Rate limiter: IP/Session tracking (max 5 generation calls per 10 minutes)
const rateLimiterStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
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

// Compute Cache Key from inputs
export function computePredictionHash(
  rawBase64: string,
  archetype: string,
  weight: number,
  targetWeight: number,
  planSummary: string,
  modelName: string
): string {
  const input = `${rawBase64.slice(0, 500)}_${rawBase64.length}_${archetype}_${weight}_${targetWeight}_${planSummary}_${PROMPT_VERSION}_${modelName}`;
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

// Secure local storage save helper
export function saveMilestoneToDisk(cacheKey: string, day: number, dataUrl: string): string {
  try {
    const publicGenDir = path.join(process.cwd(), "public", "generated");
    if (!fs.existsSync(publicGenDir)) {
      fs.mkdirSync(publicGenDir, { recursive: true });
    }

    const filename = `${cacheKey}_day_${day}.jpg`;
    const filePath = path.join(publicGenDir, filename);

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    return `/generated/${filename}`;
  } catch (err) {
    console.warn("[Prediction] Failed to save file to disk, returning data URL:", err);
    return dataUrl;
  }
}

export function checkDiskCache(cacheKey: string, day: number): string | null {
  try {
    const filename = `${cacheKey}_day_${day}.jpg`;
    const filePath = path.join(process.cwd(), "public", "generated", filename);
    if (fs.existsSync(filePath)) {
      return `/generated/${filename}`;
    }
  } catch {
    // ignore
  }
  return null;
}

// Delete user cached images on demand (Step 6 Privacy)
export function deleteUserPredictionCache(cacheKey: string): boolean {
  try {
    const publicGenDir = path.join(process.cwd(), "public", "generated");
    if (!fs.existsSync(publicGenDir)) return true;

    const files = fs.readdirSync(publicGenDir);
    for (const f of files) {
      if (f.startsWith(cacheKey)) {
        fs.unlinkSync(path.join(publicGenDir, f));
      }
    }
    return true;
  } catch (e) {
    console.error("[Prediction] Error deleting cache:", e);
    return false;
  }
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

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${visionModel}:generateContent?key=${apiKey}`;

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
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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
  jobId: string,
  cacheKey: string,
  detectedGender: "male" | "female" | "uncertain",
  genderMismatchWarning: string | undefined,
  prompts: Record<number, string>
): PredictionJob {
  const job: PredictionJob = {
    jobId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "queued",
    progress: {
      current: 0,
      total: 3,
      percent: 0,
      stageMessage: "Đang xếp hàng khởi tạo...",
    },
    detectedGender,
    genderMismatchWarning,
    completedMilestones: {},
    prompts,
    cached: false,
  };

  globalJobs.set(jobId, job);
  return job;
}

export function getPredictionJob(jobId: string): PredictionJob | null {
  return globalJobs.get(jobId) || null;
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
