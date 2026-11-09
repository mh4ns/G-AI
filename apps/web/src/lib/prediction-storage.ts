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

const CACHE_KEY_PATTERN = /^[a-f0-9]{64}$/;
const DEFAULT_URL_TTL_SECONDS = 24 * 60 * 60;

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

function milestonePath(cacheKey: string, day: MilestoneDay): string {
  if (!isValidCacheKey(cacheKey)) throw new Error("Invalid cache key");
  return path.join(storageDir(), `${cacheKey}_day_${day}.jpg`);
}

export function saveMilestone(cacheKey: string, day: MilestoneDay, dataUrl: string): void {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  fs.mkdirSync(storageDir(), { recursive: true, mode: 0o700 });
  fs.writeFileSync(milestonePath(cacheKey, day), Buffer.from(base64Data, "base64"), { mode: 0o600 });
}

export function hasMilestone(cacheKey: string, day: MilestoneDay): boolean {
  try {
    return fs.existsSync(milestonePath(cacheKey, day));
  } catch {
    return false;
  }
}

export function readMilestone(cacheKey: string, day: MilestoneDay): Buffer | null {
  try {
    return fs.readFileSync(milestonePath(cacheKey, day));
  } catch {
    return null;
  }
}

export function deleteMilestones(cacheKey: string): void {
  if (!isValidCacheKey(cacheKey)) return;
  for (const day of MILESTONE_DAYS) {
    try {
      fs.unlinkSync(milestonePath(cacheKey, day));
    } catch {
      // already gone
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
