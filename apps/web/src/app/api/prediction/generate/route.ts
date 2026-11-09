import { NextRequest, NextResponse } from "next/server";
import {
  calculateMilestoneDeltas,
  buildImageEditPrompt,
  computePredictionHash,
  assessPhotoQualityAndGender,
  callGeminiImageToImage,
  checkRateLimit,
  createPredictionJob,
  getClientId,
  serializeJob,
  updatePredictionJob,
} from "@/lib/prediction-jobs";
import { MILESTONE_DAYS, MilestoneDay, hasMilestone, saveMilestone } from "@/lib/prediction-storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Step 6: Verify User Consent
    if (body.consentAccepted !== true) {
      return NextResponse.json(
        {
          success: false,
          code: "CONSENT_REQUIRED",
          error: "Vui lòng xác nhận đồng ý để AI xử lý ảnh thể trạng của bạn.",
        },
        { status: 400 }
      );
    }

    // 2. Step 6: Rate Limiting (max 5 calls per 10 mins)
    const rateCheck = checkRateLimit(getClientId(req.headers));
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: "RATE_LIMITED",
          error: "Bạn đã vượt quá giới hạn tạo ảnh (tối đa 5 lần trong 10 phút). Vui lòng thử lại sau.",
        },
        { status: 429 }
      );
    }

    const userPhotoBase64 = body.userPhotoBase64 || null;
    if (!userPhotoBase64 || typeof userPhotoBase64 !== "string") {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PHOTO",
          error: "Thiếu ảnh Day 0 của người dùng. Vui lòng tải ảnh lên.",
        },
        { status: 400 }
      );
    }

    // Validate size (< 10MB) & MIME
    const mimeMatch = userPhotoBase64.match(/^data:(image\/(jpeg|png|webp));base64,/i);
    if (!mimeMatch) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_MIME",
          error: "Định dạng ảnh không hợp lệ. Vui lòng sử dụng tệp JPEG, PNG hoặc WebP.",
        },
        { status: 400 }
      );
    }

    const mimeType = mimeMatch[1];
    const rawBase64 = userPhotoBase64.replace(/^data:image\/\w+;base64,/, "");

    // Check base64 byte size (< 10MB approx 13.5MB base64)
    if (rawBase64.length > 14 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          code: "FILE_TOO_LARGE",
          error: "Kích thước ảnh vượt quá giới hạn 10MB. Vui lòng thu nhỏ ảnh trước khi gửi.",
        },
        { status: 400 }
      );
    }

    const archetype: "female_pilates" | "male_strength" =
      body.archetype === "male_strength" ? "male_strength" : "female_pilates";
    const isMale = archetype === "male_strength";
    const clampKg = (v: unknown, fallback: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 30 && n <= 250 ? n : fallback;
    };
    const weight = clampKg(body.weight, isMale ? 76 : 56);
    const targetWeight = clampKg(body.targetWeight, isMale ? 72 : 50);
    // Free text is only used in the cache key, never in prompts; cap its size.
    const planSummary =
      typeof body.planSummary === "string" ? body.planSummary.slice(0, 200) : "Standard 4-week kinetic adaptation";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_API_KEY",
          error: "Chưa nhận diện được GEMINI_API_KEY. Vui lòng kiểm tra file apps/web/.env.local và khởi động lại server Next.js (Ctrl+C rồi npm run dev) để hệ thống nhận key.",
        },
        { status: 400 }
      );
    }

    const imageModel = process.env.IMAGE_MODEL || "gemini-2.5-flash-image";
    const visionModel = process.env.VISION_MODEL || "gemini-3-flash-preview";

    // Compute rule-based prompts
    const milestoneSpecs = calculateMilestoneDeltas(weight, targetWeight, isMale);
    const promptRecord: Record<number, string> = {
      7: buildImageEditPrompt(milestoneSpecs[7]),
      14: buildImageEditPrompt(milestoneSpecs[14]),
      28: buildImageEditPrompt(milestoneSpecs[28]),
    };

    // 3. Step 6: Cache Verification via SHA-256
    const cacheKey = computePredictionHash(
      rawBase64,
      archetype,
      weight,
      targetWeight,
      planSummary,
      imageModel
    );

    if (MILESTONE_DAYS.every((day) => hasMilestone(cacheKey, day))) {
      const job = createPredictionJob(cacheKey, isMale ? "male" : "female", undefined, promptRecord);
      const done = updatePredictionJob(job.jobId, {
        status: "done",
        cached: true,
        completedDays: [...MILESTONE_DAYS],
        progress: {
          current: 3,
          total: 3,
          percent: 100,
          stageMessage: "Kết quả đã sẵn sàng từ bộ nhớ đệm.",
        },
      })!;

      return NextResponse.json({ success: true, jobToken: job.accessToken, ...serializeJob(done) });
    }

    // 4. Step 4: Photo Validation & Gender Consistency Check (Vision Intake)
    const assessment = await assessPhotoQualityAndGender(
      apiKey,
      visionModel,
      rawBase64,
      mimeType,
      archetype
    );

    if (!assessment.isValid) {
      return NextResponse.json(
        {
          success: false,
          code: "QUALITY_VALIDATION_FAILED",
          error: assessment.errorMessage,
        },
        { status: 422 }
      );
    }

    const job = createPredictionJob(
      cacheKey,
      assessment.detectedGender,
      assessment.genderMismatchWarning,
      promptRecord
    );
    const jobId = job.jobId;

    // Background worker. Runs after the response on a long-lived Node server
    // (`next start`); see docs/adr/0002 for the durable-queue follow-up.
    (async () => {
      updatePredictionJob(jobId, {
        status: "running",
        progress: {
          current: 0,
          total: 3,
          percent: 10,
          stageMessage: "Đang phân tích và khởi tạo vóc dáng mốc Tuần 1...",
        },
      });

      const completedDays: MilestoneDay[] = [];

      try {
        for (let i = 0; i < MILESTONE_DAYS.length; i++) {
          const day = MILESTONE_DAYS[i];
          const weekNum = day === 7 ? 1 : day === 14 ? 2 : 4;

          updatePredictionJob(jobId, {
            progress: {
              current: i,
              total: 3,
              percent: Math.round((i / 3) * 90),
              stageMessage: `Đang tạo sinh ảnh Tuần ${weekNum} (${i + 1}/3)...`,
            },
          });

          if (!hasMilestone(cacheKey, day)) {
            const dataUrl = await callGeminiImageToImage(
              apiKey,
              imageModel,
              rawBase64,
              mimeType,
              promptRecord[day],
              2 // Max 2 retries
            );
            saveMilestone(cacheKey, day, dataUrl);
          }

          completedDays.push(day);
          // Incremental update so polling clients see each image as soon as it exists.
          updatePredictionJob(jobId, { completedDays: [...completedDays] });
        }

        updatePredictionJob(jobId, {
          status: "done",
          progress: {
            current: 3,
            total: 3,
            percent: 100,
            stageMessage: "Đã hoàn thành toàn bộ 3 mốc dự đoán.",
          },
        });
      } catch (err: any) {
        // Log without the request body or model output: both may contain the user's photo.
        console.error(`[Prediction Job ${jobId}] Failed:`, err?.message || "unknown error");
        updatePredictionJob(jobId, {
          status: "failed",
          error: {
            code: err?.isSafetyFilter ? "CONTENT_SAFETY_VIOLATION" : "GENERATION_ERROR",
            message:
              err?.message ||
              "Không thể sinh ảnh dự đoán. Vui lòng kiểm tra lại ảnh chụp và thử lại.",
            isSafetyFilter: Boolean(err?.isSafetyFilter),
          },
        });
      }
    })();

    // Return job_id immediately (Step 3 Async Requirement)
    return NextResponse.json({ success: true, jobToken: job.accessToken, ...serializeJob(job) });
  } catch (error: any) {
    console.error("[Prediction API] Generate error:", error?.message || "unknown error");
    return NextResponse.json(
      {
        success: false,
        code: "SERVER_ERROR",
        error: "Lỗi xử lý yêu cầu sinh ảnh.",
      },
      { status: 500 }
    );
  }
}
