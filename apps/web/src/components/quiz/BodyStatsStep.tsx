"use client";

import React from "react";
import { ArrowRight, Sparkles, Scale, Info } from "lucide-react";
import { calculateBMI, getBMICategory } from "@/lib/quiz-calculations";

interface BodyStatsStepProps {
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  onChangeStats: (field: "heightCm" | "currentWeightKg" | "targetWeightKg", val: number) => void;
  onNext: () => void;
}

export const BodyStatsStep: React.FC<BodyStatsStepProps> = ({
  heightCm,
  currentWeightKg,
  targetWeightKg,
  onChangeStats,
  onNext,
}) => {
  const bmi = calculateBMI(currentWeightKg, heightCm);
  const bmiCategory = getBMICategory(bmi);
  const weightDiff = targetWeightKg - currentWeightKg;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">
          Bước 4 / 5
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
          Chỉ Số Thể Trạng Hiện Tại
        </h2>
        <p className="text-stone-500 text-sm mt-1">
          Dữ liệu giúp thuật toán tính chính xác năng lượng trao đổi chất cơ bản (BMR).
        </p>
      </div>

      {/* Live BMI Radiant Display Card */}
      <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#FF5A36]" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Chỉ Số Khối Cơ Thể (BMI)
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${bmiCategory.color}`}>
            {bmiCategory.label}
          </span>
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-4xl sm:text-5xl font-black text-stone-900">
            {bmi}
          </span>
          <span className="text-xs text-stone-400 font-mono">kg/m²</span>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
          <span>{bmiCategory.advice}</span>
        </p>
      </div>

      {/* Controls Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200/90 shadow-card space-y-6 mb-8">
        {/* Height Slider */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-bold text-stone-700">Chiều cao</span>
            <span className="font-extrabold text-[#FF5A36] text-lg font-mono">{heightCm} cm</span>
          </div>
          <input
            type="range"
            min={135}
            max={210}
            value={heightCm}
            onChange={(e) => onChangeStats("heightCm", Number(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#FF5A36]"
          />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
            <span>135 cm</span>
            <span>170 cm</span>
            <span>210 cm</span>
          </div>
        </div>

        {/* Current Weight */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-bold text-stone-700">Cân nặng hiện tại</span>
            <span className="font-extrabold text-[#FF5A36] text-lg font-mono">{currentWeightKg} kg</span>
          </div>
          <input
            type="range"
            min={35}
            max={150}
            value={currentWeightKg}
            onChange={(e) => onChangeStats("currentWeightKg", Number(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#FF5A36]"
          />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
            <span>35 kg</span>
            <span>60 kg</span>
            <span>150 kg</span>
          </div>
        </div>

        {/* Target Weight */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-bold text-stone-700">Cân nặng mong muốn</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500">
                ({weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg)
              </span>
              <span className="font-extrabold text-emerald-600 text-lg font-mono">{targetWeightKg} kg</span>
            </div>
          </div>
          <input
            type="range"
            min={35}
            max={120}
            value={targetWeightKg}
            onChange={(e) => onChangeStats("targetWeightKg", Number(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
            <span>35 kg</span>
            <span>50 kg</span>
            <span>120 kg</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 rounded-full bg-[#FF5A36] hover:bg-[#E64E2B] text-white font-bold text-base transition-all duration-300 shadow-soft active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <span>Tiếp Tục</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
