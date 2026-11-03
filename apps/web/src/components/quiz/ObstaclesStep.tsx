"use client";

import React from "react";
import { Check, HeartHandshake, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { FitnessObstacle } from "@/types/quiz";

interface ObstaclesStepProps {
  selectedObstacles: FitnessObstacle[];
  onToggleObstacle: (obstacleId: FitnessObstacle) => void;
  onSubmit: () => void;
}

const OBSTACLES: {
  id: FitnessObstacle;
  title: string;
  desc: string;
  emoji: string;
}[] = [
  { id: "sweet_cravings", title: "Cơn Thèm Ngọt & Ăn Vặt Đêm", desc: "Thường xuyên thèm đồ ngọt hoặc ăn theo cảm xúc khi căng thẳng.", emoji: "🍫" },
  { id: "busy_schedule", title: "Lịch Trình Bận Rộn", desc: "Khó dành ra 1-2 tiếng đến phòng gym, chỉ có thể tập 15-20 phút tại nhà.", emoji: "⏰" },
  { id: "sore_back", title: "Đau Lưng & Khớp Gối Nhạy Cảm", desc: "Cần các bài tập Low-Impact trên tường hoặc thảm, không nhảy xóc hay chấn thương.", emoji: "🦴" },
  { id: "lack_of_motivation", title: "Dễ Nản Khi Tập Một Mình", desc: "Cần phản hồi khích lệ và hướng dẫn sửa động tác ngay khi thực hiện.", emoji: "🤍" },
];

export const ObstaclesStep: React.FC<ObstaclesStepProps> = ({
  selectedObstacles,
  onToggleObstacle,
  onSubmit,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">
          Bước 5 / 5
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
          Rào Cản Lớn Nhất Của Bạn?
        </h2>
        <p className="text-stone-500 text-sm mt-1">
          Chia sẻ để AI hiểu bạn và xây dựng lộ trình thích nghi dễ dàng nhất.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {OBSTACLES.map((item) => {
          const isSelected = selectedObstacles.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onToggleObstacle(item.id)}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border bg-white cursor-pointer transition-all duration-200 flex items-center justify-between shadow-soft hover:shadow-card",
                isSelected
                  ? "border-[#FF5A36] ring-2 ring-[#FF5A36]/20 bg-peach-50/20"
                  : "border-stone-200 hover:border-stone-300"
              )}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-2xl shrink-0">{item.emoji}</span>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors",
                  isSelected
                    ? "border-[#FF5A36] bg-[#FF5A36] text-white"
                    : "border-stone-300 bg-stone-50"
                )}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Live PT Guarantee Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-peach-50/60 via-white to-emerald-50/40 border border-peach-200/80 mb-8 flex items-start gap-3.5 shadow-soft">
        <div className="w-10 h-10 rounded-2xl bg-[#FF5A36] text-white flex items-center justify-center shrink-0 shadow-sm">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-stone-900 text-sm">
            Cam kết đồng hành từ G—AI Companion
          </h4>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            AI sẽ quan sát qua webcam để nhắc bạn siết cơ bụng, sửa võng lưng và động viên kịp thời. 100% thuần phần mềm, không yêu cầu thiết bị đắt tiền.
          </p>
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-4 rounded-full bg-[#FF5A36] hover:bg-[#E64E2B] text-white font-bold text-base transition-all duration-300 shadow-soft active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <ShieldCheck className="w-5 h-5" />
        <span>Tạo Lộ Trình Cá Nhân Hóa 28 Ngày</span>
      </button>
    </div>
  );
};
