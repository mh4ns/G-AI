"use client";

import React from "react";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BodyFocusArea } from "@/types/quiz";

interface FocusAreaStepProps {
  selectedAreas: BodyFocusArea[];
  onToggleArea: (areaId: BodyFocusArea) => void;
  onNext: () => void;
}

const BODY_AREAS: {
  id: BodyFocusArea;
  label: string;
  sub: string;
  emoji: string;
}[] = [
  { id: "belly", label: "Bụng & Cơ Lõi (Core)", sub: "Làm phẳng mỡ bụng dưới, siết eo đồng hồ cát", emoji: "✨" },
  { id: "glutes", label: "Mông & Hông (Glutes)", sub: "Nâng cao cơ mông, làm đầy hõm mông hai bên", emoji: "🍑" },
  { id: "thighs", label: "Đùi & Chân Thon", sub: "Đốt mỡ đùi trong, làm thon gọn bắp chân", emoji: "🦵" },
  { id: "back", label: "Lưng & Vai Gáy", sub: "Khắc phục gù lưng, mở ngực và săn chắc cơ xô", emoji: "🧘" },
  { id: "arms", label: "Cánh Tay & Bắp Tay", sub: "Làm thon gọn bắp tay, săn cơ tam đầu", emoji: "💪" },
  { id: "full_body", label: "Toàn Thân Toàn Diện", sub: "Kích hoạt toàn bộ nhóm cơ chính và tăng trao đổi chất", emoji: "⚡" },
];

export const FocusAreaStep: React.FC<FocusAreaStepProps> = ({
  selectedAreas,
  onToggleArea,
  onNext,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">
          Bước 3 / 5
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
          Khu Vực Bạn Muốn Cải Thiện?
        </h2>
        <p className="text-stone-500 text-sm mt-1">
          Chọn một hoặc nhiều vùng cơ thể để AI điều chỉnh tần suất bài tập.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        {BODY_AREAS.map((area) => {
          const isSelected = selectedAreas.includes(area.id);
          return (
            <div
              key={area.id}
              onClick={() => onToggleArea(area.id)}
              className={cn(
                "p-4 rounded-2xl border bg-white cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-soft hover:shadow-card",
                isSelected
                  ? "border-[#FF5A36] ring-2 ring-[#FF5A36]/20 bg-peach-50/20"
                  : "border-stone-200 hover:border-stone-300"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-2xl">{area.emoji}</span>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                    isSelected
                      ? "border-[#FF5A36] bg-[#FF5A36] text-white"
                      : "border-stone-300 bg-stone-50"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  {area.label}
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  {area.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={selectedAreas.length === 0}
        className={cn(
          "w-full py-4 rounded-full font-bold text-base transition-all duration-300 shadow-soft flex items-center justify-center gap-2",
          selectedAreas.length > 0
            ? "bg-[#FF5A36] hover:bg-[#E64E2B] text-white active:scale-[0.99]"
            : "bg-stone-200 text-stone-400 cursor-not-allowed"
        )}
      >
        <span>Tiếp Tục</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
