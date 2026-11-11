"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass, Flame, UserCheck, ArrowRight, Target, Activity } from "lucide-react";
import { SEMANTIC_COLORS } from "@/lib/design-tokens";

interface TelemetryHudProps {
  progress: number; // 0 to 1
  currentDay: number; // 0, 7, 14, 28
  activeHotspot: string | null;
  userWeight?: number;
  targetWeight?: number;
  /** TDEE minus the plan's daily calorie target, from the saved plan. */
  dailyCalorieGapKcal?: number;
  onJumpToTarget?: () => void;
}

// Hook for smooth number animation on milestone changes (disabled when prefers-reduced-motion)
function useAnimatedNumber(
  targetValue: number,
  decimals: number = 1,
  duration: number = 320
): string {
  const [current, setCurrent] = useState<number>(targetValue);
  const prevRef = useRef<number>(targetValue);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setCurrent(targetValue);
      prevRef.current = targetValue;
      return;
    }

    const start = prevRef.current;
    const end = targetValue;
    if (start === end) return;

    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      const val = start + (end - start) * ease;
      setCurrent(val);

      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [targetValue, duration]);

  return current.toFixed(decimals);
}

export const TelemetryHud: React.FC<TelemetryHudProps> = ({
  currentDay,
  activeHotspot,
  userWeight,
  targetWeight,
  dailyCalorieGapKcal,
  onJumpToTarget,
}) => {
  // Step 8: Tabbed chips for 3 Focus Changes (cervical, waist, lifestyle)
  const [selectedFocusTab, setSelectedFocusTab] = useState<"cervical" | "waist" | "lifestyle">("cervical");

  // Determine active milestone index (0: Day 0, 1: Day 7, 2: Day 14, 3: Day 28)
  const milestoneIdx =
    currentDay <= 3 ? 0 : currentDay <= 10 ? 1 : currentDay <= 20 ? 2 : 3;

  // Weight follows the plan's own maths (quiz-calculations.ts): the daily
  // calorie gap over ~7700 kcal per kg lost or ~5500 per kg gained, never past
  // the target. Waist and posture are not measured anywhere yet, so they get no
  // predicted numbers.
  const MILESTONE_DAYS = [0, 7, 14, 28];
  const milestoneDay = MILESTONE_DAYS[milestoneIdx];
  const hasWeight = !!userWeight && userWeight > 0;
  const baseWeight = hasWeight ? (userWeight as number) : 0;
  const goalDelta = hasWeight && targetWeight && targetWeight > 0 ? targetWeight - baseWeight : 0;
  const kcalPerKg = goalDelta < 0 ? 7700 : 5500;
  const hasProjection = goalDelta !== 0 && !!dailyCalorieGapKcal && dailyCalorieGapKcal > 0;
  const projectedChange = hasProjection
    ? Math.min(Math.abs(goalDelta), ((dailyCalorieGapKcal as number) * milestoneDay) / kcalPerKg)
    : 0;
  const projectedWeight = baseWeight + Math.sign(goalDelta) * projectedChange;
  const remainingKg = Math.abs(goalDelta) - projectedChange;

  const animWeight = useAnimatedNumber(projectedWeight, 1);
  const animWeightDelta = useAnimatedNumber(projectedChange, 1);

  const weightNote = !hasWeight
    ? "Làm khảo sát để có dự đoán cân nặng"
    : milestoneIdx === 0
      ? "Cân nặng bạn nhập trong khảo sát"
      : goalDelta === 0
        ? "Giữ cân: lộ trình tập trung vào sức mạnh và tư thế"
        : !hasProjection
          ? "Làm lại khảo sát để có dự đoán theo lượng calo"
          : remainingKg <= 0.05
            ? "Đạt cân nặng mục tiêu"
            : `Còn khoảng ${remainingKg.toFixed(1)} kg tới mục tiêu`;

  // Dynamic milestone data with prediction ranges (Step 4, 6, 7)
  const milestoneData = [
    {
      mainTitle: "Ngày 0: điểm xuất phát",
      stageName: "Ngày 0",
      cervicalText: "Tuần đầu, để ý tư thế cổ và vai khi ngồi làm việc: đầu có đưa ra trước, vai có cuộn vào không.",
      waistText: "Đo vòng eo ngang rốn hôm nay để có mốc so sánh. Đo lại mỗi tuần, cùng giờ.",
      lifestyleText: "Ghi lại lúc nào trong ngày bạn thấy mỏi cổ, mỏi lưng nhất.",
      coachInsight:
        "Bắt đầu nhẹ: học thở đúng và nhận biết tư thế. Tuần này chưa cần tập nặng.",
    },
    {
      mainTitle: "Tuần 1: làm quen",
      stageName: "Tuần 1",
      cervicalText: "Mục tiêu tuần: mở vai sang hai bên và giảm thói quen chúi đầu khi nhìn màn hình.",
      waistText: "Mục tiêu tuần: học cách gồng cơ bụng sâu khi thở ra, giữ lưng dưới không ưỡn.",
      lifestyleText: "Đứng dậy vận động vài phút sau mỗi giờ ngồi.",
      coachInsight:
        "Tuần đầu cơ thể đang làm quen. Nếu bài nào gây đau (không phải mỏi cơ), hãy dừng bài đó.",
    },
    {
      mainTitle: "Tuần 2: căn chỉnh",
      stageName: "Tuần 2",
      cervicalText: "Mục tiêu tuần: giữ đầu gần trục cơ thể và thả lỏng vai trong lúc tập.",
      waistText: "Mục tiêu tuần: giữ cơ bụng sâu hoạt động suốt bài, không chỉ lúc gập bụng.",
      lifestyleText: "Để ý tư thế khi ngồi làm việc: lưng tựa, hai chân chạm sàn.",
      coachInsight:
        "Giữ nhịp tập đều quan trọng hơn tập nặng. Cân nặng có thể dao động theo ngày, hãy nhìn xu hướng theo tuần.",
    },
    {
      mainTitle: "Ngày 28: hoàn thành chu kỳ đầu",
      stageName: "Ngày 28",
      cervicalText: "Mục tiêu chu kỳ: giữ được tư thế cổ và vai đúng mà không phải nghĩ tới.",
      waistText: "So sánh số đo vòng eo hôm nay với Ngày 0 để thấy thay đổi thật của bạn.",
      lifestyleText: "Ghi lại những gì đã khác so với Ngày 0: giấc ngủ, mức mỏi, tư thế khi ngồi.",
      coachInsight:
        "Hết 28 ngày, hãy xem lại số đo và cảm nhận của mình rồi đặt mục tiêu cho chu kỳ tiếp theo.",
    },
  ];

  const current = milestoneData[milestoneIdx];

  // Hotspot details with strict Step 6 Semantic Colors
  const hotspotDetails: Record<
    string,
    { title: string; color: string; desc: string; tip: string }
  > = {
    cervical: {
      title: "Vùng Cổ & Vai Gáy",
      color: SEMANTIC_COLORS.hotspots.cervical.color,
      desc: "Kéo giãn cổ, đưa đầu về gần trục cơ thể và hạ vai đang cuộn về trước.",
      tip: "Bài tập trọng tâm: Pilates Chin Tuck & Kéo giãn mở khớp vai cạnh tường.",
    },
    thoracic: {
      title: "Lưng Trên & Khớp Ngực",
      color: SEMANTIC_COLORS.hotspots.thoracic.color,
      desc: "Kéo giãn cơ ngực lớn, tăng sức bền nhóm cơ trám (Rhomboids) để giảm dáng gù lưng.",
      tip: "Bài tập trọng tâm: Mở ngực trên thảm Foam Roller & Swan Dive nhẹ nhàng.",
    },
    core: {
      title: "Cơ Bụng Sâu & Thắt Lưng",
      color: SEMANTIC_COLORS.hotspots.core.color,
      desc: "Tập cơ ngang bụng, nhóm cơ giữ cho thân người vững khi bạn vận động.",
      tip: "Bài tập trọng tâm: Nhịp thở sườn bên Pilates & The Hundred giữ trục.",
    },
    pelvis: {
      title: "Khung Chậu & Cơ Mông",
      color: SEMANTIC_COLORS.hotspots.pelvis.color,
      desc: "Tập cơ mông và cơ bụng để giảm tư thế võng lưng (nghiêng chậu ra trước).",
      tip: "Bài tập trọng tâm: Pelvic Glute Bridge & Cân bằng hông Quadruped.",
    },
  };

  const selectedHotspot = activeHotspot ? hotspotDetails[activeHotspot] : null;

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Dynamic Header Banner + Always-Visible "Mục Tiêu Day 28" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: SEMANTIC_COLORS.success }}
          />
          <h4 className="text-sm font-bold text-stone-100 tracking-normal">
            {current.mainTitle}
          </h4>
        </div>

        {/* Dedicated Always-Visible Target Button */}
        <button
          onClick={onJumpToTarget}
          className="px-3.5 py-1.5 rounded-full bg-[#FF5A36]/15 hover:bg-[#FF5A36]/25 border border-[#FF5A36]/40 text-[#FF5A36] hover:text-white text-xs font-semibold flex items-center justify-between sm:justify-start gap-1.5 transition-all active:scale-95 shadow-sm self-start sm:self-auto"
          title="Xem mốc Ngày 28"
          aria-label="Xem mốc Ngày 28"
        >
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>Mục tiêu:</span>
            <strong className="text-white font-mono tabular-nums">
              {targetWeight ? `${targetWeight} kg` : "--"}
            </strong>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[#FF5A36]" />
        </button>
      </div>

      {/* 2. Step 4: Metric Area with Delta, Prediction Ranges & Circular Progress Ring */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric A: Weight, projected from the plan's calorie gap */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-300 mb-1.5">
              <span className="text-xs font-semibold">Cân nặng</span>
              <Flame className="w-3.5 h-3.5 text-[#FF5A36]" />
            </div>

            {hasWeight ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-mono tabular-nums text-stone-400 text-sm">
                  {baseWeight.toFixed(1)}
                </span>
                <span className="text-stone-400 text-xs">→</span>
                <span className="font-mono tabular-nums text-white text-2xl sm:text-3xl font-black">
                  {animWeight}
                </span>
                <span className="text-stone-300 text-xs">kg</span>

                {projectedChange > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-mono tabular-nums font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {goalDelta < 0 ? "▼" : "▲"}
                    {animWeightDelta}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xl font-black text-stone-400">Chưa có</span>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-stone-800/80">
            <span className="text-xs text-stone-400 block font-medium">Ước tính theo lượng calo của lộ trình:</span>
            <span className="text-xs text-emerald-400 font-semibold block">{weightNote}</span>
          </div>
        </div>

        {/* Metric B: Waistline. Nothing measures it yet, so no prediction. */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-300 mb-1.5">
              <span className="text-xs font-semibold">Vòng eo</span>
              <Compass className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="text-xl font-black text-stone-400">Chưa đo</span>
          </div>

          <div className="mt-3 pt-2 border-t border-stone-800/80">
            <span className="text-xs text-stone-300 block">
              Đo ngang rốn mỗi tuần, cùng giờ, để thấy thay đổi thật của bạn.
            </span>
          </div>
        </div>

        {/* Metric C: Posture. Only a camera session measures form. */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-300 mb-1.5">
              <span className="text-xs font-semibold">Tư thế</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xl font-black text-stone-400">Chưa chấm</span>
          </div>

          <div className="mt-3 pt-2 border-t border-stone-800/80">
            <span className="text-xs text-stone-300 block">
              Tập với camera AI để có điểm form của từng buổi tập.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Step 8: Focus Changes converted into Tabbed Chips (Chỉ hiện mốc đang chọn) */}
      <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-stone-300">
            Trọng tâm cải thiện ở {current.stageName}:
          </span>

          {/* Tabbed Chips */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-stone-950/80 border border-stone-800/80 text-xs">
            <button
              type="button"
              onClick={() => setSelectedFocusTab("cervical")}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                selectedFocusTab === "cervical"
                  ? "bg-[#FF5A36] text-white font-bold shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Cổ & vai gáy
            </button>
            <button
              type="button"
              onClick={() => setSelectedFocusTab("waist")}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                selectedFocusTab === "waist"
                  ? "bg-[#FF5A36] text-white font-bold shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Vòng bụng & eo
            </button>
            <button
              type="button"
              onClick={() => setSelectedFocusTab("lifestyle")}
              className={`px-3 py-1 rounded-lg transition-all font-medium ${
                selectedFocusTab === "lifestyle"
                  ? "bg-[#FF5A36] text-white font-bold shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Cảm nhận thực tế
            </button>
          </div>
        </div>

        {/* Selected Focus Content Detail */}
        <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/60 text-sm text-stone-200 leading-relaxed transition-all min-h-[56px] flex items-center">
          {selectedFocusTab === "cervical" && (
            <p className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5A36] mt-1.5 shrink-0" />
              <span>{current.cervicalText}</span>
            </p>
          )}
          {selectedFocusTab === "waist" && (
            <p className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 shrink-0" />
              <span>{current.waistText}</span>
            </p>
          )}
          {selectedFocusTab === "lifestyle" && (
            <p className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>{current.lifestyleText}</span>
            </p>
          )}
        </div>
      </div>

      {/* 4. AI Coach Insight Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 to-[#161413] border border-stone-800 text-sm">
        <div className="flex items-center gap-2 mb-1.5 text-[#FF5A36] font-bold">
          <UserCheck className="w-4 h-4" />
          <span>Lời khuyên của Huấn luyện viên AI</span>
        </div>
        <p className="text-stone-300 leading-relaxed italic text-xs sm:text-sm">
          &ldquo;{current.coachInsight}&rdquo;
        </p>
      </div>

      {/* 5. Selected Hotspot Detail Card (If active) */}
      {selectedHotspot && (
        <div
          className="p-4 rounded-2xl bg-stone-900/90 border text-xs sm:text-sm animate-in fade-in duration-200"
          style={{ borderColor: selectedHotspot.color }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-white text-sm">{selectedHotspot.title}</span>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              style={{
                color: selectedHotspot.color,
                borderColor: `${selectedHotspot.color}50`,
                backgroundColor: `${selectedHotspot.color}15`,
              }}
            >
              Vùng đang chọn
            </span>
          </div>
          <p className="text-stone-300 mb-2 leading-relaxed">{selectedHotspot.desc}</p>
          <p className="text-xs font-medium" style={{ color: selectedHotspot.color }}>
            {selectedHotspot.tip}
          </p>
        </div>
      )}
    </div>
  );
};
