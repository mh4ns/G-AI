import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Current prompt version for cache invalidation
const PROMPT_VERSION = "v2.0-img2img-consistent";

interface BiometricDeltas {
  bodyFatChangePct: number;
  waistChangeCm: number;
  muscleChanges: string;
}

interface MilestoneSpec {
  day: number;
  week: number;
  title: string;
  deltas: BiometricDeltas;
}

// Rule-based delta calculation with realistic physiological ceilings for 28-day kinetic protocol
function calculateMilestoneDeltas(
  currentWeight: number,
  targetWeight: number,
  isMale: boolean
): Record<number, MilestoneSpec> {
  const totalWeightDelta = Math.max(0, currentWeight - targetWeight);
  const factor = Math.min(1.5, Math.max(0.5, totalWeightDelta / 4.0));

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
function buildImageEditPrompt(spec: MilestoneSpec): string {
  const { deltas, week } = spec;
  return `Edit this photo of the same person. Keep the face, identity, gender, skin tone, hairstyle, pose, clothing, background, camera angle and lighting EXACTLY the same. Change ONLY the body shape: ${deltas.bodyFatChangePct}% lower body fat, waist about ${deltas.waistChangeCm} cm smaller, ${deltas.muscleChanges}. The result must look realistic and natural for ${week} weeks of training, subtle to moderate, no exaggeration, no airbrushing, no added muscle definition beyond what is described. Do not change the person's age, ethnicity or gender.`;
}

// Helper to call Gemini Image-to-Image editing API with retry, timeout and backoff
async function callGeminiImageToImage(
  apiKey: string,
  modelName: string,
  base64Image: string,
  mimeType: string,
  promptText: string,
  maxRetries: number = 2
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

    try {
      if (attempt > 0) {
        // Exponential backoff: 1.5s, 3s
        await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, attempt - 1)));
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        const errBody = await res.text().catch(() => "");
        throw new Error(`Gemini API error [${res.status} ${res.statusText}]: ${errBody.slice(0, 300)}`);
      }

      const data = await res.json();
      const candidates = data.candidates || [];
      const parts = candidates[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || "image/jpeg";
          return `data:${outMime};base64,${part.inlineData.data}`;
        }
      }

      throw new Error("Gemini API succeeded but returned no image bytes in candidates parts.");
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      console.warn(`[Generate-Twin] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, err?.message || err);
    }
  }

  throw lastError || new Error("Failed to generate edited image after retries.");
}

// Cache storage helper (saves to public/generated/{hash}_day_{day}.jpg)
function saveToDiskCache(cacheKey: string, day: number, dataUrl: string): string {
  try {
    const publicGenDir = path.join(process.cwd(), "public", "generated");
    if (!fs.existsSync(publicGenDir)) {
      fs.mkdirSync(publicGenDir, { recursive: true });
    }

    const filename = `${cacheKey}_day_${day}.jpg`;
    const filePath = path.join(publicGenDir, filename);

    // Extract base64
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    return `/generated/${filename}`;
  } catch (err) {
    console.warn("[Generate-Twin] Could not save to disk cache, returning data URL directly:", err);
    return dataUrl;
  }
}

function checkDiskCache(cacheKey: string, day: number): string | null {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const archetype = body.archetype || "female_pilates";
    const isMale = archetype === "male_strength";
    const age = body.age || 26;
    const height = body.height || (isMale ? 175 : 162);
    const weight = body.weight || (isMale ? 78 : 56);
    const targetWeight = body.targetWeight || (isMale ? 72 : 50);
    const postureIssue = body.postureIssue || "Võng lưng & gù vai cổ nhẹ";
    const userPhotoBase64 = body.userPhotoBase64 || null;

    // Configurable models via environment variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    const isKeyValid = Boolean(apiKey && apiKey !== "your_gemini_api_key_here");
    const imageModel = process.env.IMAGE_MODEL || "gemini-2.5-flash";
    const visionModel = process.env.VISION_MODEL || "gemini-1.5-flash";

    // Calibrated fallback assets
    const defaultMilestones = isMale
      ? [
          userPhotoBase64 || "/twins/male-day-0.png",
          "/twins/male-day-7.png",
          "/twins/male-day-14.png",
          "/twins/male-day-28.png",
        ]
      : [
          userPhotoBase64 || "/twins/female-day-0.png",
          "/twins/female-day-7.png",
          "/twins/female-day-14.png",
          "/twins/female-day-28.png",
        ];

    // Compute rule-based milestone specs and prompt deltas
    const milestoneSpecs = calculateMilestoneDeltas(weight, targetWeight, isMale);

    const prompts = [
      {
        day: 0,
        stage: "Day 0 - Xuất phát điểm",
        title: "Khởi đầu & Đo góc lệch",
        prompt: "Day 0 original reference photograph.",
      },
      {
        day: 7,
        stage: "Tuần 1 - Kích hoạt",
        title: milestoneSpecs[7].title,
        prompt: buildImageEditPrompt(milestoneSpecs[7]),
      },
      {
        day: 14,
        stage: "Tuần 2 - Tái căn chỉnh",
        title: milestoneSpecs[14].title,
        prompt: buildImageEditPrompt(milestoneSpecs[14]),
      },
      {
        day: 28,
        stage: "Tuần 4 - Vóc dáng mục tiêu",
        title: milestoneSpecs[28].title,
        prompt: buildImageEditPrompt(milestoneSpecs[28]),
      },
    ];

    // If no user photo or no valid API key, return diagnosis info and calibrated fallbacks
    if (!userPhotoBase64) {
      return NextResponse.json({
        success: false,
        error: "MISSING_USER_PHOTO",
        message: "Chưa có ảnh Day 0 của người dùng. Vui lòng tải ảnh lên để AI thực hiện chỉnh sửa vóc dáng.",
        isMockFallback: true,
        milestoneImages: defaultMilestones,
        prompts,
      });
    }

    if (!isKeyValid) {
      return NextResponse.json({
        success: false,
        error: "MISSING_OR_INVALID_API_KEY",
        message: "GEMINI_API_KEY chưa được cấu hình hoặc đang là giá trị placeholder trong .env.local.",
        isMockFallback: true,
        milestoneImages: defaultMilestones,
        prompts,
        diagnosis: {
          keyPresent: Boolean(apiKey),
          keyValid: false,
          imageModel,
          visionModel,
        },
      });
    }

    // Prepare clean Base64 and MIME type
    const mimeMatch = userPhotoBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const rawBase64 = userPhotoBase64.replace(/^data:image\/\w+;base64,/, "");

    // Step 6: Cache key based on SHA-256 of (Day 0 Photo + Plan + Deltas + Prompt Version + Model)
    const cacheInput = `${rawBase64.slice(0, 1000)}_${rawBase64.length}_${archetype}_${weight}_${targetWeight}_${JSON.stringify(milestoneSpecs)}_${PROMPT_VERSION}_${imageModel}`;
    const cacheKey = crypto.createHash("sha256").update(cacheInput).digest("hex").slice(0, 16);

    // Check if all 3 milestones are already in disk cache
    const cachedDay7 = checkDiskCache(cacheKey, 7);
    const cachedDay14 = checkDiskCache(cacheKey, 14);
    const cachedDay28 = checkDiskCache(cacheKey, 28);

    if (cachedDay7 && cachedDay14 && cachedDay28) {
      return NextResponse.json({
        success: true,
        cached: true,
        cacheKey,
        isMockFallback: false,
        milestoneImages: [userPhotoBase64, cachedDay7, cachedDay14, cachedDay28],
        prompts,
        engine: {
          imageModel,
          visionModel,
          cacheHit: true,
        },
      });
    }

    // Step 4: Parallel generation of 3 milestones (Day 7, Day 14, Day 28)
    // ALWAYS using Day 0 original photo as source reference to prevent identity drifting
    const targetDays = [7, 14, 28];
    const generationPromises = targetDays.map(async (day) => {
      // Check individual cache first
      const cached = checkDiskCache(cacheKey, day);
      if (cached) return { day, url: cached, fromCache: true };

      const promptText = buildImageEditPrompt(milestoneSpecs[day]);
      const dataUrl = await callGeminiImageToImage(
        apiKey,
        imageModel,
        rawBase64,
        mimeType,
        promptText,
        2 // Max 2 retries with backoff
      );

      const savedUrl = saveToDiskCache(cacheKey, day, dataUrl);
      return { day, url: savedUrl, fromCache: false };
    });

    const results = await Promise.allSettled(generationPromises);

    const generatedUrls: Record<number, string> = {};
    const errors: Array<{ day: number; reason: string }> = [];

    results.forEach((res, idx) => {
      const day = targetDays[idx];
      if (res.status === "fulfilled") {
        generatedUrls[day] = res.value.url;
      } else {
        errors.push({ day, reason: res.reason?.message || "Unknown generation error" });
      }
    });

    // Check if at least some milestones succeeded
    const finalMilestoneImages = [
      userPhotoBase64, // Day 0 is always original photo
      generatedUrls[7] || defaultMilestones[1],
      generatedUrls[14] || defaultMilestones[2],
      generatedUrls[28] || defaultMilestones[3],
    ];

    const allSucceeded = errors.length === 0;

    return NextResponse.json({
      success: allSucceeded,
      partialSuccess: !allSucceeded && Object.keys(generatedUrls).length > 0,
      cached: false,
      cacheKey,
      isMockFallback: Object.keys(generatedUrls).length === 0,
      milestoneImages: finalMilestoneImages,
      prompts,
      generationErrors: errors.length > 0 ? errors : undefined,
      engine: {
        imageModel,
        visionModel,
        generationTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Generate-Twin] Unexpected pipeline failure:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_PIPELINE_ERROR",
        message: error?.message || "Lỗi xử lý luồng tạo sinh ảnh.",
      },
      { status: 500 }
    );
  }
}
