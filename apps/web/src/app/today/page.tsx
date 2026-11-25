"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Check, Lightbulb, Play, Plus, RotateCcw, ShoppingBag } from "lucide-react";
import { BrandLogo, homeUrl, siteUrl } from "@g-ai/ui";
import { LiveWorkoutStudio } from "@/components/workout/LiveWorkoutStudio";
import { FastingTimerCard } from "@/components/today/FastingTimerCard";
import { MealLoggerSection } from "@/components/today/MealLoggerSection";
import { StreakBadge } from "@/components/today/StreakBadge";
import { useTodaySession } from "@/components/today/useTodaySession";

export default function TodayDashboardPage() {
  const {
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
    isLight,
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
  } = useTodaySession();

  const remainingCalories = plan.dailyCalorieTarget - caloriesEaten + caloriesBurned;
  const waterPercent = Math.min(100, Math.round((waterDrunkMl / plan.recommendedWaterMl) * 100));
  const isOverBudget = remainingCalories < 0;
  const habitsDone = Object.values(checklist).filter(Boolean).length;
  const habitsTotal = Object.keys(checklist).length;
  const waterGoalReached = waterDrunkMl >= plan.recommendedWaterMl;
  const fastingDetail = preset.describeFasting(now);
  const showGuestBanner = sessionStatus === "guest";

  return (
    <div data-theme={theme} className="min-h-screen bg-page text-ink transition-colors duration-300">
      <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={homeUrl()}
              aria-label="G-AI – trang chủ"
              className={`flex shrink-0 items-center rounded-lg transition-opacity hover:opacity-70 ${FOCUS_RING}`}
            >
              <BrandLogo variant="horizontal" isLight={isLight} size="sm" />
            </Link>
            <div className="min-w-0 border-l border-line pl-3">
              <h1 className="truncate text-sm font-semibold leading-tight text-ink">
                {todayLabel ? `Hôm nay, ${todayLabel}` : "Hôm nay"}
              </h1>
              <p className="truncate text-xs text-ink-muted">Lộ trình 28 ngày</p>
            </div>
          </div>

          <nav aria-label="Công cụ" className="flex shrink-0 items-center">
            <Link href={siteUrl("/store")} title="Dụng cụ tập" aria-label="Dụng cụ tập" className={ICON_BUTTON}>
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
            <Link href="/quiz" title="Làm lại khảo sát" aria-label="Làm lại khảo sát" className={ICON_BUTTON}>
              <RotateCcw className="h-[18px] w-[18px]" aria-hidden />
            </Link>
          </nav>
        </div>
      </header>

      {/* Plan and account notices: one quiet strip, only when there is something to say */}
      {(!hasCustomPlan || showGuestBanner || syncError) && (
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
            {showGuestBanner && (
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
            {preset.workoutTitle}
          </h2>
          <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-ink-muted">
            {preset.workoutSubtitle}
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

          <div className="mt-7">
            <StreakBadge
              streakDays={streakDays}
              bestStreakDays={bestStreakDays}
              history7d={history7d}
              isSignedIn={Boolean(sessionUser)}
              now={now}
            />
          </div>
        </section>

        {/* Energy budget, written as the sum it is */}
        <section aria-labelledby="energy-title" className="border-t border-line pb-12 pt-8">
          <h2 id="energy-title" className="text-lg font-semibold text-ink">
            Năng lượng hôm nay
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{preset.calorieGoal.todayGoalLine}</p>
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

        {/* Meals and macros */}
        <MealLoggerSection
          isSignedIn={Boolean(sessionUser)}
          macroTarget={plan.macroSplit}
          meals={meals}
          totalCalories={totalMealCalories}
          totalProteinG={totalProteinG}
          totalCarbsG={totalCarbsG}
          totalFatG={totalFatG}
          onMealLogged={handleMealLogged}
          onMealDeleted={handleMealDeleted}
          onError={setSyncError}
        />

        {/* Biological fasting timer */}
        <FastingTimerCard
          fastingState={fastingState}
          fastingProtocol={fastingProtocol}
          fastingStartedAt={fastingStartedAt}
          busy={fastingBusy}
          onUpdateFasting={handleUpdateFasting}
        />

        {/* Habits: water, fasting and the checklist in one list */}
        <section aria-labelledby="habits-title" className="border-t border-line pb-12 pt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="habits-title" className="text-lg font-semibold text-ink">
              Thói quen hôm nay
            </h2>
            <p className="text-sm tabular-nums text-ink-muted">
              {habitsDone}/{habitsTotal} xong
            </p>
          </div>

          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            <HabitRow
              checked={checklist.workout}
              onToggle={() => toggleChecklist("workout")}
              title={preset.workoutHabitTitle}
              detail={preset.workoutHabitDetail}
            />

            <HabitRow
              checked={checklist.water}
              onToggle={() => toggleChecklist("water")}
              title={`Uống đủ ${preset.waterGoalLitres} L nước lọc trong ngày`}
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
              title="5 phút thở hộp (hít 4 giây, giữ 4, thở 4, giữ 4) để thư giãn"
            />

            <HabitRow
              checked={checklist.fasting}
              onToggle={() => toggleChecklist("fasting")}
              title={preset.fastingHabitTitle}
              detail={fastingDetail}
            />
          </ul>
        </section>

        {/* Prediction: secondary destination, kept as a single quiet row */}
        <div className="border-t border-line pt-3">
          <Link
            href="/prediction"
            className={`group -mx-3 flex items-center justify-between gap-6 rounded-2xl px-3 py-5 transition-colors duration-200 hover:bg-sunken ${FOCUS_RING}`}
          >
            <span className="min-w-0">
              <span className="block text-lg font-semibold text-ink">Dự đoán vóc dáng 28 ngày</span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
                Kéo thanh thời gian để xem lộ trình 28 ngày theo từng tuần.
              </span>
            </span>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-ink-muted transition-[transform,color] duration-200 group-hover:translate-x-1 group-hover:text-ink"
              aria-hidden
            />
          </Link>
        </div>
      </main>

      {/* Camera workout studio */}
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

// 44px: the minimum tap target.
const ICON_BUTTON = `flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-sunken hover:text-ink ${FOCUS_RING}`;

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
