/**
 * AI Live PT Studio Session Engine.
 *
 * Deep module encapsulating webcam stream acquisition, MediaPipe WASM detection,
 * the 60fps animation frame loop, rep/hold tracking, and throttled voice coaching.
 *
 * Presents a minimal imperative / observable interface to UI callers and headless tests.
 */

import { api } from "@/lib/api-client";
import { SEMANTIC_COLORS } from "@/lib/design-tokens";
import {
  DEFAULT_EXERCISES,
  RepTracker,
  estimateCalories,
  exercisesFromApi,
  measureExerciseAngle,
  overallFormScore,
  type PosePoint,
  type StudioExercise,
  type ZonePosition,
} from "./pose-math";
import { createPoseLandmarker, type PoseLandmarker } from "./pose-detector";
import { drawDemo, drawLivePose } from "./skeleton-canvas";

export interface WorkoutSummaryData {
  caloriesBurned: number;
  /** 0–100 from camera tracking, or null when no frame was scored (camera off). */
  averageFormScore: number | null;
  durationMinutes: number;
  repsCompleted: number;
}

export type CameraState = "off" | "starting" | "loading-model" | "on";
export type CatalogSource = "loading" | "server" | "default";

export interface WorkoutSessionSnapshot {
  exercises: StudioExercise[];
  exerciseIndex: number;
  currentExercise: StudioExercise;
  count: number;
  isPaused: boolean;
  isMuted: boolean;
  cameraState: CameraState;
  cameraError: string | null;
  formScore: number | null;
  liveAngle: number | null;
  formStatus: string;
  catalogSource: CatalogSource;
  summary: WorkoutSummaryData | null;
}

export interface WorkoutSessionConfig {
  exercises?: StudioExercise[];
  archetype?: "female_pilates" | "male_strength";
  isMuted?: boolean;
  onSummary?: (summary: WorkoutSummaryData) => void;
}

export const HUD_INTERVAL_MS = 250;
export const CATALOG_TIMEOUT_MS = 4000;
export const CUE_GAP_MS = 4500;
export const FORM_CUE_AFTER_MS = 1500;

export function zoneHint(ex: StudioExercise, zone: ZonePosition, working: boolean): string {
  if (zone === "in") return "Chuẩn! Đang trong vùng góc mục tiêu";
  if (!working) return ex.holdSeconds ? "Vào tư thế để bắt đầu tính giờ" : "Sẵn sàng — bắt đầu động tác";
  return zone === "below"
    ? `Góc nhỏ hơn mục tiêu — mở khớp ra tới ${Math.round(ex.targetMin)}°`
    : `Góc lớn hơn mục tiêu — gập sâu tới ${Math.round(ex.targetMax)}°`;
}

/**
 * Throttled speech synthesis adapter with rate-limiting and safe fallbacks.
 */
export class VoiceCoach {
  private lastCueAt = 0;
  private muted = false;

  constructor(initialMuted = false) {
    this.muted = initialMuted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe fallback
      }
    }
  }

  speak(text: string, force = false): void {
    if (this.muted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const now = Date.now();
    if (!force && now - this.lastCueAt < CUE_GAP_MS) return;
    this.lastCueAt = now;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "vi-VN";
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    } catch {
      // Speech synthesis is optional
    }
  }
}

/**
 * Headless Workout Session Engine.
 */
export class WorkoutSessionEngine {
  private exercises: StudioExercise[];
  private exerciseIndex = 0;
  private count = 0;
  private isPaused = false;
  private isMuted = false;
  private cameraState: CameraState = "off";
  private cameraError: string | null = null;
  private formScore: number | null = null;
  private liveAngle: number | null = null;
  private formStatus = "Chế độ minh hoạ — chưa bật camera";
  private catalogSource: CatalogSource = "loading";
  private summary: WorkoutSummaryData | null = null;
  private lastMeasured: { joints: [number, number, number]; angle: number; zone: ZonePosition } | null = null;

  private voiceCoach: VoiceCoach;
  private tracker: RepTracker;
  private parts: { working: number; inZone: number }[] = [];
  private holdMs = 0;
  private totalReps = 0;
  private startedAt = 0;
  private outOfZoneSince: number | null = null;
  private completed = false;
  private cameraGen = 0;

  // Web hardware & canvas bindings
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private containerEl: HTMLElement | null = null;
  private stream: MediaStream | null = null;
  private landmarker: PoseLandmarker | null = null;
  private rafId = 0;
  private lastVideoTime = -1;
  private lastFrameAt = 0;
  private lastHudAt = 0;
  private lastStatusString = "";
  private holdIntervalId: NodeJS.Timeout | null = null;
  private catalogController: AbortController | null = null;

  private listeners = new Set<(snapshot: WorkoutSessionSnapshot) => void>();
  private onSummaryCallback?: (summary: WorkoutSummaryData) => void;
  private primaryColor: string;

  constructor(config: WorkoutSessionConfig = {}) {
    this.exercises = config.exercises ?? [...DEFAULT_EXERCISES];
    this.isMuted = config.isMuted ?? false;
    this.onSummaryCallback = config.onSummary;
    this.primaryColor =
      config.archetype === "male_strength" ? SEMANTIC_COLORS.success : SEMANTIC_COLORS.primary;
    this.voiceCoach = new VoiceCoach(this.isMuted);
    const firstEx = this.exercises[0] ?? DEFAULT_EXERCISES[0]!;
    this.tracker = new RepTracker(firstEx.targetMin, firstEx.targetMax);
    this.startedAt = Date.now();
  }

  // --- Snapshot & Subscription -----------------------------------------------

  getSnapshot(): WorkoutSessionSnapshot {
    const currentExercise = this.exercises[this.exerciseIndex] ?? this.exercises[0] ?? DEFAULT_EXERCISES[0]!;
    return {
      exercises: this.exercises,
      exerciseIndex: this.exerciseIndex,
      currentExercise,
      count: this.count,
      isPaused: this.isPaused,
      isMuted: this.isMuted,
      cameraState: this.cameraState,
      cameraError: this.cameraError,
      formScore: this.formScore,
      liveAngle: this.liveAngle,
      formStatus: this.formStatus,
      catalogSource: this.catalogSource,
      summary: this.summary,
    };
  }

  subscribe(listener: (snapshot: WorkoutSessionSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  // --- Session Lifecycle -----------------------------------------------------

  attachElements(elements: {
    video?: HTMLVideoElement | null;
    canvas?: HTMLCanvasElement | null;
    container?: HTMLElement | null;
  }): void {
    this.videoEl = elements.video ?? null;
    this.canvasEl = elements.canvas ?? null;
    this.containerEl = elements.container ?? null;
  }

  start(): void {
    this.resetSession(this.exercises);
    this.loadCatalog();
    this.startRenderLoop();
    this.startHoldTimer();
  }

  pause(): void {
    this.isPaused = true;
    this.notify();
  }

  resume(): void {
    this.isPaused = false;
    this.notify();
  }

  togglePause(): void {
    if (this.isPaused) this.resume();
    else this.pause();
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.voiceCoach.setMuted(muted);
    this.notify();
  }

  toggleMute(): void {
    this.setMuted(!this.isMuted);
  }

  dispose(): void {
    this.stopCamera();
    this.stopRenderLoop();
    this.stopHoldTimer();
    this.catalogController?.abort();
    this.catalogController = null;
    this.voiceCoach.setMuted(true);
    this.listeners.clear();
  }

  // --- Exercise Progression --------------------------------------------------

  resetSession(list: StudioExercise[]): void {
    this.exercises = list.length > 0 ? list : [...DEFAULT_EXERCISES];
    this.exerciseIndex = 0;
    this.parts = [];
    this.totalReps = 0;
    this.completed = false;
    this.startedAt = Date.now();
    this.summary = null;
    this.isPaused = false;
    this.resetExerciseTracking(this.exercises[0] ?? DEFAULT_EXERCISES[0]!);
    this.notify();
  }

  private resetExerciseTracking(ex: StudioExercise): void {
    this.tracker = new RepTracker(ex.targetMin, ex.targetMax);
    this.holdMs = 0;
    this.count = 0;
    this.outOfZoneSince = null;
    this.formScore = null;
    this.liveAngle = null;
    this.notify();
  }

  addCount(amount: number): void {
    const ex = this.exercises[this.exerciseIndex];
    if (!ex || this.completed) return;
    const value = this.count + amount;
    this.count = value;
    if (!ex.holdSeconds) this.totalReps += amount;
    this.notify();

    if (value >= ex.targetCount) {
      this.nextExercise();
    } else if (!ex.holdSeconds && value === Math.ceil(ex.targetCount / 2)) {
      this.voiceCoach.speak(`Tốt lắm! Còn ${ex.targetCount - value} lần nữa.`);
    }
  }

  nextExercise(): void {
    this.parts.push(this.tracker.frames);
    const next = this.exerciseIndex + 1;
    if (next >= this.exercises.length) {
      this.completeWorkout();
      return;
    }
    this.exerciseIndex = next;
    const ex = this.exercises[next]!;
    this.resetExerciseTracking(ex);
    this.voiceCoach.speak(`Chuyển sang bài: ${ex.name}. ${ex.cue}`, true);
    this.notify();
  }

  completeWorkout(): void {
    if (this.completed) return;
    this.completed = true;
    if (this.tracker.frames.working > 0) {
      this.parts.push(this.tracker.frames);
    }
    const durationSec = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
    const result: WorkoutSummaryData = {
      caloriesBurned: estimateCalories(durationSec),
      averageFormScore: overallFormScore(this.parts),
      durationMinutes: Math.max(1, Math.round(durationSec / 60)),
      repsCompleted: this.totalReps,
    };
    this.summary = result;
    this.stopCamera();
    this.stopHoldTimer();
    this.voiceCoach.speak("Chúc mừng bạn đã hoàn thành buổi tập hôm nay!", true);
    this.notify();
    this.onSummaryCallback?.(result);
  }

  // --- Camera & Model Lifecycle ----------------------------------------------

  async startCamera(): Promise<void> {
    const gen = ++this.cameraGen;
    this.cameraError = null;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      this.cameraError = "Trình duyệt không hỗ trợ camera. Bạn vẫn có thể tập và bấm +1 thủ công.";
      this.notify();
      return;
    }

    this.cameraState = "starting";
    this.notify();

    let mediaStream: MediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
    } catch {
      if (gen === this.cameraGen) {
        this.cameraState = "off";
        this.cameraError = "Chưa được cấp quyền camera. Bạn vẫn có thể tập và bấm +1 thủ công.";
        this.notify();
      }
      return;
    }

    if (gen !== this.cameraGen) {
      mediaStream.getTracks().forEach((t) => t.stop());
      return;
    }

    this.stream = mediaStream;
    if (this.videoEl) {
      this.videoEl.srcObject = mediaStream;
      await this.videoEl.play().catch(() => undefined);
    }

    this.cameraState = "loading-model";
    this.notify();

    try {
      const landmarker = await createPoseLandmarker();
      if (gen !== this.cameraGen) {
        landmarker.close();
        return;
      }
      this.landmarker = landmarker;
    } catch {
      if (gen === this.cameraGen) {
        this.stopCamera();
        this.cameraError = "Không tải được mô hình nhận diện tư thế. Kiểm tra kết nối mạng rồi thử lại.";
        this.notify();
      }
      return;
    }

    const currentEx = this.exercises[this.exerciseIndex] ?? DEFAULT_EXERCISES[0]!;
    this.resetExerciseTracking(currentEx);
    this.cameraState = "on";
    this.formStatus = "Đang tìm cơ thể…";
    this.voiceCoach.speak("Camera AI đã sẵn sàng. Hãy lùi ra xa để camera thấy toàn thân.", true);
    this.notify();
  }

  stopCamera(): void {
    this.cameraGen++;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.videoEl) this.videoEl.srcObject = null;
    this.landmarker?.close();
    this.landmarker = null;
    this.cameraState = "off";
    this.notify();
  }

  toggleCamera(): void {
    if (this.cameraState === "off") {
      void this.startCamera();
    } else {
      this.stopCamera();
    }
  }

  // --- Headless Pose Simulation (Testing Surface) -----------------------------

  /**
   * Process a frame's pose landmarks headlessly without requiring camera hardware.
   * Enables 1000x faster deterministic testing of tracking and voice cues.
   */
  processPoseFrame(landmarks: PosePoint[] | null, now: number = Date.now(), dt = 16): void {
    const ex = this.exercises[this.exerciseIndex];
    if (!ex || this.completed || this.isPaused) return;

    if (!landmarks) {
      this.formStatus = "Chưa thấy cơ thể — lùi ra xa camera";
      this.lastMeasured = null;
      return;
    }

    const m = measureExerciseAngle(landmarks, ex.joints);
    if (!m) {
      this.formStatus = "Chưa thấy rõ khớp cần đo — xoay người hoặc lùi xa hơn";
      this.lastMeasured = null;
      return;
    }

    const u = this.tracker.update(m.angle);
    this.lastMeasured = { ...m, zone: u.zone };
    this.liveAngle = Math.round(m.angle);
    this.formScore = this.tracker.formScore;
    this.formStatus = zoneHint(ex, u.zone, u.working);

    if (ex.holdSeconds) {
      if (u.zone === "in") {
        const before = Math.floor(this.holdMs / 1000);
        this.holdMs += dt;
        const after = Math.floor(this.holdMs / 1000);
        if (after > before) this.addCount(after - before);
      }
    } else if (u.repCompleted) {
      this.addCount(1);
    }

    if (u.working && u.zone !== "in") {
      this.outOfZoneSince ??= now;
      if (now - this.outOfZoneSince > FORM_CUE_AFTER_MS) {
        this.voiceCoach.speak(this.formStatus);
      }
    } else {
      this.outOfZoneSince = null;
    }
  }

  // --- Render Loop & Hold Timer ----------------------------------------------

  private startRenderLoop(): void {
    if (typeof window === "undefined") return;
    this.stopRenderLoop();

    const tick = (now: number) => {
      this.rafId = requestAnimationFrame(tick);
      if (this.completed) return;

      const dt = Math.min(100, now - (this.lastFrameAt || now));
      this.lastFrameAt = now;

      // Handle canvas rendering if elements are bound
      const canvas = this.canvasEl;
      const box = this.containerEl;
      const ctx = canvas?.getContext("2d");
      const video = this.videoEl;
      const landmarker = this.landmarker;
      const ex = this.exercises[this.exerciseIndex];

      if (canvas && box && ctx && ex) {
        const dpr = window.devicePixelRatio || 1;
        const w = box.clientWidth;
        const h = box.clientHeight;
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        if (this.cameraState !== "on" || !landmarker || !video) {
          drawDemo(ctx, { width: w, height: h }, now, ex, this.primaryColor);
        } else {
          let landmarks: PosePoint[] | null = null;
          if (video.readyState >= 2 && video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = video.currentTime;
            try {
              const result = landmarker.detectForVideo(video, now);
              landmarks = result.landmarks[0] ?? null;
            } catch {
              landmarks = null;
            }

            this.processPoseFrame(landmarks, now, dt);

            if (now - this.lastHudAt > HUD_INTERVAL_MS || this.formStatus !== this.lastStatusString) {
              this.lastHudAt = now;
              this.lastStatusString = this.formStatus;
              this.notify();
            }
          }

          if (landmarks) {
            drawLivePose(
              ctx,
              { width: w, height: h },
              landmarks,
              video.videoWidth || 1280,
              video.videoHeight || 720,
              {
                color: this.primaryColor,
                measured: this.lastMeasured,
              }
            );
          }
        }
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private stopRenderLoop(): void {
    if (this.rafId && typeof window !== "undefined") {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private startHoldTimer(): void {
    if (typeof window === "undefined") return;
    this.stopHoldTimer();
    this.holdIntervalId = setInterval(() => {
      const ex = this.exercises[this.exerciseIndex];
      // Without camera, a hold exercise is a plain timer
      if (!this.completed && !this.isPaused && this.cameraState !== "on" && ex?.holdSeconds) {
        this.addCount(1);
      }
    }, 1000);
  }

  private stopHoldTimer(): void {
    if (this.holdIntervalId) {
      clearInterval(this.holdIntervalId);
      this.holdIntervalId = null;
    }
  }

  // --- Catalog Fetching ------------------------------------------------------

  private loadCatalog(): void {
    if (typeof window === "undefined") return;
    this.catalogSource = "loading";
    this.notify();

    this.catalogController?.abort();
    const controller = new AbortController();
    this.catalogController = controller;
    const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);

    (async () => {
      try {
        const [ex, routines] = await Promise.allSettled([
          api.workouts.exercises({ signal: controller.signal }),
          api.workouts.routines({ signal: controller.signal }),
        ]);

        if (controller.signal.aborted && ex.status !== "fulfilled") {
          this.catalogSource = "default";
          this.notify();
          return;
        }

        const repsByCode: Record<string, number> = {};
        let order: string[] = [];

        if (routines.status === "fulfilled") {
          const routine = routines.value.find((r) => r.is_featured) ?? routines.value[0];
          for (const step of routine?.exercises_sequence ?? []) {
            if (step.exercise_code && typeof step.reps === "number") repsByCode[step.exercise_code] = step.reps;
          }
          order = (routine?.exercises_sequence ?? []).map((s) => s.exercise_code ?? "");
        }

        const list = ex.status === "fulfilled" ? exercisesFromApi(ex.value, repsByCode) : [];
        if (order.length) {
          const rank = (listArr: string[], code: string) => {
            const idx = listArr.indexOf(code);
            return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
          };
          list.sort((a, b) => rank(order, a.code) - rank(order, b.code));
        }

        const untouched = this.exerciseIndex === 0 && this.count === 0;
        if (list.length > 0 && untouched) {
          this.resetSession(list);
          this.catalogSource = "server";
        } else {
          this.catalogSource = "default";
        }
      } catch {
        this.catalogSource = "default";
      } finally {
        this.notify();
      }
    })().finally(() => clearTimeout(timer));

    if (this.exercises[0]?.cue) {
      this.voiceCoach.speak(this.exercises[0].cue);
    }
  }
}
