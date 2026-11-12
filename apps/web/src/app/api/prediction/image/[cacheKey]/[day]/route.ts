import { NextRequest, NextResponse } from "next/server";
import { isMilestoneDay, readMilestone, verifyMilestoneSignature } from "@/lib/prediction-storage";

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

  const image = readMilestone(cacheKey, dayNum);
  if (!image) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/jpeg",
      // Personal biometric image: browser may cache privately, shared caches must not.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
