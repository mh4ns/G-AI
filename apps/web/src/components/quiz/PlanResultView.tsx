"use client";

import React, { useEffect, useRef, useState } from "react";
import { QuizResponses, PersonalizedPlanResult } from "@/types/quiz";
import { 
  
  CheckCircle2, 
  ArrowRight, 
  
  
  
  HeartHandshake, 
  Sparkles,
  ShieldCheck,
  
  
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
          : ["#FF5A36", "#10B981", "#F59E0B", "#F472B6"],
      });
    } catch {
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
  // The calorie floor can shrink the planned deficit, so show the real gap.
  const dailyCalorieGap = Math.abs(result.tdee - result.dailyCalorieTarget);

  // Mini Digital Twin Avatar Morphing Vector
  // Day 0: slouch, curved spine, wider waist. Day 28: upright spine, cinched waist.
  const progressRatio = previewDay / 28;
  const spineControlY = 70 + (1 - progressRatio) * 15; // Slouch at Day 0, upright at Day 28
  const waistWidth = 36 - progressRatio * (isMale ? 4 : 8); // Cinch waist
  const chestWidth = 42 + progressRatio * (isMale ? 6 : 2); // Broader chest

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-500 text-stone-900">
      {/* Top Trophy Banner */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2">
          Lộ trình 28 ngày: {isMale ? "sức mạnh & tăng cơ" : "Pilates & cơ lõi"}
        </h1>

        <p className="text-xs sm:text-sm max-w-lg mx-auto text-stone-600">
          Dành riêng cho {responses.gender === "male" ? "Nam giới" : "Nữ giới"} • {responses.age} tuổi • Không gian tập:{" "}
          <strong className={"text-stone-900"}>
            {responses.equipmentAccess === "gym" ? "Phòng gym" : "Tại nhà (thảm & dây kháng lực)"}
          </strong>
        </p>
      </div>

      {/* 1. Target Milestone Card with Trajectory Curve */}
      <div className="p-6 sm:p-7 rounded-3xl shadow-xl mb-6 relative overflow-hidden border bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 border-stone-800 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs text-brand">
              Dự kiến cán đích
            </span>
            <div className="text-2xl sm:text-4xl font-extrabold mt-1">
              {result.estimatedTargetDate}
            </div>
            <p className="text-stone-300 text-xs sm:text-sm mt-1">
              Trong <strong className="text-white font-bold">{result.estimatedWeeks} tuần</strong> để đạt mốc{" "}
              <strong className="font-bold text-brand">
                {responses.targetWeightKg} kg
              </strong>{" "}
              ({isLosing
                ? `giảm ${Math.abs(weightDiff)} kg, ăn ít hơn khoảng ${dailyCalorieGap} kcal mỗi ngày`
                : isGaining
                  ? `tăng ${Math.abs(weightDiff)} kg, ăn thêm khoảng ${dailyCalorieGap} kcal mỗi ngày`
                  : "giữ cân, tập trung vào sức mạnh và tư thế"}).
            </p>
          </div>

          <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 text-center self-stretch sm:self-auto shrink-0">
            <span className="text-xs text-stone-300 block ">Thời lượng</span>
            <span className="text-lg sm:text-xl font-extrabold text-white ">30–40 phút/ngày</span>
          </div>
        </div>

        {/* Dynamic Trajectory Curve Visualization */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between text-xs text-stone-300 mb-2">
            <span>Hôm nay ({responses.currentWeightKg} kg)</span>
            <span className="text-brand">
              Mục tiêu ({responses.targetWeightKg} kg)
            </span>
          </div>
          <svg className="w-full h-14 overflow-visible" viewBox="0 0 300 50">
            <path
              d={isLosing ? "M 10 10 Q 150 15 290 40" : "M 10 40 Q 150 35 290 10"}
              fill="none"
              stroke={"#FF5A36"}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="10" cy={isLosing ? 10 : 40} r="4.5" fill="#FFFFFF" />
            <circle cx="290" cy={isLosing ? 40 : 10} r="6" fill={"#FF5A36"} />
            <circle cx="290" cy={isLosing ? 40 : 10} r="4.5" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* 2. Mini Digital Twin Morphing Preview (The Aha! Moment) */}
      <div className="p-6 rounded-3xl border mb-6 bg-white border-stone-200/90 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-action" />
            <h3 className="font-bold text-sm text-stone-900">
              Xem trước dự đoán vóc dáng
            </h3>
          </div>

          <div role="group" aria-label="Chọn mốc xem trước" className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setPreviewDay(0)}
              aria-pressed={previewDay === 0}
              className={`min-h-11 px-3 rounded-lg text-sm font-semibold transition-colors ${
                previewDay === 0
                  ? "bg-brand-action text-white"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              Ngày 0 (Hiện tại)
            </button>
            <button
              onClick={() => setPreviewDay(28)}
              aria-pressed={previewDay === 28}
              className={`min-h-11 px-3 rounded-lg text-sm font-semibold transition-colors ${
                previewDay === 28
                  ? "bg-brand-action text-white"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              Ngày 28 (Mục tiêu)
            </button>
          </div>
        </div>

        {/* Morphing Silhouette Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-stone-50 p-4 rounded-2xl border border-stone-200">
          <div className="relative w-full h-44 flex items-center justify-center">
            <svg viewBox="0 0 100 160" className="w-28 h-40 overflow-visible">
              {/* Head */}
              <circle cx="50" cy="22" r="12" fill="none" stroke={"#FF5A36"} strokeWidth="2.5" />
              
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
                fill={"rgba(255, 107, 74, 0.15)"}
                stroke={"#FF5A36"}
                strokeWidth="2"
                className="transition-all duration-500 ease-out"
              />

              {/* Legs */}
              <line x1="42" y1="110" x2="38" y2="155" stroke={"#FF5A36"} strokeWidth="2.5" />
              <line x1="58" y1="110" x2="62" y2="155" stroke={"#FF5A36"} strokeWidth="2.5" />
            </svg>
          </div>

          <div className="sm:col-span-2 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900">Trạng thái:</span>
              <span className="text-brand-action font-medium">
                {previewDay === 0 ? "Ngày 0: điểm xuất phát" : "Ngày 28: tư thế lộ trình hướng tới"}
              </span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              Hình này minh họa hướng thay đổi tư thế mà giáo án nhắm tới, không phải số đo dự đoán của bạn. Kết quả thật phụ thuộc vào việc tập đều, ăn uống và giấc ngủ.
            </p>
            <Link
              href="/prediction"
              className="inline-flex items-center gap-1.5 font-bold hover:underline pt-1 text-brand-action"
            >
              <span>Mở dự đoán đầy đủ với thanh thời gian 28 ngày</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Golden Metabolic Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl border text-center bg-white border-stone-200/90 shadow-soft">
          <span className="text-xs font-bold block text-stone-500">BMI</span>
          <span className="text-xl sm:text-2xl font-extrabold block mt-0.5 text-stone-900">
            {result.bmi}
          </span>
          <span className="text-xs text-emerald-700 font-semibold">{result.bmiCategory}</span>
        </div>

        <div className="p-4 rounded-2xl border text-center bg-white border-stone-200/90 shadow-soft">
          <span className="text-xs font-bold block text-stone-500">Calo mỗi ngày</span>
          <span className="text-xl sm:text-2xl font-extrabold block mt-0.5 text-brand-action">
            {result.dailyCalorieTarget}
          </span>
          <span className="text-xs text-stone-500 ">kcal / ngày</span>
        </div>

        <div className="p-4 rounded-2xl border text-center bg-white border-stone-200/90 shadow-soft">
          <span className="text-xs font-bold block text-stone-500">BMR</span>
          <span className="text-xl sm:text-2xl font-extrabold block mt-0.5 text-stone-900">
            {result.bmr}
          </span>
          <span className="text-xs text-stone-500 ">kcal trao đổi</span>
        </div>

        <div className="p-4 rounded-2xl border text-center bg-white border-stone-200/90 shadow-soft">
          <span className="text-xs font-bold block text-stone-500">Nước uống</span>
          <span className="text-xl sm:text-2xl font-extrabold text-blue-500 block mt-0.5">
            {result.recommendedWaterMl}
          </span>
          <span className="text-xs text-stone-500 ">ml / ngày</span>
        </div>
      </div>

      {/* 4. Macro Split Cards */}
      <div className="p-5 rounded-3xl border mb-6 bg-white border-stone-200/90 shadow-card">
        <h4 className="text-xs font-bold mb-3 text-stone-700">
          Phân bổ dinh dưỡng vĩ mô (macronutrient split):
        </h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs text-amber-800 font-semibold block">Chất đạm (protein)</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-800">
              {result.macroSplit?.proteinG || 95}g
            </span>
            <span className="text-xs text-stone-600 block mt-0.5">Xây dựng & phục hồi cơ</span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs text-sky-800 font-semibold block">Tinh bột (carbs)</span>
            <span className="text-lg sm:text-xl font-extrabold text-sky-800">
              {result.macroSplit?.carbsG || 160}g
            </span>
            <span className="text-xs text-stone-600 block mt-0.5">Năng lượng tập luyện</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs text-rose-800 font-semibold block">Chất béo tốt (fat)</span>
            <span className="text-lg sm:text-xl font-extrabold text-rose-800">
              {result.macroSplit?.fatG || 40}g
            </span>
            <span className="text-xs text-stone-600 block mt-0.5">Nội tiết tố cân bằng</span>
          </div>
        </div>
      </div>

      {/* 5. Medical & Joint Safety Notes */}
      <div className="p-5 rounded-3xl border mb-6 bg-white border-stone-200/90 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-brand-action" />
          <h4 className="text-xs font-bold text-stone-700">
            Biện pháp bảo vệ khớp & an toàn vận động:
          </h4>
        </div>

        <div className="space-y-2">
          {result.safetyNotes?.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className={"text-stone-700"}>{note}</span>
            </div>
          ))}
          {result.excludedExercises?.length > 0 && (
            <div className="pt-2 mt-2 border-t border-stone-800/40 text-xs text-stone-500">
              <strong>Bài tập đã loại trừ khỏi giáo án:</strong> {result.excludedExercises.join(", ")}.
            </div>
          )}
        </div>
      </div>

      {/* 6. 4-Day Weekly Workout Routine Preview */}
      <div className="p-5 rounded-3xl border mb-8 bg-white border-stone-200/90 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-action" />
            <h4 className="text-xs font-bold text-stone-700">
              Lịch tập tuần (4 buổi / tuần):
            </h4>
          </div>
          <span className="text-xs text-stone-500">Chu kỳ 28 ngày</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.weeklyRoutine?.map((day) => (
            <div
              key={day.dayNumber}
              className="p-3.5 rounded-2xl border bg-stone-50 border-stone-200"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-peach-50 text-brand-action-hover">
                  Buổi {day.dayNumber}
                </span>
                <span className="text-xs text-stone-600">{day.durationMin} phút</span>
              </div>
              <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                {day.title}
              </h5>
              <p className="text-xs text-stone-500 mt-0.5">{day.target}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Dual Navigation Actions */}
      <div className="space-y-3">
        <Link
          href="/prediction"
          className="w-full py-4 px-6 rounded-full font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-98 bg-brand-action hover:bg-brand-action-hover text-white"
        >
          <Sparkles className="w-5 h-5 fill-white" />
          <span>Khám phá mô hình dự đoán 28 ngày (Digital Twin)</span>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <button
          onClick={onGoToDashboard}
          className="w-full py-3.5 px-6 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 border bg-white hover:bg-stone-50 border-stone-200 text-stone-700 hover:text-stone-900"
        >
          <span>Vào bảng luyện tập hôm nay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-stone-500 text-xs mt-6">
        <HeartHandshake className="w-4 h-4 text-brand-action" />
        <span>Calo được ước tính bằng công thức Mifflin-St Jeor. Đây không phải lời khuyên y khoa: hỏi bác sĩ trước khi tập nếu bạn có bệnh lý hoặc chấn thương.</span>
      </div>
    </div>
  );
};
