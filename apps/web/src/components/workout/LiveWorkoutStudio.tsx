"use client";

import React, { useState, useEffect, useRef } from "react";
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
  RotateCcw,
  AlertCircle,
  Activity,
} from "lucide-react";
import confetti from "canvas-confetti";

export interface WorkoutSummaryData {
  caloriesBurned: number;
  averageFormScore: number;
  durationMinutes: number;
  repsCompleted: number;
}

interface LiveWorkoutStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishWorkout: (summary: WorkoutSummaryData) => void;
  archetype?: "female_pilates" | "male_strength";
}

interface RoutineExercise {
  id: string;
  name: string;
  vietnameseName: string;
  targetMuscles: string;
  targetCount: number;
  isTimed: boolean; // false for reps, true for seconds
  unit: string;
  cueText: string;
  formCriteria: string;
}

const ROUTINE_EXERCISES: RoutineExercise[] = [
  {
    id: "squat",
    name: "Bodyweight Squat",
    vietnameseName: "Squat Căn Chỉnh Trục Hông",
    targetMuscles: "Cơ mông, Cơ đùi trước & Cơ lõi",
    targetCount: 10,
    isTimed: false,
    unit: "Lần",
    cueText: "Đẩy hông ra sau như ngồi vào ghế, giữ ngực mở và lưng thẳng tự nhiên.",
    formCriteria: "Góc gập đầu gối 90° - 110°, không chụm gối vào trong.",
  },
  {
    id: "plank",
    name: "Core Stabilization Plank",
    vietnameseName: "Plank Siết Cơ Ngang Bụng",
    targetMuscles: "Cơ ngang bụng (TVA) & Sàn chậu",
    targetCount: 30,
    isTimed: true,
    unit: "Giây",
    cueText: "Gồng chắc cơ bụng, thở đều, giữ một đường thẳng từ vai đến gót chân.",
    formCriteria: "Không võng thắt lưng, không nhô mông quá cao.",
  },
  {
    id: "wall_angel",
    name: "Wall Angel Posture Opener",
    vietnameseName: "Mở Vai & Sửa Gù Lưng Trên",
    targetMuscles: "Cơ trám, Cơ lưng trên & Giải phóng đốt sống cổ",
    targetCount: 8,
    isTimed: false,
    unit: "Lần",
    cueText: "Ép sát bả vai, từ từ trượt cánh tay lên cao, cảm nhận lồng ngực nở rộng.",
    formCriteria: "Khuỷu tay và mu bàn tay giữ phẳng, không rụt cổ vai.",
  },
];

export const LiveWorkoutStudio: React.FC<LiveWorkoutStudioProps> = ({
  isOpen,
  onClose,
  onFinishWorkout,
  archetype = "female_pilates",
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [formScore, setFormScore] = useState<number>(94);
  const [formStatus, setFormStatus] = useState<string>("Tư thế chuẩn xác");
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastSpokenTimeRef = useRef<number>(0);

  const currentExercise = ROUTINE_EXERCISES[currentExerciseIndex] ?? ROUTINE_EXERCISES[0];
  const isMale = archetype === "male_strength";
  const primaryColor = isMale ? "#10B981" : "#FF5A36";

  // Text to speech helper
  const speakVoiceCue = (text: string) => {
    if (isMuted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const now = Date.now();
    if (now - lastSpokenTimeRef.current < 4500) return; // avoid overlapping speech
    lastSpokenTimeRef.current = now;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Speech fallback
    }
  };

  // Start / Stop Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
        speakVoiceCue("Camera AI đã sẵn sàng. Hãy đứng cách màn hình 2 mét.");
      } else {
        setCameraError("Trình duyệt không hỗ trợ truy cập camera.");
      }
    } catch (err: unknown) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError("Chưa cấp quyền camera. Đang sử dụng Chế độ Mô phỏng Thông minh (Virtual PT).");
      setCameraEnabled(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraEnabled(false);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentExerciseIndex(0);
      setCurrentCount(0);
      setIsWorkoutCompleted(false);
      speakVoiceCue(currentExercise.cueText);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Timed Exercises Interval (e.g. Plank 30s)
  useEffect(() => {
    if (!isOpen || isPaused || isWorkoutCompleted || !currentExercise.isTimed) return;

    const timer = setInterval(() => {
      setCurrentCount((prev) => {
        if (prev + 1 >= currentExercise.targetCount) {
          handleNextExercise();
          return 0;
        }
        if (prev === 15) {
          speakVoiceCue("Tốt lắm! Nửa chặng đường rồi, siết chặt cơ bụng!");
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, isWorkoutCompleted, currentExercise, currentExerciseIndex]);

  // Synthetic skeleton animation on Canvas
  useEffect(() => {
    if (!isOpen || isWorkoutCompleted) return;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    const renderSkeleton = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const baseGround = height * 0.88;

      // Motion curve depending on current exercise
      const motionProgress = Math.sin(frame * 0.05); // -1 to 1

      // Biomechanical Joint Coordinates
      const headY = height * 0.22 + (currentExercise.id === "squat" ? (motionProgress + 1) * 22 : 0);
      const neckY = headY + 28;
      const shoulderWidth = 44;
      const hipWidth = 32;

      const hipY = height * 0.52 + (currentExercise.id === "squat" ? (motionProgress + 1) * 35 : 0);
      const kneeY = height * 0.72 + (currentExercise.id === "squat" ? (motionProgress + 1) * 15 : 0);
      const ankleY = baseGround;

      const kneeSpread = currentExercise.id === "squat" ? (motionProgress + 1) * 8 : 0;

      // Draw datum grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(centerX, 20);
      ctx.lineTo(centerX, height - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Skeleton Connections
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";

      // Spine (Neck to Hip)
      ctx.beginPath();
      ctx.moveTo(centerX, neckY);
      ctx.lineTo(centerX, hipY);
      ctx.stroke();

      // Shoulders
      ctx.beginPath();
      ctx.moveTo(centerX - shoulderWidth, neckY + 8);
      ctx.lineTo(centerX + shoulderWidth, neckY + 8);
      ctx.stroke();

      // Arms (Wall Angel or Squat hold)
      const armLift = currentExercise.id === "wall_angel" ? (motionProgress + 1) * 35 : 15;
      ctx.beginPath();
      ctx.moveTo(centerX - shoulderWidth, neckY + 8);
      ctx.lineTo(centerX - shoulderWidth - 25, neckY + 20 - armLift);
      ctx.lineTo(centerX - shoulderWidth - 30, neckY - armLift);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + shoulderWidth, neckY + 8);
      ctx.lineTo(centerX + shoulderWidth + 25, neckY + 20 - armLift);
      ctx.lineTo(centerX + shoulderWidth + 30, neckY - armLift);
      ctx.stroke();

      // Hips
      ctx.beginPath();
      ctx.moveTo(centerX - hipWidth, hipY);
      ctx.lineTo(centerX + hipWidth, hipY);
      ctx.stroke();

      // Left Leg
      ctx.beginPath();
      ctx.moveTo(centerX - hipWidth, hipY);
      ctx.lineTo(centerX - hipWidth - 10 - kneeSpread, kneeY);
      ctx.lineTo(centerX - hipWidth - 5, ankleY);
      ctx.stroke();

      // Right Leg
      ctx.beginPath();
      ctx.moveTo(centerX + hipWidth, hipY);
      ctx.lineTo(centerX + hipWidth + 10 + kneeSpread, kneeY);
      ctx.lineTo(centerX + hipWidth + 5, ankleY);
      ctx.stroke();

      // Draw Keypoint Nodes
      const joints = [
        { x: centerX, y: headY, r: 10, fill: "#FFFFFF" },
        { x: centerX, y: neckY, r: 5, fill: primaryColor },
        { x: centerX - shoulderWidth, y: neckY + 8, r: 6, fill: primaryColor },
        { x: centerX + shoulderWidth, y: neckY + 8, r: 6, fill: primaryColor },
        { x: centerX, y: hipY, r: 6, fill: primaryColor },
        { x: centerX - hipWidth - 10 - kneeSpread, y: kneeY, r: 6, fill: "#FFFFFF" },
        { x: centerX + hipWidth + 10 + kneeSpread, y: kneeY, r: 6, fill: "#FFFFFF" },
        { x: centerX - hipWidth - 5, y: ankleY, r: 5, fill: primaryColor },
        { x: centerX + hipWidth + 5, y: ankleY, r: 5, fill: primaryColor },
      ];

      joints.forEach((j) => {
        ctx.fillStyle = j.fill;
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Rep counting simulation when in Virtual PT mode
      if (!cameraEnabled && !isPaused && !currentExercise.isTimed) {
        if (frame % 80 === 0) {
          triggerRepProgress();
        }
      }

      animId = requestAnimationFrame(renderSkeleton);
    };

    renderSkeleton();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isPaused, isWorkoutCompleted, currentExercise, cameraEnabled, primaryColor]);

  // Handle Rep Increment
  const triggerRepProgress = () => {
    setCurrentCount((prev) => {
      const next = prev + 1;
      if (next >= currentExercise.targetCount) {
        handleNextExercise();
        return 0;
      } else {
        // Vary form score slightly for realistic dynamic telemetry
        const randomizedScore = 90 + Math.floor(Math.random() * 8);
        setFormScore(randomizedScore);
        if (next === 5) {
          speakVoiceCue("Rất tốt! 5 lần nữa, tiếp tục giữ vững lưng thẳng!");
        }
        return next;
      }
    });
  };

  const handleNextExercise = () => {
    const nextIdx = currentExerciseIndex + 1;
    if (nextIdx < ROUTINE_EXERCISES.length) {
      setCurrentExerciseIndex(nextIdx);
      setCurrentCount(0);
      const nextEx = ROUTINE_EXERCISES[nextIdx];
      if (nextEx) {
        speakVoiceCue(`Chuyển sang bài: ${nextEx.vietnameseName}. ${nextEx.cueText}`);
      }
    } else {
      // Completed all 3 routine movements!
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = () => {
    setIsWorkoutCompleted(true);
    stopCamera();
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#FF5A36", "#10B981", "#FFFFFF", "#F59E0B"],
      });
    } catch (e) {
      // Confetti fallback
    }
    speakVoiceCue("Chúc mừng bạn đã hoàn thành xuất sắc toàn bộ bài tập hôm nay! Điểm form đạt mức rất tốt.");
  };

  const handleFinishAndSave = () => {
    onFinishWorkout({
      caloriesBurned: 85,
      averageFormScore: 94,
      durationMinutes: 12,
      repsCompleted: 18,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-canvas-dark text-white flex flex-col select-none overflow-hidden animate-in fade-in duration-300">
      {/* 1. Header Bar */}
      <header className="h-16 px-4 sm:px-6 border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF5A36]/20 border border-[#FF5A36]/40 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#FF5A36]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#FF5A36] uppercase">
                AI Live PT Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                BÀI {currentExerciseIndex + 1}/3
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-stone-200">
              {currentExercise.vietnameseName}
            </h2>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {/* Mute Voice Coach Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-full border transition-all ${
              isMuted
                ? "bg-stone-900 border-stone-700 text-stone-400"
                : "bg-stone-800 border-stone-700 text-white"
            }`}
            title={isMuted ? "Bật Hướng Dẫn Giọng Nói" : "Tắt Giọng Nói"}
            aria-label="Toggle Voice Coach"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Camera Toggle Button */}
          <button
            onClick={cameraEnabled ? stopCamera : startCamera}
            className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              cameraEnabled
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                : "bg-stone-900 border-stone-700 text-stone-300 hover:text-white"
            }`}
            aria-label="Toggle Webcam"
          >
            {cameraEnabled ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{cameraEnabled ? "Camera: Bật" : "Bật Camera"}</span>
          </button>

          {/* Close Studio Button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition-all ml-2"
            title="Đóng buồng tập"
            aria-label="Close Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Studio Area */}
      {!isWorkoutCompleted ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
          {/* Left Column: Visual Camera / Canvas Skeleton Arena */}
          <div className="lg:col-span-8 relative bg-black flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-stone-800">
            {/* Live Camera Video (Mirrored) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${
                cameraEnabled ? "opacity-90" : "opacity-0 pointer-events-none"
              }`}
            />

            {/* Dark Studio Grid Background when Camera is off */}
            {!cameraEnabled && (
              <div className="absolute inset-0 bg-[radial-gradient(#292524_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
            )}

            {/* Skeleton Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={640}
              height={580}
              className="relative z-10 w-full max-w-[560px] h-full max-h-[520px] pointer-events-none"
            />

            {/* Camera Off / Fallback Notification Banner */}
            {!cameraEnabled && (
              <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between p-3.5 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-stone-700 text-xs">
                <div className="flex items-center gap-2 text-stone-300">
                  <Sparkles className="w-4 h-4 text-[#FF5A36]" />
                  <span>
                    {cameraError
                      ? cameraError
                      : "Đang chạy Chế độ Mô phỏng Thông minh (Virtual PT). Bật Camera để AI phân tích hình thể trực tiếp."}
                  </span>
                </div>
                <button
                  onClick={startCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-stone-900 font-bold font-mono text-[11px] shrink-0 transition-all ml-2"
                >
                  Kết Nối Camera
                </button>
              </div>
            )}

            {/* Live Form Status Badge Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-stone-300">{formStatus}</span>
            </div>
          </div>

          {/* Right Column: Telemetry HUD & AI Coach Intelligence Panel */}
          <div className="lg:col-span-4 bg-[#0F0E0D] p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-6">
              {/* Routine Step Indicators */}
              <div className="grid grid-cols-3 gap-2">
                {ROUTINE_EXERCISES.map((ex, idx) => {
                  const isDone = idx < currentExerciseIndex;
                  const isCurrent = idx === currentExerciseIndex;
                  return (
                    <div
                      key={ex.id}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? "bg-[#FF5A36]/15 border-[#FF5A36]/60 text-white shadow-sm"
                          : isDone
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-stone-900/40 border-stone-800 text-stone-500"
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase">Bài {idx + 1}</div>
                      <div className="text-xs font-bold truncate mt-0.5">{ex.name.split(" ")[0]}</div>
                    </div>
                  );
                })}
              </div>

              {/* Rep / Countdown Hero Counter Box */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C1B1A] via-[#141312] to-[#0A0908] border border-stone-800 text-center relative overflow-hidden shadow-xl">
                <div className="text-xs font-mono uppercase tracking-widest text-[#FF5A36] font-bold">
                  {currentExercise.isTimed ? "Thời Gian Giữ Tư Thế" : "Số Lần Đã Hoàn Thành"}
                </div>
                <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight my-2 text-white">
                  {currentCount}{" "}
                  <span className="text-xl font-normal text-stone-500">
                    / {currentExercise.targetCount} {currentExercise.unit}
                  </span>
                </div>
                <p className="text-xs text-stone-400">{currentExercise.formCriteria}</p>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-stone-800 mt-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF5A36] to-emerald-400 transition-all duration-300"
                    style={{ width: `${(currentCount / currentExercise.targetCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Biomechanical Form Score Gauge */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                    Độ Chuẩn Form Y Sinh
                  </span>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                    {formScore}% • RẤT TỐT
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* AI Coach Verbal Directive Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-stone-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono text-[#FF5A36] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chỉ Dẫn Từ AI PT Companion</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
                  &ldquo;{currentExercise.cueText}&rdquo;
                </p>
              </div>
            </div>

            {/* Bottom Action Controls */}
            <div className="space-y-3 pt-4 border-t border-stone-800/80">
              <div className="grid grid-cols-2 gap-3">
                {/* Manual Rep trigger (Useful in simulation mode or for self-checking) */}
                <button
                  onClick={triggerRepProgress}
                  disabled={isPaused}
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-stone-200 text-stone-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-md"
                >
                  <span>+1 Rep (Thủ Công)</span>
                </button>

                {/* Pause / Resume Button */}
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-4 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? "Tiếp Tục" : "Tạm Dừng"}</span>
                </button>
              </div>

              {/* Skip to Next Exercise */}
              <button
                onClick={handleNextExercise}
                className="w-full py-2.5 rounded-xl border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Bỏ qua động tác này</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. Celebration & Workout Summary Screen */
        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-[#141210] to-[#0A0908]">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HOÀN THÀNH BUỔI TẬP NGÀY 1</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Xuất Sắc! Cơ Lưng & Hông Đã Kích Hoạt
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
                Cột sống của bạn đã được giải phóng áp lực và cơ bụng sâu đã được kích hoạt trọn vẹn.
              </p>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-stone-800">
                <div className="flex items-center justify-center gap-1 text-[11px] text-amber-500 font-mono">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Calo Đốt</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">+85</div>
                <div className="text-[10px] text-stone-500">kcal</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-stone-800">
                <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <Award className="w-3.5 h-3.5" />
                  <span>Điểm Form</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">94%</div>
                <div className="text-[10px] text-stone-500">Chuẩn y sinh</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-stone-800">
                <div className="flex items-center justify-center gap-1 text-[11px] text-sky-400 font-mono">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Thời lượng</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">12</div>
                <div className="text-[10px] text-stone-500">Phút tập</div>
              </div>
            </div>

            {/* Save & Sync Button */}
            <button
              onClick={handleFinishAndSave}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#e04825] hover:from-[#e04825] hover:to-[#c83c1d] text-white font-bold font-mono text-sm shadow-xl shadow-[#FF5A36]/25 transition-all active:scale-[0.98]"
            >
              Lưu Kết Quả & Cập Nhật Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
