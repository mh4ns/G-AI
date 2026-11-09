import {
  GenerationError,
  MilestoneSpec,
  PhotoQualityAssessment,
  buildImageEditPrompt,
  assessPhotoQualityAndGender,
  callGeminiImageToImage,
} from "./prediction-jobs";

/**
 * Which AI backend edits the Day 0 photo into milestone predictions.
 *
 * Resolution order (first configured wins), overridable with IMAGE_PROVIDER:
 *   1. gemini      GEMINI_API_KEY                                   (Google AI Studio key, paid image quota)
 *   2. ai-gateway  AI_GATEWAY_API_KEY, or IMAGE_PROVIDER=ai-gateway on Vercel (OIDC, no key needed).
 *                  Billed to Vercel AI Gateway credits. Model via AI_GATEWAY_IMAGE_MODEL, e.g.
 *                  meta/muse-image-1.0 (Muse Image) or google/gemini-3.1-flash-image-preview.
 *   3. cloudflare  CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_API_TOKEN  (Workers AI free daily allowance)
 *   4. none        no provider: the app shows illustrative preset images instead
 */

export type ImageProvider =
  | { name: "gemini"; apiKey: string; imageModel: string; visionModel: string }
  | { name: "ai-gateway"; apiKey: string | null; imageModel: string }
  | { name: "cloudflare"; accountId: string; apiToken: string; imageModel: string };

const PLACEHOLDER_KEYS = new Set(["", "your_gemini_api_key_here"]);

function geminiFromEnv(): ImageProvider | null {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (PLACEHOLDER_KEYS.has(apiKey)) return null;
  return {
    name: "gemini",
    apiKey,
    imageModel: process.env.IMAGE_MODEL || "gemini-2.5-flash-image",
    visionModel: process.env.VISION_MODEL || "gemini-3-flash-preview",
  };
}

// Overridable for tests only; production always talks to Vercel's gateway.
const aiGatewayUrl = () => process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1";

/**
 * explicit=true (IMAGE_PROVIDER=ai-gateway) allows key-less use: on Vercel the
 * per-request OIDC token authenticates, see `withRequestCredentials`.
 */
function aiGatewayFromEnv(explicit: boolean): ImageProvider | null {
  const apiKey = (process.env.AI_GATEWAY_API_KEY || "").trim() || null;
  if (!apiKey && !explicit) return null;
  return {
    name: "ai-gateway",
    apiKey,
    imageModel: process.env.AI_GATEWAY_IMAGE_MODEL || "meta/muse-image-1.0",
  };
}

/**
 * Fills in request-scoped credentials. On Vercel the platform passes a
 * short-lived OIDC token in `x-vercel-oidc-token`; AI Gateway accepts it in place
 * of an API key. Must run inside the request handler (before `after()`).
 */
export function withRequestCredentials(provider: ImageProvider, headers: Headers): ImageProvider {
  if (provider.name !== "ai-gateway" || provider.apiKey) return provider;
  const oidc = headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN || null;
  return { ...provider, apiKey: oidc };
}

function cloudflareFromEnv(): ImageProvider | null {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const apiToken = (process.env.CLOUDFLARE_AI_API_TOKEN || "").trim();
  if (!/^[a-f0-9]{32}$/i.test(accountId) || !apiToken) return null;
  return {
    name: "cloudflare",
    accountId,
    apiToken,
    imageModel: process.env.CLOUDFLARE_IMAGE_MODEL || "@cf/runwayml/stable-diffusion-v1-5-img2img",
  };
}

export function resolveImageProvider(): ImageProvider | null {
  switch ((process.env.IMAGE_PROVIDER || "").toLowerCase()) {
    case "none":
      return null;
    case "gemini":
      return geminiFromEnv();
    case "ai-gateway":
      return aiGatewayFromEnv(true);
    case "cloudflare":
      return cloudflareFromEnv();
    default:
      return geminiFromEnv() ?? aiGatewayFromEnv(false) ?? cloudflareFromEnv();
  }
}

/** Stable label used in cache keys so outputs from different backends never mix. */
export function providerModelLabel(provider: ImageProvider): string {
  return `${provider.name}:${provider.imageModel}`;
}

/**
 * Gemini follows long editing instructions. Stable Diffusion's text encoder reads
 * only ~77 tokens, so the Workers AI prompt is short and front-loads what matters.
 */
export function buildPromptFor(provider: ImageProvider, spec: MilestoneSpec): string {
  if (provider.name !== "cloudflare") return buildImageEditPrompt(spec);
  const intensity = spec.week >= 4 ? "noticeably" : spec.week >= 2 ? "moderately" : "slightly";
  return `realistic photo of the same person, same face and clothes, ${intensity} slimmer waist, toned core, upright posture, natural lighting`;
}

export async function assessPhoto(
  provider: ImageProvider,
  rawBase64: string,
  mimeType: string,
  archetype: "female_pilates" | "male_strength"
): Promise<PhotoQualityAssessment> {
  if (provider.name === "gemini") {
    return assessPhotoQualityAndGender(provider.apiKey, provider.visionModel, rawBase64, mimeType, archetype);
  }
  // Workers AI path has no vision pre-check: accept the photo and rely on the
  // client-side size/MIME validation already done by the route.
  return {
    isValid: true,
    onePerson: true,
    isNearFullBody: true,
    goodLighting: true,
    detectedGender: archetype === "male_strength" ? "male" : "female",
  };
}

export async function generateMilestoneImage(
  provider: ImageProvider,
  rawBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  if (provider.name === "gemini") {
    return callGeminiImageToImage(provider.apiKey, provider.imageModel, rawBase64, mimeType, prompt, 2);
  }
  if (provider.name === "ai-gateway") {
    return callAiGatewayImageEdit(provider, rawBase64, mimeType, prompt);
  }
  return callCloudflareImg2Img(provider, rawBase64, prompt);
}

/**
 * Workers AI img2img over the REST API. The model returns raw image bytes.
 * Lower `strength` keeps more of the original photo (identity, pose, background).
 */
async function callCloudflareImg2Img(
  provider: Extract<ImageProvider, { name: "cloudflare" }>,
  rawBase64: string,
  prompt: string
): Promise<string> {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${provider.accountId}/ai/run/${provider.imageModel}`;
  const imageBytes = Array.from(Buffer.from(rawBase64, "base64"));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiToken}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        prompt,
        negative_prompt:
          "different person, changed face, extra limbs, distorted body, cartoon, illustration, nudity, text, watermark",
        image: imageBytes,
        strength: 0.35,
        guidance: 7.5,
        num_steps: 20,
      }),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.startsWith("image/")) {
      const detail = (await res.text().catch(() => "")).slice(0, 200);
      if (res.status === 401 || res.status === 403) {
        throw new GenerationError(`Cloudflare Workers AI auth failed [${res.status}]: ${detail}`, "CONFIG");
      }
      if (res.status === 429) {
        throw new GenerationError(
          `Cloudflare Workers AI daily allowance exhausted: ${detail}`,
          "QUOTA",
          "Hạn mức tạo ảnh miễn phí hôm nay đã hết. Vui lòng thử lại vào ngày mai."
        );
      }
      throw new GenerationError(`Cloudflare Workers AI error [${res.status}]: ${detail}`, "UPSTREAM");
    }

    const out = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${contentType.split(";")[0]};base64,${out}`;
  } catch (err) {
    if (err instanceof GenerationError) throw err;
    throw new GenerationError(
      `Cloudflare Workers AI request failed: ${err instanceof Error ? err.message : "unknown"}`,
      "UPSTREAM"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * AI Gateway image editing. Google's image models are multimodal chat models
 * (chat completions + modalities); image-only models such as Muse Image or Flux
 * use the OpenAI-compatible /images/edits endpoint.
 */
async function callAiGatewayImageEdit(
  provider: Extract<ImageProvider, { name: "ai-gateway" }>,
  rawBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  if (!provider.apiKey) {
    throw new GenerationError(
      "AI Gateway has no credentials: set AI_GATEWAY_API_KEY, or run on Vercel with OIDC enabled.",
      "CONFIG"
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);
  const headers = { Authorization: `Bearer ${provider.apiKey}` };

  try {
    let res: Response;
    const isChatImageModel = provider.imageModel.startsWith("google/");
    if (isChatImageModel) {
      res = await fetch(`${aiGatewayUrl()}/chat/completions`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: provider.imageModel,
          modalities: ["text", "image"],
          stream: false,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${rawBase64}` } },
              ],
            },
          ],
        }),
      });
    } else {
      const form = new FormData();
      form.append("model", provider.imageModel);
      form.append("prompt", prompt);
      form.append("n", "1");
      form.append("image", new Blob([Buffer.from(rawBase64, "base64")], { type: mimeType }), "day0.jpg");
      res = await fetch(`${aiGatewayUrl()}/images/edits`, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: form,
      });
    }

    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      const detail = JSON.stringify(json?.error ?? json ?? {}).slice(0, 300);
      if (res.status === 401 || res.status === 403) {
        throw new GenerationError(`AI Gateway auth failed [${res.status}]: ${detail}`, "CONFIG");
      }
      if (res.status === 402 || res.status === 429) {
        throw new GenerationError(
          `AI Gateway credits/rate limit [${res.status}]: ${detail}`,
          "QUOTA",
          "Hạn mức tạo ảnh đã hết. Vui lòng thử lại sau."
        );
      }
      if (res.status === 400 && /safety|moderation|policy/i.test(detail)) {
        const msg = "Ảnh không đáp ứng tiêu chuẩn an toàn nội dung. Vui lòng chọn ảnh trang phục thể thao kín đáo hơn.";
        throw new GenerationError(detail, "SAFETY", msg);
      }
      throw new GenerationError(`AI Gateway error [${res.status}] (${provider.imageModel}): ${detail}`, "UPSTREAM");
    }

    const dataUrl = isChatImageModel ? extractChatImage(json) : extractImagesEndpointImage(json);
    if (!dataUrl) {
      throw new GenerationError(`AI Gateway returned no image (${provider.imageModel})`, "UPSTREAM");
    }
    return dataUrl;
  } catch (err) {
    if (err instanceof GenerationError) throw err;
    throw new GenerationError(
      `AI Gateway request failed: ${err instanceof Error ? err.message : "unknown"}`,
      "UPSTREAM"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

type ChatImageResponse = {
  choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
};
type ImagesEndpointResponse = { data?: Array<{ b64_json?: string; url?: string }> };

export function extractChatImage(json: unknown): string | null {
  const url = (json as ChatImageResponse)?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  return typeof url === "string" && url.startsWith("data:image/") ? url : null;
}

export function extractImagesEndpointImage(json: unknown): string | null {
  const first = (json as ImagesEndpointResponse)?.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  return null;
}
