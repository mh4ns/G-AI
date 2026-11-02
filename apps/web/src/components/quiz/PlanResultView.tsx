"use client";

import React, { useEffect } from "react";
import { QuizResponses, PersonalizedPlanResult } from "@/types/quiz";
import { Flame, Droplets, Trophy, Calendar, Sparkles, CheckCircle2, ArrowRight, Video, HeartHandshake } from "lucide-react";
import confetti from "canvas-confetti";

interface PlanResultViewProps {
  responses: QuizResponses;
  result: PersonalizedPlanResult;
  onGoToDashboard: () => void;
}

export const PlanResultView: React.FC<PlanResultViewProps> = ({
  responses,
  result,
  onGoToDashboard,
}) => {
  useEffect(() => {
    // Launch festive confetti celebration on load
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FF6542", "#60B88B", "#FBBF24", "#A78BFA"],
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  const weightChange = responses.targetWeightKg - responses.currentWeightKg;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 animate-in fade-in duration-500">
      {/* Celebration Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3 shadow-sm">
          <Trophy className="w-4 h-4 text-emerald-600" />
          Kế Hoạch Đã Khởi Tạo Thành Công!
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-800 tracking-tight">
          Lộ Trình Thay Đổi Vóc Dáng Của Bạn
        </h1>
        <p className="text-stone-500 text-sm sm:text-base mt-2 max-w-lg mx-auto">
          Dựa trên chỉ số trao đổi chất, đây là kế hoạch khoa học và an toàn nhất để bạn đạt phong độ tốt nhất.
        </p>
      </div>

      {/* Target Date Milestone Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-peach-500 via-peach-600 to-amber-600 text-white shadow-soft mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-peach-100 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              Mục tiêu thời gian hoàn thành
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-1">
              {result.estimatedTargetDate}
            </div>
            <p className="text-peach-100 text-xs sm:text-sm mt-1">
              Chỉ trong khoảng <span className="font-bold underline text-white">{result.estimatedWeeks} tuần</span> để đạt mốc{" "}
              <span className="font-bold text-white">{responses.targetWeightKg} kg</span>!
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl text-center self-stretch sm:self-auto border border-white/20">
            <div className="text-xs text-peach-100 font-medium">Mục tiêu cân nặng</div>
            <div className="text-2xl font-black">
              {weightChange < 0 ? `-${Math.abs(weightChange)}` : `+${weightChange}`} kg
            </div>
          </div>
        </div>
      </div>

      {/* 4 Golden Health Numbers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card text-center">
          <div className="w-8 h-8 rounded-lg bg-peach-50 text-peach-500 mx-auto flex items-center justify-center mb-1.5">
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-stone-400 font-semibold uppercase">Calo Nạp Ngày</div>
          <div className="text-xl font-bold text-stone-800 mt-0.5">{result.dailyCalorieTarget}</div>
          <div className="text-[11px] text-stone-400">kcal / ngày</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card text-center">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-1.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-stone-400 font-semibold uppercase">Chuyển hóa (BMR)</div>
          <div className="text-xl font-bold text-stone-800 mt-0.5">{result.bmr}</div>
          <div className="text-[11px] text-stone-400">kcal tiêu hao cơ bản</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center mb-1.5">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-stone-400 font-semibold uppercase">Chỉ số BMI</div>
          <div className="text-xl font-bold text-stone-800 mt-0.5">{result.bmi}</div>
          <div className="text-[11px] text-emerald-600 font-medium">{result.bmiCategory}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card text-center">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 mx-auto flex items-center justify-center mb-1.5">
            <Droplets className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-stone-400 font-semibold uppercase">Nước uống</div>
          <div className="text-xl font-bold text-stone-800 mt-0.5">{(result.recommendedWaterMl / 1000).toFixed(1)}L</div>
          <div className="text-[11px] text-stone-400">mỗi ngày</div>
        </div>
      </div>

      {/* AI Companion Spotlight Feature Card */}
      <div className="p-5 rounded-3xl bg-white border border-peach-200/90 shadow-card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-peach-500 to-peach-400 text-white flex items-center justify-center shrink-0 shadow-soft">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-800 text-base sm:text-lg">
                Người Bạn AI Live Companion Sẵn Sàng Đồng Hành!
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-peach-100 text-peach-700 rounded-full uppercase">
                Mới
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
              Bạn không còn phải tập một mình. Bật webcam hoặc camera điện thoại, AI sẽ:
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 font-medium">
              <div className="flex items-center gap-2 bg-peach-50/50 p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-peach-500 shrink-0" />
                <span>Nhận diện và sửa tư thế gù lưng / lệch gối</span>
              </div>
              <div className="flex items-center gap-2 bg-peach-50/50 p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-peach-500 shrink-0" />
                <span>Tự động đếm rep khi thực hiện đủ chuẩn</span>
              </div>
              <div className="flex items-center gap-2 bg-peach-50/50 p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-peach-500 shrink-0" />
                <span>Hạ nhạc nền bài tập để lên tiếng khích lệ</span>
              </div>
              <div className="flex items-center gap-2 bg-peach-50/50 p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-peach-500 shrink-0" />
                <span>Trò chuyện CBT xoa dịu cảm giác thèm ngọt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Areas Selected */}
      <div className="mb-8">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
          Các vùng tập trung ưu tiên trong giáo án:
        </div>
        <div className="flex flex-wrap gap-2">
          {result.focusHighlights.map((hl) => (
            <span
              key={hl}
              className="px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-700 font-medium text-xs border border-stone-200"
            >
              ✓ {hl}
            </span>
          ))}
          <span className="px-3.5 py-1.5 rounded-full bg-peach-50 text-peach-700 font-medium text-xs border border-peach-200">
            4 buổi tập/tuần • 3 ngày nghỉ phục hồi
          </span>
        </div>
      </div>

      {/* Call to Action Button */}
      <button
        onClick={onGoToDashboard}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-peach-500 via-peach-600 to-amber-600 hover:from-peach-600 hover:to-amber-700 text-white font-bold text-base sm:text-lg shadow-soft hover:shadow-glow transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2.5"
      >
        <span>Bắt Đầu Hành Trình Ngay Hôm Nay</span>
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="flex items-center justify-center gap-1.5 text-stone-400 text-xs mt-4">
        <HeartHandshake className="w-4 h-4 text-peach-500" />
        <span>Cam kết 100% khoa học, không ép cân cực đoan hay dùng thực phẩm chức năng.</span>
      </div>
    </div>
  );
};
