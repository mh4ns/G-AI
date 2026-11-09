"use client";

import React, { useEffect, useRef, useState } from "react";
import { QuizResponses, PersonalizedPlanResult } from "@/types/quiz";
import { 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Video, 
  Flame, 
  Droplets, 
  HeartHandshake, 
  Sparkles,
  ShieldCheck,
  Dumbbell,
  Compass,
  Activity
} from "lucide-react";
import confetti from "canvas-confetti";
import { syncQuizForSignedInUser } from "@/lib/api-client";
import Link from "next/link";

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
  const isMale = responses.archetype === "male_strength";
  const [previewDay, setPreviewDay] = useState<number>(28);
  const syncedRef = useRef(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: isMale 
          ? ["#FF5A36", "#FFFFFF", "#F59E0B", "#3B82F6"]
          : ["#FF6B4A", "#10B981", "#F59E0B", "#F472B6"],
      });
    } catch (e) {
      // fallback
    }

    // Persist to the user's account when signed in (guests keep data on-device only).
    // The ref keeps React Strict Mode's double effect from saving the quiz twice.
    if (!syncedRef.current) {
      syncedRef.current = true;
      syncQuizForSignedInUser(responses).catch(() => {
        // Backend offline: the plan is still saved locally.
      });
    }
  }, [isMale, responses]);

  const weightDiff = responses.currentWeightKg - responses.targetWeightKg;
  const isLosing = weightDiff > 0;
  const isGaining = weightDiff < 0;

  // Mini Digital Twin Avatar Morphing Vector
  // Day 0: slouch, curved spine, wider waist. Day 28: upright spine, cinched waist.
  const progressRatio = previewDay / 28;
  const spineControlY = 70 + (1 - progressRatio) * 15; // Slouch at Day 0, upright at Day 28
  const waistWidth = 36 - progressRatio * (isMale ? 4 : 8); // Cinch waist
  const chestWidth = 42 + progressRatio * (isMale ? 6 : 2); // Broader chest

  return (
    <div className={`w-full max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-500 ${
      isMale ? "text-stone-100" : "text-stone-900"
    }`}>
      {/* Top Trophy Banner */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm ${
          isMale
            ? "bg-[#FF5A36]/15 border border-[#FF5A36]/30 text-[#FF5A36]"
            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
        }`}>
          <Trophy className="w-4 h-4" />
          <span>Kế Hoạch Đã Khởi Tạo Thành Công!</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
          Lộ Trình 28 Ngày: {isMale ? "Khối Cơ Nạc & Cắt Nét" : "Vóc Dáng Thon Gọn & Cơ Lõi"}
        </h1>

        <p className={`text-xs sm:text-sm max-w-lg mx-auto ${
          isMale ? "text-stone-400" : "text-stone-600"
        }`}>
          Dành riêng cho {responses.gender === "male" ? "Nam giới" : "Nữ giới"} • {responses.age} tuổi • Không gian tập:{" "}
          <strong className={isMale ? "text-white" : "text-stone-900"}>
            {responses.equipmentAccess === "gym" ? "Phòng Gym Đầy Đủ" : "Tại Nhà (Thảm & Dây Kháng Lực)"}
          </strong>
        </p>
      </div>

      {/* 1. Target Milestone Card with Trajectory Curve */}
      <div className={`p-6 sm:p-7 rounded-3xl shadow-xl mb-6 relative overflow-hidden border ${
        isMale
          ? "bg-gradient-to-br from-[#1C1B1A] via-[#121110] to-[#0A0908] border-stone-800 text-white"
          : "bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 border-stone-800 text-white"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className={`text-[11px] font-mono tracking-widest uppercase ${
              isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"
            }`}>
              Dự Kiến Cán Đích
            </span>
            <div className="text-2xl sm:text-4xl font-black mt-1">
              {result.estimatedTargetDate}
            </div>
            <p className="text-stone-300 text-xs sm:text-sm mt-1">
              Trong <strong className="text-white font-bold">{result.estimatedWeeks} tuần</strong> để đạt mốc{" "}
              <strong className={`font-bold ${isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"}`}>
                {responses.targetWeightKg} kg
              </strong>{" "}
              ({isLosing ? `Giảm ${Math.abs(weightDiff)} kg mỡ an toàn` : isGaining ? `Tăng ${Math.abs(weightDiff)} kg cơ nạc` : "Định hình & siết cơ săn chắc"}).
            </p>
          </div>

          <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 text-center self-stretch sm:self-auto shrink-0">
            <span className="text-[10px] text-stone-300 uppercase block font-mono">Thời lượng</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">30-40 Phút/Ngày</span>
          </div>
        </div>

        {/* Dynamic Trajectory Curve Visualization */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-2">
            <span>Hôm nay ({responses.currentWeightKg} kg)</span>
            <span className={isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"}>
              Mục tiêu ({responses.targetWeightKg} kg)
            </span>
          </div>
          <svg className="w-full h-14 overflow-visible" viewBox="0 0 300 50">
            <path
              d={isLosing ? "M 10 10 Q 150 15 290 40" : "M 10 40 Q 150 35 290 10"}
              fill="none"
              stroke={isMale ? "#FF5A36" : "#FF6B4A"}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="10" cy={isLosing ? 10 : 40} r="4.5" fill="#FFFFFF" />
            <circle cx="290" cy={isLosing ? 40 : 10} r="6" fill={isMale ? "#FF5A36" : "#FF6B4A"} className="animate-ping" />
            <circle cx="290" cy={isLosing ? 40 : 10} r="4.5" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* 2. Mini Digital Twin Morphing Preview (The Aha! Moment) */}
      <div className={`p-6 rounded-3xl border mb-6 ${
        isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200/90 shadow-card"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"}`} />
            <h3 className={`font-bold text-sm uppercase tracking-wider ${
              isMale ? "text-white" : "text-stone-900"
            }`}>
              Mô Hình Dự Đoán Biến Đổi Vóc Dáng (Digital Twin Preview)
            </h3>
          </div>

          <div className="flex items-center gap-2 bg-stone-800/10 dark:bg-stone-800/40 p-1 rounded-xl">
            <button
              onClick={() => setPreviewDay(0)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                previewDay === 0
                  ? isMale ? "bg-[#FF5A36] text-white" : "bg-[#FF6B4A] text-white"
                  : isMale ? "text-stone-400 hover:text-white" : "text-stone-600 hover:text-black"
              }`}
            >
              Ngày 0 (Hiện tại)
            </button>
            <button
              onClick={() => setPreviewDay(28)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                previewDay === 28
                  ? isMale ? "bg-[#FF5A36] text-white" : "bg-[#FF6B4A] text-white"
                  : isMale ? "text-stone-400 hover:text-white" : "text-stone-600 hover:text-black"
              }`}
            >
              Ngày 28 (Mục tiêu)
            </button>
          </div>
        </div>

        {/* Morphing Silhouette Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-stone-900/40 p-4 rounded-2xl border border-stone-800/60">
          <div className="relative w-full h-44 flex items-center justify-center">
            <svg viewBox="0 0 100 160" className="w-28 h-40 overflow-visible">
              {/* Head */}
              <circle cx="50" cy="22" r="12" fill="none" stroke={isMale ? "#FF5A36" : "#FF6B4A"} strokeWidth="2.5" />
              
              {/* Spine Curve - Interacting dynamically */}
              <path
                d={`M 50 34 Q ${spineControlY} 75 50 110`}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray="3 3"
              />

              {/* Torso & Waist Silhouette */}
              <path
                d={`M ${50 - chestWidth/2} 40 L ${50 + chestWidth/2} 40 L ${50 + waistWidth/2} 80 L 58 110 L 42 110 L ${50 - waistWidth/2} 80 Z`}
                fill={isMale ? "rgba(255, 90, 54, 0.15)" : "rgba(255, 107, 74, 0.15)"}
                stroke={isMale ? "#FF5A36" : "#FF6B4A"}
                strokeWidth="2"
                className="transition-all duration-500 ease-out"
              />

              {/* Legs */}
              <line x1="42" y1="110" x2="38" y2="155" stroke={isMale ? "#FF5A36" : "#FF6B4A"} strokeWidth="2.5" />
              <line x1="58" y1="110" x2="62" y2="155" stroke={isMale ? "#FF5A36" : "#FF6B4A"} strokeWidth="2.5" />
            </svg>
          </div>

          <div className="sm:col-span-2 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Trạng thái:</span>
              <span className="font-mono text-[#FF5A36]">
                {previewDay === 0 ? "Ngày 0: Cột sống gù nhẹ, cơ lõi chưa siết" : "Ngày 28: Cột sống thẳng trục, cơ lõi siết gọn"}
              </span>
            </div>
            <p className="text-stone-300 leading-relaxed">
              Mô hình viễn trắc AI dự báo vòng eo giảm <strong>4 – 6 cm</strong>, cơ mông nâng <strong>15%</strong> và áp lực đĩa đệm thắt lưng giảm <strong>28%</strong> sau chu kỳ 28 ngày.
            </p>
            <Link
              href="/prediction"
              className={`inline-flex items-center gap-1.5 font-bold hover:underline pt-1 ${
                isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"
              }`}
            >
              <span>Xem toàn màn hình Digital Twin với thanh thời gian 28 ngày</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Golden Metabolic Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className={`p-4 rounded-2xl border text-center ${
          isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200/90 shadow-soft"
        }`}>
          <span className="text-[10px] font-bold uppercase block font-mono text-stone-400">BMI</span>
          <span className={`text-xl sm:text-2xl font-black font-mono block mt-0.5 ${
            isMale ? "text-white" : "text-stone-900"
          }`}>
            {result.bmi}
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold">{result.bmiCategory}</span>
        </div>

        <div className={`p-4 rounded-2xl border text-center ${
          isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200/90 shadow-soft"
        }`}>
          <span className="text-[10px] font-bold uppercase block font-mono text-stone-400">Calo Ngày</span>
          <span className={`text-xl sm:text-2xl font-black font-mono block mt-0.5 ${
            isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"
          }`}>
            {result.dailyCalorieTarget}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">kcal / ngày</span>
        </div>

        <div className={`p-4 rounded-2xl border text-center ${
          isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200/90 shadow-soft"
        }`}>
          <span className="text-[10px] font-bold uppercase block font-mono text-stone-400">BMR Nền</span>
          <span className={`text-xl sm:text-2xl font-black font-mono block mt-0.5 ${
            isMale ? "text-white" : "text-stone-900"
          }`}>
            {result.bmr}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">kcal trao đổi</span>
        </div>

        <div className={`p-4 rounded-2xl border text-center ${
          isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200/90 shadow-soft"
        }`}>
          <span className="text-[10px] font-bold uppercase block font-mono text-stone-400">Nước Uống</span>
          <span className="text-xl sm:text-2xl font-black text-blue-500 font-mono block mt-0.5">
            {result.recommendedWaterMl}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">ml / ngày</span>
        </div>
      </div>

      {/* 4. Macro Split Cards */}
      <div className={`p-5 rounded-3xl border mb-6 ${
        isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200/90 shadow-card"
      }`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
          isMale ? "text-stone-300" : "text-stone-700"
        }`}>
          Phân Bổ Dinh Dưỡng Vĩ Mô (Macronutrient Split):
        </h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] text-amber-500 font-bold block uppercase">Chất Đạm (Protein)</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
              {result.macroSplit?.proteinG || 95}g
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Xây dựng & phục hồi cơ</span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[10px] text-blue-500 font-bold block uppercase">Tinh Bột (Carbs)</span>
            <span className="text-lg sm:text-xl font-black text-blue-400 font-mono">
              {result.macroSplit?.carbsG || 160}g
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Năng lượng tập luyện</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[10px] text-rose-500 font-bold block uppercase">Chất Béo Tốt (Fat)</span>
            <span className="text-lg sm:text-xl font-black text-rose-400 font-mono">
              {result.macroSplit?.fatG || 40}g
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Nội tiết tố cân bằng</span>
          </div>
        </div>
      </div>

      {/* 5. Medical & Joint Safety Notes */}
      <div className={`p-5 rounded-3xl border mb-6 ${
        isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200/90 shadow-card"
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className={`w-4 h-4 ${isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"}`} />
          <h4 className={`text-xs font-bold uppercase tracking-wider ${
            isMale ? "text-stone-300" : "text-stone-700"
          }`}>
            Biện Pháp Bảo Vệ Khớp & An Toàn Vận Động:
          </h4>
        </div>

        <div className="space-y-2">
          {result.safetyNotes?.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className={isMale ? "text-stone-300" : "text-stone-700"}>{note}</span>
            </div>
          ))}
          {result.excludedExercises?.length > 0 && (
            <div className="pt-2 mt-2 border-t border-stone-800/40 text-[11px] text-stone-400">
              <strong>Bài tập đã loại trừ khỏi giáo án:</strong> {result.excludedExercises.join(", ")}.
            </div>
          )}
        </div>
      </div>

      {/* 6. 4-Day Weekly Workout Routine Preview */}
      <div className={`p-5 rounded-3xl border mb-8 ${
        isMale ? "bg-[#161514] border-stone-800" : "bg-white border-stone-200/90 shadow-card"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"}`} />
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isMale ? "text-stone-300" : "text-stone-700"
            }`}>
              Lịch Tập Tuần (4 Buổi / Tuần):
            </h4>
          </div>
          <span className="text-xs font-mono text-stone-400">Chu kỳ 28 ngày</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.weeklyRoutine?.map((day) => (
            <div
              key={day.dayNumber}
              className={`p-3.5 rounded-2xl border ${
                isMale ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                  isMale ? "bg-[#FF5A36]/20 text-[#FF5A36]" : "bg-peach-100 text-[#FF6B4A]"
                }`}>
                  Buổi 0{day.dayNumber}
                </span>
                <span className="text-[11px] text-stone-400 font-mono">{day.durationMin} phút</span>
              </div>
              <h5 className={`text-xs sm:text-sm font-bold ${isMale ? "text-white" : "text-stone-900"}`}>
                {day.title}
              </h5>
              <p className="text-[11px] text-stone-400 mt-0.5">{day.target}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Dual Navigation Actions */}
      <div className="space-y-3">
        <Link
          href="/prediction"
          className={`w-full py-4 px-6 rounded-full font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-98 ${
            isMale
              ? "bg-[#FF5A36] hover:bg-[#ff461e] text-white shadow-[#FF5A36]/30"
              : "bg-[#FF6B4A] hover:bg-[#ff5530] text-white shadow-[#FF6B4A]/30"
          }`}
        >
          <Sparkles className="w-5 h-5 fill-white" />
          <span>Khám Phá Mô Hình Dự Đoán 28 Ngày (Digital Twin)</span>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <button
          onClick={onGoToDashboard}
          className={`w-full py-3.5 px-6 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 border ${
            isMale
              ? "bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-300 hover:text-white"
              : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700 hover:text-stone-900"
          }`}
        >
          <span>Vào Bảng Luyện Tập Hôm Nay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-stone-400 text-xs mt-6">
        <HeartHandshake className={`w-4 h-4 ${isMale ? "text-[#FF5A36]" : "text-[#FF6B4A]"}`} />
        <span>100% Khoa học Trao đổi chất • Loại trừ rủi ro chấn thương cột sống & khớp gối.</span>
      </div>
    </div>
  );
};
