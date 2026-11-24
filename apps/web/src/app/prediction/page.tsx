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
  X,
} from "lucide-react";
import { MorphingAvatar } from "@/components/prediction/MorphingAvatar";
import { TelemetryHud } from "@/components/prediction/TelemetryHud";
import { TimelineScrubber } from "@/components/prediction/TimelineScrubber";
import { BackLink, BrandLogo, homeUrl, siteUrl } from "@g-ai/ui";
import { BodyCalibrationModal } from "@/components/prediction/BodyCalibrationModal";
import { PlanSummaryCard } from "@/components/prediction/PlanSummaryCard";
import { HotspotsFilter } from "@/components/prediction/HotspotsFilter";
import { WeeklyRoadmapAccordion } from "@/components/prediction/WeeklyRoadmapAccordion";
import { usePredictionSession } from "@/components/prediction/usePredictionSession";

export default function PredictionPage() {
  const {
    currentDay,
    setCurrentDay,
    viewMode,
    setViewMode,
    activeHotspot,
    setActiveHotspot,
    archetype,
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
    retryGeneration,
    handleUpdatePlan,
    handleCalibrationSave,
    handlePhotoUpdate,
  } = usePredictionSession();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [menuClosing, setMenuClosing] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const menuWasOpen = useRef<boolean>(false);

  // Menu dropdown (transitions.dev 05): play the close before resting.
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

  // Close the menu on Escape.
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMoreMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMoreMenuOpen]);

  // Close more menu when clicking outside.
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

  return (
    <div className="min-h-screen bg-canvas-dark text-stone-100 font-sans selection:bg-brand/30 selection:text-white">
      {/* 1. Header with Primary Action ("Bắt đầu Ngày 1") + More Menu ("⋯") */}
      <header className="sticky top-0 z-40 bg-canvas-dark/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackLink
              fallbackHref="/today"
              className="w-11 h-11 -ml-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800/60 transition-colors flex items-center justify-center"
              title="Quay lại trang trước"
              aria-label="Quay lại trang trước"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden />
            </BackLink>
            <Link href={homeUrl()} className="min-h-11 flex items-center" aria-label="G-AI – trang chủ">
              <BrandLogo isLight={false} size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Group Secondary Actions into "⋯" Menu */}
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
          {/* Gender Mismatch Warning Banner */}
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

          {/* Plan Summary Card */}
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
                  onRetryGeneration={retryGeneration}
                  isMock={!userPhoto}
                  isIllustrative={aiAvailable === false}
                  hasSidePhoto={false}
                  onOpenUploadModal={() => setIsModalOpen(true)}
                />
              </div>

              {/* Anatomical Hotspots Filter */}
              <HotspotsFilter
                activeHotspot={activeHotspot}
                onSelectHotspot={(hotspot) => setActiveHotspot(hotspot)}
              />

              {/* Disclaimer line */}
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

              {/* Realistic Telemetry */}
              <TelemetryHud
                progress={progress}
                currentDay={currentDay}
                activeHotspot={activeHotspot}
                userWeight={userStats?.weight}
                targetWeight={userStats?.targetWeight}
                dailyCalorieGapKcal={dailyCalorieGap}
                onJumpToTarget={() => setCurrentDay(28)}
              />

              {/* Week by week roadmap */}
              <WeeklyRoadmapAccordion
                currentDay={currentDay}
                onSelectDay={setCurrentDay}
              />

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

          {/* Mobile Sticky Scrubber (Fixed at bottom on screens <= 768px) */}
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
