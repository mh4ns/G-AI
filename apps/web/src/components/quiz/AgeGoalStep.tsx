"use client";

import React from "react";
import Image from "next/image";
import { Check, Sparkles, Target } from "lucide-react";
import { AthleticArchetype, PrimaryGoal } from "@/types/quiz";

interface AgeGoalStepProps {
  archetype: AthleticArchetype;
  selectedAge: number;
  selectedGoal: PrimaryGoal;
  onSelectAge: (age: number) => void;
  onSelectGoal: (goal: PrimaryGoal) => void;
}

interface DemographicCard {
  range: string;
  numericAge: number;
  title: string;
  subtitle: string;
  image: string;
}

export const AgeGoalStep: React.FC<AgeGoalStepProps> = ({
  archetype,
  selectedAge,
  selectedGoal,
  onSelectAge,
  onSelectGoal,
}) => {
  const isMale = archetype === "male_strength";

  const femaleCards: DemographicCard[] = [
    {
      range: "18-29",
      numericAge: 24,
      title: "18 – 29 Tuổi",
      subtitle: "Năng động, trao đổi chất cao & định hình cơ lõi",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
    },
    {
      range: "30-39",
      numericAge: 34,
      title: "30 – 39 Tuổi",
      subtitle: "Siết eo, giải phóng thắt lưng & phục hồi sau sinh",
      image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80",
    },
    {
      range: "40-49",
      numericAge: 44,
      title: "40 – 49 Tuổi",
      subtitle: "Săn chắc toàn thân, bảo vệ mật độ xương & khớp",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80",
    },
    {
      range: "50+",
      numericAge: 54,
      title: "50+ Tuổi",
      subtitle: "Bài tập thảm nhẹ nhàng, cân bằng & dẻo dai",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const maleCards: DemographicCard[] = [
    {
      range: "18-29",
      numericAge: 24,
      title: "18 – 29 Tuổi",
      subtitle: "Hypertrophy tối đa, tăng cơ nạc & cắt nét cơ thể",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
    },
    {
      range: "30-39",
      numericAge: 34,
      title: "30 – 39 Tuổi",
      subtitle: "Siết mỡ bụng bia, tối ưu thể lực & bảo vệ cột sống",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
    },
    {
      range: "40-49",
      numericAge: 44,
      title: "40 – 49 Tuổi",
      subtitle: "Củng cố gân khớp, sức mạnh cơ lõi & chống đau lưng",
      image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80",
    },
    {
      range: "50+",
      numericAge: 54,
      title: "50+ Tuổi",
      subtitle: "Duy trì khối cơ, sức bền tim mạch & linh hoạt",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const demographicCards = isMale ? maleCards : femaleCards;

  const femaleGoals: { id: PrimaryGoal; title: string; desc: string }[] = [
    {
      id: "tone_muscle",
      title: "Siết Eo & Cơ Lõi Phẳng",
      desc: "Làm phẳng bụng dưới, lộ rãnh số 11 và săn chắc eo",
    },
    {
      id: "tone_glutes",
      title: "Nâng Mông & Thon Đùi",
      desc: "Kích hoạt cơ mông quả đào, giảm mỡ đùi trong và săn đùi sau",
    },
    {
      id: "fix_posture",
      title: "Thẳng Lưng & Chống Gù",
      desc: "Mở rộng khớp vai, giải phóng áp lực thắt lưng và cổ rùa",
    },
    {
      id: "lose_weight",
      title: "Đốt Mỡ Toàn Thân Bền Vững",
      desc: "Giảm 3 – 6 kg mỡ thừa với các bài tập nhịp thở Pilates kiểm soát",
    },
  ];

  const maleGoals: { id: PrimaryGoal; title: string; desc: string }[] = [
    {
      id: "hypertrophy",
      title: "Tăng Cơ Ngực, Vai & Lưng Xô",
      desc: "Xây dựng khối cơ nạc dày dặn, thân hình chữ V nam tính",
    },
    {
      id: "lose_weight",
      title: "Siết Mỡ & Lộ Rãnh 6 Múi",
      desc: "Triệt tiêu mỡ bụng dưới, làm rõ nét cơ bụng thẳng và cơ liên sườn",
    },
    {
      id: "explosive_power",
      title: "Sức Mạnh Bùng Nổ & Calisthenics",
      desc: "Tăng sức kéo xà, chống đẩy biến thể và sức bật toàn thân",
    },
    {
      id: "cardio_stamina",
      title: "Sức Bền Tim Mạch & Năng Lượng Cao",
      desc: "Cải thiện VO2 Max, bền bỉ và không còn hụt hơi khi leo dốc",
    },
  ];

  const goals = isMale ? maleGoals : femaleGoals;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 animate-in fade-in duration-500">
      {/* Step Badge & Title */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold mb-3 ${
          isMale 
            ? "bg-[#FF5A36]/10 border border-[#FF5A36]/30 text-[#FF5A36]" 
            : "bg-peach-100/80 border border-peach-200 text-[#FF6B4A]"
        }`}>
          <Target className="w-3.5 h-3.5" />
          <span>Bước 2 / 5 • Thể Trạng & Mục Tiêu</span>
        </div>

        <h2 className={`text-2xl sm:text-4xl font-black tracking-tight mb-2 ${
          isMale ? "text-white" : "text-stone-900"
        }`}>
          Độ Tuổi Của Bạn & Mục Tiêu Trọng Tâm
        </h2>

        <p className={`text-xs sm:text-sm max-w-md mx-auto ${
          isMale ? "text-stone-400" : "text-stone-600"
        }`}>
          Chọn nhóm tuổi để hệ thống hiệu chỉnh tốc độ chuyển hóa sinh học BMR và mật độ phục hồi khớp.
        </p>
      </div>

      {/* 1. Age Demographic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
        {demographicCards.map((card) => {
          const isSelected = selectedAge === card.numericAge;
          return (
            <div
              key={card.range}
              onClick={() => onSelectAge(card.numericAge)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border-2 flex flex-col justify-between p-3.5 sm:p-4 text-left min-h-[190px] sm:min-h-[220px] ${
                isSelected
                  ? isMale
                    ? "border-[#FF5A36] bg-[#FF5A36]/10 ring-2 ring-[#FF5A36]/30 shadow-lg shadow-[#FF5A36]/20"
                    : "border-[#FF6B4A] bg-[#FFF5F0] ring-2 ring-[#FF6B4A]/30 shadow-lg shadow-[#FF6B4A]/10"
                  : isMale
                  ? "border-stone-800 bg-[#161514] hover:border-stone-600"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              {/* Image Preview */}
              <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden mb-3">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute inset-0 ${
                  isMale ? "bg-black/30" : "bg-black/10"
                }`} />
                {isSelected && (
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white ${
                    isMale ? "bg-[#FF5A36]" : "bg-[#FF6B4A]"
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className={`text-sm sm:text-base font-bold tracking-tight mb-1 ${
                  isMale ? "text-white" : "text-stone-900"
                }`}>
                  {card.title}
                </h3>
                <p className={`text-[11px] leading-snug line-clamp-2 ${
                  isMale ? "text-stone-400" : "text-stone-500"
                }`}>
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Primary Goals Selection */}
      <div>
        <h3 className={`text-sm sm:text-base font-bold tracking-tight mb-4 flex items-center gap-2 ${
          isMale ? "text-white" : "text-stone-900"
        }`}>
          <Sparkles className={`w-4 h-4 ${isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"}`} />
          <span>Mục Tiêu Ưu Tiên Cao Nhất:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((g) => {
            const isSelected = selectedGoal === g.id;
            return (
              <div
                key={g.id}
                onClick={() => onSelectGoal(g.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 flex items-start justify-between gap-3 ${
                  isSelected
                    ? isMale
                      ? "border-[#FF5A36] bg-[#FF5A36]/15 shadow-md"
                      : "border-[#FF6B4A] bg-[#FFF5F0] shadow-md"
                    : isMale
                    ? "border-stone-800 bg-[#161514] hover:border-stone-700"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div>
                  <h4 className={`text-sm sm:text-base font-bold mb-1 ${
                    isMale ? "text-white" : "text-stone-900"
                  }`}>
                    {g.title}
                  </h4>
                  <p className={`text-xs leading-relaxed ${
                    isMale ? "text-stone-400" : "text-stone-600"
                  }`}>
                    {g.desc}
                  </p>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
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
            );
          })}
        </div>
      </div>
    </div>
  );
};
