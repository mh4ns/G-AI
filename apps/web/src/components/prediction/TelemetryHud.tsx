"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass, Flame, UserCheck, ArrowRight, Target, Activity } from "lucide-react";

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

  // Animated smooth counts for numbers
  const animWeight = useAnimatedNumber(targetCurrentWeight, 1);
  const animWeightDelta = useAnimatedNumber(targetWeightDelta, 1);
  const animWaist = useAnimatedNumber(targetCurrentWaist, 1);
  const animWaistDelta = useAnimatedNumber(targetWaistDelta, 1);
  const animPostureScore = useAnimatedNumber(targetPostureScore, 0);

  // Dynamic milestone data with prediction ranges
  const milestoneData = [
    {
      badge: "HIỆN TRẠNG",
      mainTitle: "Hiện trạng Ngày 0 (Khởi điểm)",
      stageName: "Ngày 0",
      weightRange: "Mốc xuất phát thể trạng",
      waistRange: "Mốc đo ban đầu",
      postureRange: "Điểm gốc (Lệch trục 18°)",
      postureStatus: "Cần cải thiện (Đổ thân trước)",
      cervicalText: "Cổ rùa nhẹ, khớp vai cuộn về trước",
      waistText: "Thành bụng dưới hơi ưỡn do ngồi nhiều",
      lifestyleText: "Thường xuyên mỏi vai gáy sau 4 tiếng làm việc",
      coachInsight:
        "Chúng ta bắt đầu bằng việc nhận diện trục cơ thể và giải phóng các đốt sống cổ bị chèn ép. Chưa cần tập nặng, mục tiêu tuần này là thở đúng và nhận thức tư thế.",
    },
    {
      badge: "TUẦN 1",
      mainTitle: "Dự kiến ở Tuần 1 (Kích hoạt & Giảm phù)",
      stageName: "Tuần 1",
      weightRange: "-0.4 ~ -0.9 kg (Thải nước mô & giảm viêm)",
      waistRange: "-0.8 ~ -1.5 cm (Giảm phù nề vòng bụng)",
      postureRange: "+8 ~ +14 điểm (Kích hoạt nhóm cơ sau)",
      postureStatus: "Đang thích nghi (Cổ vươn nhẹ)",
      cervicalText: "Khớp vai mở nhẹ, giảm áp lực cổ gáy",
      waistText: "Giảm tích nước mô liên kết vùng bụng",
      lifestyleText: "Cổ bớt căng cứng vào cuối ngày, ngủ sâu giấc hơn",
      coachInsight:
        "Cơ hoành bắt đầu được đánh thức qua các nhịp thở sâu. Cảm giác nhẹ nhõm ở vùng cổ gáy là dấu hiệu dây thần kinh đang được giải phóng áp lực.",
    },
    {
      badge: "TUẦN 2",
      mainTitle: "Dự kiến ở Tuần 2 (Tái căn chỉnh & Siết eo)",
      stageName: "Tuần 2",
      weightRange: "-1.0 ~ -1.8 kg (Đốt mỡ sâu & siết cơ)",
      waistRange: "-1.6 ~ -2.6 cm (Cơ ngang bụng siết chặt)",
      postureRange: "+18 ~ +24 điểm (Căn chỉnh trục vai - hông)",
      postureStatus: "Chuyển biến rõ nét (Vai mở ngang)",
      cervicalText: "Đầu thu về gần đường dóng trọng tâm",
      waistText: "Rãnh cơ bụng lộ rõ, cơ ngang bụng siết chặt",
      lifestyleText: "Ngồi làm việc thẳng lưng tự nhiên, dáng đi thanh thoát",
      coachInsight:
        "Trọng tâm cơ thể dịch chuyển về gót chân, lực phân bổ đều lên hai bàn chân. Vòng eo bắt đầu gom lại tự nhiên nhờ cơ bụng sâu hoạt động như chiếc đai nịt sinh học.",
    },
    {
      badge: "TUẦN 4",
      mainTitle: "Dự kiến ở Tuần 4 (Vóc dáng mục tiêu)",
      stageName: "Tuần 4",
      weightRange:
        targetWeight && targetWeight > 0
          ? `-${(baseWeight - targetWeight).toFixed(1)} kg (Đạt cân nặng mục tiêu)`
          : "-2.0 ~ -3.5 kg (Tái tạo tỷ lệ mỡ & cơ)",
      waistRange: "-2.8 ~ -4.8 cm (Vòng eo thon phẳng)",
      postureRange: "+30 ~ +36 điểm (Trục thẳng cân bằng 0°)",
      postureStatus: "Cân bằng vững vàng (Chuẩn dáng)",
      cervicalText: "Cột sống cổ thẳng tắp, bờ vai thanh thoát",
      waistText: "Vòng eo thon gọn săn chắc -3.8cm",
      lifestyleText: "Dáng đi thẳng tự tin, chấm dứt thói quen gù lưng",
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
      ? "#10B981"
      : numericPostureScore >= 65
      ? "#F59E0B"
      : "#FF5A36";

  // Hotspot details
  const hotspotDetails: Record<string, { title: string; desc: string; tip: string }> = {
    cervical: {
      title: "Vùng Cổ & Vai Gáy",
      desc: "Giải phóng chèn ép đốt sống cổ C1-C7, đưa đầu về đúng trục trọng tâm và hạ thấp vai cuộn.",
      tip: "Bài tập trọng tâm: Pilates Chin Tuck & Kéo giãn mở khớp vai cạnh tường.",
    },
    thoracic: {
      title: "Lưng Trên & Khớp Ngực",
      desc: "Kéo giãn cơ ngực lớn, tăng sức bền nhóm cơ trám (Rhomboids) để chấm dứt dáng gù lưng.",
      tip: "Bài tập trọng tâm: Mở ngực trên thảm Foam Roller & Swan Dive nhẹ nhàng.",
    },
    core: {
      title: "Cơ Bụng Sâu & Thắt Lưng",
      desc: "Kích hoạt cơ ngang bụng đóng vai trò như chiếc nịt bụng tự nhiên kéo phẳng bụng dưới.",
      tip: "Bài tập trọng tâm: Nhịp thở sườn bên Pilates & The Hundred giữ trục.",
    },
    pelvis: {
      title: "Khung Chậu & Cơ Mông",
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
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            {current.mainTitle}
          </h4>
        </div>

        {/* Dedicated Always-Visible Target Button */}
        <button
          onClick={onJumpToTarget}
          className="px-3 py-1.5 rounded-full bg-[#FF5A36]/15 hover:bg-[#FF5A36]/25 border border-[#FF5A36]/40 text-[#FF5A36] hover:text-white text-xs font-sans font-bold flex items-center justify-between sm:justify-start gap-1.5 transition-all active:scale-95 shadow-sm self-start sm:self-auto"
          title="Xem ngay mốc mục tiêu hoàn thành sau 28 ngày"
          aria-label="Xem mục tiêu Ngày 28"
        >
          <span className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>Mục Tiêu Day 28:</span>
            <strong className="text-white ml-0.5 font-mono tabular-nums">
              {targetWeight ? `${targetWeight} kg` : "--"}
            </strong>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[#FF5A36]" />
        </button>
      </div>

      {/* 2. Step 4: Metric Area with Delta, Prediction Ranges & Circular Progress Ring */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric A: Weight (Day 0 -> Current with Delta & Prediction Range) */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-400 mb-1.5">
              <span className="text-xs font-semibold uppercase">Cân Nặng</span>
              <Flame className="w-3.5 h-3.5 text-[#FF5A36]" />
            </div>

            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-mono tabular-nums text-stone-400 text-sm">
                {baseWeight.toFixed(1)}
              </span>
              <span className="text-stone-500 font-sans text-xs">→</span>
              <span className="font-mono tabular-nums text-white text-2xl sm:text-3xl font-black">
                {animWeight}
              </span>
              <span className="text-stone-400 text-xs font-sans">kg</span>

              {milestoneIdx > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  ▼{animWeightDelta}
                </span>
              )}
            </div>
          </div>

          {/* Prediction Range */}
          <div className="mt-3 pt-2 border-t border-stone-800/80">
            <span className="text-[10px] text-stone-500 uppercase block font-medium">Khoảng dự đoán:</span>
            <span className="text-[11px] text-emerald-400/90 font-mono tabular-nums font-semibold block truncate">
              {current.weightRange}
            </span>
          </div>
        </div>

        {/* Metric B: Waistline (Day 0 -> Current with Delta & Prediction Range) */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-400 mb-1.5">
              <span className="text-xs font-semibold uppercase">Vòng Eo</span>
              <Compass className="w-3.5 h-3.5 text-sky-400" />
            </div>

            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-mono tabular-nums text-stone-400 text-sm">
                {baseWaist.toFixed(1)}
              </span>
              <span className="text-stone-500 font-sans text-xs">→</span>
              <span className="font-mono tabular-nums text-white text-2xl sm:text-3xl font-black">
                {animWaist}
              </span>
              <span className="text-stone-400 text-xs font-sans">cm</span>

              {milestoneIdx > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  ▼{animWaistDelta}
                </span>
              )}
            </div>
          </div>

          {/* Prediction Range */}
          <div className="mt-3 pt-2 border-t border-stone-800/80">
            <span className="text-[10px] text-stone-500 uppercase block font-medium">Khoảng dự đoán:</span>
            <span className="text-[11px] text-sky-400/90 font-mono tabular-nums font-semibold block truncate">
              {current.waistRange}
            </span>
          </div>
        </div>

        {/* Metric C: Posture Health Score with Circular Progress Ring */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-400 mb-1.5">
              <span className="text-xs font-semibold uppercase">Điểm Tư Thế</span>
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
                  <span className="text-stone-500 font-sans text-xs">→</span>
                  <span className="font-mono tabular-nums text-white text-xl sm:text-2xl font-black">
                    {animPostureScore}
                  </span>
                  <span className="text-[10px] text-stone-500 font-sans">/100</span>

                  {milestoneIdx > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      ▲{numericPostureScore - 55}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-300 font-medium truncate mt-0.5">
                  {current.postureStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Prediction Range */}
          <div className="mt-3 pt-2 border-t border-stone-800/80">
            <span className="text-[10px] text-stone-500 uppercase block font-medium">Khoảng dự đoán:</span>
            <span className="text-[11px] text-amber-400/90 font-mono tabular-nums font-semibold block truncate">
              {current.postureRange}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 3 Real-Life Focus Cards */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-stone-400 block px-1">
          3 Thay Đổi Trọng Tâm Ở Mốc {current.stageName}
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Card 1: Neck & Shoulders */}
          <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex flex-col justify-between">
            <div className="text-[11px] text-[#FF5A36] font-bold uppercase mb-1">
              Cổ & Vai Gáy
            </div>
            <p className="text-xs text-stone-300 leading-snug">
              {current.cervicalText}
            </p>
          </div>

          {/* Card 2: Waist & Core */}
          <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex flex-col justify-between">
            <div className="text-[11px] text-sky-400 font-bold uppercase mb-1">
              Vòng Bụng & Eo
            </div>
            <p className="text-xs text-stone-300 leading-snug">
              {current.waistText}
            </p>
          </div>

          {/* Card 3: Lifestyle & Energy */}
          <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex flex-col justify-between">
            <div className="text-[11px] text-emerald-400 font-bold uppercase mb-1">
              Cảm Nhận Thực Tế
            </div>
            <p className="text-xs text-stone-300 leading-snug">
              {current.lifestyleText}
            </p>
          </div>
        </div>
      </div>

      {/* 4. AI Coach Insight Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 to-[#161413] border border-stone-800 text-xs">
        <div className="flex items-center gap-2 mb-2 text-[#FF5A36] font-bold">
          <UserCheck className="w-4 h-4" />
          <span>Lời Khuyên Của Huấn Luyện Viên AI</span>
        </div>
        <p className="text-stone-300 leading-relaxed italic">
          "{current.coachInsight}"
        </p>
      </div>

      {/* 5. Selected Hotspot Detail Card (If active) */}
      {selectedHotspot && (
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-emerald-500/40 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-white text-sm">{selectedHotspot.title}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
              VÙNG ĐANG CHỌN
            </span>
          </div>
          <p className="text-stone-300 mb-2 leading-relaxed">{selectedHotspot.desc}</p>
          <p className="text-[11px] text-emerald-400 font-medium">{selectedHotspot.tip}</p>
        </div>
      )}
    </div>
  );
};
