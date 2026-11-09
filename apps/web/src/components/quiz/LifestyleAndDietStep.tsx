import React from "react";
import { ActivityLevel, DietPreference } from "@/types/quiz";
import { Coffee, Footprints, Bike, Zap, Apple, Salad, Fish, Clock, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LifestyleAndDietStepProps {
  activityLevel: ActivityLevel;
  dietPreference: DietPreference;
  onUpdate: (activity: ActivityLevel, diet: DietPreference) => void;
  onNext: () => void;
}

export const LifestyleAndDietStep: React.FC<LifestyleAndDietStepProps> = ({
  activityLevel,
  dietPreference,
  onUpdate,
  onNext,
}) => {
  const activities: { id: ActivityLevel; title: string; desc: string; icon: LucideIcon }[] = [
    {
      id: "sedentary",
      title: "Ít vận động (Bàn giấy)",
      desc: "Ngồi nhiều suốt ngày, ít đi lại",
      icon: Coffee,
    },
    {
      id: "lightly_active",
      title: "Vận động nhẹ",
      desc: "Đi bộ nhẹ nhàng 1-2 lần mỗi tuần",
      icon: Footprints,
    },
    {
      id: "moderately_active",
      title: "Vận động đều đặn",
      desc: "Tập luyện thể thao 3-5 buổi mỗi tuần",
      icon: Bike,
    },
    {
      id: "very_active",
      title: "Cường độ cao",
      desc: "Vận động thể chất hàng ngày hoặc lao động nặng",
      icon: Zap,
    },
  ];

  const diets: { id: DietPreference; title: string; desc: string; icon: LucideIcon }[] = [
    {
      id: "balanced",
      title: "Ăn uống cân bằng",
      desc: "Ăn đa dạng các nhóm chất: thịt, cá, rau, cơm",
      icon: Apple,
    },
    {
      id: "vegetarian",
      title: "Ăn chay / Thuần thực vật",
      desc: "Ưu tiên rau củ, đậu hạt, ít hoặc không dùng thịt",
      icon: Salad,
    },
    {
      id: "low_carb",
      title: "Low-Carb / Giảm tinh bột",
      desc: "Hạn chế đường và cơm trắng, ưu tiên đạm và rau",
      icon: Fish,
    },
    {
      id: "intermittent_fasting",
      title: "Nhịn ăn gián đoạn 16:8",
      desc: "Ăn trong 8 tiếng, để hệ tiêu hóa nghỉ ngơi 16 tiếng",
      icon: Clock,
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          Lối sống & Thói quen ăn uống
        </h1>
        <p className="text-stone-500 text-sm sm:text-base">
          Để thực đơn và cường độ bài tập khớp tự nhiên với nhịp sinh hoạt của bạn.
        </p>
      </div>

      {/* Activity Level */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2.5">
          1. Mức độ vận động hàng ngày
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activities.map((act) => {
            const Icon = act.icon;
            const isSelected = activityLevel === act.id;
            return (
              <div
                key={act.id}
                onClick={() => onUpdate(act.id, dietPreference)}
                className={cn(
                  "p-3.5 rounded-2xl border cursor-pointer transition-all bg-white flex items-center gap-3",
                  isSelected
                    ? "border-peach-500 bg-peach-50/20 ring-2 ring-peach-200/50"
                    : "border-stone-200 hover:border-peach-200"
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isSelected ? "bg-peach-500 text-white" : "bg-stone-100 text-stone-600")}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-800 text-xs sm:text-sm truncate">{act.title}</div>
                  <div className="text-[11px] text-stone-400 truncate">{act.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diet Preference */}
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2.5">
          2. Phong cách dinh dưỡng mong muốn
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {diets.map((diet) => {
            const Icon = diet.icon;
            const isSelected = dietPreference === diet.id;
            return (
              <div
                key={diet.id}
                onClick={() => onUpdate(activityLevel, diet.id)}
                className={cn(
                  "p-3.5 rounded-2xl border cursor-pointer transition-all bg-white flex items-center gap-3",
                  isSelected
                    ? "border-sage-500 bg-sage-50/20 ring-2 ring-sage-200/50"
                    : "border-stone-200 hover:border-sage-200"
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isSelected ? "bg-sage-600 text-white" : "bg-stone-100 text-stone-600")}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-800 text-xs sm:text-sm truncate">{diet.title}</div>
                  <div className="text-[11px] text-stone-400 truncate">{diet.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
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
