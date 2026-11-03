import React from "react";
import { FitnessObstacle } from "@/types/quiz";
import { ShieldCheck, HeartHandshake, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ObstaclesStepProps {
  selectedObstacles: FitnessObstacle[];
  onToggleObstacle: (obstacle: FitnessObstacle) => void;
  onSubmit: () => void;
}

export const ObstaclesStep: React.FC<ObstaclesStepProps> = ({
  selectedObstacles,
  onToggleObstacle,
  onSubmit,
}) => {
  const obstacles: { id: FitnessObstacle; title: string; desc: string; emoji: string }[] = [
    {
      id: "sweet_cravings",
      title: "Thèm đồ ngọt & ăn vặt ban đêm",
      desc: "Khó kiềm chế trước trà sữa, bánh ngọt khi ở nhà muộn",
      emoji: "🍰",
    },
    {
      id: "stress_eating",
      title: "Ăn uống do căng thẳng (Stress Eating)",
      desc: "Áp lực công việc khiến mình muốn ăn nhiều hơn bình thường",
      emoji: "🧠",
    },
    {
      id: "low_motivation",
      title: "Dễ nản & bỏ dở sau vài ngày",
      desc: "Tập một mình rất buồn, thiếu người đếm nhịp và khích lệ",
      emoji: "😔",
    },
    {
      id: "lack_of_time",
      title: "Lịch trình bận rộn, ít thời gian",
      desc: "Cần các bài tập ngắn 15–20 phút nhưng đốt mỡ hiệu quả cao",
      emoji: "⏰",
    },
    {
      id: "sore_back",
      title: "Đau mỏi vai gáy & sợ sai tư thế",
      desc: "Lo sợ tự tập sai dáng sẽ gây đau lưng hoặc chấn thương khớp",
      emoji: "🩹",
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          Điều gì từng khiến bạn gặp khó khăn nhất?
        </h1>
        <p className="text-stone-500 text-sm sm:text-base">
          Chia sẻ thật lòng để AI hiểu bạn và trở thành điểm tựa tâm lý vững vàng.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {obstacles.map((item) => {
          const isSelected = selectedObstacles.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onToggleObstacle(item.id)}
              className={cn(
                "p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center gap-3.5 bg-white",
                isSelected
                  ? "border-peach-500 bg-peach-50/20 shadow-card ring-2 ring-peach-200/50"
                  : "border-stone-200 hover:border-peach-200"
              )}
            >
              <span className="text-2xl shrink-0">{item.emoji}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-stone-800 text-sm sm:text-base">{item.title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{item.desc}</p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                  isSelected
                    ? "bg-peach-500 border-peach-500 text-white"
                    : "border-stone-300 bg-stone-50"
                )}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Companion Guarantee Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-peach-50 via-cream-100 to-sage-50 border border-peach-200/80 mb-8 flex items-start gap-3.5 shadow-soft">
        <div className="w-9 h-9 rounded-xl bg-peach-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-stone-800 text-sm">Cam kết từ G-AI Companion</h4>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            AI sẽ sửa dáng trực tiếp qua webcam và trò chuyện CBT giúp bạn điều hòa cảm xúc, vượt qua cơn thèm ăn mà không cần ép buộc bản thân.
          </p>
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white font-semibold text-base shadow-soft hover:shadow-glow transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <ShieldCheck className="w-5 h-5" />
        Tạo Lộ Trình Cá Nhân Hóa Của Tôi
      </button>
    </div>
  );
};
