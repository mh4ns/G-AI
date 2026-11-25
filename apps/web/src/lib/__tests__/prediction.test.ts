import test from "node:test";
import assert from "node:assert";
import {
  calculateMilestoneDeltas,
  buildImageEditPrompt,
  checkRateLimit,
  getClientId,
} from "../prediction-jobs";
import { cleanNumberInput } from "../../components/prediction/BodyCalibrationModal";

test("calculateMilestoneDeltas produces realistic 28-day ceilings", () => {
  const maleDeltas = calculateMilestoneDeltas(76, 73.5, true);

  // Week 1 (Day 7)
  assert.ok(maleDeltas[7].deltas.bodyFatChangePct <= 1.0, "Week 1 body fat change <= 1.0%");
  assert.ok(maleDeltas[7].deltas.waistChangeCm <= 1.5, "Week 1 waist change <= 1.5cm");

  // Week 2 (Day 14)
  assert.ok(maleDeltas[14].deltas.bodyFatChangePct <= 2.0, "Week 2 body fat change <= 2.0%");
  assert.ok(maleDeltas[14].deltas.waistChangeCm <= 2.5, "Week 2 waist change <= 2.5cm");

  // Week 4 (Day 28)
  assert.ok(maleDeltas[28].deltas.bodyFatChangePct <= 3.5, "Week 4 body fat change <= 3.5%");
  assert.ok(maleDeltas[28].deltas.waistChangeCm <= 4.5, "Week 4 waist change <= 4.5cm");

  // Female deltas check
  const femaleDeltas = calculateMilestoneDeltas(56, 52, false);
  assert.ok(femaleDeltas[28].deltas.bodyFatChangePct > 0);
  assert.ok(femaleDeltas[28].deltas.waistChangeCm > 0);
});

test("buildImageEditPrompt enforces Day 0 anchor and identity preservation", () => {
  const maleDeltas = calculateMilestoneDeltas(76, 73.5, true);
  const promptWeek1 = buildImageEditPrompt(maleDeltas[7]);
  const promptWeek4 = buildImageEditPrompt(maleDeltas[28]);

  // Must strictly preserve face, pose, clothing, lighting, background, identity, gender
  assert.ok(promptWeek1.includes("Keep the face, identity, gender, skin tone, hairstyle, pose, clothing, background, camera angle and lighting EXACTLY the same"));
  assert.ok(promptWeek1.includes("Change ONLY the body shape"));
  assert.ok(promptWeek1.includes("no exaggeration, no airbrushing"));
  assert.ok(promptWeek1.includes("Do not change the person's age, ethnicity or gender"));

  assert.ok(promptWeek4.includes("Change ONLY the body shape"));
});

test("cleanNumberInput completely strips leading zeros from inputs", () => {
  // Bug reported by user: "0080"
  assert.strictEqual(cleanNumberInput("0080"), "80");
  assert.strictEqual(cleanNumberInput("0170"), "170");
  assert.strictEqual(cleanNumberInput("08"), "8");
  assert.strictEqual(cleanNumberInput("00"), "0");
  assert.strictEqual(cleanNumberInput("000"), "0");
  assert.strictEqual(cleanNumberInput("0"), "0");
  assert.strictEqual(cleanNumberInput(""), "");
  assert.strictEqual(cleanNumberInput("0.5"), "0.5");
  assert.strictEqual(cleanNumberInput("00.5"), "0.5");
  assert.strictEqual(cleanNumberInput("000.5"), "0.5");
  assert.strictEqual(cleanNumberInput("65"), "65");
  assert.strictEqual(cleanNumberInput("170.5"), "170.5");
  assert.strictEqual(cleanNumberInput("0052.5"), "52.5");
  assert.strictEqual(cleanNumberInput("abc75.2xyz"), "75.2");
});

test("checkRateLimit limits excessive calls per IP/client", () => {
  const testClientId = "test_client_" + Date.now();
  // Call 5 times
  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(testClientId);
    assert.strictEqual(res.allowed, true);
  }
  // 6th call must be blocked
  const blockedRes = checkRateLimit(testClientId);
  assert.strictEqual(blockedRes.allowed, false);
  assert.strictEqual(blockedRes.remaining, 0);
});

test("weight-gain deltas and prompts avoid fat-loss / smaller-waist wording", () => {
  const gainDeltas = calculateMilestoneDeltas(60, 66, true);
  for (const day of [7, 14, 28] as const) {
    const spec = gainDeltas[day];
    assert.strictEqual(spec.goalDirection, "gain");
    assert.strictEqual(spec.deltas.bodyFatChangePct, 0);
    assert.strictEqual(spec.deltas.waistChangeCm, 0);
    assert.ok((spec.deltas.leanMassGainKg ?? 0) > 0);
    const prompt = buildImageEditPrompt(spec).toLowerCase();
    assert.ok(!prompt.includes("lower body fat"), `unexpected fat-loss text in day ${day}`);
    assert.ok(!prompt.includes("smaller"), `unexpected smaller-waist text in day ${day}`);
    assert.ok(!prompt.includes("slimmer"), `unexpected slimmer text in day ${day}`);
  }
});

test("getClientId ignores spoofed x-forwarded-for unless TRUST_PROXY=1", () => {
  const prevTrust = process.env.TRUST_PROXY;
  const prevVercel = process.env.VERCEL;
  delete process.env.TRUST_PROXY;
  delete process.env.VERCEL;
  try {
    const spoofedOnly = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    assert.strictEqual(getClientId(spoofedOnly), "anonymous");

    const withRealIp = new Headers({
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "1.2.3.4",
    });
    assert.strictEqual(getClientId(withRealIp), "203.0.113.10");

    process.env.TRUST_PROXY = "1";
    assert.strictEqual(getClientId(spoofedOnly), "5.6.7.8");
  } finally {
    if (prevTrust === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = prevTrust;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
  }
});
