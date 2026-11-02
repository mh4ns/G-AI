import React from "react";
import { BodyFocusArea } from "@/types/quiz";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusAreaStepProps {
  selectedAreas: BodyFocusArea[];
  onToggleArea: (area: BodyFocusArea) => void;
  onNext: () => void;
}

export const FocusAreaStep: React.FC<FocusAreaStepProps> = ({
  selectedAreas,
  onToggleArea,
  onNext,
}) => {
  const areas: { id: BodyFocusArea; title: string; desc: string; emoji: string }[] = [
    {
      id: "belly",
      title: "Bụng & Vòng eo",
      desc: "Giảm mỡ thừa, làm phẳng bụng dưới và thon gọn eo",
      emoji: "🧘‍♀️",
    },
    {
      id: "glutes",
      title: "Mông & Hông",
      desc: "Nâng cao, căng tròn và săn chắc vòng 3",
      emoji: "🍑",
    },
    {
      id: "thighs",
      title: "Đùi & Bắp chân",
      desc: "Làm thon gọn khe đùi, săn chắc đôi chân nhẹ nhàng",
      emoji: "🦵",
    },
    {
      id: "back",
      title: "Lưng & Cột sống",
      desc: "Định hình lại vai thẳng, giảm mỏi lưng do ngồi nhiều",
      emoji: "✨",
    },
    {
      id: "arms",
      title: "Bắp tay & Vai",
      desc: "Thu nhỏ mỡ bắp tay dưới, vai thanh thoát",
      emoji: "💪",
    },
    {
      id: "full_body",
      title: "Toàn thân cân đối",
      desc: "Đốt mỡ đồng đều và tăng độ dẻo dai toàn diện",
      emoji: "🌟",
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          Vùng cơ thể bạn muốn tập trung nhiều nhất?
        </h1>
        <p className="text-stone-500 text-sm sm:text-base">
          Bạn có thể chọn một hoặc nhiều vùng để AI cá nhân hóa tỷ lệ bài tập.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {areas.map((item) => {
          const isSelected = selectedAreas.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onToggleArea(item.id)}
              className={cn(
                "p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between bg-white",
                isSelected
                  ? "border-peach-500 bg-peach-50/20 shadow-card ring-2 ring-peach-200/60"
                  : "border-stone-200 hover:border-peach-200 hover:bg-stone-50/50"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{item.emoji}</span>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-peach-500 border-peach-500 text-white"
                      : "border-stone-300 bg-stone-50"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-stone-800 text-sm sm:text-base">{item.title}</h3>
                <p className="text-xs text-stone-500 mt-1 leading-snug">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={selectedAreas.length === 0}
        className={cn(
          "w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 shadow-soft",
          selectedAreas.length > 0
            ? "bg-gradient-to-r from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white hover:shadow-glow active:scale-[0.99]"
            : "bg-stone-200 text-stone-400 cursor-not-allowed"
        )}
      >
        {selectedAreas.length === 0 ? "Vui lòng chọn ít nhất 1 vùng" : `Tiếp tục (${selectedAreas.length} vùng đã chọn)`}
      </button>
    </div>
  );
};
