"use client";

import React from "react";
import { Flame, Sparkles, Activity, Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrimaryGoal } from "@/types/quiz";

interface GoalSelectionStepProps {
  selectedGoal: PrimaryGoal;
  onSelectGoal: (goal: PrimaryGoal) => void;
  onNext: () => void;
}

const GOALS: {
  id: PrimaryGoal;
  title: string;
  desc: string;
  icon: typeof Flame;
  color: string;
  borderActive: string;
}[] = [
  {
    id: "lose_weight",
    title: "Giảm Cân & Phẳng Bụng",
    desc: "Đốt mỡ toàn thân, siết eo thon và kích hoạt cơ bụng sâu với chuỗi bài Wall Pilates.",
    icon: Flame,
    color: "text-[#FF5A36] bg-peach-50",
    borderActive: "border-[#FF5A36] ring-2 ring-[#FF5A36]/20",
  },
  {
    id: "tone_glutes",
    title: "Nâng Mông & Thon Đùi",
    desc: "Định hình vòng 3 săn chắc, cải thiện độ căng tròn và làm thon gọn cơ đùi trong.",
    icon: Sparkles,
    color: "text-amber-500 bg-amber-50",
    borderActive: "border-amber-500 ring-2 ring-amber-500/20",
  },
  {
    id: "fix_posture",
    title: "Sửa Tư Thế & Giảm Đau Lưng",
    desc: "Căn chỉnh cột sống, khắc phục võng lưng gù vai và giải tỏa căng thẳng sau giờ làm.",
    icon: Activity,
    color: "text-emerald-600 bg-emerald-50",
    borderActive: "border-emerald-500 ring-2 ring-emerald-500/20",
  },
  {
    id: "mindful_flexibility",
    title: "Dẻo Dai & Thư Giãn Tinh Thần",
    desc: "Tăng cường biên độ chuyển động khớp, điều hòa hơi thở và tìm lại năng lượng tích cực.",
    icon: Heart,
    color: "text-purple-600 bg-purple-50",
    borderActive: "border-purple-500 ring-2 ring-purple-500/20",
  },
];

export const GoalSelectionStep: React.FC<GoalSelectionStepProps> = ({
  selectedGoal,
  onSelectGoal,
  onNext,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">
          Bước 2 / 5
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
          Mục Tiêu Trọng Tâm Của Bạn?
        </h2>
        <p className="text-stone-500 text-sm mt-1">
          Giáo án Pilates 28 ngày sẽ được cá nhân hóa tập trung vào mong muốn này.
        </p>
      </div>

      <div className="space-y-3.5 mb-8">
        {GOALS.map((goal) => {
          const isSelected = selectedGoal === goal.id;
          const IconComponent = goal.icon;
          return (
            <div
              key={goal.id}
              onClick={() => {
                onSelectGoal(goal.id);
                // Slight delay for smooth feedback before next
                setTimeout(onNext, 250);
              }}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border bg-white cursor-pointer transition-all duration-200 flex items-center justify-between shadow-soft hover:shadow-card hover:border-stone-300",
                isSelected ? goal.borderActive : "border-stone-200"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", goal.color)}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {goal.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    {goal.desc}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 transition-colors",
                  isSelected
                    ? "border-[#FF5A36] bg-[#FF5A36] text-white"
                    : "border-stone-300 bg-stone-50"
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
