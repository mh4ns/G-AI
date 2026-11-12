"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Check, Flame, Lightbulb, Play, Plus, RotateCcw, ShoppingBag } from "lucide-react";
import { PersonalizedPlanResult } from "@/types/quiz";
import { BrandLogo, siteUrl, hubUrl } from "@g-ai/ui";
import { LiveWorkoutStudio, WorkoutSummaryData } from "@/components/workout/LiveWorkoutStudio";
import { api, ApiDailyMetric, ApiUser, getSessionUser } from "@/lib/api-client";

// Checklist keys persisted as habit keys on the backend.
const CHECKLIST_KEYS = ["water", "workout", "mindfulness", "fasting"] as const;

function checklistFromMetric(metric: ApiDailyMetric): Record<string, boolean> {
  return Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, metric.habits_completed.includes(k)]));
}

export default function TodayDashboardPage() {
  const [plan, setPlan] = useState<PersonalizedPlanResult>({
    archetype: "female_pilates",
    bmi: 22.1,
    bmiCategory: "Cân đối lý tưởng",
    bmr: 1350,
    tdee: 1850,
    dailyCalorieTarget: 1450,
    calorieDeficitDaily: 400,
    macroSplit: { proteinG: 96, carbsG: 160, fatG: 40 },
    estimatedWeeks: 6,
    estimatedTargetDate: "15 Tháng 12, 2026",
    recommendedWaterMl: 2100,
    weeklyWorkoutsCount: 4,
    focusHighlights: ["Đốt mỡ phẳng bụng", "Nâng và săn chắc vòng 3"],
    safetyNotes: ["Đã bảo vệ cột sống và khớp gối"],
    excludedExercises: [],
    weeklyRoutine: [
      {
        dayNumber: 1,
        title: "Thảm Mat: Siết Eo & Phẳng Bụng",
        durationMin: 35,
        target: "Cơ lõi, Cơ ngang bụng & Sàn chậu",
        intensity: "moderate",
        exerciseCount: 6,
      },
      {
        dayNumber: 2,
        title: "Glute Bridge & Hip Sculpting",
        durationMin: 40,
        target: "Cơ mông lớn & Cơ đùi sau",
        intensity: "high",
        exerciseCount: 7,
      },
      {
        dayNumber: 3,
        title: "Active Recovery: Decompression & Mở Khớp",
        durationMin: 25,
        target: "Giải phóng đốt sống lưng",
        intensity: "low",
        exerciseCount: 5,
      },
      {
        dayNumber: 4,
        title: "Pilates Toàn Thân & Cân Bằng Tư Thế",
        durationMin: 35,
        target: "Đốt mỡ toàn diện & Định hình đường cong",
        intensity: "moderate",
        exerciseCount: 6,
      },
    ],
  });

  const [waterDrunkMl, setWaterDrunkMl] = useState<number>(750);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(180);
  const [caloriesEaten, setCaloriesEaten] = useState<number>(620);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    water: false,
    workout: false,
    mindfulness: true,
    fasting: false,
  });

  const [sessionUser, setSessionUser] = useState<ApiUser | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasCustomPlan, setHasCustomPlan] = useState<boolean>(true);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem("g_ai_user_plan");
      if (savedPlan) {
        setPlan(JSON.parse(savedPlan));
        setHasCustomPlan(true);
      } else {
        setHasCustomPlan(false);
      }
      const savedTheme = localStorage.getItem("g_ai_theme");
      if (savedTheme === "dark") {
        setTheme("dark");
      }
    } catch {
      // fallback
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("g_ai_theme", nextTheme);
      localStorage.setItem("g_ai_theme_manual", "true");
    } catch {
      // fallback
    }
  };

  // Signed-in users get real, persisted numbers; guests keep the local demo values.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getSessionUser();
      if (cancelled || !user) return;
      setSessionUser(user);
      try {
        applyMetric(await api.today.get());
      } catch {
        if (!cancelled) setSyncError("Không tải được số liệu hôm nay từ máy chủ.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyMetric = (metric: ApiDailyMetric) => {
    setWaterDrunkMl(metric.water_intake_ml);
    setCaloriesBurned(metric.calories_burned);
    setCaloriesEaten(metric.calories_consumed);
    setChecklist(checklistFromMetric(metric));
    setSyncError(null);
  };

  /** Runs a backend update for signed-in users; reports (but does not undo) failures. */
  const syncToBackend = async (call: () => Promise<ApiDailyMetric>) => {
    if (!sessionUser) return;
    try {
      applyMetric(await call());
    } catch {
      setSyncError("Chưa lưu được thay đổi lên máy chủ. Vui lòng thử lại.");
    }
  };

  const handleFinishWorkout = async (summary: WorkoutSummaryData) => {
    if (!sessionUser) {
      setCaloriesBurned((prev) => prev + summary.caloriesBurned);
      setChecklist((prev) => ({ ...prev, workout: true }));
      return;
    }
    try {
      await api.workouts.log({
        duration_sec: Math.max(1, Math.round(summary.durationMinutes * 60)),
        calories_burned: Math.max(0, Math.round(summary.caloriesBurned)),
        reps_completed: Math.max(0, Math.round(summary.repsCompleted)),
        // Camera off = nothing measured: send null rather than a fake 0%.
        form_accuracy_pct:
          summary.averageFormScore == null ? null : Math.min(100, Math.max(0, summary.averageFormScore)),
      });
      let metric = await api.today.get();
      if (!metric.habits_completed.includes("workout")) {
        metric = await api.today.toggleHabit("workout");
      }
      applyMetric(metric);
    } catch {
      setSyncError("Chưa lưu được buổi tập lên máy chủ.");
    }
  };

  const isLight = theme === "light";

  const remainingCalories = plan.dailyCalorieTarget - caloriesEaten + caloriesBurned;
  const waterPercent = Math.min(100, Math.round((waterDrunkMl / plan.recommendedWaterMl) * 100));

  const addWater = () => {
    if (sessionUser) {
      void syncToBackend(async () => {
        const metric = await api.today.addWater(250);
        const reachedGoal = metric.water_intake_ml >= plan.recommendedWaterMl;
        return reachedGoal && !metric.habits_completed.includes("water")
          ? api.today.toggleHabit("water")
          : metric;
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
  };

  const toggleChecklist = (key: string) => {
    if (sessionUser) {
      void syncToBackend(() => api.today.toggleHabit(key));
      return;
    }
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const todayLabel = new Date().toLocaleDateString("vi-VN", { day: "numeric", month: "long" });

  const isOverBudget = remainingCalories < 0;
  const habitsDone = Object.values(checklist).filter(Boolean).length;
  const habitsTotal = Object.keys(checklist).length;
  const waterGoalReached = waterDrunkMl >= plan.recommendedWaterMl;
  const waterGoalLitres = (plan.recommendedWaterMl / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 });

  return (
    <div data-theme={theme} className="min-h-screen bg-page text-ink transition-colors duration-300">
      <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={hubUrl("/")}
              aria-label="Về trang chủ G-AI"
              className={`flex shrink-0 items-center rounded-lg transition-opacity hover:opacity-70 ${FOCUS_RING}`}
            >
              <BrandLogo variant="horizontal" isLight={isLight} size="sm" />
            </Link>
            <div className="min-w-0 border-l border-line pl-3">
              <h1 className="truncate text-sm font-semibold leading-tight text-ink">Hôm nay, {todayLabel}</h1>
              <p className="truncate text-xs text-ink-muted">
                <span className="hidden sm:inline">Lộ trình 28 ngày · </span>Tuần 1, ngày 3
              </p>
            </div>
          </div>

          <nav aria-label="Công cụ" className="flex shrink-0 items-center">
            <Link href={siteUrl("/#movement-goods")} title="Dụng cụ tập luyện" aria-label="Dụng cụ tập luyện" className={ICON_BUTTON}>
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={handleToggleTheme}
              title="Đổi giao diện sáng / tối"
              aria-label="Đổi giao diện sáng / tối"
              aria-pressed={!isLight}
              className={ICON_BUTTON}
            >
              <Lightbulb className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <a href="/quiz" title="Khảo sát lại kế hoạch" aria-label="Khảo sát lại kế hoạch" className={ICON_BUTTON}>
              <RotateCcw className="h-[18px] w-[18px]" aria-hidden />
            </a>
          </nav>
        </div>
      </header>

      {/* Plan and account notices: one quiet strip, only when there is something to say */}
      {(!hasCustomPlan || !sessionUser || syncError) && (
        <div className="border-b border-line bg-surface">
          <div className="mx-auto w-full max-w-3xl divide-y divide-line px-4 text-sm">
            {syncError && (
              <p role="alert" className="py-2.5 font-medium text-danger">
                {syncError}
              </p>
            )}
            {!hasCustomPlan && (
              <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-ink-muted">
                <span>Đây là lộ trình mẫu, chưa cá nhân hóa.</span>
                <Link href="/quiz" className={NOTICE_LINK}>
                  Làm khảo sát 2 phút
                </Link>
              </p>
            )}
            {!sessionUser && (
              <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-ink-muted">
                <span>Số liệu bên dưới chỉ lưu trên trình duyệt này.</span>
                <Link href="/login?next=/today" className={NOTICE_LINK}>
                  Đăng nhập để lưu tiến trình
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-3xl px-4 pb-24">
        {/* Today's workout: the one primary action on this screen */}
        <section aria-labelledby="workout-title" className="pb-12 pt-10 sm:pb-16 sm:pt-14">
          <h2
            id="workout-title"
            className="max-w-[15ch] text-balance font-display text-[2.75rem] font-extrabold leading-[1.04] tracking-[-0.015em] text-ink sm:text-[4rem]"
          >
            Pilates siết cơ bụng &amp; thẳng vai
          </h2>
          <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-ink-muted">
            18 phút · 4 bài tập. Bật webcam để AI Live PT quan sát cột sống và sửa tư thế gù lưng theo thời gian thực.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className={
                checklist.workout
                  ? `inline-flex h-12 items-center gap-2.5 rounded-full border border-ink-faint px-6 text-[15px] font-semibold text-ink transition-[background-color,transform] duration-200 hover:bg-sunken active:scale-[0.98] ${FOCUS_RING}`
                  : `inline-flex h-12 items-center gap-2.5 rounded-full bg-brand px-7 text-[15px] font-semibold text-brand-contrast transition-[background-color,transform] duration-200 hover:bg-brand-soft active:scale-[0.98] ${FOCUS_RING}`
              }
            >
              <Play className="h-4 w-4 fill-current" aria-hidden />
              <span>{checklist.workout ? "Tập lại" : "Bắt đầu tập"}</span>
            </button>
            {checklist.workout && (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-positive">
                <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                Đã tập xong hôm nay
              </p>
            )}
          </div>
        </section>

        {/* Energy budget, written as the sum it is */}
        <section aria-labelledby="energy-title" className="border-t border-line pb-12 pt-8">
          <h2 id="energy-title" className="text-lg font-semibold text-ink">
            Năng lượng hôm nay
          </h2>
          <p className="sr-only">
            Mục tiêu {plan.dailyCalorieTarget} kcal, đã nạp {caloriesEaten} kcal, đã đốt {caloriesBurned} kcal.{" "}
            {isOverBudget
              ? `Đã vượt ${Math.abs(remainingCalories)} kcal.`
              : `Còn lại ${remainingCalories} kcal.`}
          </p>
          <div
            aria-hidden
            className="mt-5 grid w-max max-w-full grid-flow-col grid-rows-[auto_auto] items-baseline gap-x-2 gap-y-1 tabular-nums sm:gap-x-4"
          >
            <span className={ENERGY_TERM}>{formatNumber(plan.dailyCalorieTarget)}</span>
            <span className={ENERGY_LABEL}>Mục tiêu</span>

            <span className={ENERGY_OPERATOR}>−</span>
            <span />

            <span className={ENERGY_TERM}>{formatNumber(caloriesEaten)}</span>
            <span className={ENERGY_LABEL}>Đã nạp</span>

            <span className={ENERGY_OPERATOR}>+</span>
            <span />

            <span className={ENERGY_TERM}>{formatNumber(caloriesBurned)}</span>
            <span className={ENERGY_LABEL}>Đã đốt</span>

            <span className={ENERGY_OPERATOR}>=</span>
            <span />

            <span
              className={`text-4xl font-bold leading-none tracking-tight sm:text-6xl ${
                isOverBudget ? "text-danger" : "text-ink"
              }`}
            >
              {formatNumber(Math.abs(remainingCalories))}
            </span>
            <span className={`text-xs font-medium sm:text-sm ${isOverBudget ? "text-danger" : "text-ink"}`}>
              {isOverBudget ? "kcal vượt mức" : "kcal còn lại"}
            </span>
          </div>
        </section>

        {/* Habits: water, fasting and the checklist in one list */}
        <section aria-labelledby="habits-title" className="border-t border-line pb-12 pt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="habits-title" className="text-lg font-semibold text-ink">
              Thói quen hôm nay
            </h2>
            <p className="flex items-center gap-3 text-sm text-ink-muted">
              <span className="tabular-nums">
                {habitsDone}/{habitsTotal} xong
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-ink">
                <Flame className="h-4 w-4 text-brand" aria-hidden />
                Chuỗi 3 ngày
              </span>
            </p>
          </div>

          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            <HabitRow
              checked={checklist.workout}
              onToggle={() => toggleChecklist("workout")}
              title="Hoàn thành 18 phút bài tập Pilates bụng"
              detail="+180 kcal"
            />

            <HabitRow
              checked={checklist.water}
              onToggle={() => toggleChecklist("water")}
              title={`Uống đủ ${waterGoalLitres} L nước lọc trong ngày`}
              detail={`${formatNumber(waterDrunkMl)} / ${formatNumber(plan.recommendedWaterMl)} ml`}
              progress={waterPercent}
              progressLabel="Lượng nước đã uống"
              progressDone={waterGoalReached}
              action={
                <button
                  type="button"
                  onClick={addWater}
                  aria-label="Thêm 250 ml nước"
                  className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-ink-faint px-3 text-sm font-semibold tabular-nums text-ink transition-[background-color,transform] duration-200 hover:bg-sunken active:scale-95 ${FOCUS_RING}`}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  250 ml
                </button>
              }
            />

            <HabitRow
              checked={checklist.mindfulness}
              onToggle={() => toggleChecklist("mindfulness")}
              title="5 phút thở thư giãn Box Breathing giảm căng thẳng"
            />

            <HabitRow
              checked={checklist.fasting}
              onToggle={() => toggleChecklist("fasting")}
              title="Không ăn vặt sau 20:00 tối"
              detail="Nhịn ăn 16:8 · đã nhịn 14h 25m / 16 giờ · khung ăn 12:00–20:00"
            />
          </ul>
        </section>

        {/* Digital Twin: secondary destination, kept as a single quiet row */}
        <div className="border-t border-line pt-3">
          <Link
            href="/prediction"
            className={`group -mx-3 flex items-center justify-between gap-6 rounded-2xl px-3 py-5 transition-colors duration-200 hover:bg-sunken ${FOCUS_RING}`}
          >
            <span className="min-w-0">
              <span className="block text-lg font-semibold text-ink">Mô hình biến đổi 28 ngày (Digital Twin)</span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
                Kéo thanh thời gian để xem mô phỏng gù lưng giảm dần và siết eo tự nhiên.
              </span>
            </span>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-ink-muted transition-[transform,color] duration-200 group-hover:translate-x-1 group-hover:text-ink"
              aria-hidden
            />
          </Link>
        </div>
      </main>

      {/* AI Live PT Studio Modal */}
      <LiveWorkoutStudio
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onFinishWorkout={handleFinishWorkout}
        archetype={plan.archetype}
      />
    </div>
  );
}

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const ICON_BUTTON = `flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-sunken hover:text-ink ${FOCUS_RING}`;

const NOTICE_LINK = `shrink-0 rounded font-semibold text-brand-text underline-offset-4 hover:underline ${FOCUS_RING}`;

const ENERGY_TERM = "text-xl font-semibold leading-none text-ink sm:text-3xl";
const ENERGY_LABEL = "text-xs text-ink-muted sm:text-sm";
const ENERGY_OPERATOR = "text-xl leading-none text-ink-faint sm:text-3xl";

function formatNumber(value: number): string {
  return value.toLocaleString("vi-VN");
}

interface HabitRowProps {
  checked: boolean;
  onToggle: () => void;
  title: string;
  detail?: string;
  /** 0-100. Renders a thin bar under the detail line. */
  progress?: number;
  progressLabel?: string;
  progressDone?: boolean;
  /** Extra control at the end of the row, outside the checkbox hit area. */
  action?: React.ReactNode;
}

function HabitRow({ checked, onToggle, title, detail, progress, progressLabel, progressDone, action }: HabitRowProps) {
  return (
    <li className="flex items-center gap-3 pr-4">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className="group flex min-w-0 flex-1 items-center gap-3.5 py-4 pl-4 text-left transition-colors duration-200 hover:bg-sunken/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
      >
        <span
          aria-hidden
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
            checked ? "border-positive bg-positive text-surface" : "border-ink-faint text-transparent group-hover:border-ink"
          }`}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-[15px] leading-snug ${
              checked ? "text-ink-muted line-through decoration-ink-faint" : "font-medium text-ink"
            }`}
          >
            {title}
          </span>
          {detail && <span className="mt-0.5 block text-sm tabular-nums text-ink-muted">{detail}</span>}
          {progress != null && (
            <span
              role="progressbar"
              aria-label={progressLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="mt-2 block h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-sunken"
            >
              <span
                className={`block h-full rounded-full transition-[width] duration-300 ease-out ${
                  progressDone ? "bg-positive" : "bg-ink"
                }`}
                style={{ width: `${progress}%` }}
              />
            </span>
          )}
        </span>
      </button>
      {action}
    </li>
  );
}
