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

  const femaleAreas: { id: BodyFocusArea; label: string; sub: string; emoji: string }[] = [
    { id: "belly", label: "Bụng & cơ lõi (Core)", sub: "Làm phẳng mỡ bụng dưới, siết eo đồng hồ cát", emoji: "✨" },
    { id: "glutes", label: "Mông & hông (glutes)", sub: "Nâng cao cơ mông, làm đầy hõm mông hai bên", emoji: "🍑" },
    { id: "thighs", label: "Đùi & chân thon", sub: "Đốt mỡ đùi trong, làm thon gọn bắp chân", emoji: "🦵" },
    { id: "back", label: "Lưng & cột sống", sub: "Khắc phục gù lưng, mở ngực và kéo giãn đốt sống", emoji: "🧘" },
    { id: "arms", label: "Cánh tay & vai thon", sub: "Làm thon gọn bắp tay, săn chắc cơ vai", emoji: "💪" },
    { id: "full_body", label: "Toàn thân toàn diện", sub: "Kích hoạt toàn bộ nhóm cơ chính và tăng trao đổi chất", emoji: "⚡" },
  ];

  const maleAreas: { id: BodyFocusArea; label: string; sub: string; emoji: string }[] = [
    { id: "chest", label: "Cơ ngực (chest)", sub: "Dày cơ ngực trên & ngực giữa, mở rộng khuôn ngực", emoji: "🛡️" },
    { id: "back", label: "Lưng xô (v-Taper lat)", sub: "Mở rộng lưng xô hình chữ V, dày cơ trám & lưng giữa", emoji: "🦅" },
    { id: "arms", label: "Cơ vai & tay (arms)", sub: "Dày cơ delta 3 góc, to bắp tay trước & tay sau", emoji: "💪" },
    { id: "belly", label: "Bụng 6 múi & cơ liên sườn", sub: "Cắt nét cơ bụng thẳng, siết chặt rãnh bụng liên sườn", emoji: "⚡" },
    { id: "thighs", label: "Cơ đùi & bắp chân", sub: "Tăng khối cơ tứ đầu đùi, đùi sau và sức mạnh trụ", emoji: "🦵" },
    { id: "full_body", label: "Toàn thân Hypertrophy", sub: "Kích thích toàn diện chuỗi động tác Compound đa khớp", emoji: "🔥" },
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
        <label className="block text-xs font-bold mb-3 text-stone-700">
          Vùng Cần Tập Trung (Chọn 1 hoặc nhiều):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {bodyAreas.map((area) => {
            const isSelected = selectedAreas.includes(area.id);
            return (
              <button type="button" aria-pressed={isSelected}
                key={area.id}
                onClick={() => onToggleArea(area.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "border-brand ring-2 ring-brand/20 bg-[#FFF5F0]"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{area.emoji}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-brand bg-brand-action text-white"
                      : "border-stone-300 bg-stone-50"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-bold mb-0.5 text-stone-900">
                    {area.label}
                  </h4>
                  <p className="text-xs text-stone-600">
                    {area.sub}
                  </p>
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
