"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Compass,
  ArrowRight,
  SlidersHorizontal,
  Info,
  MoreHorizontal,
  Dumbbell,
  AlertTriangle,
} from "lucide-react";
import { MorphingAvatar } from "@/components/prediction/MorphingAvatar";
import { TelemetryHud } from "@/components/prediction/TelemetryHud";
import { TimelineScrubber } from "@/components/prediction/TimelineScrubber";
import { BrandLogo, siteUrl, hubUrl } from "@g-ai/ui";
import { BodyCalibrationModal } from "@/components/prediction/BodyCalibrationModal";
import { PlanSummaryCard, PlanConfig } from "@/components/prediction/PlanSummaryCard";
import { SEMANTIC_COLORS } from "@/lib/design-tokens";
import {
  clearJobRef,
  deletePredictionOnServer,
  hasPhotoConsent,
  isSignedUrlExpired,
  saveJobRef,
  setPhotoConsent,
} from "@/lib/prediction-client";

export default function PredictionPage() {
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"profile" | "front" | "threeQuarter">("front");
  const [activeHotspot, setActiveHotspot] = useState<string | null>("cervical");
  const [archetype, setArchetype] = useState<"female_pilates" | "male_strength">("female_pilates");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [customMilestones, setCustomMilestones] = useState<string[] | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Record<number, string>>({});
  const [userStats, setUserStats] = useState<{ height: number; weight: number; targetWeight: number } | null>(null);
  const [isRecalculatingPlan, setIsRecalculatingPlan] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; stageMessage: string } | undefined>(undefined);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [genderMismatchWarning, setGenderMismatchWarning] = useState<string | null>(null);

  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Explicit, revocable opt-in before any photo is sent to the AI provider.
  const consentRef = useRef<boolean>(false);
  const needsUrlRefreshRef = useRef<boolean>(false);

  // Default plan configuration
  const [planConfig, setPlanConfig] = useState<PlanConfig>({
    workoutType: "Pilates & Siết Cơ Lõi",
    weeklySets: "16 set bài tập / tuần (Tiêu chuẩn)",
    dietStyle: "Thâm hụt calo sinh học lành mạnh (-350 kcal/ngày)",
    archetype: "female_pilates",
  });

  // Read archetype, photo, plan and quiz data from localStorage if exists
  useEffect(() => {
    try {
      const savedQuiz = localStorage.getItem("g_ai_user_quiz");
      if (savedQuiz) {
        const parsedQuiz = JSON.parse(savedQuiz);
        if (parsedQuiz.heightCm && parsedQuiz.currentWeightKg && parsedQuiz.targetWeightKg) {
          setUserStats({
            height: parsedQuiz.heightCm,
            weight: parsedQuiz.currentWeightKg,
            targetWeight: parsedQuiz.targetWeightKg,
          });
        }
      }

      const savedPlan = localStorage.getItem("g_ai_user_plan");
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        if (parsed.archetype) {
          setArchetype(parsed.archetype);
          setPlanConfig((prev) => ({
            ...prev,
            archetype: parsed.archetype,
            workoutType:
              parsed.archetype === "male_strength"
                ? "Calisthenics & Cơ Xô"
                : "Pilates & Siết Cơ Lõi",
            weeklySets:
              parsed.archetype === "male_strength"
                ? "18 set Calisthenics / tuần (Tiêu chuẩn)"
                : "16 set Pilates / tuần (Tiêu chuẩn)",
          }));
        }
        if (parsed.userPhotoBase64) {
          setUserPhoto(parsed.userPhotoBase64);
        }
      }

      const savedPhoto = localStorage.getItem("g_ai_user_twin_photo");
      if (savedPhoto) {
        setUserPhoto(savedPhoto);
      }

      consentRef.current = hasPhotoConsent();

      const savedMilestones = localStorage.getItem("g_ai_twin_milestones");
      const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : null;
      // Image links are signed and short-lived. Expired ones are dropped and,
      // with consent, re-requested below (served from the server cache, no new AI call).
      const linksExpired =
        Array.isArray(parsedMilestones) &&
        parsedMilestones.slice(1).some((u: unknown) => typeof u === "string" && u !== "" && isSignedUrlExpired(u));
      if (linksExpired) {
        localStorage.removeItem("g_ai_twin_milestones");
        needsUrlRefreshRef.current = true;
      } else if (Array.isArray(parsedMilestones)) {
        setCustomMilestones(parsedMilestones);
        setCompletedMilestones({
          7: parsedMilestones[1] || "",
          14: parsedMilestones[2] || "",
          28: parsedMilestones[3] || parsedMilestones[4] || "",
        });
      }

      const savedCustomPlan = localStorage.getItem("g_ai_prediction_plan");
      if (savedCustomPlan) {
        setPlanConfig(JSON.parse(savedCustomPlan));
      }
    } catch (e) {
      // LocalStorage safety fallback
    }
  }, []);

  // Re-issue expired image links once the saved photo/stats are loaded.
  useEffect(() => {
    if (needsUrlRefreshRef.current && userPhoto && consentRef.current) {
      needsUrlRefreshRef.current = false;
      void startGeneration(userPhoto, archetype, userStats, planConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPhoto]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMoreMenuOpen]);

  const progress = currentDay / 28.0;

  // Real Async Image Generation Trigger & Polling (Steps 2, 3, 4, 5)
  const startGeneration = async (
    photo: string | null,
    arch: "female_pilates" | "male_strength",
    stats: { height: number; weight: number; targetWeight: number } | null,
    plan: PlanConfig
  ) => {
    if (!photo) return;
    if (!consentRef.current) {
      setGenerationError("Vui lòng mở “Hiệu chỉnh thể trạng” và xác nhận đồng ý để AI xử lý ảnh của bạn.");
      setIsModalOpen(true);
      return;
    }

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress({
      current: 0,
      total: 3,
      stageMessage: "Đang xếp hàng tạo sinh mốc tuần...",
    });

    try {
      const res = await fetch("/api/prediction/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhotoBase64: photo,
          archetype: arch,
          height: stats?.height || (arch === "male_strength" ? 175 : 162),
          weight: stats?.weight || (arch === "male_strength" ? 76 : 56),
          targetWeight: stats?.targetWeight || (arch === "male_strength" ? 73.5 : 52),
          planSummary: `${plan.workoutType} · ${plan.weeklySets}`,
          consentAccepted: consentRef.current,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsGenerating(false);
        setGenerationError(data.error || "Không thể khởi tạo phiên dự đoán ảnh.");
        return;
      }

      if (data.genderMismatchWarning) {
        setGenderMismatchWarning(data.genderMismatchWarning);
      } else {
        setGenderMismatchWarning(null);
      }

      if (data.jobId && data.jobToken) {
        saveJobRef({ jobId: data.jobId, jobToken: data.jobToken });
      }

      // Check if result was served from instant SHA-256 disk cache
      if (data.cached && data.completedMilestones) {
        setCompletedMilestones(data.completedMilestones);
        const arr = [
          photo,
          data.completedMilestones[7] || "",
          data.completedMilestones[14] || "",
          data.completedMilestones[28] || "",
        ];
        setCustomMilestones(arr);
        localStorage.setItem("g_ai_twin_milestones", JSON.stringify(arr));
        setIsGenerating(false);
        return;
      }

      const jobId = data.jobId;
      if (!jobId) {
        setIsGenerating(false);
        return;
      }

      // Begin polling every 1500ms
      pollTimerRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/prediction/${encodeURIComponent(jobId)}`, {
            headers: { "x-job-token": data.jobToken },
          });
          if (!pollRes.ok) return;

          const pollData = await pollRes.json();
          if (pollData.progress) {
            setGenerationProgress(pollData.progress);
          }

          if (pollData.completedMilestones) {
            setCompletedMilestones((prev) => ({
              ...prev,
              ...pollData.completedMilestones,
            }));

            setCustomMilestones((prev) => {
              const next = prev ? [...prev] : [photo, "", "", ""];
              if (pollData.completedMilestones[7]) next[1] = pollData.completedMilestones[7];
              if (pollData.completedMilestones[14]) next[2] = pollData.completedMilestones[14];
              if (pollData.completedMilestones[28]) next[3] = pollData.completedMilestones[28];
              return next;
            });
          }

          if (pollData.status === "done") {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setIsGenerating(false);
            if (pollData.completedMilestones) {
              const finalArr = [
                photo,
                pollData.completedMilestones[7] || "",
                pollData.completedMilestones[14] || "",
                pollData.completedMilestones[28] || "",
              ];
              setCustomMilestones(finalArr);
              localStorage.setItem("g_ai_twin_milestones", JSON.stringify(finalArr));
            }
          } else if (pollData.status === "failed") {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setIsGenerating(false);
            setGenerationError(pollData.error?.message || "Tạo sinh ảnh dự đoán thất bại.");
          }
        } catch (err) {
          // Polling network hiccup; retry next tick
        }
      }, 1500);
    } catch {
      setIsGenerating(false);
      setGenerationError("Lỗi kết nối máy chủ khi tạo sinh ảnh.");
    }
  };

  // Step 5: Plan Change Handler (recalculates with API, otherwise uses cache)
  const handleUpdatePlan = async (newPlan: PlanConfig) => {
    setIsRecalculatingPlan(true);
    setPlanConfig(newPlan);
    setArchetype(newPlan.archetype);

    try {
      localStorage.setItem("g_ai_prediction_plan", JSON.stringify(newPlan));
      if (userPhoto) {
        await startGeneration(userPhoto, newPlan.archetype, userStats, newPlan);
      }
    } catch (e) {
      console.error("Plan recalculation error:", e);
    } finally {
      setIsRecalculatingPlan(false);
    }
  };

  const handleCalibrationSave = async (updated: {
    archetype: "female_pilates" | "male_strength";
    height: number;
    weight: number;
    targetWeight: number;
    postureIssue: string;
    consentAccepted: boolean;
  }) => {
    setArchetype(updated.archetype);
    const nextStats = {
      height: updated.height,
      weight: updated.weight,
      targetWeight: updated.targetWeight,
    };
    setUserStats(nextStats);

    const updatedPlan: PlanConfig = {
      ...planConfig,
      archetype: updated.archetype,
      workoutType:
        updated.archetype === "male_strength"
          ? "Calisthenics & Cơ Xô"
          : "Pilates & Siết Cơ Lõi",
    };
    setPlanConfig(updatedPlan);

    consentRef.current = updated.consentAccepted;
    setPhotoConsent(updated.consentAccepted);

    if (userPhoto && updated.consentAccepted) {
      await startGeneration(userPhoto, updated.archetype, nextStats, updatedPlan);
    }
  };

  const handlePhotoUpdate = (newPhoto: string | null) => {
    setUserPhoto(newPhoto);
    if (newPhoto) {
      try {
        localStorage.setItem("g_ai_user_twin_photo", newPhoto);
      } catch (e) {
        // ignore
      }
      // Without consent the photo stays on this device until the user confirms in the modal.
      if (consentRef.current) {
        startGeneration(newPhoto, archetype, userStats, planConfig);
      }
    } else {
      void deletePredictionOnServer();
      clearJobRef();
      localStorage.removeItem("g_ai_user_twin_photo");
      localStorage.removeItem("g_ai_twin_milestones");
      setCustomMilestones(null);
      setCompletedMilestones({});
    }
  };

  return (
    <div className="min-h-screen bg-canvas-dark text-stone-100 font-sans selection:bg-[#FF5A36]/30 selection:text-white">
      {/* 1. Step 8: Header with ONLY ONE Primary Button ("Bắt đầu Ngày 1") + More Menu ("⋯") */}
      <header className="sticky top-0 z-40 bg-canvas-dark/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/today"
              className="p-2 -ml-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
              title="Quay lại Today Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href={hubUrl("/")} className="flex items-center group">
              <BrandLogo isLight={false} size="sm" showSubtitle subtitle="Dự đoán vóc dáng 28 ngày" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Step 8: Group Secondary Actions into "⋯" Menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                title="Tùy chọn khác"
                aria-label="Menu tùy chọn bổ sung"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Popover Dropdown */}
              {isMoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#141210] border border-stone-800 shadow-2xl py-2 z-50 text-xs text-stone-200 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 hover:bg-stone-900 hover:text-white transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#FF5A36]" />
                    <span>Hiệu chỉnh chỉ số thể trạng</span>
                  </button>

                  <Link
                    href="/quiz"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 hover:bg-stone-900 hover:text-white transition-colors"
                  >
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>Khảo sát lại từ đầu</span>
                  </Link>
                </div>
              )}
            </div>

            {/* ONLY ONE Primary Header Button */}
            <Link
              href="/today"
              className="px-4 sm:px-5 py-2 rounded-full bg-white hover:bg-stone-200 text-stone-900 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
            >
              Bắt đầu Ngày 1
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Visualizer & Telemetry View (Responsive & Sticky Scrubber) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-36 lg:pb-12">
        {/* Step 4: Gender Mismatch Warning Banner */}
        {genderMismatchWarning && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200 animate-in fade-in duration-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-amber-300">Thông báo đối soát hình thể</p>
              <p className="text-stone-300 leading-relaxed">{genderMismatchWarning}</p>
            </div>
            <button
              onClick={() => setGenderMismatchWarning(null)}
              aria-label="Đóng cảnh báo"
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/50 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Step 5: Plan Summary Card immediately below the top title */}
        <PlanSummaryCard
          currentPlan={planConfig}
          onUpdatePlan={handleUpdatePlan}
          isRecalculating={isRecalculatingPlan}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Sticky Pinned Visualizer on Desktop) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 flex flex-col items-center">
            {/* Header info */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span className="font-medium">Trục trọng tâm & dáng đứng 28 ngày</span>
              </div>
              <span className="text-xs text-stone-300 font-medium">
                {archetype === "male_strength" ? "Nam · Calisthenics" : "Nữ · Pilates"}
              </span>
            </div>

            {/* Visualizer Container with Morphing Avatar */}
            <div className="w-full rounded-3xl bg-stone-950/80 border border-stone-800/80 p-2 sm:p-4 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <MorphingAvatar
                progress={progress}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                activeHotspot={activeHotspot}
                onSelectHotspot={(hotspot) => setActiveHotspot(hotspot)}
                archetype={archetype}
                currentDay={currentDay}
                customMilestones={customMilestones || undefined}
                completedMilestones={completedMilestones}
                userPhoto={userPhoto}
                isGenerating={isGenerating}
                generationProgress={generationProgress}
                generationError={generationError}
                onRetryGeneration={() => startGeneration(userPhoto, archetype, userStats, planConfig)}
                isMock={!userPhoto}
                hasSidePhoto={false}
                onOpenUploadModal={() => setIsModalOpen(true)}
              />
            </div>

            {/* Step 6: Interactive Anatomical Hotspots Filter with Exact Token Colors */}
            <div className="w-full flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 text-xs select-none">
              <button
                type="button"
                onClick={() => setActiveHotspot("cervical")}
                className={`flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-xl border ${
                  activeHotspot === "cervical"
                    ? "bg-[#FF5A36]/15 border-[#FF5A36] text-white font-bold"
                    : "bg-stone-950 border-stone-800/80 text-stone-300 hover:text-white"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SEMANTIC_COLORS.hotspots.cervical.color }}
                />
                <span>Cổ & vai gáy</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHotspot("thoracic")}
                className={`flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-xl border ${
                  activeHotspot === "thoracic"
                    ? "bg-sky-500/15 border-sky-400 text-white font-bold"
                    : "bg-stone-950 border-stone-800/80 text-stone-300 hover:text-white"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SEMANTIC_COLORS.hotspots.thoracic.color }}
                />
                <span>Lưng trên</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHotspot("core")}
                className={`flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-xl border ${
                  activeHotspot === "core"
                    ? "bg-emerald-500/15 border-emerald-400 text-white font-bold"
                    : "bg-stone-950 border-stone-800/80 text-stone-300 hover:text-white"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SEMANTIC_COLORS.hotspots.core.color }}
                />
                <span>Cơ bụng & eo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHotspot("pelvis")}
                className={`flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-xl border ${
                  activeHotspot === "pelvis"
                    ? "bg-amber-500/15 border-amber-400 text-white font-bold"
                    : "bg-stone-950 border-stone-800/80 text-stone-300 hover:text-white"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SEMANTIC_COLORS.hotspots.pelvis.color }}
                />
                <span>Khung chậu & mông</span>
              </button>
            </div>

            {/* Step 8: Short merged disclaimer line */}
            <p className="w-full mt-4 text-center text-xs text-stone-400 leading-normal">
              Ảnh là mô phỏng tham khảo, kết quả thực tế khác nhau tùy mỗi người.
            </p>
          </div>

          {/* Right Column: 4-Step Scrubber, Real-Life Telemetry & Chapters */}
          <div className="lg:col-span-6 space-y-6">
            {/* Desktop Scrubber placement */}
            <div className="hidden lg:block">
              <TimelineScrubber
                currentDay={currentDay}
                onDayChange={setCurrentDay}
                archetype={archetype}
              />
            </div>

            {/* Realistic Telemetry with Step 4 & Step 8 Tabbed Chips */}
            <TelemetryHud
              progress={progress}
              currentDay={currentDay}
              activeHotspot={activeHotspot}
              userWeight={userStats?.weight}
              targetWeight={userStats?.targetWeight}
              onJumpToTarget={() => setCurrentDay(28)}
            />

            {/* 4-Week Physiological Adaptation Chapters */}
            <div className="pt-2 space-y-3">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-normal block px-1">
                Lộ trình thích nghi cơ sinh học
              </span>

              {/* Week 1 */}
              <div
                onClick={() => setCurrentDay(7)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay === 7
                    ? "bg-stone-900 border-[#FF5A36]/70 shadow-lg"
                    : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#FF5A36] font-bold">Tuần 1 · Ngày 01 — 07</span>
                  <span className="text-xs text-stone-300">Giảm ~0.6kg (Thải nước mô)</span>
                </div>
                <h5 className="text-sm sm:text-base font-bold text-white mb-1">
                  Đánh thức cơ hoành & giảm căng cứng cổ gáy
                </h5>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Tập trung vào nhịp thở Pilates sâu và các động tác kéo giãn cột sống cạnh tường. Cơ hoành được kích hoạt giúp lồng ngực mở nhẹ, giải tỏa áp lực đè nặng vùng vai gáy.
                </p>
              </div>

              {/* Week 2 */}
              <div
                onClick={() => setCurrentDay(14)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay === 14
                    ? "bg-stone-900 border-[#FF5A36]/70 shadow-lg"
                    : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-emerald-400 font-bold">Tuần 2 · Ngày 08 — 14</span>
                  <span className="text-xs text-stone-300">Giảm ~1.4kg (Siết cơ bụng sâu)</span>
                </div>
                <h5 className="text-sm sm:text-base font-bold text-white mb-1">
                  Căn chỉnh cột sống & làm phẳng bụng dưới
                </h5>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Kích hoạt cơ ngang bụng sâu (Transverse Abdominis). Nhóm cơ này đóng vai trò như đai nịt tự nhiên kéo phẳng thành bụng dưới mà không cần nín thở hóp bụng.
                </p>
              </div>

              {/* Week 3 */}
              <div
                onClick={() => setCurrentDay(21)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay === 21
                    ? "bg-stone-900 border-[#FF5A36]/70 shadow-lg"
                    : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-amber-400 font-bold">Tuần 3 · Ngày 15 — 21</span>
                  <span className="text-xs text-stone-300">Giảm ~1.8kg (Săn chắc chuỗi cơ sau)</span>
                </div>
                <h5 className="text-sm sm:text-base font-bold text-white mb-1">
                  Cân bằng khung chậu & khắc phục võng lưng
                </h5>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Các bài Glute Bridge và Bird Dog điều chỉnh triệt để tật võng lưng do ngồi làm việc nhiều. Cơ mông được nâng đỡ, đưa trọng tâm cơ thể về vị trí cân bằng tự nhiên.
                </p>
              </div>

              {/* Week 4 */}
              <div
                onClick={() => setCurrentDay(28)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay === 28
                    ? "bg-stone-900 border-emerald-500/70 shadow-lg"
                    : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-emerald-400 font-bold">Tuần 4 · Ngày 22 — 28</span>
                  <span className="text-xs text-stone-300">Mục tiêu ~2.5kg & Eo -3.8cm</span>
                </div>
                <h5 className="text-sm sm:text-base font-bold text-white mb-1">
                  Vóc dáng chuẩn mực & bước đi tự tin
                </h5>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Điểm tư thế đạt 88/100. Vai mở rộng thanh thoát, thắt lưng khỏe mạnh, thói quen giữ thẳng lưng đã trở thành phản xạ tự nhiên suốt cả ngày.
                </p>
              </div>
            </div>

            {/* Bottom Call To Action */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/today"
                className="flex-1 py-3.5 sm:py-4 rounded-2xl bg-[#FF5A36] hover:bg-[#e04825] text-white font-bold text-sm text-center transition-all shadow-xl shadow-[#FF5A36]/25 flex items-center justify-center gap-2"
              >
                <span>Bắt đầu kế hoạch tập Ngày 1</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={siteUrl("/#movement-goods")}
                className="px-6 py-3.5 sm:py-4 rounded-2xl border border-stone-800 text-stone-300 hover:text-white hover:border-stone-600 text-xs text-center transition-colors flex items-center justify-center font-medium"
              >
                Dụng cụ khuyên dùng
              </Link>
            </div>
          </div>
        </div>

        {/* Step 8: Mobile Sticky Scrubber (Fixed at bottom on screens <= 768px) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-canvas-dark/95 backdrop-blur-xl border-t border-stone-800 shadow-[0_-8px_24px_rgba(0,0,0,0.85)]">
          <div className="max-w-md mx-auto">
            <TimelineScrubber
              currentDay={currentDay}
              onDayChange={setCurrentDay}
              archetype={archetype}
            />
          </div>
        </div>
      </main>

      {/* 3. Personal Calibration Modal */}
      <BodyCalibrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        archetype={archetype}
        initialHeight={userStats?.height}
        initialWeight={userStats?.weight}
        initialTargetWeight={userStats?.targetWeight}
        currentPhoto={userPhoto}
        onPhotoChange={handlePhotoUpdate}
        onSave={handleCalibrationSave}
      />
    </div>
  );
}
