import { NextRequest, NextResponse } from "next/server";
import { getPredictionJob, serializeJob } from "@/lib/prediction-jobs";
import { tokensMatch } from "@/lib/prediction-storage";

export async function GET(request: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = jobId ? getPredictionJob(jobId) : null;

  // Unknown job and wrong token look the same, so job ids cannot be probed.
  if (!job || !tokensMatch(job.accessToken, request.headers.get("x-job-token"))) {
    return NextResponse.json(
      {
        success: false,
        code: "JOB_NOT_FOUND",
        error: "Không tìm thấy tác vụ tạo sinh này hoặc tác vụ đã hết hạn.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { success: true, ...serializeJob(job) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
