import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  API_BASE,
  ApiError,
  createApiRequest,
  extractFastApiDetail,
  formatFastApiDetail,
  parseRetryAfter,
  type FetchLike,
} from "../api";

describe("@g-ai/ui/api", () => {
  it("joins baseUrl and path cleanly, sets credentials and default JSON Content-Type", async () => {
    let seenUrl = "";
    let seenInit: RequestInit | undefined;

    const mockFetch: FetchLike = async (input, init) => {
      seenUrl = String(input);
      seenInit = init;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const req = createApiRequest({ baseUrl: `${API_BASE}/`, fetch: mockFetch });
    const data = await req<{ ok: boolean }>("today/summary");

    assert.deepEqual(data, { ok: true });
    assert.equal(seenUrl, "/api/v1/today/summary");
    assert.equal(seenInit?.credentials, "same-origin");
    const headers = new Headers(seenInit?.headers);
    assert.equal(headers.get("Content-Type"), "application/json");
  });

  it("omits default JSON Content-Type for FormData bodies and returns undefined on 204", async () => {
    let seenHeaders: Headers | undefined;

    const mockFetch: FetchLike = async (_input, init) => {
      seenHeaders = new Headers(init?.headers);
      return new Response(null, { status: 204 });
    };

    const req = createApiRequest({ fetch: mockFetch });
    const form = new FormData();
    form.append("file", "blob-placeholder");

    const res = await req<void>("/upload", { method: "POST", body: form });
    assert.equal(res, undefined);
    assert.equal(seenHeaders?.has("Content-Type"), false);
  });

  it("normalizes FastAPI string detail, 422 validation array detail, and non-JSON fallback", async () => {
    const stringErrReq = createApiRequest({
      fetch: async () =>
        new Response(JSON.stringify({ detail: "Insufficient stock" }), { status: 409 }),
    });

    await assert.rejects(
      () => stringErrReq("/store/orders"),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 409);
        assert.equal(err.message, "Insufficient stock");
        assert.equal(err.detail, "Insufficient stock");
        return true;
      }
    );

    const validationDetail = [
      { loc: ["body", "customer_email"], msg: "value is not a valid email address", type: "value_error" },
      { loc: ["body", "items", 0, "quantity"], msg: "Input should be >= 1", type: "greater_than_equal" },
    ];
    const validationErrReq = createApiRequest({
      fetch: async () =>
        new Response(JSON.stringify({ detail: validationDetail }), { status: 422 }),
    });

    await assert.rejects(
      () => validationErrReq("/store/orders"),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 422);
        assert.deepEqual(err.detail, validationDetail);
        assert.equal(
          err.message,
          "body.customer_email: value is not a valid email address; body.items.0.quantity: Input should be >= 1"
        );
        return true;
      }
    );

    const nonJsonReq = createApiRequest({
      fetch: async () => new Response("Bad Gateway", { status: 502 }),
    });

    await assert.rejects(
      () => nonJsonReq("/health"),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 502);
        assert.equal(err.detail, undefined);
        assert.equal(err.message, "Request failed (502)");
        return true;
      }
    );
  });

  it("parses Retry-After integer seconds, HTTP-dates, and rejects invalid/zero values", () => {
    const now = Date.parse("2026-11-24T12:00:00Z");
    assert.equal(parseRetryAfter("42", now), 42);
    assert.equal(parseRetryAfter(" 15 ", now), 15);
    assert.equal(parseRetryAfter("0", now), undefined);
    assert.equal(parseRetryAfter("-5", now), undefined);
    assert.equal(parseRetryAfter("Wed, 24 Nov 2026 12:00:30 GMT", now), 30);
    assert.equal(parseRetryAfter("Wed, 24 Nov 2026 11:59:00 GMT", now), undefined);
    assert.equal(parseRetryAfter("not-a-date", now), undefined);
    assert.equal(parseRetryAfter(null, now), undefined);
  });

  it("propagates Retry-After onto ApiError with retryAfterSeconds === retryAfterSec", async () => {
    const req = createApiRequest({
      fetch: async () =>
        new Response(JSON.stringify({ detail: "Too many attempts" }), {
          status: 429,
          headers: { "Retry-After": "120" },
        }),
    });

    await assert.rejects(
      () => req("/auth/login"),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 429);
        assert.equal(err.retryAfterSeconds, 120);
        assert.equal(err.retryAfterSec, 120);
        return true;
      }
    );
  });

  it("handles timeoutMs via AbortController and external signal cancellation", async () => {
    const slowReq = createApiRequest({
      defaultTimeoutMs: 15,
      fetch: (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    });

    await assert.rejects(
      () => slowReq("/slow"),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.message, "Request timed out");
        assert.ok(err.cause !== undefined);
        return true;
      }
    );

    const externalController = new AbortController();
    const abortableReq = createApiRequest({
      fetch: (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          if (init?.signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    });

    const promise = abortableReq("/workouts/routines", { signal: externalController.signal });
    externalController.abort();

    await assert.rejects(
      () => promise,
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.message, "Request aborted");
        return true;
      }
    );
  });

  it("normalizes network failures to ApiError(0) with cause", async () => {
    const rootCause = new TypeError("Failed to fetch");
    const req = createApiRequest({
      fetch: async () => {
        throw rootCause;
      },
    });

    await assert.rejects(
      () => req("/store/orders"),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.message, "Network request failed");
        assert.equal(err.cause, rootCause);
        return true;
      }
    );

    assert.equal(extractFastApiDetail({ detail: "abc" }), "abc");
    assert.equal(extractFastApiDetail(null), undefined);
    assert.equal(formatFastApiDetail(400, []), "Request failed (400)");
  });
});
