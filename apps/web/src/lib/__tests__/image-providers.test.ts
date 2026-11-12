import test from "node:test";
import assert from "node:assert";
import { buildPromptFor, providerModelLabel, resolveImageProvider } from "../image-providers";
import { calculateMilestoneDeltas } from "../prediction-jobs";

const KEYS = [
  "HF_TOKEN",
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

// ---- AI Gateway (Muse Image / Google image models) ---------------------------
import http from "node:http";
import { AddressInfo } from "node:net";
import { generateMilestoneImage, withRequestCredentials, extractChatImage } from "../image-providers";

test("AI Gateway needs an explicit opt-in or a key, and picks up the Vercel OIDC token", () => {
  withEnv({}, () => assert.strictEqual(resolveImageProvider(), null));
  withEnv({ IMAGE_PROVIDER: "ai-gateway" }, () => {
    const p = resolveImageProvider()!;
    assert.strictEqual(p.name, "ai-gateway");
    assert.strictEqual(p.imageModel, "meta/muse-image-1.0");
    const withToken = withRequestCredentials(p, new Headers({ "x-vercel-oidc-token": "oidc-123" }));
    assert.strictEqual((withToken as { apiKey: string }).apiKey, "oidc-123");
  });
  withEnv({ GEMINI_API_KEY: "g", ...CF }, () => assert.strictEqual(resolveImageProvider()?.name, "gemini"));
});

async function withMockGateway(
  handler: (path: string, contentType: string, body: Buffer) => { status: number; json: unknown },
  fn: () => Promise<void>
) {
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      assert.strictEqual(req.headers.authorization, "Bearer test-key");
      const out = handler(req.url || "", req.headers["content-type"] || "", Buffer.concat(chunks));
      res.writeHead(out.status, { "content-type": "application/json" });
      res.end(JSON.stringify(out.json));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as AddressInfo;
  process.env.AI_GATEWAY_BASE_URL = `http://127.0.0.1:${port}`;
  try {
    await fn();
  } finally {
    delete process.env.AI_GATEWAY_BASE_URL;
    server.close();
  }
}

const PHOTO = Buffer.from("day0-jpeg-bytes").toString("base64");

test("Muse Image goes through /images/edits with the photo as multipart", async () => {
  await withMockGateway(
    (path, contentType, body) => {
      assert.strictEqual(path, "/images/edits");
      assert.match(contentType, /^multipart\/form-data/);
      const text = body.toString("latin1");
      assert.ok(text.includes("meta/muse-image-1.0"));
      assert.ok(text.includes("day0-jpeg-bytes"), "original photo is attached");
      return { status: 200, json: { data: [{ b64_json: "RURJVEVE" }] } };
    },
    async () => {
      const url = await generateMilestoneImage(
        { name: "ai-gateway", apiKey: "test-key", imageModel: "meta/muse-image-1.0" },
        PHOTO,
        "image/jpeg",
        "make the waist slimmer"
      );
      assert.strictEqual(url, "data:image/png;base64,RURJVEVE");
    }
  );
});

test("Google image models go through chat completions with the photo inline", async () => {
  await withMockGateway(
    (path, _ct, body) => {
      assert.strictEqual(path, "/chat/completions");
      const req = JSON.parse(body.toString());
      assert.deepStrictEqual(req.modalities, ["text", "image"]);
      assert.strictEqual(req.messages[0].content[1].image_url.url, `data:image/jpeg;base64,${PHOTO}`);
      return {
        status: 200,
        json: { choices: [{ message: { images: [{ image_url: { url: "data:image/png;base64,T1VU" } }] } }] },
      };
    },
    async () => {
      const url = await generateMilestoneImage(
        { name: "ai-gateway", apiKey: "test-key", imageModel: "google/gemini-3.1-flash-image-preview" },
        PHOTO,
        "image/jpeg",
        "prompt"
      );
      assert.strictEqual(url, "data:image/png;base64,T1VU");
    }
  );
});

test("Gateway errors map to user-safe messages", async () => {
  for (const [status, code] of [
    [402, "QUOTA"],
    [401, "CONFIG"],
    [500, "UPSTREAM"],
  ] as const) {
    await withMockGateway(
      () => ({ status, json: { error: { message: "secret upstream detail" } } }),
      async () => {
        await assert.rejects(
          generateMilestoneImage(
            { name: "ai-gateway", apiKey: "test-key", imageModel: "meta/muse-image-1.0" },
            PHOTO,
            "image/jpeg",
            "p"
          ),
          (err: { code: string; userMessage: string }) =>
            err.code === code && !err.userMessage.includes("secret upstream detail")
        );
      }
    );
  }
  assert.strictEqual(extractChatImage({ choices: [{ message: { images: [{ image_url: { url: "https://x" } }] } }] }), null);
});

// ---- Hugging Face Inference Providers -----------------------------------------

test("Hugging Face is chosen with an hf_ token, after Gemini and AI Gateway keys", () => {
  withEnv({ HF_TOKEN: "hf_abc" } as Record<string, string>, () => {
    const p = resolveImageProvider()!;
    assert.strictEqual(p.name, "huggingface");
    assert.strictEqual(p.imageModel, "black-forest-labs/FLUX.1-Kontext-dev");
  });
  withEnv({ HF_TOKEN: "not-a-token" } as Record<string, string>, () => assert.strictEqual(resolveImageProvider(), null));
  withEnv({ HF_TOKEN: "hf_abc", GEMINI_API_KEY: "g" } as Record<string, string>, () =>
    assert.strictEqual(resolveImageProvider()?.name, "gemini")
  );
});

test("Hugging Face image-to-image sends the photo and returns a data URL", async () => {
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      assert.strictEqual(req.headers.authorization, "Bearer hf_test");
      const body = Buffer.concat(chunks).toString();
      assert.ok(body.includes(Buffer.from("day0-jpeg-bytes").toString("base64")) || body.includes("day0-jpeg-bytes"));
      assert.ok(body.includes("slimmer"), "prompt is forwarded");
      res.writeHead(200, { "content-type": "image/jpeg" });
      res.end(Buffer.from("EDITED-JPEG"));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  process.env.HF_ENDPOINT_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const url = await generateMilestoneImage(
      { name: "huggingface", token: "hf_test", imageModel: "some/model", inferenceProvider: "hf-inference" },
      PHOTO,
      "image/jpeg",
      "make the waist slimmer"
    );
    assert.strictEqual(url, `data:image/jpeg;base64,${Buffer.from("EDITED-JPEG").toString("base64")}`);
  } finally {
    delete process.env.HF_ENDPOINT_URL;
    server.close();
  }
});
