"use client";

import React, { useEffect } from "react";
import { QuizResponses, PersonalizedPlanResult } from "@/types/quiz";
import { Trophy, Calendar, CheckCircle2, ArrowRight, Video, Flame, Droplets, HeartHandshake } from "lucide-react";
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
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#FF5A36", "#10B981", "#F59E0B", "#8B5CF6"],
      });
    } catch (e) {
      // fallback
    }
  }, []);

  const weightDiff = responses.currentWeightKg - responses.targetWeightKg;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Top Trophy Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3 shadow-sm">
          <Trophy className="w-4 h-4 text-emerald-600" />
          <span>Kế Hoạch Đã Sẵn Sàng!</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Lộ Trình Của Bạn: 28 Ngày Vóc Dáng Mới
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
          Dựa trên độ tuổi {responses.age} và các vùng tập trung, giáo án Wall & Mat Pilates đã được tối ưu hóa.
        </p>
      </div>

      {/* Target Milestone Card with Trajectory Curve */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-[#FF5A36] uppercase">
              Dự Kiến Cán Đích
            </span>
            <div className="text-2xl sm:text-3xl font-black mt-1">
              {result.estimatedTargetDate}
            </div>
            <p className="text-stone-300 text-xs mt-1">
              Chỉ trong <strong className="text-white font-bold">{result.estimatedWeeks} tuần</strong> để đạt mốc{" "}
              <strong className="text-[#FF5A36] font-bold">{responses.targetWeightKg} kg</strong> (Giảm {Math.abs(weightDiff)} kg an toàn).
            </p>
          </div>

          <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 text-center self-stretch sm:self-auto">
            <span className="text-[10px] text-stone-300 uppercase block font-mono">Thời gian/ngày</span>
            <span className="text-xl font-black text-white font-mono">15-20 Phút</span>
          </div>
        </div>

        {/* Dynamic Trajectory Curve Visualization (SVG Graph) */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between text-[11px] font-mono text-stone-400 mb-2">
            <span>Hôm nay ({responses.currentWeightKg} kg)</span>
            <span className="text-[#FF5A36]">Mục tiêu ({responses.targetWeightKg} kg)</span>
          </div>
          <svg className="w-full h-16 overflow-visible" viewBox="0 0 300 60">
            <path
              d="M 10 15 Q 150 20 290 50"
              fill="none"
              stroke="#FF5A36"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="10" cy="15" r="4" fill="#FFFFFF" />
            <circle cx="290" cy="50" r="5" fill="#FF5A36" className="animate-ping" />
            <circle cx="290" cy="50" r="4" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* 4 Golden Health Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-soft text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase block font-mono">BMI</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono block mt-0.5">
            {result.bmi}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">{result.bmiCategory}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-soft text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase block font-mono">Mục Tiêu Calo</span>
          <span className="text-xl sm:text-2xl font-black text-[#FF5A36] font-mono block mt-0.5">
            {result.dailyCalorieTarget}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">kcal/ngày</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-soft text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase block font-mono">Năng Lượng Nền</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono block mt-0.5">
            {result.bmr}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">BMR kcal</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-soft text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase block font-mono">Nước Uống</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono block mt-0.5">
            {result.recommendedWaterMl}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">ml/ngày</span>
        </div>
      </div>

      {/* AI Live PT Webcam Companion Spotlight */}
      <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-card mb-8">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#FF5A36] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Video className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-stone-900 text-base">
              Tập Cùng Trợ Lý AI Live PT Qua Camera
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Bạn chỉ cần đặt điện thoại hoặc mở webcam máy tính. Trợ lý AI sẽ:
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 font-medium">
              <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Nhận diện và sửa võng lưng, sai khớp gối</span>
              </div>
              <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tự động đếm rep khi thực hiện đúng biên độ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action to Enter Today Dashboard */}
      <button
        onClick={onGoToDashboard}
        className="w-full py-4 px-6 rounded-full bg-[#FF5A36] hover:bg-[#E64E2B] text-white font-black text-base sm:text-lg shadow-soft hover:shadow-card transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2.5"
      >
        <span>Bắt Đầu Hành Trình Ngay Hôm Nay</span>
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="flex items-center justify-center gap-2 text-stone-400 text-xs mt-4">
        <HeartHandshake className="w-4 h-4 text-[#FF5A36]" />
        <span>100% khoa học trao đổi chất • Không ép cân hay dùng thuốc giảm cân.</span>
      </div>
    </div>
  );
};
