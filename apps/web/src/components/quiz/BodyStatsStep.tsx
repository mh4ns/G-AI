"use client";

import React from "react";
import { ArrowRight, Sparkles, Scale, Info, Plus, Minus } from "lucide-react";
import { calculateBMI, getBMICategory } from "@/lib/quiz-calculations";
import { AthleticArchetype } from "@/types/quiz";

interface BodyStatsStepProps {
  archetype?: AthleticArchetype;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  onChangeStats: (field: "heightCm" | "currentWeightKg" | "targetWeightKg", val: number) => void;
  onNext: () => void;
}

export const BodyStatsStep: React.FC<BodyStatsStepProps> = ({
  archetype = "female_pilates",
  heightCm,
  currentWeightKg,
  targetWeightKg,
  onChangeStats,
  onNext,
}) => {
  const isMale = archetype === "male_strength";
  const bmi = calculateBMI(currentWeightKg, heightCm);
  const bmiCategory = getBMICategory(bmi);
  const weightDiff = targetWeightKg - currentWeightKg;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <span className={`text-xs font-bold tracking-widest uppercase ${
          isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"
        }`}>
          Bước 4 / 5 • Chỉ Số Thể Trạng
        </span>
        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 ${
          isMale ? "text-white" : "text-stone-900"
        }`}>
          Chiều Cao & Cân Nặng Mục Tiêu
        </h2>
        <p className={`text-sm mt-1 max-w-md mx-auto ${
          isMale ? "text-stone-400" : "text-stone-600"
        }`}>
          Dữ liệu giúp thuật toán tính chính xác năng lượng chuyển hóa sinh học (BMR) và chỉ số khối (BMI).
        </p>
      </div>

      {/* Live BMI Radiant Display Card */}
      <div className={`p-5 rounded-3xl border shadow-card mb-6 ${
        isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200/90"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale className={`w-4 h-4 ${isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isMale ? "text-stone-400" : "text-stone-500"
            }`}>
              Chỉ Số Khối Cơ Thể (BMI)
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${bmiCategory.color}`}>
            {bmiCategory.label}
          </span>
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <span className={`text-4xl sm:text-5xl font-black ${
            isMale ? "text-white" : "text-stone-900"
          }`}>
            {bmi}
          </span>
          <span className="text-xs text-stone-400 font-mono">kg/m²</span>
        </div>

        <p className={`text-xs leading-relaxed ${
          isMale ? "text-stone-400" : "text-stone-600"
        }`}>
          {bmiCategory.advice}
        </p>
      </div>

      {/* 3 Metric Numeric Sliders / Steppers */}
      <div className="space-y-4 mb-8">
        {/* Height */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200"
        }`}>
          <div>
            <div className={`text-xs font-bold uppercase ${isMale ? "text-stone-400" : "text-stone-500"}`}>
              Chiều Cao
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-2xl font-black ${isMale ? "text-white" : "text-stone-900"}`}>
                {heightCm}
              </span>
              <span className="text-xs text-stone-400">cm</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeStats("heightCm", Math.max(130, heightCm - 1))}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isMale ? "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700" : "bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeStats("heightCm", Math.min(220, heightCm + 1))}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isMale ? "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700" : "bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Weight */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200"
        }`}>
          <div>
            <div className={`text-xs font-bold uppercase ${isMale ? "text-stone-400" : "text-stone-500"}`}>
              Cân Nặng Hiện Tại
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-2xl font-black ${isMale ? "text-white" : "text-stone-900"}`}>
                {currentWeightKg}
              </span>
              <span className="text-xs text-stone-400">kg</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeStats("currentWeightKg", Math.max(35, currentWeightKg - 1))}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isMale ? "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700" : "bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeStats("currentWeightKg", Math.min(180, currentWeightKg + 1))}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isMale ? "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700" : "bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Target Weight */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200"
        }`}>
          <div>
            <div className={`text-xs font-bold uppercase ${isMale ? "text-stone-400" : "text-stone-500"}`}>
              Cân Nặng Mục Tiêu
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-2xl font-black ${isMale ? "text-white" : "text-stone-900"}`}>
                {targetWeightKg}
              </span>
              <span className="text-xs text-stone-400">kg</span>
              {weightDiff !== 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  weightDiff > 0 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {weightDiff > 0 ? `+${weightDiff} kg tăng cơ` : `${weightDiff} kg giảm mỡ`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeStats("targetWeightKg", Math.max(35, targetWeightKg - 1))}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isMale ? "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700" : "bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeStats("targetWeightKg", Math.min(180, targetWeightKg + 1))}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isMale ? "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700" : "bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          className={`px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-95 ${
            isMale
              ? "bg-[#FF5A36] hover:bg-[#ff461e] text-white shadow-[#FF5A36]/25"
              : "bg-[#FF6B4A] hover:bg-[#ff5530] text-white shadow-[#FF6B4A]/25"
          }`}
        >
          <span>Tiếp Tục</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
