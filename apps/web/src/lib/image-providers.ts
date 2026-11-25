import { InferenceClient } from "@huggingface/inference";
import {
  GenerationError,
  MilestoneSpec,
  PhotoQualityAssessment,
  buildImageEditPrompt,
} from "./prediction-jobs";

/**
 * Which AI backend edits the Day 0 photo into milestone predictions.
 *
 * Resolution order (first configured wins), overridable with IMAGE_PROVIDER:
 *   1. gemini      GEMINI_API_KEY                                   (Google AI Studio key, paid image quota)
 *   2. ai-gateway  AI_GATEWAY_API_KEY, or IMAGE_PROVIDER=ai-gateway on Vercel (OIDC, no key needed).
 *                  Billed to Vercel AI Gateway credits. Model via AI_GATEWAY_IMAGE_MODEL, e.g.
 *                  meta/muse-image-1.0 (Muse Image) or google/gemini-3.1-flash-image-preview.
 *   3. huggingface HF_TOKEN  (Hugging Face Inference Providers; free accounts get small monthly credits)
 *                  Model via HF_IMAGE_MODEL (default black-forest-labs/FLUX.1-Kontext-dev).
 *   4. cloudflare  CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_API_TOKEN  (Workers AI free daily allowance)
 *   5. none        no provider: the app shows illustrative preset images instead
 */

export type ImageProvider =
  | { name: "gemini"; apiKey: string; imageModel: string; visionModel: string }
  | { name: "ai-gateway"; apiKey: string | null; imageModel: string }
  | { name: "huggingface"; token: string; imageModel: string; inferenceProvider: string }
  | { name: "cloudflare"; accountId: string; apiToken: string; imageModel: string };

const PLACEHOLDER_KEYS = new Set(["", "your_gemini_api_key_here"]);
const SAFETY_BLOCK_MESSAGE =
  "Ảnh không đáp ứng tiêu chuẩn an toàn nội dung. Vui lòng chọn ảnh trang phục thể thao kín đáo hơn.";
const VISION_UNAVAILABLE_MESSAGE =
  "Không thể kiểm tra chất lượng ảnh lúc này. Vui lòng thử lại sau ít phút.";

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

// Overridable for tests only; production always talks to Google / Vercel endpoints.
const geminiBaseUrl = () =>
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
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

function huggingFaceFromEnv(): ImageProvider | null {
  const token = (process.env.HF_TOKEN || "").trim();
  if (!token.startsWith("hf_")) return null;
  return {
    name: "huggingface",
    token,
    imageModel: process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-Kontext-dev",
    // "auto" = first provider in the account's Inference Providers preference order.
    inferenceProvider: process.env.HF_INFERENCE_PROVIDER || "auto",
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
    case "ai-gateway":
      return aiGatewayFromEnv(true);
    case "huggingface":
      return huggingFaceFromEnv();
    case "cloudflare":
      return cloudflareFromEnv();
    default:
      return geminiFromEnv() ?? aiGatewayFromEnv(false) ?? huggingFaceFromEnv() ?? cloudflareFromEnv();
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
  const bodyClause =
    spec.goalDirection === "gain"
      ? `${intensity} fuller athletic muscle tone`
      : spec.goalDirection === "maintain"
        ? `${intensity} more toned core`
        : `${intensity} slimmer waist, toned core`;
  return `realistic photo of the same person, same face and clothes, ${bodyClause}, upright posture, natural lighting`;
}

export async function assessPhotoQualityAndGender(
  apiKey: string,
  visionModel: string,
  rawBase64: string,
  mimeType: string,
  quizArchetype: "female_pilates" | "male_strength"
): Promise<PhotoQualityAssessment> {
  const quizGender = quizArchetype === "male_strength" ? "male" : "female";
  const trimmedKey = (apiKey || "").trim();

  if (PLACEHOLDER_KEYS.has(trimmedKey)) {
    throw new GenerationError("Gemini vision API key is missing or placeholder.", "CONFIG");
  }

  const endpoint = `${geminiBaseUrl()}/models/${visionModel}:generateContent`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": trimmedKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an AI biometric intake validator for a body adaptation fitness app. Analyze this photo and respond ONLY with a JSON object:
{
  "onePerson": boolean (true if exactly one adult is in the frame),
  "isNearFullBody": boolean (true if visible at least from mid-thigh up),
  "goodLighting": boolean (true if lighting and focus are clear without severe blur or dark shadows),
  "detectedGender": "male" | "female" | "uncertain" (perceived biological gender presentation of the person in the photo),
  "safetyOk": boolean (true if apparel is appropriate athletic wear and not violating safety policies)
}`,
              },
              {
                inlineData: {
                  mimeType,
                  data: rawBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let errMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) errMsg = errJson.error.message;
      } catch {
        // ignore
      }

      if (res.status === 429 || errMsg.includes("Quota exceeded") || errMsg.includes("free_tier")) {
        throw new GenerationError(`Gemini vision quota exceeded [${res.status}]`, "QUOTA");
      }
      if (res.status === 403 || res.status === 404) {
        throw new GenerationError(`Gemini vision configuration error [${res.status}]`, "CONFIG");
      }
      if (res.status === 400 && (errText.includes("SAFETY") || errMsg.toLowerCase().includes("safety"))) {
        return {
          isValid: false,
          onePerson: true,
          isNearFullBody: true,
          goodLighting: true,
          detectedGender: "uncertain",
          errorMessage: SAFETY_BLOCK_MESSAGE,
        };
      }

      throw new GenerationError(
        `Gemini vision HTTP error [${res.status}]: ${errMsg.slice(0, 200)}`,
        "UPSTREAM",
        VISION_UNAVAILABLE_MESSAGE
      );
    }

    const data = await res.json();
    if (
      data?.promptFeedback?.blockReason === "SAFETY" ||
      data?.candidates?.[0]?.finishReason === "SAFETY"
    ) {
      return {
        isValid: false,
        onePerson: true,
        isNearFullBody: true,
        goodLighting: true,
        detectedGender: "uncertain",
        errorMessage: SAFETY_BLOCK_MESSAGE,
      };
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonMatch = typeof rawText === "string" ? rawText.match(/\{[\s\S]*\}/) : null;
    if (!jsonMatch) {
      throw new GenerationError(
        "Gemini vision response missing JSON payload.",
        "UPSTREAM",
        VISION_UNAVAILABLE_MESSAGE
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch (err) {
      throw new GenerationError(
        `Gemini vision JSON parse failed: ${err instanceof Error ? err.message : "unknown"}`,
        "UPSTREAM",
        VISION_UNAVAILABLE_MESSAGE
      );
    }

    if (parsed.safetyOk === false) {
      return {
        isValid: false,
        onePerson: Boolean(parsed.onePerson ?? true),
        isNearFullBody: Boolean(parsed.isNearFullBody ?? true),
        goodLighting: Boolean(parsed.goodLighting ?? true),
        detectedGender: (parsed.detectedGender as PhotoQualityAssessment["detectedGender"]) || "uncertain",
        errorMessage: SAFETY_BLOCK_MESSAGE,
      };
    }

    if (!parsed.onePerson) {
      return {
        isValid: false,
        onePerson: false,
        isNearFullBody: Boolean(parsed.isNearFullBody ?? true),
        goodLighting: Boolean(parsed.goodLighting ?? true),
        detectedGender: (parsed.detectedGender as PhotoQualityAssessment["detectedGender"]) || "uncertain",
        errorMessage: "Ảnh cần có đúng 1 người. Vui lòng chụp một mình để AI nhận diện vóc dáng chính xác.",
      };
    }

    if (!parsed.isNearFullBody) {
      return {
        isValid: false,
        onePerson: true,
        isNearFullBody: false,
        goodLighting: Boolean(parsed.goodLighting ?? true),
        detectedGender: (parsed.detectedGender as PhotoQualityAssessment["detectedGender"]) || "uncertain",
        errorMessage:
          "Ảnh chưa thấy đủ vóc dáng (cần thấy từ đùi trở lên hoặc toàn thân). Vui lòng đứng lùi xa hơn.",
      };
    }

    if (!parsed.goodLighting) {
      return {
        isValid: false,
        onePerson: true,
        isNearFullBody: true,
        goodLighting: false,
        detectedGender: (parsed.detectedGender as PhotoQualityAssessment["detectedGender"]) || "uncertain",
        errorMessage: "Ảnh quá tối hoặc bị mờ. Vui lòng chụp ở nơi đủ ánh sáng và đứng vững.",
      };
    }

    const detectedGender =
      parsed.detectedGender === "male" ||
      parsed.detectedGender === "female" ||
      parsed.detectedGender === "uncertain"
        ? parsed.detectedGender
        : quizGender;

    let genderMismatchWarning: string | undefined = undefined;
    if (detectedGender !== "uncertain" && detectedGender !== quizGender) {
      genderMismatchWarning = `Thông tin quiz (${
        quizGender === "female" ? "Nữ" : "Nam"
      }) và người trong ảnh (${
        detectedGender === "female" ? "Nữ" : "Nam"
      }) có vẻ không khớp. Mô hình sẽ giữ nguyên giới tính của người trong ảnh để đảm bảo hình ảnh tự nhiên nhất.`;
    }

    return {
      isValid: true,
      onePerson: true,
      isNearFullBody: true,
      goodLighting: true,
      detectedGender,
      genderMismatchWarning,
    };
  } catch (err) {
    if (err instanceof GenerationError) throw err;
    throw new GenerationError(
      `Gemini vision validation failed: ${err instanceof Error ? err.message : "unknown"}`,
      "UPSTREAM",
      VISION_UNAVAILABLE_MESSAGE
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// Image-to-Image editing via Gemini API with retry & timeout
export async function callGeminiImageToImage(
  apiKey: string,
  modelName: string,
  base64Image: string,
  mimeType: string,
  promptText: string,
  maxRetries: number = 2,
  timeoutMs: number = 35_000
): Promise<string> {
  const trimmedKey = (apiKey || "").trim();
  if (!trimmedKey || PLACEHOLDER_KEYS.has(trimmedKey)) {
    throw new GenerationError("Gemini image API key is missing or placeholder.", "CONFIG");
  }

  const endpoint = `${geminiBaseUrl()}/models/${modelName}:generateContent`;
  let lastError: GenerationError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, attempt - 1)));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": trimmedKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Image,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE"],
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch {
          // ignore
        }

        // 1. Quota exceeded on Free Tier
        if (res.status === 429 || errMsg.includes("Quota exceeded") || errMsg.includes("free_tier")) {
          throw new GenerationError(
            "Tài khoản Google Gemini của bạn đang ở gói Miễn phí (Free Tier), Google quy định hạn mức tạo sinh ảnh là 0 lượt/ngày. Vui lòng kích hoạt thanh toán (Pay-as-you-go) tại aistudio.google.com/app/plan_information.",
            "QUOTA"
          );
        }

        // 2. Unregistered caller / Missing API key
        if (res.status === 403 && (errMsg.includes("unregistered callers") || errMsg.includes("API Key"))) {
          throw new GenerationError(
            "Chưa nhận diện được Gemini API Key (Lỗi 403 unregistered caller). Hãy kiểm tra GEMINI_API_KEY trong .env.local và khởi động lại server Next.js (Ctrl+C rồi npm run dev).",
            "CONFIG"
          );
        }

        // 3. Model not found or deprecated
        if (res.status === 404) {
          throw new GenerationError(
            `Mô hình ${modelName} không tồn tại hoặc đã ngừng hỗ trợ. Vui lòng kiểm tra biến IMAGE_MODEL trong file .env.local.`,
            "CONFIG"
          );
        }

        // 4. Content Safety Filter
        if (
          res.status === 400 &&
          (errText.toLowerCase().includes("safety") || errMsg.toLowerCase().includes("safety"))
        ) {
          throw new GenerationError(SAFETY_BLOCK_MESSAGE, "SAFETY", SAFETY_BLOCK_MESSAGE);
        }

        throw new GenerationError(`Gemini API error [${res.status}]: ${errMsg.slice(0, 200)}`, "UPSTREAM");
      }

      const data = await res.json();
      const finishReason = data?.candidates?.[0]?.finishReason;
      if (
        data?.promptFeedback?.blockReason === "SAFETY" ||
        finishReason === "SAFETY" ||
        finishReason === "IMAGE_SAFETY"
      ) {
        throw new GenerationError(SAFETY_BLOCK_MESSAGE, "SAFETY", SAFETY_BLOCK_MESSAGE);
      }

      const parts = data.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || "image/jpeg";
          return `data:${outMime};base64,${part.inlineData.data}`;
        }
      }

      throw new GenerationError("Mô hình phản hồi nhưng không chứa dữ liệu ảnh kết quả.", "UPSTREAM");
    } catch (err: unknown) {
      const wrapped =
        err instanceof GenerationError
          ? err
          : new GenerationError(
              `Gemini image request failed: ${err instanceof Error ? err.message : "unknown"}`,
              "UPSTREAM"
            );
      lastError = wrapped;
      // Safety blocks, configuration problems, and quota exhaustion will not fix themselves on retry.
      if (wrapped.code === "SAFETY" || wrapped.code === "CONFIG" || wrapped.code === "QUOTA") break;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new GenerationError("Thao tác tạo sinh ảnh vượt quá thời gian chờ.", "UPSTREAM");
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
  // Other providers have no vision pre-check: accept the photo and rely on the
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
  if (provider.name === "huggingface") {
    return callHuggingFaceImageToImage(provider, rawBase64, mimeType, prompt);
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
        throw new GenerationError(detail, "SAFETY", SAFETY_BLOCK_MESSAGE);
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

/**
 * Hugging Face Inference Providers through the official SDK, which routes the
 * request to a serving partner (fal, Replicate, ...) and returns the edited image.
 */
async function callHuggingFaceImageToImage(
  provider: Extract<ImageProvider, { name: "huggingface" }>,
  rawBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const client = new InferenceClient(provider.token);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);
  try {
    const out = await client.imageToImage(
      {
        model: provider.imageModel,
        inputs: new Blob([Buffer.from(rawBase64, "base64")], { type: mimeType }),
        parameters: { prompt },
        // HF_ENDPOINT_URL is a test-only override; production lets the SDK route
        // through Hugging Face to the chosen provider (the SDK rejects both at once).
        ...(process.env.HF_ENDPOINT_URL
          ? { endpointUrl: process.env.HF_ENDPOINT_URL }
          : { provider: provider.inferenceProvider as never }),
      },
      { signal: controller.signal }
    );
    const type = out.type && out.type.startsWith("image/") ? out.type : "image/png";
    return `data:${type};base64,${Buffer.from(await out.arrayBuffer()).toString("base64")}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { httpResponse?: { status?: number } })?.httpResponse?.status;
    if (status === 401 || status === 403 || /unauthori|forbidden|gated|accept the (license|conditions)/i.test(message)) {
      throw new GenerationError(`Hugging Face auth/gating error: ${message.slice(0, 300)}`, "CONFIG");
    }
    if (status === 402 || status === 429 || /credit|quota|payment|exceeded/i.test(message)) {
      throw new GenerationError(
        `Hugging Face credits exhausted: ${message.slice(0, 300)}`,
        "QUOTA",
        "Hạn mức tạo ảnh miễn phí tháng này đã hết. Đang hiển thị ảnh minh họa."
      );
    }
    throw new GenerationError(`Hugging Face error (${provider.imageModel}): ${message.slice(0, 300)}`, "UPSTREAM");
  } finally {
    clearTimeout(timeoutId);
  }
}
