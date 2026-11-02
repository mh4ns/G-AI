"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Heart } from "lucide-react";

interface AnalyzingLoaderProps {
  onComplete: () => void;
}

export const AnalyzingLoader: React.FC<AnalyzingLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(10);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    "Đang phân tích tỷ lệ trao đổi chất cơ bản (BMR)...",
    "Tính toán ngân sách thâm hụt calo an toàn theo ngày...",
    "Lựa chọn bài tập khắc phục tình trạng mỏi lưng & siết cơ...",
    "Khởi tạo AI Companion hỗ trợ sửa tư thế qua camera...",
    "Hoàn tất lộ trình cá nhân hóa 28 ngày!",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 600);
          return 100;
        }
        const next = prev + 3;
        const step = Math.min(Math.floor((next / 100) * steps.length), steps.length - 1);
        setCurrentStepIndex(step);
        return next;
      });
    }, 90);

    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="w-full max-w-md mx-auto px-6 py-12 text-center animate-in fade-in duration-500">
      {/* Animated Heart Pulsing Icon */}
      <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-peach-200/50 animate-ping opacity-75" />
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-peach-500 to-peach-400 text-white flex items-center justify-center shadow-glow animate-pulse">
          <Heart className="w-10 h-10 fill-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-stone-800 mb-3">
        Đang xây dựng lộ trình cho bạn...
      </h2>
      <p className="text-stone-500 text-sm mb-8 h-6 transition-all duration-300">
        {steps[currentStepIndex]}
      </p>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-stone-200/70 rounded-full overflow-hidden p-0.5 mb-3 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-peach-400 via-peach-500 to-sage-500 rounded-full transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs font-semibold text-stone-400 tracking-wider">
        {progress}% HOÀN TẤT
      </div>

      {/* Sub steps completed checklist */}
      <div className="mt-8 text-left space-y-2.5 max-w-sm mx-auto">
        {steps.map((s, idx) => {
          const isDone = idx < currentStepIndex || progress === 100;
          const isCurrent = idx === currentStepIndex && progress < 100;
          return (
            <div
              key={s}
              className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                isDone ? "text-stone-700 opacity-100" : isCurrent ? "text-peach-600 font-semibold" : "text-stone-400 opacity-40"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : isCurrent ? (
                <Sparkles className="w-4 h-4 text-peach-500 shrink-0 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
              )}
              <span className="truncate">{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
