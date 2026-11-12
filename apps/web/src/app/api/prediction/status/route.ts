import { NextResponse } from "next/server";
import { resolveImageProvider } from "@/lib/image-providers";

export const dynamic = "force-dynamic";

/** Tells the client whether photo-based predictions are available (no secrets exposed). */
export async function GET() {
  const provider = resolveImageProvider();
  return NextResponse.json(
    { enabled: provider !== null, provider: provider?.name ?? "none" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
