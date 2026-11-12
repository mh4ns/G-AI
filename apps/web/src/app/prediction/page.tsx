"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  ArrowRight,
  SlidersHorizontal,
  
  MoreHorizontal,
  
  AlertTriangle,
  ChevronDown,
  X,
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

const WEEKS = [
  { day: 7, label: "Tuần 1 · Ngày 01 — 07", focus: "Trọng tâm: thở & cổ vai", title: "Đánh thức cơ hoành & giảm căng cứng cổ gáy", body: "Tập trung vào nhịp thở Pilates sâu và các động tác kéo giãn cột sống cạnh tường. Cơ hoành được kích hoạt giúp lồng ngực mở nhẹ, giải tỏa áp lực đè nặng vùng vai gáy." },
  { day: 14, label: "Tuần 2 · Ngày 08 — 14", focus: "Trọng tâm: cơ bụng sâu", title: "Căn chỉnh cột sống & làm phẳng bụng dưới", body: "Kích hoạt cơ ngang bụng sâu (Transverse Abdominis). Nhóm cơ này giữ thân người vững khi bạn vận động, mà không cần nín thở hóp bụng." },
  { day: 21, label: "Tuần 3 · Ngày 15 — 21", focus: "Trọng tâm: chuỗi cơ sau", title: "Cân bằng khung chậu & khắc phục võng lưng", body: "Các bài Glute Bridge và Bird Dog giúp giảm tư thế võng lưng do ngồi làm việc nhiều. Cơ mông được nâng đỡ, đưa trọng tâm cơ thể về vị trí cân bằng tự nhiên." },
  { day: 28, label: "Tuần 4 · Ngày 22 — 28", focus: "Trọng tâm: đánh giá lại", title: "Đánh giá lại & giữ nhịp", body: "So sánh với Ngày 0: cân nặng, số đo vòng eo và cảm giác khi ngồi làm việc. Thói quen giữ thẳng lưng cần thời gian; tiếp tục chu kỳ sau để giữ nhịp." },
];

const NO_PLAN_CALORIES = "chưa có, làm khảo sát để G-AI tính";

/** The plan's real calorie line, e.g. "1415 kcal/ngày (ít hơn mức tiêu hao khoảng 400 kcal)". */
function calorieLine(tdee: number, target: number): string {
  const gap = Math.round(tdee - target);
  if (Math.abs(gap) < 10) return `${target} kcal/ngày (giữ mức tiêu hao)`;
  return `${target} kcal/ngày (${gap > 0 ? "ít" : "nhiều"} hơn mức tiêu hao khoảng ${Math.abs(gap)} kcal)`;
}

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
  // null until localStorage is read; false shows the "do the quiz first" state.
  const [hasQuiz, setHasQuiz] = useState<boolean | null>(null);
  // TDEE minus the daily calorie target from the saved plan; drives the weight projection.
  const [dailyCalorieGap, setDailyCalorieGap] = useState<number | undefined>(undefined);
  const [isRecalculatingPlan, setIsRecalculatingPlan] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; stageMessage: string } | undefined>(undefined);
  const [generationError, setGenerationError] = useState<string | null>(null);
  // null = unknown yet; false = no AI image provider configured (show illustrative presets).
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [genderMismatchWarning, setGenderMismatchWarning] = useState<string | null>(null);

  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Explicit, revocable opt-in before any photo is sent to the AI provider.
  const consentRef = useRef<boolean>(false);
  const needsUrlRefreshRef = useRef<boolean>(false);

  // Default plan configuration
  const [planConfig, setPlanConfig] = useState<PlanConfig>({
    workoutType: "Pilates & cơ lõi",
    weeklySets: "18 hiệp mỗi tuần (vừa)",
    dietStyle: NO_PLAN_CALORIES,
    archetype: "female_pilates",
  });

  // Read archetype, photo, plan and quiz data from localStorage if exists
  useEffect(() => {
    try {
      const savedQuiz = localStorage.getItem("g_ai_user_quiz");
      setHasQuiz(!!savedQuiz);
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

      // Calories always come from the quiz plan, never from an older saved preset.
      let planCalories: string | null = null;
      const savedPlan = localStorage.getItem("g_ai_user_plan");
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        if (typeof parsed.tdee === "number" && typeof parsed.dailyCalorieTarget === "number") {
          setDailyCalorieGap(Math.abs(parsed.tdee - parsed.dailyCalorieTarget));
          planCalories = calorieLine(parsed.tdee, parsed.dailyCalorieTarget);
          const calories = planCalories;
          setPlanConfig((prev) => ({ ...prev, dietStyle: calories }));
        }
        if (parsed.archetype) {
          setArchetype(parsed.archetype);
          setPlanConfig((prev) => ({
            ...prev,
            archetype: parsed.archetype,
            workoutType:
              parsed.archetype === "male_strength"
                ? "Sức mạnh"
                : "Pilates & cơ lõi",
            weeklySets: "18 hiệp mỗi tuần (vừa)",
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
        setPlanConfig({ ...JSON.parse(savedCustomPlan), dietStyle: planCalories ?? NO_PLAN_CALORIES });
      }
    } catch {
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

  useEffect(() => {
    fetch("/api/prediction/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAiAvailable(d ? Boolean(d.enabled) : null))
      .catch(() => setAiAvailable(null));
  }, []);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Menu dropdown (transitions.dev 05): play the close before resting.
  const [menuClosing, setMenuClosing] = useState(false);
  const menuWasOpen = useRef(false);
  useEffect(() => {
    if (isMoreMenuOpen) {
      menuWasOpen.current = true;
      setMenuClosing(false);
      return;
    }
    if (!menuWasOpen.current) return;
    menuWasOpen.current = false;
    setMenuClosing(true);
    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")) || 150;
    const id = setTimeout(() => setMenuClosing(false), ms);
    return () => clearTimeout(id);
  }, [isMoreMenuOpen]);

  // Close the menu on Escape too.
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMoreMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMoreMenuOpen]);

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
    if (aiAvailable === false) {
      // No AI backend: keep the illustrative presets, nothing to upload.
      return;
    }
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

      if (!res.ok && data.code === "AI_GENERATION_DISABLED") {
        setIsGenerating(false);
        setAiAvailable(false);
        return;
      }

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
        } catch {
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
          ? "Sức mạnh"
          : "Pilates & cơ lõi",
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
      } catch {
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
    <div className="min-h-screen bg-canvas-dark text-stone-100 font-sans selection:bg-brand/30 selection:text-white">
      {/* 1. Step 8: Header with ONLY ONE Primary Button ("Bắt đầu Ngày 1") + More Menu ("⋯") */}
      <header className="sticky top-0 z-40 bg-canvas-dark/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/today"
              className="w-11 h-11 -ml-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800/60 transition-colors flex items-center justify-center"
              aria-label="Quay lại trang Hôm nay"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden />
            </Link>
            <Link href={hubUrl("/")} className="min-h-11 flex items-center" aria-label="G-AI – trang chính">
              <BrandLogo isLight={false} size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Step 8: Group Secondary Actions into "⋯" Menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className="w-11 h-11 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tùy chọn khác"
                aria-label="Tùy chọn khác"
                aria-haspopup="menu"
                aria-expanded={isMoreMenuOpen}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Popover Dropdown */}
              <div
                  role="menu"
                  data-origin="top-right"
                  inert={!isMoreMenuOpen || undefined}
                  aria-hidden={!isMoreMenuOpen || undefined}
                  className={`t-dropdown absolute right-0 mt-2 w-60 rounded-2xl bg-[#141210] border border-stone-800 shadow-2xl py-2 z-50 text-sm text-stone-200${
                    isMoreMenuOpen ? " is-open" : menuClosing ? " is-closing" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="w-full min-h-11 px-4 text-left flex items-center gap-2.5 hover:bg-stone-900 hover:text-white transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-brand" />
                    <span>Hiệu chỉnh chỉ số thể trạng</span>
                  </button>

                  <Link
                    href="/quiz"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="w-full min-h-11 px-4 text-left flex items-center gap-2.5 hover:bg-stone-900 hover:text-white transition-colors"
                  >
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>Khảo sát lại từ đầu</span>
                  </Link>
                </div>
            </div>

            {/* Primary header action, once there is a plan to start. */}
            {hasQuiz && (
            <Link
              href="/today"
              className="min-h-11 inline-flex items-center px-4 sm:px-5 rounded-full bg-white hover:bg-stone-200 text-stone-900 text-sm font-semibold transition-colors active:translate-y-px"
            >
              Bắt đầu Ngày 1
            </Link>
            )}
          </div>
        </div>
      </header>

      {/* Before the quiz there is nothing to predict: one clear next step. */}
      {hasQuiz === false && (
        <main className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Dự đoán vóc dáng 28 ngày</h1>
          <p className="mt-4 text-base text-stone-300 leading-relaxed">
            G-AI dựng dự đoán từ chiều cao, cân nặng và mục tiêu của bạn. Làm khảo sát 2 phút để bắt đầu; bạn có thể thêm
            ảnh sau để xem ảnh minh họa theo từng tuần.
          </p>
          <Link
            href="/quiz"
            className="mt-8 min-h-12 px-8 rounded-full bg-brand-action hover:bg-brand-action-hover text-white font-semibold text-base inline-flex items-center gap-2 transition-colors active:translate-y-px"
          >
            Làm khảo sát 2 phút
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </main>
      )}

      {/* 2. Main Visualizer & Telemetry View (Responsive & Sticky Scrubber) */}
      {hasQuiz && (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-36 lg:pb-12">
        {/* Step 4: Gender Mismatch Warning Banner */}
        {genderMismatchWarning && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-amber-300">Thông báo đối soát hình thể</p>
              <p className="text-stone-300 leading-relaxed">{genderMismatchWarning}</p>
            </div>
            <button
              onClick={() => setGenderMismatchWarning(null)}
              aria-label="Đóng cảnh báo"
              className="w-11 h-11 -m-2 flex items-center justify-center rounded-lg text-stone-300 hover:text-white hover:bg-stone-800/50 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden />
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
            <div className="w-full flex items-baseline justify-between gap-3 mb-4 px-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Dự đoán vóc dáng 28 ngày</h1>
              <span className="text-sm text-stone-300 font-medium whitespace-nowrap">
                {archetype === "male_strength" ? "Sức mạnh" : "Pilates & cơ lõi"}
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
                isIllustrative={aiAvailable === false}
                hasSidePhoto={false}
                onOpenUploadModal={() => setIsModalOpen(true)}
              />
            </div>

            {/* Step 6: Interactive Anatomical Hotspots Filter with Exact Token Colors */}
            <div className="w-full flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 text-xs select-none">
              <button
                type="button"
                onClick={() => setActiveHotspot("cervical")}
                className={`min-h-11 flex items-center gap-1.5 transition-colors px-3 rounded-xl border ${
                  activeHotspot === "cervical"
                    ? "bg-brand/15 border-brand text-white font-bold"
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
                className={`min-h-11 flex items-center gap-1.5 transition-colors px-3 rounded-xl border ${
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
                className={`min-h-11 flex items-center gap-1.5 transition-colors px-3 rounded-xl border ${
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
                className={`min-h-11 flex items-center gap-1.5 transition-colors px-3 rounded-xl border ${
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
              dailyCalorieGapKcal={dailyCalorieGap}
              onJumpToTarget={() => setCurrentDay(28)}
            />

            {/* Week by week: one line each; the week in view opens. */}
            <section aria-labelledby="weekly-plan-heading" className="pt-2">
              <h2 id="weekly-plan-heading" className="text-sm font-bold text-stone-200 px-1 mb-3">
                Lộ trình từng tuần
              </h2>
              <div className="space-y-2">
                {WEEKS.map((w) => {
                  const inView = currentDay === w.day;
                  return (
                    <details
                      key={w.day}
                      open={inView}
                      className={`group rounded-2xl border transition-colors ${
                        inView ? "bg-stone-900 border-brand/60" : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
                      }`}
                    >
                      <summary
                        onClick={(e) => {
                          // Opening a week also moves the timeline to it.
                          e.preventDefault();
                          setCurrentDay(w.day);
                        }}
                        className="min-h-12 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
                      >
                        <span>
                          <span className="block text-xs font-semibold text-brand">{w.label}</span>
                          <span className="block text-sm font-bold text-white">{w.title}</span>
                        </span>
                        <ChevronDown className="w-4 h-4 shrink-0 text-stone-400 transition-transform duration-[var(--duration-fast)] group-open:rotate-180" aria-hidden />
                      </summary>
                      <div className="px-4 pb-4 text-sm text-stone-300 leading-relaxed">
                        <p className="text-xs text-stone-400 mb-1.5">{w.focus}</p>
                        <p>{w.body}</p>
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>

            {/* Bottom Call To Action */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/today"
                className="flex-1 py-3.5 sm:py-4 rounded-2xl bg-brand-action hover:bg-brand-action-hover text-white font-bold text-sm text-center transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <span>Bắt đầu kế hoạch tập Ngày 1</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={siteUrl("/store")}
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
      )}

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
