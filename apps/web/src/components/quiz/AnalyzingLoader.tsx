"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AthleticArchetype } from "@/types/quiz";

interface AnalyzingLoaderProps {
  archetype?: AthleticArchetype;
  onComplete: () => void;
}

export const AnalyzingLoader: React.FC<AnalyzingLoaderProps> = ({ 
  archetype = "female_pilates",
  onComplete 
}) => {
  const isMale = archetype === "male_strength";
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [percent, setPercent] = useState(12);

  const femaleSteps = [
    "Tính lượng calo cơ thể bạn đốt mỗi ngày...",
    "Đặt mức ăn giảm an toàn, không dưới ngưỡng tối thiểu...",
    "Bỏ các bài không hợp với chấn thương bạn đã báo...",
    "Xếp lịch Pilates và giãn cơ cho 28 ngày...",
    "Hoàn thiện dự đoán vóc dáng của bạn",
  ];

  const maleSteps = [
    "Tính lượng calo cơ thể bạn đốt mỗi ngày...",
    "Tính lượng calo và đạm cần cho mục tiêu của bạn...",
    "Bỏ các bài không hợp với chấn thương bạn đã báo...",
    "Xếp lịch đẩy, kéo, chân cho 28 ngày...",
    "Hoàn thiện dự đoán vóc dáng của bạn",
  ];

  const computationSteps = isMale ? maleSteps : femaleSteps;

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < computationSteps.length - 1) return prev + 1;
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
  }, [onComplete, computationSteps.length]);

  const activeColor = "#FF5A36";

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
      {/* Animated Circular Progress Gauge */}
      <div className="relative w-44 h-44 mb-8 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={"#F1EFE9"}
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={activeColor}
            strokeWidth="7"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * percent) / 100}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-4xl font-extrabold tracking-tight text-stone-900">
            {percent}%
          </span>
          <span className="text-xs mt-0.5 text-stone-500">
            AI Analyzing
          </span>
        </div>
      </div>

      {/* Dynamic Status Text */}
      <div className="min-h-[48px] mb-8">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
          {computationSteps[currentStepIndex]}
        </h3>
      </div>

      {/* Progress Checklist */}
      <div className="w-full p-4 rounded-2xl border space-y-2.5 text-left bg-white border-stone-200 shadow-soft">
        {computationSteps.slice(0, 4).map((text, idx) => {
          const isDone = currentStepIndex > idx || percent >= 95;
          const isCurrent = currentStepIndex === idx;

          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 text-sm transition-colors duration-300 ${
                isDone 
                  ? "text-emerald-700 font-semibold" 
                  : isCurrent 
                  ? "text-stone-900 font-medium"
                  : "text-stone-500"
              }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                isDone 
                  ? "bg-emerald-500/20 text-emerald-500" 
                  : isCurrent 
                  ? "bg-stone-700/40 text-stone-300 animate-pulse"
                  : "bg-stone-800/20 text-stone-500"
              }`}>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
              <span>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
