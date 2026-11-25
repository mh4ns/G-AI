export const API_BASE = "/api/v1";

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface FastApiValidationItem {
  loc?: ReadonlyArray<string | number>;
  msg?: string;
  type?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly detail?: unknown;
  public readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    message: string,
    detail?: unknown,
    retryAfterSeconds?: number,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  /** Alias kept for apps/web callers (e.g. login/page.tsx) until migrated. */
  get retryAfterSec(): number | undefined {
    return this.retryAfterSeconds;
  }
}

export interface ApiRequestOptions extends RequestInit {
  /** Aborts the request and throws ApiError(0, "Request timed out") after ms. */
  timeoutMs?: number;
}

export interface CreateApiRequestConfig {
  baseUrl?: string;
  fetch?: FetchLike;
  defaultTimeoutMs?: number;
  credentials?: RequestCredentials;
}

export type ApiRequestFn = <T>(path: string, init?: ApiRequestOptions) => Promise<T>;

export function parseRetryAfter(
  headerValue: string | null,
  nowMs: number = Date.now()
): number | undefined {
  if (!headerValue) return undefined;
  const trimmed = headerValue.trim();
  if (!trimmed) return undefined;

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
  }

  const parsedMs = Date.parse(trimmed);
  if (Number.isNaN(parsedMs)) return undefined;

  const deltaSeconds = Math.ceil((parsedMs - nowMs) / 1000);
  return Number.isFinite(deltaSeconds) && deltaSeconds >= 1 ? deltaSeconds : undefined;
}

export function extractFastApiDetail(body: unknown): unknown {
  if (body && typeof body === "object" && "detail" in body) {
    return (body as { detail: unknown }).detail;
  }
  return undefined;
}

export function formatFastApiDetail(status: number, detail: unknown): string {
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (!item || typeof item !== "object") return "";
        const entry = item as FastApiValidationItem;
        const msg = typeof entry.msg === "string" ? entry.msg.trim() : "";
        const loc =
          Array.isArray(entry.loc) && entry.loc.length > 0
            ? entry.loc.map((segment) => String(segment)).join(".")
            : "";
        if (loc && msg) return `${loc}: ${msg}`;
        return msg || loc;
      })
      .filter((part) => part.length > 0);

    if (parts.length > 0) {
      return parts.join("; ");
    }
  }

  return `Request failed (${status})`;
}

export function createApiRequest(config?: CreateApiRequestConfig): ApiRequestFn {
  const baseUrl = (config?.baseUrl ?? API_BASE).replace(/\/+$/, "");

  return async function request<T>(path: string, init: ApiRequestOptions = {}): Promise<T> {
    const fetchImpl = config?.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      throw new ApiError(0, "Network request failed");
    }

    const {
      timeoutMs: initTimeoutMs,
      signal: externalSignal,
      headers: initHeaders,
      credentials: initCredentials,
      ...restInit
    } = init;

    const headers = new Headers(initHeaders);
    const isFormData = typeof FormData !== "undefined" && restInit.body instanceof FormData;
    if (!isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const credentials = initCredentials ?? config?.credentials ?? "same-origin";
    const timeoutMs = initTimeoutMs ?? config?.defaultTimeoutMs;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${baseUrl}${normalizedPath}`;

    const controller = new AbortController();
    let timedOut = false;
    let abortedByCaller = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const onExternalAbort = () => {
      abortedByCaller = true;
      controller.abort(externalSignal?.reason);
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        abortedByCaller = true;
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener("abort", onExternalAbort, { once: true });
      }
    }

    if (typeof timeoutMs === "number" && Number.isFinite(timeoutMs) && timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
    }

    let res: Response;
    try {
      res = await fetchImpl(url, {
        ...restInit,
        headers,
        credentials,
        signal: controller.signal,
      });
    } catch (err) {
      if (timedOut) {
        throw new ApiError(0, "Request timed out", undefined, undefined, { cause: err });
      }
      if (abortedByCaller || externalSignal?.aborted) {
        throw new ApiError(0, "Request aborted", undefined, undefined, { cause: err });
      }
      throw new ApiError(0, "Network request failed", undefined, undefined, { cause: err });
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      if (externalSignal) {
        externalSignal.removeEventListener("abort", onExternalAbort);
      }
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = extractFastApiDetail(body);
      const message = formatFastApiDetail(res.status, detail);
      const retryAfterSeconds = parseRetryAfter(res.headers.get("Retry-After"));
      throw new ApiError(res.status, message, detail, retryAfterSeconds);
    }

    return body as T;
  };
}

export const apiRequest: ApiRequestFn = createApiRequest();
