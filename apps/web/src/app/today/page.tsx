"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Droplets,
  
  Play,
  Plus,
  
  Sparkles,
  
  RotateCcw,
  Clock,
  ArrowRight,
  TrendingUp,
  Moon,
  ShoppingBag,
  Sun,
} from "lucide-react";
import { PersonalizedPlanResult } from "@/types/quiz";
import { BrandLogo, SubtleNumber, siteUrl, hubUrl } from "@g-ai/ui";
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
        title: "Thảm Mat: Siết eo & phẳng bụng",
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
        title: "Active Recovery: Decompression & mở khớp",
        durationMin: 25,
        target: "Giải phóng đốt sống lưng",
        intensity: "low",
        exerciseCount: 5,
      },
      {
        dayNumber: 4,
        title: "Pilates toàn thân & cân bằng tư thế",
        durationMin: 35,
        target: "Toàn thân & tư thế",
        intensity: "moderate",
        exerciseCount: 6,
      },
    ],
  });

  // Everyone starts the day at zero; signed-in users get their saved numbers below.
  const [waterDrunkMl, setWaterDrunkMl] = useState<number>(0);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);
  const [caloriesEaten, setCaloriesEaten] = useState<number>(0);
  // Clock for the 16:8 card, refreshed each minute.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    water: false,
    workout: false,
    mindfulness: false,
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

  // Signed-in users get real, persisted numbers; guests log on this device only.
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

  // 16:8 from the clock: eating 12:00-20:00, fasting 20:00-12:00.
  const fasting = (() => {
    if (!now) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const fmt = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
    if (minutes >= 12 * 60 && minutes < 20 * 60) {
      return { eating: true, value: fmt(20 * 60 - minutes), caption: "còn lại trong giờ ăn" };
    }
    const elapsed = minutes >= 20 * 60 ? minutes - 20 * 60 : minutes + 4 * 60;
    return { eating: false, value: fmt(elapsed), caption: "/ 16 giờ nhịn" };
  })();

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

  return (
    <div data-theme={theme} className={`min-h-screen transition-colors duration-300 pb-16 ${
      isLight ? "bg-canvas text-stone-800" : "bg-canvas-dark text-stone-100"
    }`}>
      {/* Top Navbar */}
      <header className={`backdrop-blur-md sticky top-0 z-30 border-b transition-colors duration-300 ${
        isLight ? "bg-white/80 border-stone-200/70" : "bg-[#11100F]/90 border-stone-800"
      }`}>
        <div className="w-full max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={hubUrl("/")} className="min-h-11 min-w-11 hover:opacity-80 transition-opacity flex items-center" aria-label="G-AI – trang chính">
              <BrandLogo variant="horizontal" isLight={isLight} size="sm" />
            </Link>
            <div className={`border-l pl-3 ${isLight ? "border-stone-200" : "border-stone-800"}`}>
              <h1 className={`font-bold text-sm sm:text-base leading-tight ${
                isLight ? "text-stone-800" : "text-white"
              }`}>
                Hôm nay, {todayLabel}
              </h1>
              <p className={`text-xs font-medium ${isLight ? "text-stone-500" : "text-stone-400"}`}>Lộ trình 28 ngày</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href={siteUrl("/store")}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                isLight
                  ? "text-stone-600 hover:text-stone-950 hover:bg-stone-100"
                  : "text-stone-300 hover:text-white hover:bg-stone-800"
              }`}
              aria-label="Dụng cụ tập"
              title="Dụng cụ tập"
            >
              <ShoppingBag className="w-[18px] h-[18px]" aria-hidden />
            </Link>

            <button
              type="button"
              onClick={handleToggleTheme}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                isLight
                  ? "text-stone-600 hover:text-stone-950 hover:bg-stone-100"
                  : "text-stone-300 hover:text-white hover:bg-stone-800"
              }`}
              aria-label={isLight ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
              title={isLight ? "Giao diện tối" : "Giao diện sáng"}
            >
              {isLight ? <Moon className="w-[18px] h-[18px]" aria-hidden /> : <Sun className="w-[18px] h-[18px]" aria-hidden />}
            </button>

            <Link
              href="/quiz"
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                isLight
                  ? "text-stone-600 hover:text-stone-950 hover:bg-stone-100"
                  : "text-stone-300 hover:text-white hover:bg-stone-800"
              }`}
              aria-label="Làm lại khảo sát"
              title="Làm lại khảo sát"
            >
              <RotateCcw className="w-[18px] h-[18px]" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {/* Demo Mode / Missing Quiz Alert Banner */}
      {!hasCustomPlan && (
        <div className="bg-gradient-to-r from-amber-500/10 via-peach-500/10 to-amber-500/10 border-b border-amber-200/80 px-4 py-3">
          <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-stone-700">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-xs">
                Lộ trình mẫu
              </span>
              <span>
                Bạn đang xem lộ trình mẫu chưa cá nhân hóa. Hãy làm bài khảo sát thể trạng 2 phút để thuật toán AI tối ưu riêng cho bạn.
              </span>
            </div>
            <Link
              href="/quiz"
              className="min-h-11 px-4 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white font-bold text-xs shrink-0 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Làm khảo sát ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Account sync status */}
      {(!sessionUser || syncError) && (
        <div className={`border-b px-4 py-2.5 text-xs ${
          syncError
            ? "bg-rose-50 border-rose-200 text-rose-700"
            : isLight ? "bg-white border-stone-200 text-stone-600" : "bg-[#11100F] border-stone-800 text-stone-300"
        }`}>
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3">
            <span role={syncError ? "alert" : undefined}>
              {syncError ?? "Số liệu bên dưới chỉ lưu trên trình duyệt này."}
            </span>
            {!sessionUser && (
              <Link href="/login?next=/today" className="min-h-11 inline-flex items-center font-bold text-brand-action hover:underline shrink-0">
                Đăng nhập để lưu tiến trình
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Dashboard Body */}
      <main className="w-full max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Calorie Balance Hero Widget */}
        <section className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-stone-800 text-lg">Ngân sách năng lượng hôm nay</h2>
              <p className="text-xs text-muted">Duy trì thâm hụt an toàn để đạt mốc cân mục tiêu</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted font-medium block">Mục tiêu ngày</span>
              <span className="text-sm font-bold text-stone-700">{plan.dailyCalorieTarget} kcal</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Remaining Highlight Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-peach-50 via-cream-100 to-peach-100 border border-peach-200/80 text-center sm:text-left">
              <div className="text-xs text-peach-700 font-semibold ">Calo còn lại</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-peach-600 mt-1"><SubtleNumber value={remainingCalories} /></div>
              <div className="text-xs text-stone-600 mt-0.5">kcal có thể nạp thêm</div>
            </div>

            {/* In / Out Details */}
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Đã nạp vào
                </div>
                <div className="text-xl font-bold text-stone-800 mt-1"><SubtleNumber value={caloriesEaten} /> <span className="text-xs font-normal text-muted">kcal</span></div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Đã đốt
                </div>
                <div className="text-xl font-bold text-stone-800 mt-1"><SubtleNumber value={caloriesBurned} /> <span className="text-xs font-normal text-muted">kcal</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Digital Twin AI Prediction Teaser Banner */}
        <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border border-stone-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-brand-action" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Dự đoán vóc dáng 28 ngày</h3>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">Kéo thanh thời gian để xem lộ trình 28 ngày theo từng tuần.</p>
            </div>
          </div>
          <Link
            href="/prediction"
            className="min-h-11 px-5 py-2.5 rounded-full bg-white text-stone-900 hover:bg-stone-200 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>Xem mô phỏng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
        <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-soft relative overflow-hidden">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-bold">
                Pilates siết cơ bụng & thẳng vai
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 max-w-md">
                18 phút · 4 bài tập. Bật webcam để AI đếm rep và nhắc khi bạn sai form.
              </p>
            </div>

            <button
              onClick={() => setIsStudioOpen(true)}
              className="min-h-12 px-6 rounded-2xl bg-brand-action hover:bg-brand-action-hover text-white font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors active:translate-y-px w-full sm:w-auto"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt đầu tập</span>
            </button>
          </div>
        </section>

        {/* 2-Column Grid: Hydration & Fasting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hydration Tracker */}
          <section className="p-5 rounded-3xl bg-white border border-stone-200 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-sm">Nước uống trong ngày</h3>
                  <p className="text-xs text-muted">Mục tiêu: {(plan.recommendedWaterMl / 1000).toFixed(1)}L</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                <SubtleNumber value={waterPercent} />%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5 my-2">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-smooth-out)] motion-reduce:transition-none"
                style={{ width: `${waterPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-700"><SubtleNumber value={waterDrunkMl} /> / {plan.recommendedWaterMl.toLocaleString("vi-VN")} ml</span>
              <button
                onClick={addWater}
                className="min-h-11 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center gap-1 transition-colors active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+250ml</span>
              </button>
            </div>
          </section>

          {/* Intermittent Fasting Widget */}
          <section className="p-5 rounded-3xl bg-white border border-stone-200 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-sm">Nhịn ăn gián đoạn 16:8</h3>
                  <p className="text-xs text-muted">Khung giờ ăn: 12:00 - 20:00</p>
                </div>
              </div>
              {fasting && (
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {fasting.eating ? "Trong giờ ăn" : "Đang nhịn"}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-2xl font-extrabold text-stone-800">{fasting ? fasting.value : "--"}</span>
              <span className="text-xs text-muted">{fasting ? fasting.caption : ""}</span>
            </div>

            <p className="text-xs text-stone-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/60">
              Tính theo khung giờ ăn 12:00–20:00. Trong lúc nhịn, bạn vẫn uống được nước, trà hoặc cà phê không đường.
            </p>
          </section>
        </div>

        {/* Daily Habits Checklist */}
        <section className="p-5 rounded-3xl bg-white border border-stone-200 shadow-card">
          <h3 className="font-bold text-stone-800 text-base mb-3 flex items-center justify-between">
            <span>Nhiệm vụ giữ phong độ hôm nay</span>
            <span className="text-xs font-normal text-muted">
              {Object.values(checklist).filter(Boolean).length} / {Object.keys(checklist).length} hoàn thành
            </span>
          </h3>

          <ul className="space-y-2.5">
            {[
              {
                key: "workout",
                label: "Hoàn thành 18 phút bài tập Pilates bụng",
                tag: "18 phút",
                tagClass: "text-brand-action bg-peach-50",
              },
              {
                key: "water",
                label: `Uống đủ ${(plan.recommendedWaterMl / 1000).toFixed(1)}L nước lọc trong ngày`,
                tag: `${waterDrunkMl.toLocaleString("vi-VN")} ml`,
                tagClass: "text-sky-800 bg-sky-50",
              },
              {
                key: "mindfulness",
                label: "5 phút thở thư giãn Box Breathing giảm căng thẳng",
                tag: "5 phút",
                tagClass: "text-stone-700 bg-stone-100",
              },
              {
                key: "fasting",
                label: "Không ăn vặt sau 20:00 tối",
                tag: "Tối nay",
                tagClass: "text-amber-800 bg-amber-50",
              },
            ].map((task) => {
              const done = !!checklist[task.key];
              return (
                <li key={task.key}>
                  {/* Checkbox check (transitions.dev 25): the box fills, then the tick draws. */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    onClick={() => toggleChecklist(task.key)}
                    className="t-check group w-full min-h-12 p-3 rounded-2xl border border-stone-200 hover:border-stone-300 bg-stone-50/50 flex items-center justify-between gap-3 text-left transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-5 h-5 shrink-0 rounded-md border-2 border-stone-300 bg-white flex items-center justify-center transition-colors duration-[var(--check-box)] group-aria-checked:bg-emerald-600 group-aria-checked:border-emerald-600">
                        <svg viewBox="0 0 10.1668 10.1668" className="w-3 h-3" aria-hidden>
                          <path d="M1 5.52L3.92 9.17L9.17 1" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className={`text-sm ${done ? "line-through text-muted" : "font-medium text-stone-700"}`}>
                        {task.label}
                      </span>
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${task.tagClass}`}>
                      {task.tag}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
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
