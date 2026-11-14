"use client";

import React from "react";
import { Check, ArrowRight, Home, Dumbbell } from "lucide-react";
import { BodyFocusArea, AthleticArchetype, EquipmentAccess } from "@/types/quiz";

interface FocusAreaStepProps {
  archetype?: AthleticArchetype;
  selectedAreas: BodyFocusArea[];
  equipmentAccess: EquipmentAccess;
  onToggleArea: (areaId: BodyFocusArea) => void;
  onSelectEquipment: (equipment: EquipmentAccess) => void;
  onNext: () => void;
}

export const FocusAreaStep: React.FC<FocusAreaStepProps> = ({
  archetype = "female_pilates",
  selectedAreas,
  equipmentAccess,
  onToggleArea,
  onSelectEquipment,
  onNext,
}) => {
  const isMale = archetype === "male_strength";

  const femaleAreas: { id: BodyFocusArea; label: string; sub: string}[] = [
    { id: "belly", label: "Bụng & cơ lõi", sub: "Bụng dưới gọn, eo săn chắc" },
    { id: "glutes", label: "Mông & hông", sub: "Cơ mông chắc và tròn hơn" },
    { id: "thighs", label: "Đùi & chân thon", sub: "Đùi trong và bắp chân thon gọn hơn" },
    { id: "back", label: "Lưng & cột sống", sub: "Khắc phục gù lưng, mở ngực và kéo giãn đốt sống" },
    { id: "arms", label: "Cánh tay & vai thon", sub: "Làm thon gọn bắp tay, săn chắc cơ vai" },
    { id: "full_body", label: "Toàn thân", sub: "Tập đủ các nhóm cơ chính, đốt nhiều calo hơn" },
  ];

  const maleAreas: { id: BodyFocusArea; label: string; sub: string}[] = [
    { id: "chest", label: "Ngực", sub: "Ngực dày và rộng hơn" },
    { id: "back", label: "Lưng", sub: "Lưng rộng, chắc và đứng thẳng hơn" },
    { id: "arms", label: "Vai & tay", sub: "Vai tròn, bắp tay trước và tay sau to hơn" },
    { id: "belly", label: "Bụng", sub: "Giảm mỡ bụng, cơ bụng rõ nét hơn" },
    { id: "thighs", label: "Đùi & bắp chân", sub: "Chân to khỏe, đứng trụ vững hơn" },
    { id: "full_body", label: "Toàn thân", sub: "Bài nhiều khớp cùng lúc như squat, chống đẩy, kéo xà" },
  ];

  const bodyAreas = isMale ? maleAreas : femaleAreas;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Step Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-stone-900">
          Vùng cơ thể & không gian bạn tập
        </h1>
        <p className="text-sm mt-1 max-w-md mx-auto text-stone-600">
          Chọn các vùng ưu tiên và không gian bạn có để AI xây dựng chuỗi bài tập tương thích.
        </p>
      </div>

      {/* 1. Equipment Selector */}
      <div className="mb-8">
        <label className="block text-xs font-bold mb-3 text-stone-700">
          Không gian & dụng cụ bạn tập:
        </label>
        <div className="grid grid-cols-2 gap-3.5">
          <button type="button" aria-pressed={equipmentAccess === "home"}
            onClick={() => onSelectEquipment("home")}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 ${
              equipmentAccess === "home"
                ? "border-brand bg-[#FFF5F0] ring-2 ring-brand/20 shadow-md"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              equipmentAccess === "home"
                ? "bg-brand-action text-white"
                : "bg-stone-100 text-stone-600"
            }`}>
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-stone-900">
                Tại nhà
              </div>
              <div className="text-xs text-stone-600">
                Thảm & Dây kháng lực
              </div>
            </div>
          </button>

          <button type="button" aria-pressed={equipmentAccess === "gym"}
            onClick={() => onSelectEquipment("gym")}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 ${
              equipmentAccess === "gym"
                ? "border-brand bg-[#FFF5F0] ring-2 ring-brand/20 shadow-md"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              equipmentAccess === "gym"
                ? "bg-brand-action text-white"
                : "bg-stone-100 text-stone-600"
            }`}>
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-stone-900">
                Phòng gym
              </div>
              <div className="text-xs text-stone-600">
                Tạ đơn & Thiết bị máy
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Body Focus Areas Grid */}
      <div className="mb-8">
        <h2 className="text-sm font-bold mb-3 text-stone-700">
          Vùng muốn tập trung (chọn một hoặc nhiều)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {bodyAreas.map((area) => {
            const isSelected = selectedAreas.includes(area.id);
            return (
              <button type="button" aria-pressed={isSelected}
                key={area.id}
                onClick={() => onToggleArea(area.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-brand ring-2 ring-brand/20 bg-[#FFF5F0]"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold mb-0.5 text-stone-900">
                      {area.label}
                    </h4>
                    <p className="text-xs text-stone-600">
                      {area.sub}
                    </p>
                  </div>
                  <div className={`w-5 h-5 mt-0.5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-brand bg-brand-action text-white"
                      : "border-stone-300 bg-stone-50"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={selectedAreas.length === 0}
          className="px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-brand-action hover:bg-brand-action-hover text-white"
        >
          <span>Tiếp tục</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
