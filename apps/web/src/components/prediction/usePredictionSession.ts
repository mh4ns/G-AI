"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PlanConfig } from "@/components/prediction/PlanSummaryCard";
import {
  clearJobRef,
  deletePredictionOnServer,
  hasPhotoConsent,
  isSignedUrlExpired,
  saveJobRef,
  setPhotoConsent,
  submitPredictionJob,
  pollPredictionJob,
  checkPredictionServiceStatus,
  PredictionProgress,
} from "@/lib/prediction-client";

export const NO_PLAN_CALORIES = "chưa có, làm khảo sát để G-AI tính";

/** The plan's real calorie line, e.g. "1415 kcal/ngày (ít hơn mức tiêu hao khoảng 400 kcal)". */
export function calorieLine(tdee: number, target: number): string {
  const gap = Math.round(tdee - target);
  if (Math.abs(gap) < 10) return `${target} kcal/ngày (giữ mức tiêu hao)`;
  return `${target} kcal/ngày (${gap > 0 ? "ít" : "nhiều"} hơn mức tiêu hao khoảng ${Math.abs(gap)} kcal)`;
}

export type ViewMode = "profile" | "front" | "threeQuarter";

export interface UserStats {
  height: number;
  weight: number;
  targetWeight: number;
}

export interface CalibrationData {
  archetype: "female_pilates" | "male_strength";
  height: number;
  weight: number;
  targetWeight: number;
  postureIssue: string;
  consentAccepted: boolean;
}

export interface UsePredictionSessionReturn {
  currentDay: number;
  setCurrentDay: (day: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeHotspot: string | null;
  setActiveHotspot: (hotspot: string | null) => void;
  archetype: "female_pilates" | "male_strength";
  setArchetype: (arch: "female_pilates" | "male_strength") => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  userPhoto: string | null;
  customMilestones: string[] | null;
  completedMilestones: Record<number, string>;
  userStats: UserStats | null;
  hasQuiz: boolean | null;
  dailyCalorieGap: number | undefined;
  isRecalculatingPlan: boolean;
  isGenerating: boolean;
  generationProgress: PredictionProgress | undefined;
  generationError: string | null;
  aiAvailable: boolean | null;
  genderMismatchWarning: string | null;
  setGenderMismatchWarning: (warning: string | null) => void;
  planConfig: PlanConfig;
  progress: number;
  startGeneration: (
    photo: string | null,
    arch: "female_pilates" | "male_strength",
    stats: UserStats | null,
    plan: PlanConfig
  ) => Promise<void>;
  retryGeneration: () => void;
  handleUpdatePlan: (newPlan: PlanConfig) => Promise<void>;
  handleCalibrationSave: (updated: CalibrationData) => Promise<void>;
  handlePhotoUpdate: (newPhoto: string | null) => void;
}

export function usePredictionSession(): UsePredictionSessionReturn {
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>("front");
  const [activeHotspot, setActiveHotspot] = useState<string | null>("cervical");
  const [archetype, setArchetype] = useState<"female_pilates" | "male_strength">("female_pilates");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [customMilestones, setCustomMilestones] = useState<string[] | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Record<number, string>>({});
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [hasQuiz, setHasQuiz] = useState<boolean | null>(null);
  const [dailyCalorieGap, setDailyCalorieGap] = useState<number | undefined>(undefined);
  const [isRecalculatingPlan, setIsRecalculatingPlan] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<PredictionProgress | undefined>(undefined);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [genderMismatchWarning, setGenderMismatchWarning] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Check AI service status
  useEffect(() => {
    checkPredictionServiceStatus()
      .then((d) => setAiAvailable(d ? Boolean(d.enabled) : null))
      .catch(() => setAiAvailable(null));
  }, []);

  // Real Async Image Generation Trigger & Polling
  const startGeneration = useCallback(
    async (
      photo: string | null,
      arch: "female_pilates" | "male_strength",
      stats: UserStats | null,
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
        const result = await submitPredictionJob({
          userPhotoBase64: photo,
          archetype: arch,
          height: stats?.height || (arch === "male_strength" ? 175 : 162),
          weight: stats?.weight || (arch === "male_strength" ? 76 : 56),
          targetWeight: stats?.targetWeight || (arch === "male_strength" ? 73.5 : 52),
          planSummary: `${plan.workoutType} · ${plan.weeklySets}`,
          consentAccepted: consentRef.current,
        });

        if (!result.ok && result.code === "AI_GENERATION_DISABLED") {
          setIsGenerating(false);
          setAiAvailable(false);
          return;
        }

        if (!result.ok) {
          setIsGenerating(false);
          setGenerationError(result.error || "Không thể khởi tạo phiên dự đoán ảnh.");
          return;
        }

        if (result.genderMismatchWarning) {
          setGenderMismatchWarning(result.genderMismatchWarning);
        } else {
          setGenderMismatchWarning(null);
        }

        if (result.jobId && result.jobToken) {
          saveJobRef({ jobId: result.jobId, jobToken: result.jobToken });
        }

        // Check if result was served from instant SHA-256 disk cache
        if (result.cached && result.completedMilestones) {
          setCompletedMilestones(result.completedMilestones);
          const arr = [
            photo,
            result.completedMilestones[7] || "",
            result.completedMilestones[14] || "",
            result.completedMilestones[28] || "",
          ];
          setCustomMilestones(arr);
          try {
            localStorage.setItem("g_ai_twin_milestones", JSON.stringify(arr));
          } catch {}
          setIsGenerating(false);
          return;
        }

        const jobId = result.jobId;
        const jobToken = result.jobToken;
        if (!jobId || !jobToken) {
          setIsGenerating(false);
          return;
        }

        // Begin polling every 1500ms
        pollTimerRef.current = setInterval(async () => {
          try {
            const pollData = await pollPredictionJob(jobId, jobToken);
            if (!pollTimerRef.current || !pollData) return;

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
                if (pollData.completedMilestones?.[7]) next[1] = pollData.completedMilestones[7];
                if (pollData.completedMilestones?.[14]) next[2] = pollData.completedMilestones[14];
                if (pollData.completedMilestones?.[28]) next[3] = pollData.completedMilestones[28];
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
                try {
                  localStorage.setItem("g_ai_twin_milestones", JSON.stringify(finalArr));
                } catch {}
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
    },
    [aiAvailable]
  );

  // Re-issue expired image links once the saved photo/stats are loaded.
  useEffect(() => {
    if (needsUrlRefreshRef.current && userPhoto && consentRef.current) {
      needsUrlRefreshRef.current = false;
      void startGeneration(userPhoto, archetype, userStats, planConfig);
    }
  }, [userPhoto, archetype, userStats, planConfig, startGeneration]);

  const retryGeneration = useCallback(() => {
    void startGeneration(userPhoto, archetype, userStats, planConfig);
  }, [userPhoto, archetype, userStats, planConfig, startGeneration]);

  // Plan Change Handler
  const handleUpdatePlan = useCallback(
    async (newPlan: PlanConfig) => {
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
    },
    [userPhoto, userStats, startGeneration]
  );

  // Calibration Save Handler
  const handleCalibrationSave = useCallback(
    async (updated: CalibrationData) => {
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
    },
    [planConfig, userPhoto, startGeneration]
  );

  // Photo Update Handler
  const handlePhotoUpdate = useCallback(
    (newPhoto: string | null) => {
      setUserPhoto(newPhoto);
      if (newPhoto) {
        try {
          localStorage.setItem("g_ai_user_twin_photo", newPhoto);
        } catch {
          // ignore
        }
        if (consentRef.current) {
          void startGeneration(newPhoto, archetype, userStats, planConfig);
        }
      } else {
        void deletePredictionOnServer();
        clearJobRef();
        try {
          localStorage.removeItem("g_ai_user_twin_photo");
          localStorage.removeItem("g_ai_twin_milestones");
        } catch {
          // ignore
        }
        setCustomMilestones(null);
        setCompletedMilestones({});
      }
    },
    [archetype, userStats, planConfig, startGeneration]
  );

  const progress = currentDay / 28.0;

  return {
    currentDay,
    setCurrentDay,
    viewMode,
    setViewMode,
    activeHotspot,
    setActiveHotspot,
    archetype,
    setArchetype,
    isModalOpen,
    setIsModalOpen,
    userPhoto,
    customMilestones,
    completedMilestones,
    userStats,
    hasQuiz,
    dailyCalorieGap,
    isRecalculatingPlan,
    isGenerating,
    generationProgress,
    generationError,
    aiAvailable,
    genderMismatchWarning,
    setGenderMismatchWarning,
    planConfig,
    progress,
    startGeneration,
    retryGeneration,
    handleUpdatePlan,
    handleCalibrationSave,
    handlePhotoUpdate,
  };
}
