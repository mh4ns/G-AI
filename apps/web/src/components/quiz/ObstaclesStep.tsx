"use client";

import React from "react";
import { Check, ShieldCheck, AlertTriangle, Sparkles, Activity } from "lucide-react";
import { FitnessObstacle, JointInjury } from "@/types/quiz";

interface ObstaclesStepProps {
  selectedObstacles: FitnessObstacle[];
  selectedInjuries: JointInjury[];
  onToggleObstacle: (obstacleId: FitnessObstacle) => void;
  onToggleInjury: (injury: JointInjury) => void;
  onSubmit: () => void;
}

export const ObstaclesStep: React.FC<ObstaclesStepProps> = ({
  selectedObstacles,
  selectedInjuries,
  onToggleObstacle,
  onToggleInjury,
  onSubmit,
}) => {

  const lifestyleObstacles: {
    id: FitnessObstacle;
    title: string;
    desc: string;
    emoji: string;
  }[] = [
    {
      id: "busy_schedule",
      title: "Lịch trình bận rộn",
      desc: "Chỉ dành được 25 – 35 phút/ngày, cần buổi tập cô đọng tối ưu thời gian.",
      emoji: "⏰",
    },
    {
      id: "sweet_cravings",
      title: "Cơn Thèm Ăn Vặt & Đồ Ngọt",
      desc: "Dễ ăn theo cảm xúc khi căng thẳng hoặc sau giờ làm việc mệt mỏi.",
      emoji: "🍫",
    },
    {
      id: "irregular_sleep",
      title: "Thiếu ngủ & thiếu năng lượng",
      desc: "Ngủ không sâu giấc, cơ thể mệt mỏi và cần các bài tập phục hồi nhịp sinh học.",
      emoji: "🌙",
    },
    {
      id: "lack_of_motivation",
      title: "Dễ bỏ cuộc khi tập một mình",
      desc: "Cần người nhắc và đếm rep để giữ nhịp mỗi ngày.",
      emoji: "🤍",
    },
  ];

  const jointInjuries: {
    id: JointInjury;
    title: string;
    desc: string;
    actionNote: string;
    emoji: string;
  }[] = [
    {
      id: "lower_back",
      title: "Đau cột sống / thắt lưng dưới",
      desc: "Thường xuyên đau mỏi khi ngồi lâu hoặc sau khi mang vác nặng.",
      actionNote: "AI sẽ loại trừ hoàn toàn các bài nén trục nặng (Deadlift, Good Morning) và bảo vệ đĩa đệm.",
      emoji: "🦴",
    },
    {
      id: "knee",
      title: "Khớp gối nhạy cảm / khô khớp",
      desc: "Đau gối khi lên xuống cầu thang hoặc khi gập gối biên độ sâu.",
      actionNote: "AI sẽ thay thế các bài bật nhảy bằng động tác Low-Impact trên thảm hoặc kháng lực tĩnh.",
      emoji: "🦵",
    },
    {
      id: "neck_shoulder",
      title: "Đau mỏi cổ vai gáy",
      desc: "Co cứng cơ thang và cơ trám do thói quen nhìn máy tính cúi đầu lâu.",
      actionNote: "AI sẽ ưu tiên bài tập giải phóng cơ cổ và mở rộng biên độ khớp vai.",
      emoji: "🧘",
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-stone-900">
          Thói quen & tiền sử cơ khớp
        </h1>
        <p className="text-sm mt-1 max-w-md mx-auto text-stone-600">
          Cho G-AI biết chỗ bạn hay đau để loại các bài tập dễ làm nặng thêm. Đây không thay cho chẩn đoán của bác sĩ.
        </p>
      </div>

      {/* 1. Joint & Injury Safety Exclusions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-brand-action" />
          <h3 className="text-xs font-bold text-stone-700">
            Cảnh báo vùng khớp cần bảo vệ (nếu có):
          </h3>
        </div>

        <div className="space-y-3">
          {jointInjuries.map((item) => {
            const isSelected = selectedInjuries.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => onToggleInjury(item.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 ${
                  isSelected
                    ? "border-brand bg-[#FFF5F0] ring-2 ring-brand/20 shadow-md"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">{item.emoji}</span>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900">
                      {item.title}
                    </h4>
                    <p className="text-xs mt-0.5 text-stone-600">
                      {item.desc}
                    </p>
                    {isSelected && (
                      <p className="text-xs font-semibold mt-1.5 flex items-center gap-1 text-brand-action">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.actionNote}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-1 transition-colors ${
                  isSelected
                    ? "border-brand bg-brand-action text-white"
                    : "border-stone-300 bg-stone-50"
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Lifestyle Obstacles */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-brand-action" />
          <h3 className="text-xs font-bold text-stone-700">
            Thói quen & rào cản luyện tập:
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lifestyleObstacles.map((item) => {
            const isSelected = selectedObstacles.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => onToggleObstacle(item.id)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "border-brand bg-[#FFF5F0] ring-2 ring-brand/20"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{item.emoji}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? "border-brand bg-brand-action text-white"
                      : "border-stone-300"
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                  {item.title}
                </h4>
                <p className="text-xs mt-0.5 text-stone-600">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onSubmit}
          className="w-full py-4 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-98 bg-brand-action hover:bg-brand-action-hover text-white"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Tạo giáo án 28 ngày cá nhân hóa (AI generate)</span>
        </button>
      </div>
    </div>
  );
};
