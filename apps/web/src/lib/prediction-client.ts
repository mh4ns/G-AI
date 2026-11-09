/**
 * Browser-side helpers for the prediction job lifecycle.
 * The job token is a bearer secret for the user's generated images: it is only
 * ever sent to our own /api/prediction routes.
 */

const JOB_KEY = "g_ai_prediction_job";
const CONSENT_KEY = "g_ai_ai_photo_consent";

export interface PredictionJobRef {
  jobId: string;
  jobToken: string;
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function saveJobRef(ref: PredictionJobRef) {
  safeStorage()?.setItem(JOB_KEY, JSON.stringify(ref));
}

export function loadJobRef(): PredictionJobRef | null {
  try {
    const raw = safeStorage()?.getItem(JOB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.jobId === "string" && typeof parsed?.jobToken === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearJobRef() {
  safeStorage()?.removeItem(JOB_KEY);
}

export function hasPhotoConsent(): boolean {
  return safeStorage()?.getItem(CONSENT_KEY) === "1";
}

export function setPhotoConsent(accepted: boolean) {
  if (accepted) safeStorage()?.setItem(CONSENT_KEY, "1");
  else safeStorage()?.removeItem(CONSENT_KEY);
}

/** Deletes the generated images on the server, if we still hold a valid job reference. */
export async function deletePredictionOnServer(): Promise<boolean> {
  const ref = loadJobRef();
  if (!ref) return true;
  try {
    const res = await fetch("/api/prediction/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ref),
    });
    // 404 means the job already expired; nothing left that we can address.
    if (res.ok || res.status === 404) {
      clearJobRef();
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}

/** True when a signed /api/prediction/image URL has passed its expiry. */
export function isSignedUrlExpired(url: string, nowMs: number = Date.now()): boolean {
  // Links from before images moved to private storage no longer resolve.
  if (url.startsWith("/generated/")) return true;
  const match = /[?&]exp=(\d+)/.exec(url);
  if (!match) return !url.startsWith("data:") && url.startsWith("/api/prediction/image/");
  return Number(match[1]) * 1000 <= nowMs;
}
