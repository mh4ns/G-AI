"use client";

import React, { useEffect, useRef } from "react";
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
import { useWorkoutSession } from "./useWorkoutSession";
import { type WorkoutSummaryData } from "./workout-session-engine";

export type { WorkoutSummaryData };

export function createSaveOnceGuard() {
  let saved = false;
  return {
    trySave<T>(summary: T | null, onSave: (summary: T) => void): boolean {
      if (!summary || saved) return false;
      saved = true;
      onSave(summary);
      return true;
    },
    reset() {
      saved = false;
    },
  };
}

interface LiveWorkoutStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishWorkout: (summary: WorkoutSummaryData) => void;
  archetype?: "female_pilates" | "male_strength";
}

function formLabel(score: number | null): { text: string; className: string } {
  if (score == null) return { text: "Chưa đo", className: "text-stone-400" };
  if (score >= 85) return { text: "Rất tốt", className: "text-emerald-400" };
  if (score >= 65) return { text: "Khá", className: "text-amber-400" };
  return { text: "Cần chỉnh", className: "text-brand" };
}

export const LiveWorkoutStudio: React.FC<LiveWorkoutStudioProps> = ({
  isOpen,
  onClose,
  onFinishWorkout,
  archetype = "female_pilates",
}) => {
  const {
    exercises,
    exerciseIndex,
    currentExercise,
    count,
    isPaused,
    isMuted,
    cameraState,
    cameraError,
    formScore,
    liveAngle,
    formStatus,
    catalogSource,
    summary,
    containerRef,
    videoRef,
    canvasRef,
    addCount,
    nextExercise,
    startCamera,
    stopCamera,
    togglePause,
    toggleMute,
  } = useWorkoutSession({
    isOpen,
    archetype,
  });

  const saveGuardRef = useRef(createSaveOnceGuard());
  useEffect(() => {
    if (!isOpen || !summary) {
      saveGuardRef.current.reset();
    }
  }, [isOpen, summary]);

  const handleFinishAndSave = () => {
    saveGuardRef.current.trySave(summary, onFinishWorkout);
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
      aria-label="Phòng tập với camera"
      className="fixed inset-0 z-50 bg-canvas-dark text-white flex flex-col select-none overflow-hidden"
    >
      <header className="h-16 px-3 sm:px-6 border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md flex items-center justify-between gap-2 z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center">
            <Activity className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-bold text-brand">
                Phòng tập với camera
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold whitespace-nowrap">
                Bài {Math.min(exerciseIndex + 1, exercises.length)}/{exercises.length}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-stone-200 truncate">{currentExercise.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleMute}
            className="w-11 h-11 flex items-center justify-center rounded-full border bg-stone-900 border-stone-700 text-stone-300 hover:text-white transition-colors"
            title={isMuted ? "Bật hướng dẫn giọng nói" : "Tắt giọng nói"}
            aria-label={isMuted ? "Bật hướng dẫn giọng nói" : "Tắt giọng nói"}
            aria-pressed={!isMuted}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {!summary && (
            <button
              onClick={cameraOn || cameraBusy ? stopCamera : startCamera}
              className={`min-h-11 px-3.5 rounded-full border text-sm font-semibold transition-colors flex items-center gap-1.5 ${
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
            className="w-11 h-11 flex items-center justify-center rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition-colors"
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-xs max-w-full"
                role="status"
                aria-live="polite"
              >
                <span className={`w-2 h-2 shrink-0 rounded-full ${cameraOn ? "bg-emerald-400 animate-pulse" : "bg-stone-500"}`} />
                <span className="text-stone-200 truncate">{formStatus}</span>
              </div>
              {cameraOn && liveAngle != null && (
                <div className="px-3 py-1.5 rounded-full bg-black/75 border border-white/10 text-xs text-stone-200">
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
                    className="min-h-11 px-4 rounded-xl bg-white hover:bg-stone-200 text-stone-900 font-semibold text-sm shrink-0 transition-colors"
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
                      <div className="text-xs">Bài {idx + 1}</div>
                      <div className="text-xs font-semibold line-clamp-2 mt-0.5">{ex.name}</div>
                    </div>
                  );
                })}
              </div>
              {catalogSource === "default" && (
                <p className="text-xs text-stone-500 -mt-2">Máy chủ chưa phản hồi — đang dùng bài tập mặc định.</p>
              )}

              <div className="p-5 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-950 to-black border border-stone-800 text-center">
                <div className="text-xs text-brand font-bold">
                  {currentExercise.holdSeconds ? "Thời gian giữ đúng tư thế" : "Số lần đã hoàn thành"}
                </div>
                <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight my-2 text-white tabular-nums">
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
                  <span className="text-xs text-stone-400 block">
                    Độ chuẩn form (bài này)
                  </span>
                  <div className={`text-xl font-extrabold font-mono mt-0.5 ${label.className}`}>
                    {formScore == null ? "—" : `${formScore}%`} · {label.text}
                  </div>
                  <span className="text-xs text-stone-500">% khung hình nằm trong vùng góc mục tiêu</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-brand font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lời nhắc của AI</span>
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
                  className="min-h-12 px-4 rounded-2xl bg-white hover:bg-stone-200 text-stone-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  +1 {currentExercise.holdSeconds ? "giây" : "rep"} (thủ công)
                </button>
                <button
                  onClick={togglePause}
                  className="min-h-12 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
                </button>
              </div>
              <button
                onClick={nextExercise}
                className="w-full min-h-11 rounded-xl border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white text-sm transition-colors flex items-center justify-center gap-1.5"
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hoàn thành buổi tập</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {summary.repsCompleted > 0 ? "Bạn đã tập xong" : "Buổi tập đã kết thúc"}
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
                {summary.averageFormScore == null
                  ? "Buổi này chưa bật camera nên chưa chấm form. Lần sau bật camera để AI đo góc khớp cho bạn."
                  : "Điểm form là tỉ lệ khung hình góc khớp nằm trong vùng mục tiêu."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                <div className="flex items-center justify-center gap-1 text-xs text-amber-500">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Calo</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1">~{summary.caloriesBurned}</div>
                <div className="text-xs text-stone-500">kcal (ước tính)</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                <div className="flex items-center justify-center gap-1 text-xs text-emerald-400">
                  <Award className="w-3.5 h-3.5" />
                  <span>Form</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1">
                  {summary.averageFormScore == null ? "—" : `${summary.averageFormScore}%`}
                </div>
                <div className={`text-xs ${summaryLabel.className}`}>{summaryLabel.text}</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                <div className="flex items-center justify-center gap-1 text-xs text-sky-400">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Rep</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1">{summary.repsCompleted}</div>
                <div className="text-xs text-stone-500">{summary.durationMinutes} phút</div>
              </div>
            </div>

            <button
              onClick={handleFinishAndSave}
              className="w-full min-h-12 rounded-2xl bg-brand-action hover:bg-brand-action-hover text-white font-semibold text-base transition-colors active:scale-[0.98]"
            >
              Lưu kết quả & cập nhật Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
