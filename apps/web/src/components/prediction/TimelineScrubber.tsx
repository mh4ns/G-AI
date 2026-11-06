"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export interface TimelineMilestone {
  day: number;
  weekLabel: string;
  stageTitle: string;
  focusDesc: string;
  weightDelta: string;
  waistDelta: string;
  postureScore: number;
  postureState: string;
}

export const MILESTONES_4_STEPS: TimelineMilestone[] = [
  {
    day: 0,
    weekLabel: "Ngày 0",
    stageTitle: "Khởi điểm",
    focusDesc: "Xác định trục cơ thể, nhận biết thói quen gù lưng & võng eo",
    weightDelta: "0.0 kg",
    waistDelta: "0.0 cm",
    postureScore: 55,
    postureState: "Cần cải thiện (Đổ thân trước)",
  },
  {
    day: 7,
    weekLabel: "Tuần 1",
    stageTitle: "Kích hoạt",
    focusDesc: "Đánh thức cơ hoành, giảm tích nước & giảm 40% mỏi gáy",
    weightDelta: "-0.6 kg",
    waistDelta: "-1.0 cm",
    postureScore: 66,
    postureState: "Đang thích nghi (Cổ vươn nhẹ)",
  },
  {
    day: 14,
    weekLabel: "Tuần 2",
    stageTitle: "Tái căn chỉnh",
    focusDesc: "Kích hoạt cơ dựng sống, siết cơ bụng sâu & phẳng bụng dưới",
    weightDelta: "-1.4 kg",
    waistDelta: "-1.8 cm",
    postureScore: 76,
    postureState: "Tiến triển tốt (Lưng thẳng tự nhiên)",
  },
  {
    day: 28,
    weekLabel: "Tuần 4",
    stageTitle: "Vóc dáng mới",
    focusDesc: "Trục cơ thể cân bằng vững vàng, vai mở mềm mại & eo thon gọn",
    weightDelta: "-2.1 kg",
    waistDelta: "-3.0 cm",
    postureScore: 88,
    postureState: "Cân bằng vững vàng (Chuẩn dáng)",
  },
];

interface TimelineScrubberProps {
  currentDay: number; // 0, 7, 14, 28
  onDayChange: (day: number) => void;
  viewMode: "profile" | "front" | "threeQuarter";
  onViewModeChange: (mode: "profile" | "front" | "threeQuarter") => void;
  archetype?: "female_pilates" | "male_strength";
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentDay,
  onDayChange,
  viewMode,
  onViewModeChange,
  archetype = "female_pilates",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Find active step index (0, 1, 2, 3)
  const stepDays = [0, 7, 14, 28];
  const activeIndex = stepDays.reduce((closestIdx, day, idx) => {
    return Math.abs(day - currentDay) < Math.abs(stepDays[closestIdx] - currentDay) ? idx : closestIdx;
  }, 0);

  const activeMilestone = MILESTONES_4_STEPS[activeIndex] || MILESTONES_4_STEPS[0];

  // Auto-play cycling through the 4 milestone weeks
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onDayChange(stepDays[(activeIndex + 1) % stepDays.length]);
      if (activeIndex === stepDays.length - 1) {
        setIsPlaying(false);
      }
    }, 2400);

    return () => clearInterval(interval);
  }, [isPlaying, activeIndex, onDayChange]);

  const handleSliderStep = (stepIdx: number) => {
    const targetDay = stepDays[stepIdx] ?? 0;
    onDayChange(targetDay);
  };

  return (
    <div className="w-full bg-[#11100F] border border-stone-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl select-none shadow-2xl">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#FF5A36] uppercase font-bold">
            Tiến Trình Chuyển Hóa 4 Tuần
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
            Kéo để xem thay đổi qua 4 tuần
          </h3>
        </div>

        {/* View Angle & Play Controls */}
        <div className="flex items-center gap-2.5">
          {/* Angle buttons */}
          <div className="inline-flex rounded-xl bg-stone-900 p-1 border border-stone-800 text-xs font-mono">
            <button
              onClick={() => onViewModeChange("profile")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                viewMode === "profile"
                  ? "bg-[#FF5A36] text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Góc Nghiêng (Cột Sống)
            </button>
            <button
              onClick={() => onViewModeChange("front")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                viewMode === "front"
                  ? "bg-[#FF5A36] text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Chính Diện (Vòng Eo)
            </button>
          </div>

          {/* Play/Pause Cycle Button */}
          <button
            onClick={() => {
              if (currentDay >= 28 && !isPlaying) {
                onDayChange(0);
              }
              setIsPlaying(!isPlaying);
            }}
            className="p-2.5 rounded-xl bg-white text-stone-900 hover:bg-stone-200 transition-colors flex items-center justify-center shrink-0 active:scale-95 shadow-md"
            title={isPlaying ? "Tạm dừng" : "Tự động tua qua các tuần"}
            aria-label="Tự động chuyển tuần"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-stone-900 fill-stone-900" />
            ) : currentDay >= 28 ? (
              <RotateCcw className="w-4 h-4 text-stone-900" />
            ) : (
              <Play className="w-4 h-4 text-stone-900 fill-stone-900 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Snap-to-Step Interactive Track */}
      <div className="relative py-4">
        {/* Step Range Input */}
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          value={activeIndex}
          onChange={(e) => handleSliderStep(parseInt(e.target.value, 10))}
          className="w-full h-3 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#FF5A36] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40"
        />

        {/* 4 Discrete Milestone Nodes */}
        <div className="grid grid-cols-4 gap-2 mt-4 text-center">
          {MILESTONES_4_STEPS.map((m, idx) => {
            const isSelected = activeIndex === idx;
            const isPassed = activeIndex >= idx;

            return (
              <button
                key={m.day}
                onClick={() => handleSliderStep(idx)}
                className={`flex flex-col items-center group transition-all p-2 rounded-2xl ${
                  isSelected
                    ? "bg-stone-900/90 border border-stone-700 shadow-lg text-white"
                    : "hover:bg-stone-900/40 text-stone-400"
                }`}
              >
                {/* Milestone Node Dot */}
                <div
                  className={`w-3.5 h-3.5 rounded-full mb-2 transition-all duration-300 ${
                    isSelected
                      ? "bg-[#FF5A36] ring-4 ring-[#FF5A36]/30 scale-125"
                      : isPassed
                      ? "bg-emerald-400"
                      : "bg-stone-700 group-hover:bg-stone-500"
                  }`}
                />

                <span className={`font-mono text-xs ${isSelected ? "text-white font-bold" : "text-stone-300"}`}>
                  {m.weekLabel}
                </span>

                <span className={`text-[11px] font-medium mt-0.5 ${isSelected ? "text-[#FF5A36]" : "text-stone-400"}`}>
                  {m.stageTitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Milestone Detail Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-stone-300 font-bold">{activeMilestone.weekLabel} • {activeMilestone.stageTitle}</span>
          </div>
          <div className="flex items-center gap-3 text-stone-400">
            <span>Cân nặng: <strong className="text-emerald-400">{activeMilestone.weightDelta}</strong></span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Vòng eo: <strong className="text-sky-400">{activeMilestone.waistDelta}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
