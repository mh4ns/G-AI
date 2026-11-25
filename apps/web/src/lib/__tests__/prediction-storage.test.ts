import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";

process.env.PREDICTION_STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "g-ai-pred-"));
process.env.PREDICTION_SIGNING_SECRET = "test-signing-secret-that-is-at-least-32-chars";

import { POST as generatePredictionPost } from "../../app/api/prediction/generate/route";
import {
  deleteMilestones,
  detectImageMimeFromBytes,
  hasMilestone,
  readMilestone,
  readMilestoneWithMime,
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
  const jpegPayload = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("fake-jpeg")]);
  const jpeg = "data:image/jpeg;base64," + jpegPayload.toString("base64");
  saveMilestone(KEY, 7, jpeg);
  assert.ok(hasMilestone(KEY, 7));
  assert.ok(readMilestone(KEY, 7)?.equals(jpegPayload));
  assert.ok(!fs.readdirSync(process.env.PREDICTION_STORAGE_DIR!).some((f) => f.includes("public")));
  deleteMilestones(KEY);
  assert.ok(!hasMilestone(KEY, 7));
  assert.throws(() => saveMilestone("not-a-key", 7, jpeg));
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

test("saveMilestone and readMilestoneWithMime detect PNG/JPEG/WebP magic bytes and reject SVG", () => {
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const webpBytes = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from("WEBP", "ascii"),
  ]);

  assert.strictEqual(detectImageMimeFromBytes(pngBytes), "image/png");
  assert.strictEqual(detectImageMimeFromBytes(jpegBytes), "image/jpeg");
  assert.strictEqual(detectImageMimeFromBytes(webpBytes), "image/webp");
  assert.strictEqual(detectImageMimeFromBytes(Buffer.from("<svg></svg>")), null);

  saveMilestone(KEY, 7, `data:image/png;base64,${pngBytes.toString("base64")}`);
  saveMilestone(KEY, 14, `data:image/webp;base64,${webpBytes.toString("base64")}`);
  saveMilestone(KEY, 28, `data:image/jpeg;base64,${jpegBytes.toString("base64")}`);

  assert.strictEqual(readMilestoneWithMime(KEY, 7)?.mimeType, "image/png");
  assert.strictEqual(readMilestoneWithMime(KEY, 14)?.mimeType, "image/webp");
  assert.strictEqual(readMilestoneWithMime(KEY, 28)?.mimeType, "image/jpeg");

  // Legacy .jpg filename containing PNG bytes self-heals via magic-byte sniffing
  const legacyPath = path.join(process.env.PREDICTION_STORAGE_DIR!, `${KEY}_day_7.jpg`);
  deleteMilestones(KEY);
  fs.writeFileSync(legacyPath, pngBytes);
  assert.strictEqual(readMilestoneWithMime(KEY, 7)?.mimeType, "image/png");

  assert.throws(
    () => saveMilestone(KEY, 7, `data:image/svg+xml;base64,${Buffer.from("<svg/>").toString("base64")}`),
    /Unsupported image MIME/
  );
  deleteMilestones(KEY);
});

test("saveMilestone and readMilestoneWithMime reject spoofed SVG, HTML, and empty payloads", () => {
  const spoofedSvg = `data:image/png;base64,${Buffer.from("<svg><script>alert(1)</script></svg>").toString("base64")}`;
  const spoofedHtml = `data:image/jpeg;base64,${Buffer.from("<!DOCTYPE html><html><body>x</body></html>").toString("base64")}`;
  const emptyPayload = "data:image/png;base64,====";

  for (const payload of [spoofedSvg, spoofedHtml, emptyPayload]) {
    assert.throws(() => saveMilestone(KEY, 7, payload), /Invalid or unsupported image payload/);
    assert.strictEqual(hasMilestone(KEY, 7), false);
  }

  // Corrupt or spoofed files on disk must also be rejected on read
  const spoofPath = path.join(process.env.PREDICTION_STORAGE_DIR!, `${KEY}_day_7.png`);
  fs.writeFileSync(spoofPath, Buffer.from("<svg><script>alert(1)</script></svg>"));
  assert.strictEqual(readMilestoneWithMime(KEY, 7), null);

  fs.writeFileSync(spoofPath, Buffer.alloc(0));
  assert.strictEqual(readMilestoneWithMime(KEY, 7), null);

  deleteMilestones(KEY);
});

test("POST /api/prediction/generate rejects spoofed SVG, HTML, and empty payloads with 400 INVALID_MIME", async () => {
  const cases = [
    {
      name: "spoofed SVG with PNG header",
      userPhotoBase64: `data:image/png;base64,${Buffer.from("<svg><script>alert(1)</script></svg>").toString("base64")}`,
    },
    {
      name: "spoofed HTML with JPEG header",
      userPhotoBase64: `data:image/jpeg;base64,${Buffer.from("<!DOCTYPE html><html></html>").toString("base64")}`,
    },
    {
      name: "empty base64 string",
      userPhotoBase64: "data:image/png;base64,",
    },
    {
      name: "empty base64 payload",
      userPhotoBase64: "data:image/png;base64,====",
    },
  ];

  for (let i = 0; i < cases.length; i++) {
    const req = new NextRequest("http://localhost/api/prediction/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": `198.51.100.${10 + i}`,
      },
      body: JSON.stringify({
        consentAccepted: true,
        userPhotoBase64: cases[i].userPhotoBase64,
        archetype: "female_pilates",
      }),
    });

    const res = await generatePredictionPost(req);
    const json = (await res.json()) as { success: boolean; code: string };
    assert.strictEqual(res.status, 400, `${cases[i].name} should return HTTP 400`);
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.code, "INVALID_MIME", `${cases[i].name} should return INVALID_MIME`);
  }
});
