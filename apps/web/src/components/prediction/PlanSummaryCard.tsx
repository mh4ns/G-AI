"use client";

import React, { useState } from "react";
import { Dumbbell, SlidersHorizontal, X, Loader2, Sparkles, Utensils } from "lucide-react";
import { SEMANTIC_COLORS } from "@/lib/design-tokens";

export interface PlanConfig {
  workoutType: string;
  weeklySets: string;
  dietStyle: string;
  archetype: "female_pilates" | "male_strength";
}

interface PlanSummaryCardProps {
  currentPlan: PlanConfig;
  onUpdatePlan: (newPlan: PlanConfig) => Promise<void>;
  isRecalculating?: boolean;
}

export const PlanSummaryCard: React.FC<PlanSummaryCardProps> = ({
  currentPlan,
  onUpdatePlan,
  isRecalculating = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState(currentPlan.workoutType);
  const [weeklySets, setWeeklySets] = useState(currentPlan.weeklySets);
  const [archetype, setArchetype] = useState<"female_pilates" | "male_strength">(
    currentPlan.archetype
  );
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    setWorkoutType(currentPlan.workoutType);
    setWeeklySets(currentPlan.weeklySets);
    setArchetype(currentPlan.archetype);
    setIsOpen(true);
  };

  const handleApply = async () => {
    // Check if configuration actually changed
    const isUnchanged =
      workoutType === currentPlan.workoutType &&
      weeklySets === currentPlan.weeklySets &&
      archetype === currentPlan.archetype;

    if (isUnchanged) {
      setIsOpen(false);
      return;
    }

    setSaving(true);
    await onUpdatePlan({
      workoutType,
      weeklySets,
      dietStyle: currentPlan.dietStyle,
      archetype,
    });
    setSaving(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* 1. Compact Plan Summary Banner */}
      <div className="w-full mb-5 p-3.5 sm:p-4 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: SEMANTIC_COLORS.primaryBg,
              borderColor: SEMANTIC_COLORS.primaryBorder,
            }}
          >
            {isRecalculating ? (
              <Loader2 className="w-4 h-4 text-brand animate-spin" />
            ) : (
              <Dumbbell className="w-4 h-4 text-brand" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-300">
                Kế hoạch mô phỏng vóc dáng:
              </span>
              {isRecalculating && (
                <span className="text-xs font-semibold text-brand animate-pulse">
                  Đang tính toán lại...
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-200 font-medium leading-snug mt-0.5">
              {currentPlan.weeklySets} · {currentPlan.dietStyle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpen}
          disabled={isRecalculating}
          className="self-start sm:self-auto min-h-11 inline-flex items-center gap-1.5 px-4 rounded-full bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 hover:text-white text-xs font-medium border border-stone-700/80 transition-all flex items-center gap-1.5 active:scale-95 shrink-0 shadow-sm disabled:opacity-50"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand" />
          <span>Đổi kế hoạch</span>
        </button>
      </div>

      {/* 2. Plan Customization Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#141210] border border-stone-800 p-6 sm:p-7 shadow-2xl text-stone-100">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/15 border border-brand/30 text-xs font-semibold text-brand">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tùy chỉnh kế hoạch</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">
                Đổi Kế Hoạch Sinh Dự Đoán
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Khi đổi bài tập hoặc dinh dưỡng, mô hình sẽ tính toán lại lộ trình chuyển hóa và kết quả hình thể 28 ngày.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Option 1: Workout Archetype */}
              <div>
                <label className="text-stone-300 font-semibold block mb-2">
                  Trường phái bài tập trọng tâm
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setArchetype("female_pilates");
                      setWorkoutType("Pilates & Siết Cơ Lõi");
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      archetype === "female_pilates"
                        ? "bg-brand/15 border-brand text-white"
                        : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <div className="font-bold text-sm mb-0.5 text-white">Pilates siết cơ lõi</div>
                    <p className="text-xs text-stone-400">Siết eo thon, phẳng bụng, thẳng lưng</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setArchetype("male_strength");
                      setWorkoutType("Calisthenics & Cơ Xô");
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      archetype === "male_strength"
                        ? "bg-brand/15 border-brand text-white"
                        : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <div className="font-bold text-sm mb-0.5 text-white">Calisthenics cơ xô</div>
                    <p className="text-xs text-stone-400">Mở rộng ngực vai, săn chắc cơ lưng</p>
                  </button>
                </div>
              </div>

              {/* Option 2: Volume / Sets per week */}
              <div>
                <label className="text-stone-300 font-semibold block mb-2">
                  Khối lượng bài tập / tuần
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    "12 set bài tập / tuần (Nhẹ nhàng)",
                    "18 set bài tập / tuần (Tiêu chuẩn)",
                    "24 set bài tập / tuần (Đẩy nhanh)",
                  ].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setWeeklySets(val)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        weeklySets === val
                          ? "bg-white/10 border-white text-white font-semibold"
                          : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      <span>{val}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calories come from the quiz plan; nothing here changes them. */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-stone-900 border border-stone-800">
                <Utensils className="w-4 h-4 mt-0.5 shrink-0 text-brand" aria-hidden />
                <p className="text-stone-300 leading-relaxed">
                  <span className="font-semibold text-stone-100">Lượng calo:</span> {currentPlan.dietStyle}. Con số
                  này lấy từ khảo sát; làm lại khảo sát nếu cân nặng hoặc mục tiêu của bạn thay đổi.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stone-800/80">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-full text-xs text-stone-400 hover:text-white transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={saving}
                className="px-5 py-2 rounded-full bg-brand-action hover:bg-brand-action-hover text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang áp dụng...</span>
                  </>
                ) : (
                  <span>Áp dụng kế hoạch</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
