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
 *   1. gemini      GEMINI_API_KEY                                   (best quality, paid image quota)
 *   2. cloudflare  CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_API_TOKEN  (Workers AI free daily allowance)
 *   3. none        no provider: the app shows illustrative preset images instead
 */

export type ImageProvider =
  | { name: "gemini"; apiKey: string; imageModel: string; visionModel: string }
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
    case "cloudflare":
      return cloudflareFromEnv();
    default:
      return geminiFromEnv() ?? cloudflareFromEnv();
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
  if (provider.name === "gemini") return buildImageEditPrompt(spec);
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
