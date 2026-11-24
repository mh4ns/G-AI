import test from "node:test";
import assert from "node:assert/strict";
import {
  saveJobRef,
  loadJobRef,
  clearJobRef,
  hasPhotoConsent,
  setPhotoConsent,
  submitPredictionJob,
  pollPredictionJob,
  checkPredictionServiceStatus,
  isSignedUrlExpired,
} from "../prediction-client";
import { calorieLine } from "@/components/prediction/usePredictionSession";

// Mock localStorage for node test runner
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

test("calorieLine calculations format deficit, surplus and maintenance", () => {
  assert.equal(
    calorieLine(2000, 1600),
    "1600 kcal/ngày (ít hơn mức tiêu hao khoảng 400 kcal)"
  );
  assert.equal(
    calorieLine(2000, 2300),
    "2300 kcal/ngày (nhiều hơn mức tiêu hao khoảng 300 kcal)"
  );
  assert.equal(
    calorieLine(2000, 1995),
    "1995 kcal/ngày (giữ mức tiêu hao)"
  );
});

test("prediction-client storage helpers manage job refs safely", () => {
  const originalWindow = globalThis.window;
  const mockStorage = new MockLocalStorage();
  // @ts-expect-error test environment mock
  globalThis.window = { localStorage: mockStorage };

  try {
    clearJobRef();
    assert.equal(loadJobRef(), null);

    saveJobRef({ jobId: "job-123", jobToken: "tok-abc" });
    const loaded = loadJobRef();
    assert.deepEqual(loaded, { jobId: "job-123", jobToken: "tok-abc" });

    clearJobRef();
    assert.equal(loadJobRef(), null);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("prediction-client consent helpers manage opt-in flags", () => {
  const originalWindow = globalThis.window;
  const mockStorage = new MockLocalStorage();
  // @ts-expect-error test environment mock
  globalThis.window = { localStorage: mockStorage };

  try {
    assert.equal(hasPhotoConsent(), false);

    setPhotoConsent(true);
    assert.equal(hasPhotoConsent(), true);

    setPhotoConsent(false);
    assert.equal(hasPhotoConsent(), false);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("submitPredictionJob and pollPredictionJob interact with fetch adapter", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // 1. Successful submission
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/prediction/generate") {
        return new Response(
          JSON.stringify({
            success: true,
            jobId: "job-789",
            jobToken: "tok-xyz",
            cached: false,
            genderMismatchWarning: null,
            progress: { current: 0, total: 3, stageMessage: "Đang xếp hàng..." },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/api/prediction/job-789")) {
        assert.equal(init?.headers && (init.headers as Record<string, string>)["x-job-token"], "tok-xyz");
        return new Response(
          JSON.stringify({
            status: "done",
            progress: { current: 3, total: 3, stageMessage: "Hoàn tất" },
            completedMilestones: { 7: "url-7", 14: "url-14", 28: "url-28" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url === "/api/prediction/status") {
        return new Response(
          JSON.stringify({ enabled: true, provider: "gemini", model: "imagen-3" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("Not Found", { status: 404 });
    };

    const submitRes = await submitPredictionJob({
      userPhotoBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      archetype: "female_pilates",
      height: 162,
      weight: 56,
      targetWeight: 52,
      planSummary: "Pilates & cơ lõi · 18 hiệp mỗi tuần",
      consentAccepted: true,
    });

    assert.equal(submitRes.ok, true);
    assert.equal(submitRes.jobId, "job-789");
    assert.equal(submitRes.jobToken, "tok-xyz");

    const pollRes = await pollPredictionJob("job-789", "tok-xyz");
    assert.ok(pollRes);
    assert.equal(pollRes.status, "done");
    assert.equal(pollRes.completedMilestones?.[7], "url-7");

    const statusRes = await checkPredictionServiceStatus();
    assert.ok(statusRes);
    assert.equal(statusRes.enabled, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("isSignedUrlExpired detects legacy and expired links", () => {
  const now = 1700000000000;
  // Legacy /generated/ links are expired
  assert.equal(isSignedUrlExpired("/generated/123.jpg", now), true);
  // Missing exp on /api/prediction/image/ is expired
  assert.equal(isSignedUrlExpired("/api/prediction/image/test", now), true);
  // Exp in the past
  assert.equal(isSignedUrlExpired(`/api/prediction/image/test?exp=${Math.floor(now / 1000) - 60}`, now), true);
  // Exp in the future
  assert.equal(isSignedUrlExpired(`/api/prediction/image/test?exp=${Math.floor(now / 1000) + 600}`, now), false);
});
