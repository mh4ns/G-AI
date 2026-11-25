/**
 * Browser-side helpers for the prediction job lifecycle.
 * The job token is a bearer secret for the user's generated images: it is only
 * ever sent to our own /api/prediction routes.
 */

import {
  type PredictionJobRef,
  isSignedUrlExpired,
  planSessionStore,
} from "./plan-session-store";

export type { PredictionJobRef };
export { isSignedUrlExpired };

export interface GeneratePredictionParams {
  userPhotoBase64: string;
  archetype: "female_pilates" | "male_strength";
  height: number;
  weight: number;
  targetWeight: number;
  planSummary: string;
  consentAccepted: boolean;
}

export interface PredictionProgress {
  current: number;
  total: number;
  stageMessage: string;
}

export interface GeneratePredictionResult {
  ok: boolean;
  code?: string;
  error?: string;
  jobId?: string;
  jobToken?: string;
  cached?: boolean;
  genderMismatchWarning?: string | null;
  completedMilestones?: Record<number, string>;
  progress?: PredictionProgress;
}

export interface PollPredictionResult {
  id?: string;
  status: "queued" | "running" | "pending" | "processing" | "done" | "failed";
  progress?: PredictionProgress;
  completedMilestones?: Record<number, string>;
  error?: { message: string };
}

export interface PredictionServiceStatus {
  enabled: boolean;
  provider?: string;
  model?: string;
}

export function saveJobRef(ref: PredictionJobRef) {
  planSessionStore.saveJobRef(ref);
}

export function loadJobRef(): PredictionJobRef | null {
  return planSessionStore.loadJobRef();
}

export function clearJobRef() {
  planSessionStore.clearJobRef();
}

export function hasPhotoConsent(): boolean {
  return planSessionStore.hasPhotoConsent();
}

export function setPhotoConsent(accepted: boolean) {
  planSessionStore.setPhotoConsent(accepted);
}

/** Deletes the generated images on the server, if we still hold a valid job reference. */
export async function deletePredictionOnServer(): Promise<boolean> {
  return planSessionStore.deletePredictionOnServer();
}

/** Submits a prediction generation request to the server API. */
export async function submitPredictionJob(
  params: GeneratePredictionParams
): Promise<GeneratePredictionResult> {
  try {
    const res = await fetch("/api/prediction/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      code: data.code,
      error: data.error,
      jobId: data.jobId,
      jobToken: data.jobToken,
      cached: data.cached,
      genderMismatchWarning: data.genderMismatchWarning ?? null,
      completedMilestones: data.completedMilestones,
      progress: data.progress,
    };
  } catch {
    return {
      ok: false,
      code: "NETWORK_ERROR",
      error: "Lỗi kết nối máy chủ khi tạo sinh ảnh.",
    };
  }
}

/** Polls the status and progress of an in-flight prediction job. */
export async function pollPredictionJob(
  jobId: string,
  jobToken: string
): Promise<PollPredictionResult | null> {
  try {
    const res = await fetch(`/api/prediction/${encodeURIComponent(jobId)}`, {
      headers: { "x-job-token": jobToken },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Checks whether the prediction backend service is enabled and operational. */
export async function checkPredictionServiceStatus(): Promise<PredictionServiceStatus | null> {
  try {
    const res = await fetch("/api/prediction/status");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
