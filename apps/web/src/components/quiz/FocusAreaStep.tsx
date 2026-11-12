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
    { id: "belly", label: "Bụng & Cơ Lõi (Core)", sub: "Làm phẳng mỡ bụng dưới, siết eo đồng hồ cát", emoji: "✨" },
    { id: "glutes", label: "Mông & Hông (Glutes)", sub: "Nâng cao cơ mông, làm đầy hõm mông hai bên", emoji: "🍑" },
    { id: "thighs", label: "Đùi & Chân Thon", sub: "Đốt mỡ đùi trong, làm thon gọn bắp chân", emoji: "🦵" },
    { id: "back", label: "Lưng & Cột Sống", sub: "Khắc phục gù lưng, mở ngực và kéo giãn đốt sống", emoji: "🧘" },
    { id: "arms", label: "Cánh Tay & Vai Thon", sub: "Làm thon gọn bắp tay, săn chắc cơ vai", emoji: "💪" },
    { id: "full_body", label: "Toàn Thân Toàn Diện", sub: "Kích hoạt toàn bộ nhóm cơ chính và tăng trao đổi chất", emoji: "⚡" },
  ];

  const maleAreas: { id: BodyFocusArea; label: string; sub: string; emoji: string }[] = [
    { id: "chest", label: "Cơ Ngực (Chest)", sub: "Dày cơ ngực trên & ngực giữa, mở rộng khuôn ngực", emoji: "🛡️" },
    { id: "back", label: "Lưng Xô (V-Taper Lat)", sub: "Mở rộng lưng xô hình chữ V, dày cơ trám & lưng giữa", emoji: "🦅" },
    { id: "arms", label: "Cơ Vai & Tay (Arms)", sub: "Dày cơ delta 3 góc, to bắp tay trước & tay sau", emoji: "💪" },
    { id: "belly", label: "Bụng 6 Múi & Cơ Liên Sườn", sub: "Cắt nét cơ bụng thẳng, siết chặt rãnh bụng liên sườn", emoji: "⚡" },
    { id: "thighs", label: "Cơ Đùi & Bắp Chân", sub: "Tăng khối cơ tứ đầu đùi, đùi sau và sức mạnh trụ", emoji: "🦵" },
    { id: "full_body", label: "Toàn Thân Hypertrophy", sub: "Kích thích toàn diện chuỗi động tác Compound đa khớp", emoji: "🔥" },
  ];

  const bodyAreas = isMale ? maleAreas : femaleAreas;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="text-center mb-6">
        <span className={`text-xs font-bold tracking-widest uppercase ${
          isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"
        }`}>
          Bước 3 / 5 • Vùng Tác Động & Dụng Cụ
        </span>
        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 ${
          isMale ? "text-white" : "text-stone-900"
        }`}>
          Vùng Cơ Thể & Không Gian Bạn Tập
        </h2>
        <p className={`text-sm mt-1 max-w-md mx-auto ${
          isMale ? "text-stone-400" : "text-stone-600"
        }`}>
          Chọn các vùng ưu tiên và không gian bạn có để AI xây dựng chuỗi bài tập tương thích.
        </p>
      </div>

      {/* 1. Equipment Selector */}
      <div className="mb-8">
        <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${
          isMale ? "text-stone-300" : "text-stone-700"
        }`}>
          Không Gian & Dụng Cụ Bạn Tập:
        </label>
        <div className="grid grid-cols-2 gap-3.5">
          <div
            onClick={() => onSelectEquipment("home")}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
              equipmentAccess === "home"
                ? isMale
                  ? "border-[#FF5A36] bg-[#FF5A36]/15 ring-2 ring-[#FF5A36]/20 shadow-md"
                  : "border-[#FF6B4A] bg-[#FFF5F0] ring-2 ring-[#FF6B4A]/20 shadow-md"
                : isMale
                ? "border-stone-800 bg-[#161514] text-stone-300 hover:border-stone-700"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              equipmentAccess === "home"
                ? isMale ? "bg-[#FF5A36] text-white" : "bg-[#FF6B4A] text-white"
                : isMale ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-600"
            }`}>
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className={`font-bold text-sm ${isMale ? "text-white" : "text-stone-900"}`}>
                Tại Nhà
              </div>
              <div className={`text-xs ${isMale ? "text-stone-400" : "text-stone-500"}`}>
                Thảm & Dây kháng lực
              </div>
            </div>
          </div>

          <div
            onClick={() => onSelectEquipment("gym")}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
              equipmentAccess === "gym"
                ? isMale
                  ? "border-[#FF5A36] bg-[#FF5A36]/15 ring-2 ring-[#FF5A36]/20 shadow-md"
                  : "border-[#FF6B4A] bg-[#FFF5F0] ring-2 ring-[#FF6B4A]/20 shadow-md"
                : isMale
                ? "border-stone-800 bg-[#161514] text-stone-300 hover:border-stone-700"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              equipmentAccess === "gym"
                ? isMale ? "bg-[#FF5A36] text-white" : "bg-[#FF6B4A] text-white"
                : isMale ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-600"
            }`}>
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className={`font-bold text-sm ${isMale ? "text-white" : "text-stone-900"}`}>
                Phòng Gym
              </div>
              <div className={`text-xs ${isMale ? "text-stone-400" : "text-stone-500"}`}>
                Tạ đơn & Thiết bị máy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Body Focus Areas Grid */}
      <div className="mb-8">
        <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${
          isMale ? "text-stone-300" : "text-stone-700"
        }`}>
          Vùng Cần Tập Trung (Chọn 1 hoặc nhiều):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {bodyAreas.map((area) => {
            const isSelected = selectedAreas.includes(area.id);
            return (
              <div
                key={area.id}
                onClick={() => onToggleArea(area.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? isMale
                      ? "border-[#FF5A36] ring-2 ring-[#FF5A36]/20 bg-[#FF5A36]/10"
                      : "border-[#FF6B4A] ring-2 ring-[#FF6B4A]/20 bg-[#FFF5F0]"
                    : isMale
                    ? "border-stone-800 bg-[#161514] hover:border-stone-700"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{area.emoji}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? isMale
                        ? "border-[#FF5A36] bg-[#FF5A36] text-white"
                        : "border-[#FF6B4A] bg-[#FF6B4A] text-white"
                      : isMale
                      ? "border-stone-700 bg-stone-900"
                      : "border-stone-300 bg-stone-50"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h4 className={`text-sm sm:text-base font-bold mb-0.5 ${
                    isMale ? "text-white" : "text-stone-900"
                  }`}>
                    {area.label}
                  </h4>
                  <p className={`text-xs ${
                    isMale ? "text-stone-400" : "text-stone-500"
                  }`}>
                    {area.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={selectedAreas.length === 0}
          className={`px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
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
