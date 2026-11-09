"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export interface TimelineMilestone {
  day: number;
  label: string;
  stageTitle: string;
  percent: number; // 0, 25, 50, 100
}

export const MILESTONES_4_STEPS: TimelineMilestone[] = [
  { day: 0, label: "Ngày 0", stageTitle: "Khởi điểm", percent: 0 },
  { day: 7, label: "Tuần 1", stageTitle: "Kích hoạt", percent: 25 },
  { day: 14, label: "Tuần 2", stageTitle: "Tái căn chỉnh", percent: 50 },
  { day: 28, label: "Tuần 4", stageTitle: "Vóc dáng mới", percent: 100 },
];

const STEP_DAYS = [0, 7, 14, 28];

interface TimelineScrubberProps {
  currentDay: number; // 0, 7, 14, 28
  onDayChange: (day: number) => void;
  archetype?: "female_pilates" | "male_strength";
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentDay,
  onDayChange,
  archetype = "female_pilates",
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Find nearest step index (0, 1, 2, 3)
  const activeIndex = STEP_DAYS.reduce((closestIdx, day, idx) => {
    return Math.abs(day - currentDay) < Math.abs(STEP_DAYS[closestIdx] - currentDay) ? idx : closestIdx;
  }, 0);

  // Check user preference for reduced motion
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Auto-play cycling through the 4 milestone weeks every ~1.2s
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onDayChange(STEP_DAYS[(activeIndex + 1) % STEP_DAYS.length]);
      if (activeIndex === STEP_DAYS.length - 1) {
        setIsPlaying(false);
      }
    }, isReducedMotion ? 2000 : 1200);

    return () => clearInterval(interval);
  }, [isPlaying, activeIndex, onDayChange, isReducedMotion]);

  // Snap to nearest milestone function
  const snapToNearest = useCallback((rawDay: number) => {
    const nearest = STEP_DAYS.reduce((prev, curr) => {
      return Math.abs(curr - rawDay) < Math.abs(prev - rawDay) ? curr : prev;
    }, 0);
    onDayChange(nearest);
  }, [onDayChange]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Space for Play)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIdx = Math.max(0, activeIndex - 1);
      onDayChange(STEP_DAYS[prevIdx]);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIdx = Math.min(STEP_DAYS.length - 1, activeIndex + 1);
      onDayChange(STEP_DAYS[nextIdx]);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setIsPlaying((prev) => !prev);
    }
  };

  // Convert current day (0 -> 28) into track percentage (0% -> 100%)
  const getProgressPercent = (day: number): number => {
    if (day <= 0) return 0;
    if (day <= 7) return (day / 7) * 25;
    if (day <= 14) return 25 + ((day - 7) / 7) * 25;
    return 50 + ((day - 14) / 14) * 50;
  };

  const progressPercent = Math.min(100, Math.max(0, getProgressPercent(currentDay)));

  // Aria text in Vietnamese
  const activeMilestone = MILESTONES_4_STEPS[activeIndex] || MILESTONES_4_STEPS[0];
  const ariaValueText = `${activeMilestone.label}: ${activeMilestone.stageTitle} (Ngày ${currentDay} trên 28)`;

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full bg-[#11100F] border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-xl select-none shadow-xl focus:outline-none focus:border-[#FF5A36]/60 transition-colors font-sans"
      role="region"
      aria-label="Thanh điều khiển dòng thời gian chuyển hóa 28 ngày"
    >
      {/* Scrubber Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-[#FF5A36] uppercase tracking-normal">
          Dòng thời gian chuyển hóa 28 ngày
        </span>
        <span className="text-xs text-stone-300 font-medium">
          Mốc: <strong className="text-white font-mono">{activeMilestone.label}</strong> ({activeMilestone.stageTitle})
        </span>
      </div>

      {/* Main Unified Scrubber: Play Button + Thick Track with Nodes & Labels */}
      <div className="flex items-center gap-3 sm:gap-4 pt-1 pb-4">
        {/* Play/Pause Cycle Button placed directly beside the slider track */}
        <button
          onClick={() => {
            if (currentDay >= 28 && !isPlaying) {
              onDayChange(0);
            }
            setIsPlaying(!isPlaying);
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FF5A36] hover:bg-[#e04825] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FF5A36]/30 transition-all active:scale-95"
          title={isPlaying ? "Tạm dừng" : "Tự động phát qua các tuần (1.2s/tuần)"}
          aria-label={isPlaying ? "Tạm dừng phát" : "Tự động phát qua 4 mốc tuần"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : currentDay >= 28 ? (
            <RotateCcw className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        {/* Thick Interactive Track (>= 8px, orange progress, >= 28px thumb, snap to milestone) */}
        <div className="flex-1 relative" ref={trackRef}>
          {/* Base Track (Thick >= 10px) */}
          <div className="relative h-2.5 sm:h-3 w-full bg-stone-800 rounded-full overflow-visible">
            {/* Active Orange Passed Fill */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#FF5A36] to-[#FF6B4A] rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />

            {/* 4 Discrete Milestone Nodes directly ON the track */}
            {MILESTONES_4_STEPS.map((m, idx) => {
              const isSelected = activeIndex === idx;
              const isPassed = currentDay >= m.day;

              return (
                <button
                  key={m.day}
                  type="button"
                  onClick={() => onDayChange(m.day)}
                  style={{ left: `${m.percent}%` }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-1 group focus:outline-none"
                  aria-label={`Chuyển tới ${m.label}: ${m.stageTitle}`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                      isSelected
                        ? "bg-white border-[#FF5A36] scale-125 ring-4 ring-[#FF5A36]/40"
                        : isPassed
                        ? "bg-[#FF5A36] border-white/80"
                        : "bg-stone-700 border-stone-900 group-hover:bg-stone-500"
                    }`}
                  />
                </button>
              );
            })}

            {/* Hidden native accessible range input over the track */}
            <input
              type="range"
              min="0"
              max="28"
              step="1"
              value={currentDay}
              onChange={(e) => onDayChange(Number(e.target.value))}
              onMouseUp={() => snapToNearest(currentDay)}
              onTouchEnd={() => snapToNearest(currentDay)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              aria-label="Thanh trượt dòng thời gian 28 ngày"
              aria-valuemin={0}
              aria-valuemax={28}
              aria-valuenow={currentDay}
              aria-valuetext={ariaValueText}
            />

            {/* Large Thumb (>= 28px) with radiant halo ring */}
            <div
              style={{ left: `${progressPercent}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF5A36] border-2 border-white shadow-lg shadow-[#FF5A36]/50 ring-4 ring-[#FF5A36]/30 flex items-center justify-center pointer-events-none transition-all duration-150 z-10"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          {/* 4 Milestone Labels directly aligned below the track */}
          <div className="relative w-full mt-3 h-7">
            {MILESTONES_4_STEPS.map((m, idx) => {
              const isSelected = activeIndex === idx;

              return (
                <button
                  key={m.day}
                  type="button"
                  onClick={() => onDayChange(m.day)}
                  style={{ left: `${m.percent}%` }}
                  className={`absolute -translate-x-1/2 flex flex-col items-center transition-colors text-center ${
                    isSelected ? "text-white" : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <span className={`text-xs ${isSelected ? "font-bold text-[#FF5A36]" : "font-medium"}`}>
                    {m.label}
                  </span>
                  <span className="text-[11px] text-stone-400 hidden sm:inline whitespace-nowrap">
                    {m.stageTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
