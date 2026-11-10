/**
 * Lazily loads MediaPipe PoseLandmarker in the browser. The WASM runtime and
 * the model come from MediaPipe's official CDNs; video frames are processed
 * locally and never leave the device.
 */
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

// Keep in sync with the installed @mediapipe/tasks-vision version so the JS
// bundle and the WASM runtime match.
const TASKS_VISION_VERSION = "0.10.35";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export type { PoseLandmarker };

export async function createPoseLandmarker(): Promise<PoseLandmarker> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  const base = {
    runningMode: "VIDEO" as const,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
  try {
    return await PoseLandmarker.createFromOptions(fileset, {
      ...base,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    });
  } catch {
    // Some browsers/GPUs lack the WebGL features the GPU delegate needs.
    return PoseLandmarker.createFromOptions(fileset, {
      ...base,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
    });
  }
}
