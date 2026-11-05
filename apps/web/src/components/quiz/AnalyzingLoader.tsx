"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
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
    "Phân tích tỷ lệ trao đổi chất cơ bản (BMR & TDEE phụ nữ)...",
    "Thiết lập đường cong thâm hụt năng lượng an toàn (Deficit curve)...",
    "Kiểm tra tiền sử cột sống & loại trừ động tác nén thắt lưng...",
    "Khởi tạo giáo án Pilates & Kéo giãn phục hồi 28 ngày...",
    "Hoàn thiện mô hình Digital Twin cá nhân hóa của bạn!",
  ];

  const maleSteps = [
    "Phân tích chuyển hóa năng lượng cơ bắp (BMR & TDEE nam giới)...",
    "Tính toán tỷ lệ Calorie Surplus & hàm lượng Protein Hypertrophy...",
    "Quét và bảo vệ khớp gối & cột sống khỏi rủi ro nén trục nặng...",
    "Khởi tạo lịch phân bổ Push / Pull / Legs & Calisthenics 28 ngày...",
    "Hoàn thiện mô hình Digital Twin sức mạnh của bạn!",
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

  const activeColor = isMale ? "#FF5A36" : "#FF6B4A";

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
      {/* Animated Circular Progress Gauge */}
      <div className="relative w-44 h-44 mb-8 flex items-center justify-center">
        {/* Soft Radiant Halo */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl animate-pulse opacity-40" 
          style={{ backgroundColor: activeColor }}
        />

        <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={isMale ? "#272522" : "#F1EFE9"}
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
          <span className={`text-4xl font-black font-mono tracking-tight ${
            isMale ? "text-white" : "text-stone-900"
          }`}>
            {percent}%
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase mt-0.5 text-stone-400">
            AI Analyzing
          </span>
        </div>
      </div>

      {/* Dynamic Status Text */}
      <div className="min-h-[48px] mb-8">
        <h3 className={`text-base sm:text-lg font-bold tracking-tight animate-fade-in ${
          isMale ? "text-white" : "text-stone-900"
        }`}>
          {computationSteps[currentStepIndex]}
        </h3>
      </div>

      {/* Progress Checklist */}
      <div className={`w-full p-4 rounded-2xl border space-y-2.5 text-left ${
        isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200 shadow-soft"
      }`}>
        {computationSteps.slice(0, 4).map((text, idx) => {
          const isDone = currentStepIndex > idx || percent >= 95;
          const isCurrent = currentStepIndex === idx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 text-xs transition-colors duration-300 ${
                isDone 
                  ? "text-emerald-500 font-semibold" 
                  : isCurrent 
                  ? isMale ? "text-white font-medium" : "text-stone-900 font-medium"
                  : "text-stone-400"
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
              <span className="truncate">{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
