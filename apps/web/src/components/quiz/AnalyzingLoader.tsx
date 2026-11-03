"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface AnalyzingLoaderProps {
  onComplete: () => void;
}

const COMPUTATION_STEPS = [
  "Phân tích tỷ lệ trao đổi chất cơ bản (BMR & TDEE)...",
  "Xác định ngưỡng thâm hụt năng lượng an toàn (Deficit curve)...",
  "Khởi tạo giáo án Wall & Mat Pilates 28 ngày...",
  "Đồng bộ hóa 33 điểm xương khớp cho camera AI Live PT...",
  "Hoàn thiện lộ trình cá nhân hóa của bạn!",
];

export const AnalyzingLoader: React.FC<AnalyzingLoaderProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [percent, setPercent] = useState(12);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < COMPUTATION_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    const progressInterval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
      {/* Animated Circular Progress Gauge */}
      <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
        {/* Soft Radiant Halo */}
        <div className="absolute inset-0 rounded-full bg-peach-50/60 blur-xl animate-pulse" />

        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#F1EFE9"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#FF5A36"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * percent) / 100}
            className="transition-all duration-150 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-black text-stone-900 font-mono tracking-tight">
            {percent}%
          </span>
          <span className="text-[10px] font-bold tracking-widest text-[#FF5A36] uppercase mt-0.5">
            AI Analyzing
          </span>
        </div>
      </div>

      <h2 className="text-2xl font-black text-stone-900 tracking-tight mb-2">
        Đang Tạo Lộ Trình 28 Ngày
      </h2>
      <p className="text-stone-500 text-sm max-w-xs mb-8">
        Hệ thống AI đang tính toán giải pháp dựa trên độ tuổi và thể trạng riêng biệt của bạn.
      </p>

      {/* Checklist of calculated steps */}
      <div className="w-full space-y-2.5 text-left bg-white p-5 rounded-3xl border border-stone-200/90 shadow-card">
        {COMPUTATION_STEPS.map((stepText, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${
                isDone
                  ? "text-stone-800 font-medium"
                  : isCurrent
                  ? "text-[#FF5A36] font-bold"
                  : "text-stone-300"
              }`}
            >
              <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-[#FF5A36] animate-ping" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-200" />
                )}
              </div>
              <span className="truncate">{stepText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
