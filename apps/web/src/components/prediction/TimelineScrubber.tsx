"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";

interface TimelineScrubberProps {
  currentDay: number; // 0.0 to 28.0
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
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  const isMale = archetype === "male_strength";

  // Milestones with magnetic snap threshold
  const milestones = [
    { day: 0, label: "Day 0", title: "Khởi đầu", desc: "Đo góc lệch" },
    { day: 7, label: "Day 7", title: "Thải nước", desc: "Giảm phù nề" },
    { day: 14, label: "Day 14", title: "Siết eo", desc: "Căn chỉnh cột sống" },
    { day: 21, label: "Day 21", title: "Sức bền", desc: "Tăng cơ sâu" },
    { day: 28, label: "Day 28", title: "Mục tiêu", desc: "Tối ưu hóa thể trạng" },
  ];

  // 60 FPS Smooth Auto-Play animation loop
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Advance by ~2.5 days per second (takes ~11s for a smooth 28-day cinematic scrub)
      const nextDay = currentDay + delta * 2.8;

      if (nextDay >= 28) {
        onDayChange(28);
        setIsPlaying(false);
      } else {
        onDayChange(parseFloat(nextDay.toFixed(2)));
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, currentDay, onDayChange]);

  // Handle slider scrub with magnetic snap
  const handleSliderChange = (rawVal: number) => {
    // Check if within magnetic snap zone (+/- 0.35 days of a milestone)
    let snappedVal = rawVal;
    for (const m of milestones) {
      if (Math.abs(rawVal - m.day) < 0.35) {
        snappedVal = m.day;
        break;
      }
    }
    onDayChange(parseFloat(snappedVal.toFixed(1)));
  };

  // Real-time delta calculations based on current scrub position (0 to 28)
  const progressRatio = currentDay / 28;
  const weightLossKg = (currentDay * (isMale ? 0.16 : 0.13)).toFixed(1);
  const waistReductionCm = (currentDay * (isMale ? 0.18 : 0.24)).toFixed(1);
  const kyphosisAngle = Math.max(12, Math.round(36 - progressRatio * 24));
  const weekNumber = Math.min(4, Math.floor(currentDay / 7) + 1);

  // Percentage position of the thumb for floating tooltip alignment
  const thumbPercent = (currentDay / 28) * 100;

  return (
    <div className="w-full bg-[#11100F]/95 border border-stone-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl select-none shadow-2xl relative">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#FF5A36] uppercase font-bold">
              60 FPS Kinetic Timeline Scrubber
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Dự Đoán Thay Đổi Hình Thể Từng Mi-li-mét
          </h3>
        </div>

        {/* View Angle Toggle & Play Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Angle buttons */}
          <div className="inline-flex rounded-xl bg-stone-900/90 p-1 border border-stone-800">
            <button
              onClick={() => onViewModeChange("profile")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                viewMode === "profile"
                  ? "bg-[#FF5A36] text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Góc Nghiêng (Cột Sống)
            </button>
            <button
              onClick={() => onViewModeChange("front")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                viewMode === "front"
                  ? "bg-[#FF5A36] text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Chính Diện (Eo & Cơ Lõi)
            </button>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={() => {
              if (currentDay >= 28 && !isPlaying) {
                onDayChange(0);
              }
              setIsPlaying(!isPlaying);
            }}
            className="p-2.5 rounded-xl bg-white text-stone-900 hover:bg-stone-200 transition-colors flex items-center justify-center shrink-0 active:scale-95 shadow-md"
            title={isPlaying ? "Tạm dừng" : "Xem tua nhanh 60 FPS"}
            aria-label="Play timeline"
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

      {/* Interactive Slider Track with Floating Telemetry Ticker */}
      <div className="relative py-4">
        {/* Floating Ticker Badge attaching to thumb position */}
        <div
          className="absolute -top-7 pointer-events-none transition-all duration-75 flex flex-col items-center z-20"
          style={{
            left: `calc(${thumbPercent}% + ${(15 - thumbPercent * 0.3)}px)`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="px-2.5 py-1 rounded-lg bg-stone-900/95 border border-[#FF5A36]/60 text-white font-mono text-[11px] font-bold shadow-xl flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[#FF5A36]">Day {currentDay.toFixed(1)}</span>
            <span className="text-stone-500">•</span>
            <span className="text-emerald-400">-{weightLossKg}kg</span>
            <span className="text-stone-500">•</span>
            <span className="text-sky-400">-{waistReductionCm}cm</span>
            <span className="text-stone-500">•</span>
            <span className="text-amber-400">{kyphosisAngle}° lệch</span>
          </div>
          {/* Caret pointing down */}
          <div className="w-1.5 h-1.5 bg-stone-900 border-r border-b border-[#FF5A36]/60 rotate-45 -mt-1" />
        </div>

        {/* Range Input Slider (Step 0.1 float precision) */}
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="28"
          step="0.1"
          value={currentDay}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
          className="w-full h-3 bg-stone-800 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-[#FF5A36] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/50 transition-all"
        />

        {/* Milestone Indicator Markers with Magnetic Snap Points */}
        <div className="flex justify-between items-start mt-4 text-xs">
          {milestones.map((m) => {
            const isPassed = currentDay >= m.day;
            const isCurrent = Math.abs(currentDay - m.day) < 0.5;

            return (
              <button
                key={m.day}
                onClick={() => onDayChange(m.day)}
                className={`flex flex-col items-center group transition-all text-center ${
                  isCurrent
                    ? "text-white font-bold"
                    : isPassed
                    ? "text-stone-300"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full mb-1.5 transition-all duration-200 ${
                    isCurrent
                      ? "bg-[#FF5A36] ring-4 ring-[#FF5A36]/30 scale-125"
                      : isPassed
                      ? "bg-emerald-400"
                      : "bg-stone-700 group-hover:bg-stone-500"
                  }`}
                />
                <span className="font-mono text-[11px]">{m.label}</span>
                <span className="text-[10px] hidden sm:block text-stone-300 font-semibold mt-0.5">
                  {m.title}
                </span>
                <span className="text-[9px] font-mono hidden md:block text-stone-500">
                  {m.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
