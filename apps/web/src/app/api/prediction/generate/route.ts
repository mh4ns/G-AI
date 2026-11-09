import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  calculateMilestoneDeltas,
  buildImageEditPrompt,
  computePredictionHash,
  saveMilestoneToDisk,
  checkDiskCache,
  assessPhotoQualityAndGender,
  callGeminiImageToImage,
  checkRateLimit,
  createPredictionJob,
  getPredictionJob,
  updatePredictionJob,
} from "@/lib/prediction-jobs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Step 6: Verify User Consent
    if (!body.consentAccepted) {
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
    const clientIp = req.headers.get("x-forwarded-for") || "local-client";
    const rateCheck = checkRateLimit(clientIp);
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

    const archetype = body.archetype || "female_pilates";
    const isMale = archetype === "male_strength";
    const weight = Number(body.weight) || (isMale ? 76 : 56);
    const targetWeight = Number(body.targetWeight) || (isMale ? 72 : 50);
    const planSummary = body.planSummary || "Standard 4-week kinetic adaptation";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    const imageModel = process.env.IMAGE_MODEL || "gemini-2.5-flash";
    const visionModel = process.env.VISION_MODEL || "gemini-1.5-flash";

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

    const cachedDay7 = checkDiskCache(cacheKey, 7);
    const cachedDay14 = checkDiskCache(cacheKey, 14);
    const cachedDay28 = checkDiskCache(cacheKey, 28);

    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    if (cachedDay7 && cachedDay14 && cachedDay28) {
      const existingJob = createPredictionJob(jobId, cacheKey, isMale ? "male" : "female", undefined, promptRecord);
      updatePredictionJob(jobId, {
        status: "done",
        cached: true,
        progress: {
          current: 3,
          total: 3,
          percent: 100,
          stageMessage: "Kết quả đã sẵn sàng từ bộ nhớ đệm.",
        },
        completedMilestones: {
          7: cachedDay7,
          14: cachedDay14,
          28: cachedDay28,
        },
      });

      return NextResponse.json({
        success: true,
        jobId,
        status: "done",
        cached: true,
      });
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

    // Create queued job
    const job = createPredictionJob(
      jobId,
      cacheKey,
      assessment.detectedGender,
      assessment.genderMismatchWarning,
      promptRecord
    );

    // 5. Launch Background Worker (Async Execution)
    // Run asynchronously without blocking response
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

      const targetDays = [7, 14, 28];
      const completedUrls: Record<number, string> = {};

      try {
        for (let i = 0; i < targetDays.length; i++) {
          const day = targetDays[i];
          const weekNum = day === 7 ? 1 : day === 14 ? 2 : 4;

          updatePredictionJob(jobId, {
            progress: {
              current: i,
              total: 3,
              percent: Math.round((i / 3) * 90),
              stageMessage: `Đang tạo sinh ảnh Tuần ${weekNum} (${i + 1}/3)...`,
            },
          });

          // Check if single milestone in cache
          const existingCached = checkDiskCache(cacheKey, day);
          if (existingCached) {
            completedUrls[day] = existingCached;
          } else {
            const promptText = promptRecord[day];
            const dataUrl = await callGeminiImageToImage(
              apiKey,
              imageModel,
              rawBase64,
              mimeType,
              promptText,
              2 // Max 2 retries
            );
            const savedUrl = saveMilestoneToDisk(cacheKey, day, dataUrl);
            completedUrls[day] = savedUrl;
          }

          // Update job progress incrementally so frontend polling sees each photo as it finishes
          updatePredictionJob(jobId, {
            completedMilestones: { ...completedUrls },
          });
        }

        // Job completed successfully
        updatePredictionJob(jobId, {
          status: "done",
          progress: {
            current: 3,
            total: 3,
            percent: 100,
            stageMessage: "Đã hoàn thành toàn bộ 3 mốc dự đoán.",
          },
          completedMilestones: completedUrls,
        });
      } catch (err: any) {
        console.error(`[Prediction Job ${jobId}] Failed:`, err);
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
    return NextResponse.json({
      success: true,
      jobId,
      status: "queued",
      cached: false,
      genderMismatchWarning: assessment.genderMismatchWarning,
    });
  } catch (error: any) {
    console.error("[Prediction API] Generate error:", error);
    return NextResponse.json(
      {
        success: false,
        code: "SERVER_ERROR",
        error: error?.message || "Lỗi xử lý yêu cầu sinh ảnh.",
      },
      { status: 500 }
    );
  }
}
