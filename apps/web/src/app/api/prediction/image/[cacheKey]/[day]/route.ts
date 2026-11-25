import { NextRequest, NextResponse } from "next/server";
import { isMilestoneDay, readMilestoneWithMime, verifyMilestoneSignature } from "@/lib/prediction-storage";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cacheKey: string; day: string }> }
) {
  const { cacheKey, day } = await context.params;
  const dayNum = Number(day);
  const { searchParams } = request.nextUrl;

  if (
    !isMilestoneDay(dayNum) ||
    !verifyMilestoneSignature(cacheKey, dayNum, searchParams.get("exp"), searchParams.get("sig"))
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = readMilestoneWithMime(cacheKey, dayNum);
  if (!result) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.mimeType,
      // Personal biometric image: browser may cache privately, shared caches must not.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
