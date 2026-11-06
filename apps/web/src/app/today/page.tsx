"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Droplets,
  Video,
  Play,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Heart,
  RotateCcw,
  Clock,
  ArrowRight,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { PersonalizedPlanResult, QuizResponses } from "@/types/quiz";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LiveWorkoutStudio, WorkoutSummaryData } from "@/components/workout/LiveWorkoutStudio";

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
    } catch (e) {
      // fallback
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("g_ai_theme", nextTheme);
      localStorage.setItem("g_ai_theme_manual", "true");
    } catch (e) {
      // fallback
    }
  };

  const handleFinishWorkout = (summary: WorkoutSummaryData) => {
    setCaloriesBurned((prev) => prev + summary.caloriesBurned);
    setChecklist((prev) => ({ ...prev, workout: true }));
  };

  const isLight = theme === "light";

  const remainingCalories = plan.dailyCalorieTarget - caloriesEaten + caloriesBurned;
  const waterPercent = Math.min(100, Math.round((waterDrunkMl / plan.recommendedWaterMl) * 100));

  const addWater = () => {
    setWaterDrunkMl((prev) => {
      const next = prev + 250;
      if (next >= plan.recommendedWaterMl) {
        setChecklist((c) => ({ ...c, water: true }));
      }
      return next;
    });
  };

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-16 ${
      isLight ? "bg-[#FAF8F5] text-stone-800" : "bg-[#0A0908] text-stone-100"
    }`}>
      {/* Top Navbar */}
      <header className={`backdrop-blur-md sticky top-0 z-30 border-b transition-colors duration-300 ${
        isLight ? "bg-white/80 border-stone-200/70" : "bg-[#11100F]/90 border-stone-800"
      }`}>
        <div className="w-full max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition-opacity flex items-center">
              <BrandLogo variant="horizontal" isLight={isLight} size="sm" />
            </Link>
            <div className={`border-l pl-3 ${isLight ? "border-stone-200" : "border-stone-800"}`}>
              <h1 className={`font-bold text-sm sm:text-base leading-tight ${
                isLight ? "text-stone-800" : "text-white"
              }`}>
                Hôm nay, 2 Tháng 11
              </h1>
              <p className="text-[11px] text-stone-400 font-medium">Lộ trình 28 ngày • Tuần 1, Ngày 3</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/#movement-goods"
              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                isLight
                  ? "text-stone-600 hover:text-[#FF5A36] bg-stone-100 hover:bg-stone-200"
                  : "text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800"
              }`}
            >
              🛍️ Dụng Cụ
            </Link>

            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold shadow-sm">
              <span className="text-sm">🔥</span>
              <span>3 Ngày Chuỗi</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              className={`p-2 rounded-xl transition-colors ${
                isLight
                  ? "text-amber-500 hover:bg-stone-100"
                  : "text-stone-400 hover:text-amber-400 hover:bg-stone-800"
              }`}
              title="Đổi Giao Diện Sáng / Tối"
              aria-label="Toggle Theme"
            >
              <Lightbulb className={`w-4 h-4 ${isLight ? "fill-amber-400 text-amber-500" : "text-stone-400"}`} />
            </button>

            <a
              href="/quiz"
              className={`p-2 rounded-xl transition-colors ${
                isLight
                  ? "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              }`}
              title="Khảo sát lại kế hoạch"
            >
              <RotateCcw className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Demo Mode / Missing Quiz Alert Banner */}
      {!hasCustomPlan && (
        <div className="bg-gradient-to-r from-amber-500/10 via-peach-500/10 to-amber-500/10 border-b border-amber-200/80 px-4 py-3">
          <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-stone-700">
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono font-bold text-[10px]">
                LỘ TRÌNH MẪU
              </span>
              <span>
                Bạn đang xem lộ trình mẫu chưa cá nhân hóa. Hãy làm bài khảo sát thể trạng 2 phút để thuật toán AI tối ưu riêng cho bạn.
              </span>
            </div>
            <Link
              href="/quiz"
              className="px-4 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white font-mono font-bold text-xs shrink-0 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Làm Khảo Sát Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Dashboard Body */}
      <main className="w-full max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Calorie Balance Hero Widget */}
        <section className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-stone-800 text-lg">Ngân Sách Năng Lượng Hôm Nay</h2>
              <p className="text-xs text-stone-400">Duy trì thâm hụt an toàn để đạt mốc cân mục tiêu</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-400 font-medium block">Mục tiêu ngày</span>
              <span className="text-sm font-bold text-stone-700">{plan.dailyCalorieTarget} kcal</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Remaining Highlight Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-peach-50 via-cream-100 to-peach-100 border border-peach-200/80 text-center sm:text-left">
              <div className="text-xs text-peach-700 font-semibold uppercase tracking-wider">Calo Còn Lại</div>
              <div className="text-3xl sm:text-4xl font-black text-peach-600 mt-1">{remainingCalories}</div>
              <div className="text-[11px] text-stone-500 mt-0.5">kcal có thể nạp thêm</div>
            </div>

            {/* In / Out Details */}
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Đã Nạp Vào
                </div>
                <div className="text-xl font-bold text-stone-800 mt-1">{caloriesEaten} <span className="text-xs font-normal text-stone-400">kcal</span></div>
                <div className="text-[10px] text-stone-400 mt-0.5">Bữa sáng + Cà phê</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Đã Đốt Cháy
                </div>
                <div className="text-xl font-bold text-stone-800 mt-1">{caloriesBurned} <span className="text-xs font-normal text-stone-400">kcal</span></div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">+ Đi bộ 3,200 bước</div>
              </div>
            </div>
          </div>
        </section>

        {/* Digital Twin AI Prediction Teaser Banner */}
        <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border border-stone-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5A36]/20 border border-[#FF5A36]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#FF5A36]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Mô Hình Nhân Vật Biến Đổi 28 Ngày (Digital Twin)</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold">MỚI</span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">Kéo thanh timeline để xem mô phỏng gù lưng giảm dần và siết eo tự nhiên.</p>
            </div>
          </div>
          <Link
            href="/prediction"
            className="px-5 py-2.5 rounded-full bg-white text-stone-900 hover:bg-stone-200 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>Xem Mô Phỏng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
        <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-soft relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-48 h-48 rounded-full bg-peach-500/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-peach-500/20 border border-peach-500/30 text-peach-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-peach-400 animate-pulse" />
                Bài Tập Hôm Nay • Sẵn Sàng Với AI Live PT
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">
                Pilates Siết Cơ Bụng & Thẳng Vai
              </h3>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md">
                18 phút • 4 bài tập • Bật webcam để AI Companion quan sát cột sống và sửa tư thế gù lưng thời gian thực.
              </p>
            </div>

            <button
              onClick={() => setIsStudioOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white font-bold text-sm shadow-glow transition-all duration-200 active:scale-[0.98] flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt Đầu Tập Ngay (AI Studio)</span>
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
                  <h3 className="font-bold text-stone-800 text-sm">Nước Uống Trong Ngày</h3>
                  <p className="text-[11px] text-stone-400">Mục tiêu: {(plan.recommendedWaterMl / 1000).toFixed(1)}L</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                {waterPercent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5 my-2">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${waterPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-700">{waterDrunkMl} / {plan.recommendedWaterMl} ml</span>
              <button
                onClick={addWater}
                className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center gap-1 transition-colors active:scale-95"
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
                  <h3 className="font-bold text-stone-800 text-sm">Nhịn Ăn Gián Đoạn 16:8</h3>
                  <p className="text-[11px] text-stone-400">Khung giờ ăn: 12:00 - 20:00</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Đang Nhịn
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-2xl font-black text-stone-800">14h 25m</span>
              <span className="text-xs text-stone-400">/ 16 giờ mục tiêu</span>
            </div>

            <div className="text-[11px] text-stone-500 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/60 flex items-center gap-2">
              <span className="text-sm">🔥</span>
              <span>Cơ thể đang ở giai đoạn <strong>đốt mỡ tự nhiên</strong> và thanh lọc tế bào.</span>
            </div>
          </section>
        </div>

        {/* Daily Habits Checklist */}
        <section className="p-5 rounded-3xl bg-white border border-stone-200 shadow-card">
          <h3 className="font-bold text-stone-800 text-base mb-3 flex items-center justify-between">
            <span>Nhiệm Vụ Giữ Phong Độ Hôm Nay</span>
            <span className="text-xs font-normal text-stone-400">
              {Object.values(checklist).filter(Boolean).length} / {Object.keys(checklist).length} hoàn thành
            </span>
          </h3>

          <div className="space-y-2.5">
            <div
              onClick={() => toggleChecklist("workout")}
              className="p-3 rounded-2xl border border-stone-200 hover:border-peach-200 cursor-pointer flex items-center justify-between transition-colors bg-stone-50/50"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-5 h-5 ${checklist.workout ? "text-emerald-500" : "text-stone-300"}`}
                />
                <span className={`text-sm ${checklist.workout ? "line-through text-stone-400" : "font-medium text-stone-700"}`}>
                  Hoàn thành 18 phút bài tập Pilates bụng
                </span>
              </div>
              <span className="text-xs font-semibold text-peach-600 bg-peach-50 px-2.5 py-0.5 rounded-full">+180 kcal</span>
            </div>

            <div
              onClick={() => toggleChecklist("water")}
              className="p-3 rounded-2xl border border-stone-200 hover:border-sky-200 cursor-pointer flex items-center justify-between transition-colors bg-stone-50/50"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-5 h-5 ${checklist.water ? "text-emerald-500" : "text-stone-300"}`}
                />
                <span className={`text-sm ${checklist.water ? "line-through text-stone-400" : "font-medium text-stone-700"}`}>
                  Uống đủ {(plan.recommendedWaterMl / 1000).toFixed(1)}L nước lọc trong ngày
                </span>
              </div>
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full">{waterDrunkMl}ml</span>
            </div>

            <div
              onClick={() => toggleChecklist("mindfulness")}
              className="p-3 rounded-2xl border border-stone-200 hover:border-lavender-200 cursor-pointer flex items-center justify-between transition-colors bg-stone-50/50"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-5 h-5 ${checklist.mindfulness ? "text-emerald-500" : "text-stone-300"}`}
                />
                <span className={`text-sm ${checklist.mindfulness ? "line-through text-stone-400" : "font-medium text-stone-700"}`}>
                  5 phút thở thư giãn Box Breathing giảm căng thẳng
                </span>
              </div>
              <span className="text-xs font-semibold text-lavender-600 bg-lavender-50 px-2.5 py-0.5 rounded-full">Đã xong</span>
            </div>

            <div
              onClick={() => toggleChecklist("fasting")}
              className="p-3 rounded-2xl border border-stone-200 hover:border-amber-200 cursor-pointer flex items-center justify-between transition-colors bg-stone-50/50"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-5 h-5 ${checklist.fasting ? "text-emerald-500" : "text-stone-300"}`}
                />
                <span className={`text-sm ${checklist.fasting ? "line-through text-stone-400" : "font-medium text-stone-700"}`}>
                  Không ăn vặt sau 20:00 tối
                </span>
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">Tối nay</span>
            </div>
          </div>
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
