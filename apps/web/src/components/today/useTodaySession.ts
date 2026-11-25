"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_THEME,
  readStoredTheme,
  toggleStoredTheme,
  type ThemeMode,
} from "@g-ai/ui/theme";
import type {
  ApiDailyMetric,
  ApiMealLog,
  ApiTodaySummaryDay,
  ApiUser,
  FastingProtocol,
} from "@/lib/api-client";
import {
  DEFAULT_SAMPLE_PLAN,
  todayPresetForPlan,
  type TodayFastingProtocol,
} from "@/lib/quiz-calculations";
import type { WorkoutSummaryData } from "@/components/workout/workout-session-engine";
import type { PersonalizedPlanResult } from "@/types/quiz";
import {
  type ChecklistKey,
  type ChecklistState,
  type SessionStatus,
  type TodayPort,
  bootstrapTodaySession,
  checklistFromMetric,
  createBrowserTodayPort,
  createMutationQueue,
  performAddWater,
  performFinishWorkout,
  performToggleChecklist,
  removeMealById,
  sumMealMacros,
} from "./today-port";

export function useTodaySession(portFactory: () => TodayPort = createBrowserTodayPort) {
  const portRef = useRef<TodayPort | null>(null);
  if (!portRef.current) {
    portRef.current = portFactory();
  }
  const queueRef = useRef(createMutationQueue());

  const [plan, setPlan] = useState<PersonalizedPlanResult>(DEFAULT_SAMPLE_PLAN);
  const [hasCustomPlan, setHasCustomPlan] = useState<boolean>(true);
  const [waterDrunkMl, setWaterDrunkMl] = useState<number>(0);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);
  const [caloriesEaten, setCaloriesEaten] = useState<number>(0);
  const [fastingState, setFastingState] = useState<ApiDailyMetric["fasting_state"]>("idle");
  const [fastingProtocol, setFastingProtocol] = useState<FastingProtocol>("16:8");
  const [fastingStartedAt, setFastingStartedAt] = useState<string | null>(null);
  const [fastingBusy, setFastingBusy] = useState<boolean>(false);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [bestStreakDays, setBestStreakDays] = useState<number>(0);
  const [history7d, setHistory7d] = useState<ApiTodaySummaryDay[]>([]);
  const [meals, setMeals] = useState<ApiMealLog[]>([]);
  const [checklist, setChecklist] = useState<ChecklistState>({
    water: false,
    workout: false,
    mindfulness: false,
    fasting: false,
  });

  // Mounted wall-clock refreshed every minute. Null on SSR & first client render
  // so server and client HTML always match.
  const [now, setNow] = useState<Date | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("loading");
  const [sessionUser, setSessionUser] = useState<ApiUser | null>(null);
  const sessionUserRef = useRef<ApiUser | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeMode>(DEFAULT_THEME);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  const applyMetric = useCallback((metric: ApiDailyMetric) => {
    setWaterDrunkMl(metric.water_intake_ml);
    setCaloriesBurned(metric.calories_burned);
    setCaloriesEaten(metric.calories_consumed);
    setFastingState(metric.fasting_state);
    setFastingProtocol(metric.fasting_protocol || "16:8");
    setFastingStartedAt(metric.fasting_started_at ?? null);
    setChecklist(checklistFromMetric(metric));
    setSyncError(null);
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      const summary = await portRef.current!.getTodaySummary();
      setStreakDays(summary.streak_days);
      setBestStreakDays(summary.best_streak_days);
      setHistory7d(summary.history_7d);
    } catch {
      // Keep existing streak indicator if background refresh fails
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await bootstrapTodaySession(portRef.current!);
      if (cancelled) return;
      setPlan(result.plan);
      setHasCustomPlan(result.hasCustomPlan);
      sessionUserRef.current = result.sessionUser;
      setSessionUser(result.sessionUser);
      setSessionStatus(result.sessionStatus);
      setSyncError(result.syncError);
      if (result.summary) {
        applyMetric(result.summary.today);
        setStreakDays(result.summary.streak_days);
        setBestStreakDays(result.summary.best_streak_days);
        setHistory7d(result.summary.history_7d);
      }
      if (result.meals.length > 0) {
        setMeals(result.meals);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMetric]);

  const handleToggleTheme = useCallback(() => {
    // Do NOT pass rootElement: keep data-theme scoped to /today's container
    setTheme((prev) => toggleStoredTheme(prev));
  }, []);

  const handleUpdateFasting = useCallback(
    async (next: {
      fasting_state: ApiDailyMetric["fasting_state"];
      fasting_protocol: FastingProtocol;
      fasting_started_at?: string | null;
      fasting_minutes?: number;
    }) => {
      if (!sessionUserRef.current) {
        setFastingState(next.fasting_state);
        setFastingProtocol(next.fasting_protocol);
        setFastingStartedAt(next.fasting_started_at ?? null);
        return;
      }
      setFastingBusy(true);
      try {
        const metric = await portRef.current!.updateFasting(next);
        applyMetric(metric);
        void refreshSummary();
      } catch {
        setSyncError("Chưa lưu được trạng thái nhịn ăn lên máy chủ.");
      } finally {
        setFastingBusy(false);
      }
    },
    [applyMetric, refreshSummary]
  );

  const handleMealLogged = useCallback(
    (meal: ApiMealLog) => {
      setMeals((prev) => [...prev, meal]);
      setCaloriesEaten((prev) => prev + meal.calories);
      if (sessionUserRef.current) void refreshSummary();
    },
    [refreshSummary]
  );

  const handleMealDeleted = useCallback(
    (mealId: number) => {
      const { removed } = removeMealById(meals, mealId);
      setMeals((prev) => removeMealById(prev, mealId).meals);
      if (removed) {
        setCaloriesEaten((cal) => Math.max(0, cal - removed.calories));
      }
      if (sessionUserRef.current) void refreshSummary();
    },
    [meals, refreshSummary]
  );

  const handleFinishWorkout = useCallback(
    async (summary: WorkoutSummaryData) => {
      if (!sessionUserRef.current) {
        setCaloriesBurned((prev) => prev + Math.max(0, Math.round(summary.caloriesBurned)));
        setChecklist((prev) => ({ ...prev, workout: true }));
        return;
      }
      try {
        const metric = await performFinishWorkout(portRef.current!, queueRef.current, summary);
        applyMetric(metric);
        void refreshSummary();
      } catch {
        setSyncError("Chưa lưu được buổi tập lên máy chủ.");
      }
    },
    [applyMetric, refreshSummary]
  );

  const addWater = useCallback(() => {
    if (sessionUserRef.current) {
      void performAddWater(portRef.current!, queueRef.current, plan.recommendedWaterMl, 250)
        .then((metric) => {
          applyMetric(metric);
          void refreshSummary();
        })
        .catch(() => {
          setSyncError("Chưa lưu được thay đổi lên máy chủ. Vui lòng thử lại.");
        });
      return;
    }
    setWaterDrunkMl((prev) => {
      const next = prev + 250;
      if (next >= plan.recommendedWaterMl) {
        setChecklist((c) => ({ ...c, water: true }));
      }
      return next;
    });
  }, [applyMetric, plan.recommendedWaterMl, refreshSummary]);

  const toggleChecklist = useCallback(
    (key: ChecklistKey) => {
      if (sessionUserRef.current) {
        void performToggleChecklist(portRef.current!, queueRef.current, key)
          .then((metric) => {
            applyMetric(metric);
            void refreshSummary();
          })
          .catch(() => {
            setSyncError("Chưa lưu được thay đổi lên máy chủ. Vui lòng thử lại.");
          });
        return;
      }
      setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [applyMetric, refreshSummary]
  );

  const { totalCalories: totalMealCalories, totalProteinG, totalCarbsG, totalFatG } = useMemo(
    () => sumMealMacros(meals),
    [meals]
  );

  const preset = useMemo(
    () => todayPresetForPlan(plan, fastingProtocol as TodayFastingProtocol),
    [plan, fastingProtocol]
  );

  const todayLabel = now
    ? now.toLocaleDateString("vi-VN", { day: "numeric", month: "long" })
    : null;

  return {
    plan,
    hasCustomPlan,
    waterDrunkMl,
    caloriesBurned,
    caloriesEaten,
    fastingState,
    fastingProtocol,
    fastingStartedAt,
    fastingBusy,
    streakDays,
    bestStreakDays,
    history7d,
    meals,
    checklist,
    now,
    todayLabel,
    sessionStatus,
    sessionUser,
    syncError,
    setSyncError,
    isStudioOpen,
    setIsStudioOpen,
    theme,
    isLight: theme === "light",
    totalMealCalories,
    totalProteinG,
    totalCarbsG,
    totalFatG,
    preset,
    handleToggleTheme,
    handleUpdateFasting,
    handleMealLogged,
    handleMealDeleted,
    handleFinishWorkout,
    addWater,
    toggleChecklist,
  };
}
