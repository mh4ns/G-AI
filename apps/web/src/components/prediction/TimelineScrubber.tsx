"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Eye } from "lucide-react";

interface TimelineScrubberProps {
  currentDay: number;
  onDayChange: (day: number) => void;
  viewMode: "profile" | "front" | "threeQuarter";
  onViewModeChange: (mode: "profile" | "front" | "threeQuarter") => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentDay,
  onDayChange,
  viewMode,
  onViewModeChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play animation loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onDayChange((prev) => {
          if (prev >= 28) {
            setIsPlaying(false);
            return 28;
          }
          return prev + 1;
        });
      }, 250); // Advance 1 day every 250ms
    }
    return () => clearInterval(interval);
  }, [isPlaying, onDayChange]);

  const milestones = [
    { day: 0, label: "Day 0", title: "Khởi đầu" },
    { day: 7, label: "Day 7", title: "Thải nước" },
    { day: 14, label: "Day 14", title: "Siết eo" },
    { day: 21, label: "Day 21", title: "Sức bền" },
    { day: 28, label: "Day 28", title: "Mục tiêu" },
  ];

  return (
    <div className="w-full bg-stone-900/90 border border-stone-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md select-none">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-[#FF5A36] uppercase font-bold">
            Interactive Timeline Scrubber
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Dự Đoán Thay Đổi Hình Thể (28 Ngày)
          </h3>
        </div>

        {/* View Angle Toggle & Play Buttons */}
        <div className="flex items-center gap-2">
          {/* Angle buttons */}
          <div className="inline-flex rounded-xl bg-stone-800/80 p-1 border border-stone-700">
            <button
              onClick={() => onViewModeChange("profile")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "profile"
                  ? "bg-[#FF5A36] text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Góc Nghiêng (Cột Sống)
            </button>
            <button
              onClick={() => onViewModeChange("front")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "front"
                  ? "bg-[#FF5A36] text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Chính Diện (Eo Thon)
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
            className="p-2.5 rounded-xl bg-white text-stone-900 hover:bg-stone-200 transition-colors flex items-center justify-center shrink-0"
            title={isPlaying ? "Tạm dừng" : "Xem tua nhanh biến đổi"}
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

      {/* Slider Input with Custom Range Styling */}
      <div className="relative py-2">
        <input
          type="range"
          min="0"
          max="28"
          step="1"
          value={currentDay}
          onChange={(e) => onDayChange(parseInt(e.target.value, 10))}
          className="w-full h-2.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#FF5A36] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40"
        />

        {/* Milestone Indicator Markers */}
        <div className="flex justify-between items-center mt-3 text-xs">
          {milestones.map((m) => (
            <button
              key={m.day}
              onClick={() => onDayChange(m.day)}
              className={`flex flex-col items-center group transition-colors ${
                currentDay === m.day
                  ? "text-white font-bold"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full mb-1 transition-all ${
                  currentDay >= m.day
                    ? currentDay === m.day
                      ? "bg-[#FF5A36] ring-4 ring-[#FF5A36]/25 scale-125"
                      : "bg-emerald-400"
                    : "bg-stone-700"
                }`}
              />
              <span className="font-mono text-[11px]">{m.label}</span>
              <span className="text-[10px] hidden sm:inline text-stone-400">
                {m.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
