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
  userWaistBaselineCm?: number;
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
  progress,
  currentDay,
  activeHotspot,
  userWeight,
  targetWeight,
  userWaistBaselineCm,
  onJumpToTarget,
}) => {
  // Step 8: Tabbed chips for 3 Focus Changes (cervical, waist, lifestyle)
  const [selectedFocusTab, setSelectedFocusTab] = useState<"cervical" | "waist" | "lifestyle">("cervical");

  // Determine active milestone index (0: Day 0, 1: Day 7, 2: Day 14, 3: Day 28)
  const milestoneIdx =
    currentDay <= 3 ? 0 : currentDay <= 10 ? 1 : currentDay <= 20 ? 2 : 3;

  // Realistic baselines
  const baseWeight = userWeight && userWeight > 0 ? userWeight : 68.0;
  const baseWaist =
    userWaistBaselineCm && userWaistBaselineCm > 0 ? userWaistBaselineCm : 78.0;

  // Target values per milestone
  let targetCurrentWeight: number;
  let targetWeightDelta: number;

  if (milestoneIdx === 0) {
    targetCurrentWeight = baseWeight;
    targetWeightDelta = 0.0;
  } else if (milestoneIdx === 1) {
    targetCurrentWeight = Math.max(30, baseWeight - 0.6);
    targetWeightDelta = 0.6;
  } else if (milestoneIdx === 2) {
    targetCurrentWeight = Math.max(30, baseWeight - 1.4);
    targetWeightDelta = 1.4;
  } else {
    if (targetWeight && targetWeight > 0) {
      targetCurrentWeight = targetWeight;
      targetWeightDelta = Math.max(0, baseWeight - targetWeight);
    } else {
      targetCurrentWeight = Math.max(30, baseWeight - 2.5);
      targetWeightDelta = 2.5;
    }
  }

  const waistMilestoneDeltas = [0.0, 1.2, 2.2, 3.8];
  const targetCurrentWaist = Math.max(45, baseWaist - waistMilestoneDeltas[milestoneIdx]);
  const targetWaistDelta = waistMilestoneDeltas[milestoneIdx];

  const postureMilestoneScores = [55, 66, 76, 88];
  const targetPostureScore = postureMilestoneScores[milestoneIdx];

  // Animated smooth counts for numbers (Step 4 & 7)
  const animWeight = useAnimatedNumber(targetCurrentWeight, 1);
  const animWeightDelta = useAnimatedNumber(targetWeightDelta, 1);
  const animWaist = useAnimatedNumber(targetCurrentWaist, 1);
  const animWaistDelta = useAnimatedNumber(targetWaistDelta, 1);
  const animPostureScore = useAnimatedNumber(targetPostureScore, 0);

  // Dynamic milestone data with prediction ranges (Step 4, 6, 7)
  const milestoneData = [
    {
      badge: "Hiện trạng",
      mainTitle: "Hiện trạng Ngày 0 (Khởi điểm)",
      stageName: "Ngày 0",
      weightRange: "Mốc xuất phát thể trạng",
      waistRange: "Mốc đo ban đầu",
      postureRange: "Điểm gốc (Lệch trục 18°)",
      postureStatus: "Cần cải thiện (Đổ thân trước)",
      cervicalText: "Cổ rùa nhẹ, khớp vai cuộn về trước do thói quen làm việc.",
      waistText: "Thành bụng dưới hơi ưỡn do ngồi nhiều và cơ lõi chưa kích hoạt.",
      lifestyleText: "Thường xuyên mỏi vai gáy sau 4 tiếng ngồi máy tính, uể oải cuối ngày.",
      coachInsight:
        "Chúng ta bắt đầu bằng việc nhận diện trục cơ thể và giải phóng các đốt sống cổ bị chèn ép. Chưa cần tập nặng, mục tiêu tuần này là thở đúng và nhận thức tư thế.",
    },
    {
      badge: "Tuần 1",
      mainTitle: "Dự kiến ở Tuần 1 (Kích hoạt & Giảm phù)",
      stageName: "Tuần 1",
      weightRange: "-0.4 ~ -0.9 kg (Thải nước mô & giảm viêm)",
      waistRange: "-0.8 ~ -1.5 cm (Giảm phù nề vòng bụng)",
      postureRange: "+8 ~ +14 điểm (Kích hoạt nhóm cơ sau)",
      postureStatus: "Đang thích nghi (Cổ vươn nhẹ)",
      cervicalText: "Khớp vai mở nhẹ sang hai bên, giảm áp lực nén lên cổ gáy.",
      waistText: "Giảm tích nước mô liên kết vùng bụng dưới, cảm giác nhẹ nhõm hơn.",
      lifestyleText: "Cổ bớt căng cứng vào cuối ngày, giấc ngủ sâu và ngon hơn.",
      coachInsight:
        "Cơ hoành bắt đầu được đánh thức qua các nhịp thở sâu. Cảm giác nhẹ nhõm ở vùng cổ gáy là dấu hiệu dây thần kinh đang được giải phóng áp lực.",
    },
    {
      badge: "Tuần 2",
      mainTitle: "Dự kiến ở Tuần 2 (Tái căn chỉnh & Siết eo)",
      stageName: "Tuần 2",
      weightRange: "-1.0 ~ -1.8 kg (Đốt mỡ sâu & siết cơ)",
      waistRange: "-1.6 ~ -2.6 cm (Cơ ngang bụng siết chặt)",
      postureRange: "+18 ~ +24 điểm (Căn chỉnh trục vai - hông)",
      postureStatus: "Chuyển biến rõ nét (Vai mở ngang)",
      cervicalText: "Đầu thu về gần đường dóng trọng tâm, bờ vai thả lỏng tự nhiên.",
      waistText: "Rãnh cơ bụng lộ rõ, cơ ngang bụng siết chặt tựa chiếc đai sinh học.",
      lifestyleText: "Ngồi làm việc thẳng lưng tự nhiên, dáng đi thanh thoát tràn đầy năng lượng.",
      coachInsight:
        "Trọng tâm cơ thể dịch chuyển về gót chân, lực phân bổ đều lên hai bàn chân. Vòng eo bắt đầu gom lại tự nhiên nhờ cơ bụng sâu hoạt động như chiếc đai nịt sinh học.",
    },
    {
      badge: "Tuần 4",
      mainTitle: "Dự kiến ở Tuần 4 (Vóc dáng mục tiêu)",
      stageName: "Tuần 4",
      weightRange:
        targetWeight && targetWeight > 0
          ? `-${(baseWeight - targetWeight).toFixed(1)} kg (Đạt cân nặng mục tiêu)`
          : "-2.0 ~ -3.5 kg (Tái tạo tỷ lệ mỡ & cơ)",
      waistRange: "-2.8 ~ -4.8 cm (Vòng eo thon phẳng)",
      postureRange: "+30 ~ +36 điểm (Trục thẳng cân bằng 0°)",
      postureStatus: "Cân bằng vững vàng (Chuẩn dáng)",
      cervicalText: "Cột sống cổ thẳng tắp, bờ vai thanh thoát, giải tỏa triệt để chèn ép.",
      waistText: "Vòng eo thon gọn săn chắc -3.8cm, cơ bụng phẳng lì cân đối.",
      lifestyleText: "Dáng đi thẳng tự tin, chấm dứt hoàn toàn thói quen gù lưng gáy.",
      coachInsight:
        "Chúc mừng bạn! Chuỗi cơ sau đã hình thành phản xạ tự động giữ thẳng trục. Thể trạng mới không chỉ đẹp mắt mà còn bảo vệ đĩa đệm và cột sống lâu dài.",
    },
  ];

  const current = milestoneData[milestoneIdx];

  // Circular Progress Ring Calculations (Radius: 22, Circumference: ~138.2)
  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const numericPostureScore = Number(animPostureScore);
  const ringOffset = ringCircumference * (1 - Math.min(100, Math.max(0, numericPostureScore)) / 100);

  const postureScoreColor =
    numericPostureScore >= 80
      ? SEMANTIC_COLORS.success
      : numericPostureScore >= 65
      ? SEMANTIC_COLORS.warning
      : SEMANTIC_COLORS.primary;

  // Hotspot details with strict Step 6 Semantic Colors
  const hotspotDetails: Record<
    string,
    { title: string; color: string; desc: string; tip: string }
  > = {
    cervical: {
      title: "Vùng Cổ & Vai Gáy",
      color: SEMANTIC_COLORS.hotspots.cervical.color,
      desc: "Giải phóng chèn ép đốt sống cổ C1-C7, đưa đầu về đúng trục trọng tâm và hạ thấp vai cuộn.",
      tip: "Bài tập trọng tâm: Pilates Chin Tuck & Kéo giãn mở khớp vai cạnh tường.",
    },
    thoracic: {
      title: "Lưng Trên & Khớp Ngực",
      color: SEMANTIC_COLORS.hotspots.thoracic.color,
      desc: "Kéo giãn cơ ngực lớn, tăng sức bền nhóm cơ trám (Rhomboids) để chấm dứt dáng gù lưng.",
      tip: "Bài tập trọng tâm: Mở ngực trên thảm Foam Roller & Swan Dive nhẹ nhàng.",
    },
    core: {
      title: "Cơ Bụng Sâu & Thắt Lưng",
      color: SEMANTIC_COLORS.hotspots.core.color,
      desc: "Kích hoạt cơ ngang bụng đóng vai trò như chiếc nịt bụng tự nhiên kéo phẳng bụng dưới.",
      tip: "Bài tập trọng tâm: Nhịp thở sườn bên Pilates & The Hundred giữ trục.",
    },
    pelvis: {
      title: "Khung Chậu & Cơ Mông",
      color: SEMANTIC_COLORS.hotspots.pelvis.color,
      desc: "Khắc phục tật võng lưng (Anterior Pelvic Tilt), đưa xương chậu về góc trung tính cân bằng.",
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
          title="Xem ngay mốc mục tiêu hoàn thành sau 28 ngày"
          aria-label="Xem mục tiêu Ngày 28"
        >
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>Mục tiêu Day 28:</span>
            <strong className="text-white font-mono tabular-nums">
              {targetWeight ? `${targetWeight} kg` : "--"}
            </strong>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[#FF5A36]" />
        </button>
      </div>

      {/* 2. Step 4: Metric Area with Delta, Prediction Ranges & Circular Progress Ring */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric A: Weight */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-300 mb-1.5">
              <span className="text-xs font-semibold">Cân nặng</span>
              <Flame className="w-3.5 h-3.5 text-[#FF5A36]" />
            </div>

            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-mono tabular-nums text-stone-400 text-sm">
                {baseWeight.toFixed(1)}
              </span>
              <span className="text-stone-400 text-xs">→</span>
              <span className="font-mono tabular-nums text-white text-2xl sm:text-3xl font-black">
                {animWeight}
              </span>
              <span className="text-stone-300 text-xs">kg</span>

              {milestoneIdx > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-mono tabular-nums font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  ▼{animWeightDelta}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-stone-800/80">
            <span className="text-xs text-stone-400 block font-medium">Khoảng dự đoán:</span>
            <span className="text-xs text-emerald-400 font-mono tabular-nums font-semibold block truncate">
              {current.weightRange}
            </span>
          </div>
        </div>

        {/* Metric B: Waistline */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-300 mb-1.5">
              <span className="text-xs font-semibold">Vòng eo</span>
              <Compass className="w-3.5 h-3.5 text-sky-400" />
            </div>

            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-mono tabular-nums text-stone-400 text-sm">
                {baseWaist.toFixed(1)}
              </span>
              <span className="text-stone-400 text-xs">→</span>
              <span className="font-mono tabular-nums text-white text-2xl sm:text-3xl font-black">
                {animWaist}
              </span>
              <span className="text-stone-300 text-xs">cm</span>

              {milestoneIdx > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-mono tabular-nums font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  ▼{animWaistDelta}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-stone-800/80">
            <span className="text-xs text-stone-400 block font-medium">Khoảng dự đoán:</span>
            <span className="text-xs text-sky-400 font-mono tabular-nums font-semibold block truncate">
              {current.waistRange}
            </span>
          </div>
        </div>

        {/* Metric C: Posture Health Score with Circular Ring */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-300 mb-1.5">
              <span className="text-xs font-semibold">Điểm tư thế</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <div className="flex items-center gap-3">
              {/* Circular Progress Ring */}
              <div className="relative shrink-0 w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 52 52">
                  <circle
                    cx="26"
                    cy="26"
                    r={ringRadius}
                    fill="none"
                    stroke="#292524"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="26"
                    cy="26"
                    r={ringRadius}
                    fill="none"
                    stroke={postureScoreColor}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-mono tabular-nums text-xs font-black text-white">
                    {animPostureScore}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono tabular-nums text-stone-400 text-xs">55</span>
                  <span className="text-stone-400 text-xs">→</span>
                  <span className="font-mono tabular-nums text-white text-xl sm:text-2xl font-black">
                    {animPostureScore}
                  </span>
                  <span className="text-xs text-stone-400">/100</span>

                  {milestoneIdx > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono tabular-nums font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      ▲{numericPostureScore - 55}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-300 font-medium truncate mt-0.5">
                  {current.postureStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-stone-800/80">
            <span className="text-xs text-stone-400 block font-medium">Khoảng dự đoán:</span>
            <span className="text-xs text-amber-400 font-mono tabular-nums font-semibold block truncate">
              {current.postureRange}
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
