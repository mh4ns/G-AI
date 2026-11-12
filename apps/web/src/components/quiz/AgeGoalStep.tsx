"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";
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
      title: "18–29 tuổi",
      subtitle: "Xây nền cơ lõi và tư thế",
    },
    {
      range: "30-39",
      numericAge: 34,
      title: "30–39 tuổi",
      subtitle: "Cơ lõi, thắt lưng và tư thế khi ngồi nhiều",
    },
    {
      range: "40-49",
      numericAge: 44,
      title: "40–49 tuổi",
      subtitle: "Săn chắc toàn thân, nhẹ nhàng với khớp",
    },
    {
      range: "50+",
      numericAge: 54,
      title: "50+ tuổi",
      subtitle: "Bài trên thảm nhẹ, cân bằng và dẻo dai",
    },
  ];

  const maleCards: DemographicCard[] = [
    {
      range: "18-29",
      numericAge: 24,
      title: "18–29 tuổi",
      subtitle: "Tăng cơ và sức mạnh",
    },
    {
      range: "30-39",
      numericAge: 34,
      title: "30–39 tuổi",
      subtitle: "Giảm mỡ bụng, giữ lưng khỏe",
    },
    {
      range: "40-49",
      numericAge: 44,
      title: "40–49 tuổi",
      subtitle: "Sức mạnh cơ lõi, nhẹ nhàng với khớp",
    },
    {
      range: "50+",
      numericAge: 54,
      title: "50+ tuổi",
      subtitle: "Giữ khối cơ, sức bền và độ linh hoạt",
    },
  ];

  const demographicCards = isMale ? maleCards : femaleCards;

  const femaleGoals: { id: PrimaryGoal; title: string; desc: string }[] = [
    {
      id: "tone_muscle",
      title: "Siết eo & cơ lõi phẳng",
      desc: "Làm phẳng bụng dưới, lộ rãnh số 11 và săn chắc eo",
    },
    {
      id: "tone_glutes",
      title: "Nâng mông & thon đùi",
      desc: "Kích hoạt cơ mông quả đào, giảm mỡ đùi trong và săn đùi sau",
    },
    {
      id: "fix_posture",
      title: "Thẳng lưng & chống gù",
      desc: "Mở rộng khớp vai, giải phóng áp lực thắt lưng và cổ rùa",
    },
    {
      id: "lose_weight",
      title: "Đốt mỡ toàn thân bền vững",
      desc: "Giảm 3 – 6 kg mỡ thừa với các bài tập nhịp thở Pilates kiểm soát",
    },
  ];

  const maleGoals: { id: PrimaryGoal; title: string; desc: string }[] = [
    {
      id: "hypertrophy",
      title: "Tăng cơ ngực, vai & lưng xô",
      desc: "Xây dựng khối cơ nạc dày dặn, thân hình chữ V nam tính",
    },
    {
      id: "lose_weight",
      title: "Siết mỡ & lộ rãnh 6 múi",
      desc: "Triệt tiêu mỡ bụng dưới, làm rõ nét cơ bụng thẳng và cơ liên sườn",
    },
    {
      id: "explosive_power",
      title: "Sức mạnh bùng nổ & Calisthenics",
      desc: "Tăng sức kéo xà, chống đẩy biến thể và sức bật toàn thân",
    },
    {
      id: "cardio_stamina",
      title: "Sức bền tim mạch & năng lượng cao",
      desc: "Cải thiện VO2 Max, bền bỉ và không còn hụt hơi khi leo dốc",
    },
  ];

  const goals = isMale ? maleGoals : femaleGoals;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 text-stone-900">
          Độ tuổi của bạn & mục tiêu trọng tâm
        </h1>

        <p className="text-xs sm:text-sm max-w-md mx-auto text-stone-600">
          Chọn nhóm tuổi để hệ thống hiệu chỉnh tốc độ chuyển hóa sinh học BMR và mật độ phục hồi khớp.
        </p>
      </div>

      {/* 1. Age Demographic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
        {demographicCards.map((card) => {
          const isSelected = selectedAge === card.numericAge;
          return (
            <button type="button" aria-pressed={isSelected}
              key={card.range}
              onClick={() => onSelectAge(card.numericAge)}
              className={`w-full text-left group relative rounded-2xl overflow-hidden transition-all duration-300 border-2 flex flex-col justify-between p-3.5 sm:p-4 text-left min-h-[120px] ${
                isSelected
                  ? "border-brand bg-[#FFF5F0] ring-2 ring-brand/30 shadow-lg"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white bg-brand-action" aria-hidden>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}

              {/* Title & Subtitle */}
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight mb-1 text-stone-900">
                  {card.title}
                </h3>
                <p className="text-sm leading-snug text-stone-600 pr-6">
                  {card.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Primary Goals Selection */}
      <div>
        <h3 className="text-sm sm:text-base font-bold tracking-tight mb-4 flex items-center gap-2 text-stone-900">
          <Sparkles className="w-4 h-4 text-brand-action" />
          <span>Mục tiêu ưu tiên cao nhất:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((g) => {
            const isSelected = selectedGoal === g.id;
            return (
              <button type="button" aria-pressed={isSelected}
                key={g.id}
                onClick={() => onSelectGoal(g.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-200 border-2 flex items-start justify-between gap-3 ${
                  isSelected
                    ? "border-brand bg-[#FFF5F0] shadow-md"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div>
                  <h4 className="text-sm sm:text-base font-bold mb-1 text-stone-900">
                    {g.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-stone-600">
                    {g.desc}
                  </p>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                  isSelected
                    ? "border-brand bg-brand-action text-white"
                    : "border-stone-300 bg-stone-50"
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
