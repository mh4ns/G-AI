import { NextRequest, NextResponse } from "next/server";
import { deletePredictionJob, getPredictionJob } from "@/lib/prediction-jobs";
import { deleteMilestones, tokensMatch } from "@/lib/prediction-storage";

/**
 * Deletes a user's generated images and job. Requires the job token that was
 * returned when the job was created, so nobody else can delete (or confirm the
 * existence of) someone's images.
 */
export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const jobToken = typeof body.jobToken === "string" ? body.jobToken : "";

  const job = jobId ? getPredictionJob(jobId) : null;
  if (!job || !tokensMatch(job.accessToken, jobToken)) {
    return NextResponse.json(
      {
        success: false,
        code: "JOB_NOT_FOUND",
        error: "Không tìm thấy phiên tạo sinh để xóa (có thể đã hết hạn).",
      },
      { status: 404 }
    );
  }

  deleteMilestones(job.cacheKey);
  deletePredictionJob(job.jobId);

  return NextResponse.json({
    success: true,
    message: "Ảnh dự đoán và phiên tạo sinh đã được xóa khỏi máy chủ.",
  });
}

export async function POST(request: NextRequest) {
  return DELETE(request);
}
