import React from "react";
import { Gender, PrimaryGoal } from "@/types/quiz";
import { Flame, Dumbbell, HeartPulse, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenderAndGoalStepProps {
  gender: Gender;
  goal: PrimaryGoal;
  onUpdate: (gender: Gender, goal: PrimaryGoal) => void;
  onNext: () => void;
}

export const GenderAndGoalStep: React.FC<GenderAndGoalStepProps> = ({
  gender,
  goal,
  onUpdate,
  onNext,
}) => {
  const goals: { id: PrimaryGoal; title: string; subtitle: string; icon: any; color: string }[] = [
    {
      id: "lose_weight",
      title: "Giảm mỡ & Thon gọn",
      subtitle: "Đốt cháy calo an toàn, thu gọn số đo vòng eo và đùi",
      icon: Flame,
      color: "text-peach-500 bg-peach-50 border-peach-100",
    },
    {
      id: "tone_muscle",
      title: "Săn chắc vóc dáng",
      subtitle: "Xây dựng cơ bắp săn gọn, vóc dáng khỏe khoắn",
      icon: Dumbbell,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      id: "improve_posture",
      title: "Cải thiện tư thế & Cột sống",
      subtitle: "Giảm đau mỏi lưng, thẳng trục vai và định hình phong thái",
      icon: HeartPulse,
      color: "text-sage-600 bg-sage-50 border-sage-100",
    },
    {
      id: "boost_energy",
      title: "Năng động & Giảm căng thẳng",
      subtitle: "Tăng sức bền, thư giãn tinh thần và ngủ ngon hơn",
      icon: Sparkles,
      color: "text-lavender-500 bg-lavender-50 border-lavender-100",
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          Mục tiêu sức khỏe lớn nhất của bạn là gì?
        </h1>
        <p className="text-stone-500 text-sm sm:text-base">
          AI Companion sẽ thiết kế từng bài tập và thực đơn bám sát mục tiêu này.
        </p>
      </div>

      {/* Gender Selection */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2.5">
          Giới tính sinh học (để tính chỉ số BMR chính xác)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdate("female", goal)}
            className={cn(
              "py-3.5 px-4 rounded-2xl border text-center font-medium transition-all duration-200 flex items-center justify-center gap-2",
              gender === "female"
                ? "bg-peach-500 text-white border-peach-600 shadow-soft"
                : "bg-white text-stone-700 border-stone-200 hover:border-peach-200 hover:bg-peach-50/30"
            )}
          >
            <span>🌸 Nữ</span>
            {gender === "female" && <Check className="w-4 h-4 ml-1" />}
          </button>
          <button
            type="button"
            onClick={() => onUpdate("male", goal)}
            className={cn(
              "py-3.5 px-4 rounded-2xl border text-center font-medium transition-all duration-200 flex items-center justify-center gap-2",
              gender === "male"
                ? "bg-peach-500 text-white border-peach-600 shadow-soft"
                : "bg-white text-stone-700 border-stone-200 hover:border-peach-200 hover:bg-peach-50/30"
            )}
          >
            <span>⚡ Nam</span>
            {gender === "male" && <Check className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>

      {/* Goal Cards */}
      <div className="space-y-3 mb-8">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2.5">
          Chọn mục tiêu ưu tiên
        </label>
        {goals.map((item) => {
          const Icon = item.icon;
          const isSelected = goal === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onUpdate(gender, item.id)}
              className={cn(
                "p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center gap-4 bg-white",
                isSelected
                  ? "border-peach-500 shadow-card ring-2 ring-peach-200/60 transform -translate-y-0.5"
                  : "border-stone-200/80 hover:border-peach-300 hover:bg-peach-50/20"
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", item.color)}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-stone-800 text-base">{item.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed mt-0.5">{item.subtitle}</p>
              </div>
              <div
                className={cn(
                  "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                  isSelected
                    ? "bg-peach-500 border-peach-500 text-white"
                    : "border-stone-300 bg-stone-50"
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white font-semibold text-base shadow-soft hover:shadow-glow transition-all duration-200 active:scale-[0.99]"
      >
        Tiếp tục
      </button>
    </div>
  );
};
