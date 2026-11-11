"use client";

import React, { useEffect, useId, useState } from "react";
import { ArrowRight, Scale, Plus, Minus } from "lucide-react";
import { calculateBMI, getBMICategory, healthyWeightRangeKg } from "@/lib/quiz-calculations";

interface BodyStatsStepProps {
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  onChangeStats: (field: "heightCm" | "currentWeightKg" | "targetWeightKg", val: number) => void;
  onNext: () => void;
}

interface NumberFieldProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Spoken names for the stepper buttons, e.g. "chiều cao". */
  spokenName: string;
  describedBy?: string;
  badge?: React.ReactNode;
}

/**
 * A number the person can type, with ±1 buttons for small changes. Typing is
 * kept as a draft and only committed (and clamped) on blur or Enter, so a
 * half-typed "1" never jumps the value to the minimum.
 */
function NumberField({ label, unit, value, min, max, onChange, spokenName, describedBy, badge }: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = Math.round(parseFloat(draft.replace(",", ".")));
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
    else setDraft(String(value));
  };

  const stepButton =
    "w-11 h-11 rounded-xl border bg-stone-100 border-stone-200 text-stone-800 hover:bg-stone-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="p-4 rounded-2xl border bg-white border-stone-200 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-stone-700">
          {label}
        </label>
        <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ""))}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            aria-describedby={describedBy}
            // Width follows the digits so the unit sits right after the number.
            style={{ width: `${Math.max(2, draft.length) + 1}ch` }}
            className="h-11 text-2xl font-extrabold text-stone-950 bg-transparent rounded-md -mx-1 px-1 border border-transparent hover:border-stone-200 focus:border-brand-action focus:outline-none"
          />
          <span className="text-sm text-stone-500">{unit}</span>
          {badge}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Giảm ${spokenName} 1 ${unit}`}
          aria-describedby={describedBy}
          className={stepButton}
        >
          <Minus className="w-4 h-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Tăng ${spokenName} 1 ${unit}`}
          className={stepButton}
        >
          <Plus className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
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
  const healthy = healthyWeightRangeKg(heightCm);
  const atTargetFloor = targetWeightKg <= healthy.min;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-stone-950">
          Chiều cao & cân nặng mục tiêu
        </h1>
        <p className="text-sm mt-1 max-w-md mx-auto text-stone-600">
          Dùng để ước tính năng lượng cơ bản (BMR) và chỉ số khối cơ thể (BMI) của bạn.
        </p>
      </div>

      <div className="p-5 rounded-3xl border shadow-card mb-6 bg-white border-stone-200" aria-live="polite">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-brand-action" aria-hidden />
            <span className="text-sm font-semibold text-stone-700">Chỉ số khối cơ thể (BMI)</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${bmiCategory.color}`}>
            {bmiCategory.label}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl sm:text-5xl font-extrabold text-stone-950">{bmi}</span>
          <span className="text-sm text-stone-500">kg/m²</span>
        </div>

        <p className="text-sm leading-relaxed text-stone-600">{bmiCategory.advice}</p>
      </div>

      <div className="space-y-3 mb-8">
        <NumberField
          label="Chiều cao"
          unit="cm"
          spokenName="chiều cao"
          value={heightCm}
          min={130}
          max={220}
          onChange={(v) => onChangeStats("heightCm", v)}
        />
        <NumberField
          label="Cân nặng hiện tại"
          unit="kg"
          spokenName="cân nặng hiện tại"
          value={currentWeightKg}
          min={35}
          max={180}
          onChange={(v) => onChangeStats("currentWeightKg", v)}
        />
        <NumberField
          label="Cân nặng mục tiêu"
          unit="kg"
          spokenName="cân nặng mục tiêu"
          value={targetWeightKg}
          min={healthy.min}
          max={180}
          describedBy="target-weight-range"
          onChange={(v) => onChangeStats("targetWeightKg", v)}
          badge={
            weightDiff !== 0 && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  weightDiff > 0 ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
                }`}
              >
                {weightDiff > 0 ? `tăng ${weightDiff} kg` : `giảm ${Math.abs(weightDiff)} kg`}
              </span>
            )
          }
        />

        <p id="target-weight-range" aria-live="polite" className="px-1 text-sm leading-relaxed text-stone-600">
          {atTargetFloor
            ? `Với chiều cao ${heightCm} cm, ${healthy.min} kg là mức thấp nhất còn trong vùng cân nặng khỏe mạnh (BMI 18,5). G-AI không lập lộ trình xuống thấp hơn.`
            : `Vùng cân nặng khỏe mạnh với chiều cao ${heightCm} cm: ${healthy.min}–${healthy.max} kg (BMI 18,5–24,9).`}
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          className="min-h-12 px-8 rounded-full font-semibold text-base flex items-center gap-2 bg-brand-action hover:bg-brand-action-hover text-white transition-colors active:translate-y-px"
        >
          <span>Tiếp tục</span>
          <ArrowRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};
