import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import os from "os";
import path from "path";

process.env.PREDICTION_STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "g-ai-pred-"));
process.env.PREDICTION_SIGNING_SECRET = "test-signing-secret-that-is-at-least-32-chars";

import {
  deleteMilestones,
  hasMilestone,
  readMilestone,
  saveMilestone,
  signedMilestoneUrl,
  tokensMatch,
  verifyMilestoneSignature,
} from "../prediction-storage";
import { computePredictionHash, createPredictionJob, serializeJob } from "../prediction-jobs";
import { isSignedUrlExpired } from "../prediction-client";

const KEY = "a".repeat(64);

function parse(url: string) {
  const u = new URL(url, "http://local");
  const [, , , , cacheKey, day] = u.pathname.split("/");
  return { cacheKey, day: Number(day), exp: u.searchParams.get("exp"), sig: u.searchParams.get("sig") };
}

test("signed milestone URLs verify and reject tampering or expiry", () => {
  const now = Date.now();
  const p = parse(signedMilestoneUrl(KEY, 14, 60, now));
  assert.strictEqual(p.cacheKey, KEY);
  assert.ok(verifyMilestoneSignature(p.cacheKey, p.day, p.exp, p.sig, now));

  assert.ok(!verifyMilestoneSignature(p.cacheKey, 28, p.exp, p.sig, now), "other day");
  assert.ok(!verifyMilestoneSignature("b".repeat(64), p.day, p.exp, p.sig, now), "other key");
  assert.ok(!verifyMilestoneSignature(p.cacheKey, p.day, String(Number(p.exp) + 1000), p.sig, now), "extended expiry");
  assert.ok(!verifyMilestoneSignature(p.cacheKey, p.day, p.exp, p.sig, now + 61_000), "expired");
  assert.ok(!verifyMilestoneSignature(p.cacheKey, p.day, p.exp, null, now), "missing sig");
  assert.ok(!verifyMilestoneSignature("../../etc/passwd", p.day, p.exp, p.sig, now), "path traversal key");
});

test("private storage round-trips and deletes", () => {
  const png = "data:image/jpeg;base64," + Buffer.from("fake-jpeg").toString("base64");
  saveMilestone(KEY, 7, png);
  assert.ok(hasMilestone(KEY, 7));
  assert.strictEqual(readMilestone(KEY, 7)?.toString(), "fake-jpeg");
  assert.ok(!fs.readdirSync(process.env.PREDICTION_STORAGE_DIR!).some((f) => f.includes("public")));
  deleteMilestones(KEY);
  assert.ok(!hasMilestone(KEY, 7));
  assert.throws(() => saveMilestone("not-a-key", 7, png));
});

test("cache key covers the whole photo, not just a prefix", () => {
  const header = "A".repeat(600);
  const a = computePredictionHash(header + "XXXX", "female_pilates", 56, 50, "plan", "m");
  const b = computePredictionHash(header + "YYYY", "female_pilates", 56, 50, "plan", "m");
  assert.notStrictEqual(a, b);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test("serialized jobs never leak the access token, cache key or prompts", () => {
  const job = createPredictionJob(KEY, "female", undefined, { 7: "secret prompt" });
  const json = JSON.stringify(serializeJob({ ...job, completedDays: [7] }));
  assert.ok(!json.includes(job.accessToken));
  assert.ok(!json.includes("secret prompt"));
  assert.ok(!json.includes(`"cacheKey"`));
  assert.ok(json.includes("/api/prediction/image/"));
});

test("token comparison and client-side expiry helper", () => {
  assert.ok(tokensMatch("abc", "abc"));
  assert.ok(!tokensMatch("abc", "abd"));
  assert.ok(!tokensMatch("abc", null));
  assert.ok(isSignedUrlExpired("/api/prediction/image/x/7?exp=1&sig=00"));
  assert.ok(!isSignedUrlExpired(`/api/prediction/image/x/7?exp=${Math.floor(Date.now() / 1000) + 60}&sig=00`));
  assert.ok(isSignedUrlExpired("/generated/abc_day_7.jpg"));
  assert.ok(!isSignedUrlExpired("/twins/female-day-7.png"));
});
