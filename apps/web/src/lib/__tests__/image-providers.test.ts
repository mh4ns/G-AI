import test from "node:test";
import assert from "node:assert";
import { buildPromptFor, providerModelLabel, resolveImageProvider } from "../image-providers";
import { calculateMilestoneDeltas } from "../prediction-jobs";

const KEYS = [
  "IMAGE_PROVIDER",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_AI_API_TOKEN",
];

function withEnv(env: Record<string, string>, fn: () => void) {
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
  Object.assign(process.env, env);
  try {
    fn();
  } finally {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

const CF = { CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_AI_API_TOKEN: "cf-token" };

test("no keys means no provider (illustrative presets)", () => {
  withEnv({}, () => assert.strictEqual(resolveImageProvider(), null));
  withEnv({ GEMINI_API_KEY: "your_gemini_api_key_here" }, () => assert.strictEqual(resolveImageProvider(), null));
});

test("gemini wins when configured, cloudflare is the fallback", () => {
  withEnv({ GEMINI_API_KEY: "g-key", ...CF }, () => assert.strictEqual(resolveImageProvider()?.name, "gemini"));
  withEnv({ ...CF }, () => assert.strictEqual(resolveImageProvider()?.name, "cloudflare"));
});

test("IMAGE_PROVIDER overrides the order and can disable generation", () => {
  withEnv({ GEMINI_API_KEY: "g-key", ...CF, IMAGE_PROVIDER: "cloudflare" }, () =>
    assert.strictEqual(resolveImageProvider()?.name, "cloudflare")
  );
  withEnv({ GEMINI_API_KEY: "g-key", IMAGE_PROVIDER: "none" }, () => assert.strictEqual(resolveImageProvider(), null));
});

test("malformed Cloudflare account id is rejected", () => {
  withEnv({ CLOUDFLARE_ACCOUNT_ID: "../evil", CLOUDFLARE_AI_API_TOKEN: "t" }, () =>
    assert.strictEqual(resolveImageProvider(), null)
  );
});

test("cache labels differ per provider and the SD prompt stays short", () => {
  withEnv({ GEMINI_API_KEY: "g-key", ...CF }, () => {
    const gemini = resolveImageProvider()!;
    process.env.IMAGE_PROVIDER = "cloudflare";
    const cf = resolveImageProvider()!;
    assert.notStrictEqual(providerModelLabel(gemini), providerModelLabel(cf));

    const spec = calculateMilestoneDeltas(70, 65, false)[28];
    const sdPrompt = buildPromptFor(cf, spec);
    assert.ok(sdPrompt.split(/\s+/).length <= 40, "fits Stable Diffusion's ~77-token window");
    assert.ok(buildPromptFor(gemini, spec).length > sdPrompt.length);
  });
});
