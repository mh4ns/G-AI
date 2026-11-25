import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Private storage for generated body-prediction images.
 *
 * Images are biometric data, so they never live under `public/`. They are
 * written to a private directory and served only through
 * `/api/prediction/image/[cacheKey]/[day]` with a short-lived HMAC signature.
 */

export const MILESTONE_DAYS = [7, 14, 28] as const;
export type MilestoneDay = (typeof MILESTONE_DAYS)[number];
export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";

const CACHE_KEY_PATTERN = /^[a-f0-9]{64}$/;
const DEFAULT_URL_TTL_SECONDS = 24 * 60 * 60;

const EXT_TO_MIME: ReadonlyArray<{ ext: "png" | "webp" | "jpg"; mime: SupportedImageMime }> = [
  { ext: "png", mime: "image/png" },
  { ext: "webp", mime: "image/webp" },
  { ext: "jpg", mime: "image/jpeg" },
];

const MIME_TO_EXT: Record<SupportedImageMime, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function storageDir(): string {
  if (process.env.PREDICTION_STORAGE_DIR) return process.env.PREDICTION_STORAGE_DIR;
  // Serverless deployments only allow writes under the temp dir (ephemeral, per instance).
  if (process.env.VERCEL) return path.join(os.tmpdir(), "g-ai-predictions");
  return path.join(process.cwd(), ".data", "predictions");
}

export function isValidCacheKey(cacheKey: string): boolean {
  return CACHE_KEY_PATTERN.test(cacheKey);
}

export function isMilestoneDay(day: number): day is MilestoneDay {
  return (MILESTONE_DAYS as readonly number[]).includes(day);
}

export function detectImageMimeFromBytes(buf: Buffer): SupportedImageMime | null {
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function milestonePath(cacheKey: string, day: MilestoneDay, ext: "jpg" | "png" | "webp"): string {
  if (!isValidCacheKey(cacheKey)) throw new Error("Invalid cache key");
  return path.join(storageDir(), `${cacheKey}_day_${day}.${ext}`);
}

export function saveMilestone(cacheKey: string, day: MilestoneDay, dataUrl: string): void {
  if (!isValidCacheKey(cacheKey)) throw new Error("Invalid cache key");
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([\s\S]+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Unsupported image MIME type");
  }
  const buffer = Buffer.from(match[2], "base64");
  const actualMime = detectImageMimeFromBytes(buffer);
  if (!actualMime) {
    throw new Error("Invalid or unsupported image payload");
  }
  const targetExt = MIME_TO_EXT[actualMime];

  fs.mkdirSync(storageDir(), { recursive: true, mode: 0o700 });
  for (const { ext } of EXT_TO_MIME) {
    if (ext !== targetExt) {
      try {
        fs.unlinkSync(milestonePath(cacheKey, day, ext));
      } catch {
        // ignore missing sibling
      }
    }
  }
  fs.writeFileSync(milestonePath(cacheKey, day, targetExt), buffer, { mode: 0o600 });
}

export function hasMilestone(cacheKey: string, day: MilestoneDay): boolean {
  if (!isValidCacheKey(cacheKey)) return false;
  try {
    return EXT_TO_MIME.some(({ ext }) => fs.existsSync(milestonePath(cacheKey, day, ext)));
  } catch {
    return false;
  }
}

export function readMilestoneWithMime(
  cacheKey: string,
  day: MilestoneDay
): { buffer: Buffer; mimeType: SupportedImageMime } | null {
  if (!isValidCacheKey(cacheKey)) return null;
  for (const { ext } of EXT_TO_MIME) {
    const filePath = milestonePath(cacheKey, day, ext);
    try {
      if (!fs.existsSync(filePath)) continue;
      const buffer = fs.readFileSync(filePath);
      const actualMime = detectImageMimeFromBytes(buffer);
      if (!actualMime) return null;
      return {
        buffer,
        mimeType: actualMime,
      };
    } catch {
      return null;
    }
  }
  return null;
}

export function readMilestone(cacheKey: string, day: MilestoneDay): Buffer | null {
  return readMilestoneWithMime(cacheKey, day)?.buffer ?? null;
}

export function deleteMilestones(cacheKey: string): void {
  if (!isValidCacheKey(cacheKey)) return;
  for (const day of MILESTONE_DAYS) {
    for (const { ext } of EXT_TO_MIME) {
      try {
        fs.unlinkSync(milestonePath(cacheKey, day, ext));
      } catch {
        // already gone
      }
    }
  }
}

// --- Signed URLs -----------------------------------------------------------

const globalForSecret = globalThis as unknown as { __gAiDevSigningSecret?: string };

function signingSecret(): string {
  const configured = process.env.PREDICTION_SIGNING_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PREDICTION_SIGNING_SECRET (>= 32 chars) must be set in production.");
  }
  // Development fallback: random per server process, so links simply stop working after a restart.
  globalForSecret.__gAiDevSigningSecret ??= crypto.randomBytes(32).toString("hex");
  return globalForSecret.__gAiDevSigningSecret;
}

function signature(cacheKey: string, day: number, exp: number): string {
  return crypto.createHmac("sha256", signingSecret()).update(`${cacheKey}:${day}:${exp}`).digest("hex");
}

export function signedMilestoneUrl(
  cacheKey: string,
  day: MilestoneDay,
  ttlSeconds: number = DEFAULT_URL_TTL_SECONDS,
  now: number = Date.now()
): string {
  const exp = Math.floor(now / 1000) + ttlSeconds;
  return `/api/prediction/image/${cacheKey}/${day}?exp=${exp}&sig=${signature(cacheKey, day, exp)}`;
}

export function verifyMilestoneSignature(
  cacheKey: string,
  day: number,
  exp: string | null,
  sig: string | null,
  now: number = Date.now()
): boolean {
  if (!exp || !sig || !/^\d+$/.test(exp) || !/^[a-f0-9]{64}$/.test(sig)) return false;
  if (!isValidCacheKey(cacheKey) || !isMilestoneDay(day)) return false;
  const expNum = Number(exp);
  if (expNum < Math.floor(now / 1000)) return false;
  const expected = Buffer.from(signature(cacheKey, day, expNum), "hex");
  return crypto.timingSafeEqual(expected, Buffer.from(sig, "hex"));
}

export function tokensMatch(expected: string, provided: string | null | undefined): boolean {
  if (!provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
