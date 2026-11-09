import { NextRequest, NextResponse } from "next/server";
import { getPredictionJob } from "@/lib/prediction-jobs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, code: "MISSING_JOB_ID", error: "Thiếu mã định danh tác vụ (jobId)" },
        { status: 400 }
      );
    }

    const job = getPredictionJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          code: "JOB_NOT_FOUND",
          error: "Không tìm thấy tác vụ tạo sinh này hoặc tác vụ đã hết hạn.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      detectedGender: job.detectedGender,
      genderMismatchWarning: job.genderMismatchWarning,
      completedMilestones: job.completedMilestones,
      error: job.error,
      cached: job.cached,
      updatedAt: job.updatedAt,
    });
  } catch (err: any) {
    console.error("[API prediction/[jobId]] Error:", err);
    return NextResponse.json(
      {
        success: false,
        code: "SERVER_ERROR",
        error: "Lỗi nội bộ máy chủ khi kiểm tra trạng thái tác vụ.",
      },
      { status: 500 }
    );
  }
}
