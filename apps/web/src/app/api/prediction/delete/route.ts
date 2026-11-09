import { NextRequest, NextResponse } from "next/server";
import { deleteUserPredictionCache, getPredictionJob } from "@/lib/prediction-jobs";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { cacheKey, jobId } = body;

    let targetCacheKey = cacheKey;

    if (!targetCacheKey && jobId) {
      const job = getPredictionJob(jobId);
      if (job) {
        // extract cacheKey from milestone URLs if available (e.g. /generated/{hash}_day_7.jpg)
        const urls = Object.values(job.completedMilestones);
        for (const url of urls) {
          const match = url.match(/\/generated\/([a-f0-9]+)_day_/);
          if (match && match[1]) {
            targetCacheKey = match[1];
            break;
          }
        }
      }
    }

    if (targetCacheKey) {
      deleteUserPredictionCache(targetCacheKey);
    }

    return NextResponse.json({
      success: true,
      message: "Toàn bộ dữ liệu ảnh và phiên tạo sinh đã được xóa sạch hoàn toàn khỏi máy chủ.",
    });
  } catch (err: any) {
    console.error("[API prediction/delete] Error:", err);
    return NextResponse.json(
      {
        success: false,
        code: "SERVER_ERROR",
        error: "Không thể xóa dữ liệu ảnh do lỗi máy chủ.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return DELETE(request);
}
