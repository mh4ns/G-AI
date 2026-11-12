"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  X,
  Play,
  Pause,
  CheckCircle2,
  Flame,
  Award,
  Sparkles,
  ChevronRight,
  Activity,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
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

interface LiveWorkoutStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishWorkout: (summary: WorkoutSummaryData) => void;
  archetype?: "female_pilates" | "male_strength";
}

type CameraState = "off" | "starting" | "loading-model" | "on";
type CatalogSource = "loading" | "server" | "default";

const HUD_INTERVAL_MS = 250;
const CATALOG_TIMEOUT_MS = 4000;
const CUE_GAP_MS = 4500;
const FORM_CUE_AFTER_MS = 1500;

function formLabel(score: number | null): { text: string; className: string } {
  if (score == null) return { text: "Chưa đo", className: "text-stone-400" };
  if (score >= 85) return { text: "Rất tốt", className: "text-emerald-400" };
  if (score >= 65) return { text: "Khá", className: "text-amber-400" };
  return { text: "Cần chỉnh", className: "text-brand" };
}

function zoneHint(ex: StudioExercise, zone: ZonePosition, working: boolean): string {
  if (zone === "in") return "Chuẩn! Đang trong vùng góc mục tiêu";
  if (!working) return ex.holdSeconds ? "Vào tư thế để bắt đầu tính giờ" : "Sẵn sàng — bắt đầu động tác";
  // Below the zone = joint more bent than the target; above = more open.
  return zone === "below"
    ? `Góc nhỏ hơn mục tiêu — mở khớp ra tới ${Math.round(ex.targetMin)}°`
    : `Góc lớn hơn mục tiêu — gập sâu tới ${Math.round(ex.targetMax)}°`;
}

export const LiveWorkoutStudio: React.FC<LiveWorkoutStudioProps> = ({
  isOpen,
  onClose,
  onFinishWorkout,
  archetype = "female_pilates",
}) => {
  const [exercises, setExercises] = useState<StudioExercise[]>(DEFAULT_EXERCISES);
  const [catalogSource, setCatalogSource] = useState<CatalogSource>("loading");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [formScore, setFormScore] = useState<number | null>(null);
  const [liveAngle, setLiveAngle] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState("Chế độ minh hoạ — chưa bật camera");
  const [summary, setSummary] = useState<WorkoutSummaryData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  /** Bumped on every camera start/stop so stale async starts can bail out. */
  const cameraGenRef = useRef(0);

  // Mutable session state read by the rAF loop (no React re-render per frame).
  const exercisesRef = useRef(exercises);
  const indexRef = useRef(0);
  const countRef = useRef(0);
  const pausedRef = useRef(false);
  const mutedRef = useRef(false);
  const cameraOnRef = useRef(false);
  const trackerRef = useRef(new RepTracker(DEFAULT_EXERCISES[0]!.targetMin, DEFAULT_EXERCISES[0]!.targetMax));
  const partsRef = useRef<{ working: number; inZone: number }[]>([]);
  const holdMsRef = useRef(0);
  const totalRepsRef = useRef(0);
  const startedAtRef = useRef(0);
  const lastCueAtRef = useRef(0);
  const outOfZoneSinceRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const isMale = archetype === "male_strength";
  const primaryColor = isMale ? SEMANTIC_COLORS.success : SEMANTIC_COLORS.primary;
  const currentExercise = exercises[exerciseIndex] ?? exercises[0] ?? DEFAULT_EXERCISES[0]!;

  useEffect(() => {
    mutedRef.current = isMuted;
    if (isMuted && typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [isMuted]);
  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  const speak = useCallback((text: string, force = false) => {
    if (mutedRef.current || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const now = Date.now();
    if (!force && now - lastCueAtRef.current < CUE_GAP_MS) return;
    lastCueAtRef.current = now;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "vi-VN";
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    } catch {
      // Speech synthesis is optional.
    }
  }, []);

  const resetExerciseTracking = useCallback((ex: StudioExercise) => {
    trackerRef.current = new RepTracker(ex.targetMin, ex.targetMax);
    holdMsRef.current = 0;
    countRef.current = 0;
    outOfZoneSinceRef.current = null;
    setCount(0);
    setFormScore(null);
    setLiveAngle(null);
  }, []);

  const resetSession = useCallback(
    (list: StudioExercise[]) => {
      exercisesRef.current = list;
      indexRef.current = 0;
      partsRef.current = [];
      totalRepsRef.current = 0;
      completedRef.current = false;
      startedAtRef.current = Date.now();
      setExercises(list);
      setExerciseIndex(0);
      setSummary(null);
      setIsPaused(false);
      resetExerciseTracking(list[0] ?? DEFAULT_EXERCISES[0]!);
    },
    [resetExerciseTracking]
  );

  // --- Camera ----------------------------------------------------------------

  const stopCamera = useCallback(() => {
    cameraGenRef.current++;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    cameraOnRef.current = false;
    setCameraState("off");
  }, []);

  const startCamera = useCallback(async () => {
    const gen = ++cameraGenRef.current;
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Trình duyệt không hỗ trợ camera. Bạn vẫn có thể tập và bấm +1 thủ công.");
      return;
    }
    setCameraState("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
    } catch {
      if (gen === cameraGenRef.current) {
        setCameraState("off");
        setCameraError("Chưa được cấp quyền camera. Bạn vẫn có thể tập và bấm +1 thủ công.");
      }
      return;
    }
    if (gen !== cameraGenRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      await video.play().catch(() => undefined);
    }

    setCameraState("loading-model");
    try {
      const landmarker = await createPoseLandmarker();
      if (gen !== cameraGenRef.current) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;
    } catch {
      if (gen === cameraGenRef.current) {
        stopCamera();
        setCameraError("Không tải được mô hình nhận diện tư thế. Kiểm tra kết nối mạng rồi thử lại.");
      }
      return;
    }
    cameraOnRef.current = true;
    resetExerciseTracking(exercisesRef.current[indexRef.current] ?? DEFAULT_EXERCISES[0]!);
    setCameraState("on");
    setFormStatus("Đang tìm cơ thể…");
    speak("Camera AI đã sẵn sàng. Hãy lùi ra xa để camera thấy toàn thân.", true);
  }, [resetExerciseTracking, speak, stopCamera]);

  // --- Exercise flow ------------------------------------------------------------

  const completeWorkout = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    const result: WorkoutSummaryData = {
      caloriesBurned: estimateCalories(durationSec),
      averageFormScore: overallFormScore(partsRef.current),
      durationMinutes: Math.max(1, Math.round(durationSec / 60)),
      repsCompleted: totalRepsRef.current,
    };
    setSummary(result);
    stopCamera();
    try {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.55 }, colors: ["#FF5A36", "#10B981", "#FFFFFF", "#F59E0B"] });
    } catch {
      // Confetti is decorative.
    }
    speak("Chúc mừng bạn đã hoàn thành buổi tập hôm nay!", true);
  }, [speak, stopCamera]);

  const nextExercise = useCallback(() => {
    partsRef.current.push(trackerRef.current.frames);
    const list = exercisesRef.current;
    const next = indexRef.current + 1;
    if (next >= list.length) {
      completeWorkout();
      return;
    }
    indexRef.current = next;
    setExerciseIndex(next);
    const ex = list[next]!;
    resetExerciseTracking(ex);
    speak(`Chuyển sang bài: ${ex.name}. ${ex.cue}`, true);
  }, [completeWorkout, resetExerciseTracking, speak]);

  const addCount = useCallback(
    (amount: number) => {
      const ex = exercisesRef.current[indexRef.current];
      if (!ex || completedRef.current) return;
      const value = countRef.current + amount;
      countRef.current = value;
      if (!ex.holdSeconds) totalRepsRef.current += amount;
      setCount(value);
      if (value >= ex.targetCount) {
        nextExercise();
      } else if (!ex.holdSeconds && value === Math.ceil(ex.targetCount / 2)) {
        speak(`Tốt lắm! Còn ${ex.targetCount - value} lần nữa.`);
      }
    },
    [nextExercise, speak]
  );

  // Load the exercise catalog whenever the studio opens; fall back to defaults.
  useEffect(() => {
    if (!isOpen) return;
    resetSession(DEFAULT_EXERCISES);
    setCatalogSource("loading");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
    (async () => {
      const [ex, routines] = await Promise.allSettled([
        api.workouts.exercises({ signal: controller.signal }),
        api.workouts.routines({ signal: controller.signal }),
      ]);
      if (controller.signal.aborted && ex.status !== "fulfilled") {
        setCatalogSource("default");
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
      if (order.length) list.sort((a, b) => rank(order, a.code) - rank(order, b.code));
      // Only swap the catalog if the user has not started yet.
      const untouched = indexRef.current === 0 && countRef.current === 0;
      if (list.length > 0 && untouched) {
        resetSession(list);
        setCatalogSource("server");
      } else {
        setCatalogSource("default");
      }
    })().finally(() => clearTimeout(timer));
    speak(DEFAULT_EXERCISES[0]!.cue);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [isOpen, resetSession, speak]);

  // Camera only runs while the studio is open.
  useEffect(() => {
    if (!isOpen) stopCamera();
    return () => stopCamera();
  }, [isOpen, stopCamera]);

  // Without a camera a hold is a plain timer (nothing is measured).
  useEffect(() => {
    if (!isOpen || isPaused || summary || cameraState === "on" || !currentExercise.holdSeconds) return;
    const t = setInterval(() => addCount(1), 1000);
    return () => clearInterval(t);
  }, [isOpen, isPaused, summary, cameraState, currentExercise, addCount]);

  // --- Render loop: detection + drawing at display rate -------------------------

  useEffect(() => {
    if (!isOpen || summary) return;
    const canvas = canvasRef.current;
    const box = containerRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !box || !ctx) return;

    let raf = 0;
    let lastVideoTime = -1;
    let lastFrameAt = performance.now();
    let lastHudAt = 0;
    let landmarks: PosePoint[] | null = null;
    let measured: { joints: [number, number, number]; angle: number; zone: ZonePosition } | null = null;
    let lastStatus = "";

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(100, now - lastFrameAt);
      lastFrameAt = now;

      const dpr = window.devicePixelRatio || 1;
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const ex = exercisesRef.current[indexRef.current];
      if (!ex) return;
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (!cameraOnRef.current || !landmarker || !video) {
        drawDemo(ctx, { width: w, height: h }, now, ex, primaryColor);
        return;
      }

      if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        try {
          const result = landmarker.detectForVideo(video, now);
          landmarks = result.landmarks[0] ?? null;
        } catch {
          landmarks = null;
        }

        measured = null;
        let status: string;
        if (!landmarks) {
          status = "Chưa thấy cơ thể — lùi ra xa camera";
        } else {
          const m = measureExerciseAngle(landmarks, ex.joints);
          if (!m) {
            status = "Chưa thấy rõ khớp cần đo — xoay người hoặc lùi xa hơn";
          } else if (pausedRef.current) {
            status = "Đang tạm dừng";
            measured = { ...m, zone: "in" };
          } else {
            const u = trackerRef.current.update(m.angle);
            measured = { ...m, zone: u.zone };
            status = zoneHint(ex, u.zone, u.working);

            if (ex.holdSeconds) {
              if (u.zone === "in") {
                const before = Math.floor(holdMsRef.current / 1000);
                holdMsRef.current += dt;
                const after = Math.floor(holdMsRef.current / 1000);
                if (after > before) addCount(after - before);
              }
            } else if (u.repCompleted) {
              addCount(1);
            }

            if (u.working && u.zone !== "in") {
              outOfZoneSinceRef.current ??= now;
              if (now - outOfZoneSinceRef.current > FORM_CUE_AFTER_MS) speak(status);
            } else {
              outOfZoneSinceRef.current = null;
            }
          }
        }

        if (now - lastHudAt > HUD_INTERVAL_MS || status !== lastStatus) {
          lastHudAt = now;
          lastStatus = status;
          setFormStatus(status);
          setFormScore(trackerRef.current.formScore);
          setLiveAngle(measured ? Math.round(measured.angle) : null);
        }
      }

      if (landmarks) {
        drawLivePose(ctx, { width: w, height: h }, landmarks, video.videoWidth || 1280, video.videoHeight || 720, {
          color: primaryColor,
          measured,
        });
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, summary, primaryColor, addCount, speak]);

  useEffect(() => {
    if (cameraState === "off") setFormStatus("Chế độ minh hoạ — chưa bật camera");
  }, [cameraState]);

  const handleFinishAndSave = () => {
    if (summary) onFinishWorkout(summary);
    onClose();
  };

  if (!isOpen) return null;

  const cameraOn = cameraState === "on";
  const cameraBusy = cameraState === "starting" || cameraState === "loading-model";
  const label = formLabel(formScore);
  const summaryLabel = formLabel(summary?.averageFormScore ?? null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Live PT Studio"
      className="fixed inset-0 z-50 bg-canvas-dark text-white flex flex-col select-none overflow-hidden"
    >
      <header className="h-16 px-3 sm:px-6 border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md flex items-center justify-between gap-2 z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center">
            <Activity className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-mono font-bold tracking-widest text-brand uppercase">
                AI Live PT Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold whitespace-nowrap">
                BÀI {Math.min(exerciseIndex + 1, exercises.length)}/{exercises.length}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-stone-200 truncate">{currentExercise.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-2.5 rounded-full border bg-stone-900 border-stone-700 text-stone-300 hover:text-white transition-colors"
            title={isMuted ? "Bật hướng dẫn giọng nói" : "Tắt giọng nói"}
            aria-label={isMuted ? "Bật hướng dẫn giọng nói" : "Tắt giọng nói"}
            aria-pressed={!isMuted}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {!summary && (
            <button
              onClick={cameraOn || cameraBusy ? stopCamera : startCamera}
              className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-colors flex items-center gap-1.5 ${
                cameraOn
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  : "bg-stone-900 border-stone-700 text-stone-300 hover:text-white"
              }`}
              aria-label={cameraOn ? "Tắt camera" : "Bật camera"}
              aria-pressed={cameraOn}
            >
              {cameraBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : cameraOn ? (
                <Camera className="w-3.5 h-3.5" />
              ) : (
                <CameraOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {cameraOn ? "Tắt camera" : cameraBusy ? "Đang khởi động…" : "Bật camera"}
              </span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition-colors"
            title="Đóng buồng tập"
            aria-label="Đóng buồng tập"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {!summary ? (
        <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* Camera / skeleton arena */}
          <div
            ref={containerRef}
            className="lg:col-span-8 relative bg-black overflow-hidden border-b lg:border-b-0 lg:border-r border-stone-800 h-[52vh] min-h-[300px] lg:h-auto shrink-0"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-500 ${
                cameraOn ? "opacity-80" : "opacity-0"
              }`}
            />
            {!cameraOn && (
              <div className="absolute inset-0 bg-[radial-gradient(#292524_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
            )}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />

            <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono max-w-full"
                role="status"
                aria-live="polite"
              >
                <span className={`w-2 h-2 shrink-0 rounded-full ${cameraOn ? "bg-emerald-400 animate-pulse" : "bg-stone-500"}`} />
                <span className="text-stone-200 truncate">{formStatus}</span>
              </div>
              {cameraOn && liveAngle != null && (
                <div className="px-3 py-1.5 rounded-full bg-black/75 border border-white/10 text-xs font-mono text-stone-200">
                  {liveAngle}° · mục tiêu {Math.round(currentExercise.targetMin)}–{Math.round(currentExercise.targetMax)}°
                </div>
              )}
            </div>

            {!cameraOn && (
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-stone-700 text-xs">
                <div className="flex items-start gap-2 text-stone-300">
                  {cameraError ? (
                    <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <span>
                    {cameraError ??
                      (cameraBusy
                        ? cameraState === "loading-model"
                          ? "Đang tải mô hình nhận diện tư thế (chỉ lần đầu)…"
                          : "Đang xin quyền camera…"
                        : "Bật camera để AI đếm rep và chấm form. Video chỉ xử lý trên máy bạn, không gửi đi đâu.")}
                  </span>
                </div>
                {!cameraBusy && (
                  <button
                    onClick={startCamera}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-200 text-stone-900 font-bold font-mono text-[11px] shrink-0 transition-colors"
                  >
                    {cameraError ? "Thử lại" : "Kết nối camera"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* HUD */}
          <div className="lg:col-span-4 bg-stone-950 p-4 sm:p-6 flex flex-col justify-between gap-6 lg:overflow-y-auto">
            <div className="space-y-5">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(exercises.length, 4)}, minmax(0, 1fr))` }}>
                {exercises.map((ex, idx) => {
                  const isDone = idx < exerciseIndex;
                  const isCurrent = idx === exerciseIndex;
                  return (
                    <div
                      key={ex.code}
                      className={`p-2 rounded-xl border text-center transition-colors ${
                        isCurrent
                          ? "bg-brand/15 border-brand/60 text-white"
                          : isDone
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-stone-900/40 border-stone-800 text-stone-500"
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase">Bài {idx + 1}</div>
                      <div className="text-xs font-bold truncate mt-0.5" title={ex.name}>{ex.name}</div>
                    </div>
                  );
                })}
              </div>
              {catalogSource === "default" && (
                <p className="text-[11px] text-stone-500 -mt-2">Máy chủ chưa phản hồi — đang dùng bài tập mặc định.</p>
              )}

              <div className="p-5 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-950 to-black border border-stone-800 text-center">
                <div className="text-xs font-mono uppercase tracking-widest text-brand font-bold">
                  {currentExercise.holdSeconds ? "Thời gian giữ đúng tư thế" : "Số lần đã hoàn thành"}
                </div>
                <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight my-2 text-white tabular-nums">
                  {count}{" "}
                  <span className="text-xl font-normal text-stone-500">
                    / {currentExercise.targetCount} {currentExercise.holdSeconds ? "giây" : "lần"}
                  </span>
                </div>
                <p className="text-xs text-stone-400">{currentExercise.criteria}</p>
                <div className="w-full h-2 rounded-full bg-stone-800 mt-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand to-emerald-400 origin-left transition-transform duration-300"
                    style={{ transform: `scaleX(${Math.min(1, count / currentExercise.targetCount)})` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                    Độ chuẩn form (bài này)
                  </span>
                  <div className={`text-xl font-black font-mono mt-0.5 ${label.className}`}>
                    {formScore == null ? "—" : `${formScore}%`} · {label.text}
                  </div>
                  <span className="text-[10px] text-stone-500">% khung hình nằm trong vùng góc mục tiêu</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono text-brand font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chỉ dẫn từ AI PT</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
                  &ldquo;{currentExercise.cue}&rdquo;
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-stone-800/80">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => addCount(1)}
                  disabled={isPaused}
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-stone-200 text-stone-950 font-bold font-mono text-xs transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  +1 {currentExercise.holdSeconds ? "giây" : "rep"} (thủ công)
                </button>
                <button
                  onClick={() => setIsPaused((p) => !p)}
                  className="px-4 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white font-bold font-mono text-xs transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
                </button>
              </div>
              <button
                onClick={nextExercise}
                className="w-full py-2.5 rounded-xl border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Bỏ qua động tác này</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-stone-950 to-canvas-dark">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HOÀN THÀNH BUỔI TẬP</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {summary.repsCompleted > 0 ? "Xuất sắc! Bạn đã tập xong" : "Buổi tập đã kết thúc"}
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
                {summary.averageFormScore == null
                  ? "Buổi này chưa bật camera nên chưa chấm form. Lần sau bật camera để AI đo góc khớp cho bạn."
                  : "Điểm form là tỉ lệ khung hình góc khớp nằm trong vùng mục tiêu."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                <div className="flex items-center justify-center gap-1 text-[11px] text-amber-500 font-mono">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Calo</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">~{summary.caloriesBurned}</div>
                <div className="text-[10px] text-stone-500">kcal (ước tính)</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <Award className="w-3.5 h-3.5" />
                  <span>Form</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                  {summary.averageFormScore == null ? "—" : `${summary.averageFormScore}%`}
                </div>
                <div className={`text-[10px] ${summaryLabel.className}`}>{summaryLabel.text}</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                <div className="flex items-center justify-center gap-1 text-[11px] text-sky-400 font-mono">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Rep</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">{summary.repsCompleted}</div>
                <div className="text-[10px] text-stone-500">{summary.durationMinutes} phút</div>
              </div>
            </div>

            <button
              onClick={handleFinishAndSave}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand to-brand-deep hover:brightness-110 text-white font-bold font-mono text-sm shadow-xl shadow-brand/25 transition-[filter] active:scale-[0.98]"
            >
              Lưu kết quả & cập nhật Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function rank(order: string[], code: string): number {
  const i = order.indexOf(code);
  return i === -1 ? order.length : i;
}
