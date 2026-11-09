"use client";

import React from "react";
import { Sparkles, Compass, Flame, UserCheck, ArrowRight, Target } from "lucide-react";

interface TelemetryHudProps {
  progress: number; // 0 to 1
  currentDay: number; // 0, 7, 14, 28
  activeHotspot: string | null;
  userWeight?: number;
  targetWeight?: number;
  userWaistBaselineCm?: number;
  onJumpToTarget?: () => void;
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
  const milestoneIdx = currentDay <= 3 ? 0 : currentDay <= 10 ? 1 : currentDay <= 20 ? 2 : 3;

  // Dynamic milestone titles per requirement
  const milestoneTitles = [
    {
      badge: "HIỆN TRẠNG",
      mainTitle: "Hiện trạng Ngày 0 (Khởi điểm)",
      stageName: "Ngày 0",
      deltaBadge: "Xuất phát điểm",
      weightSubtitle: "Cân nặng thực tế từ khảo sát thể trạng",
      waistDeltaText: userWaistBaselineCm ? `${userWaistBaselineCm} cm (Mốc ban đầu)` : "--",
      postureScore: 55,
      postureStatus: "Cần cải thiện (Đổ thân trước)",
      cervicalText: "Cổ rùa nhẹ, vai cuộn về trước",
      waistText: "Thành bụng dưới hơi ưỡn do ngồi nhiều",
      lifestyleText: "Thường xuyên mỏi vai gáy sau 4 tiếng làm việc",
      coachInsight: "Chúng ta bắt đầu bằng việc nhận diện trục cơ thể và giải phóng các đốt sống cổ bị chèn ép. Chưa cần tập nặng, mục tiêu tuần này là thở đúng và nhận thức tư thế.",
    },
    {
      badge: "TUẦN 1",
      mainTitle: "Dự kiến ở Tuần 1 (Kích hoạt & Giảm phù)",
      stageName: "Tuần 1",
      deltaBadge: "-0.6 kg (Thải nước mô)",
      weightSubtitle: "Mức giảm nước ngoại bào lành mạnh",
      waistDeltaText: "-1.0 cm (Giảm phù nề)",
      postureScore: 66,
      postureStatus: "Đang thích nghi (Cổ vươn nhẹ)",
      cervicalText: "Khớp vai mở nhẹ, giảm áp lực cổ gáy",
      waistText: "Giảm tích nước mô liên kết vùng bụng",
      lifestyleText: "Cổ bớt căng cứng vào cuối ngày, ngủ sâu giấc hơn",
      coachInsight: "Cơ hoành bắt đầu được đánh thức qua các nhịp thở sâu. Cảm giác nhẹ nhõm ở vùng cổ gáy là dấu hiệu dây thần kinh đang được giải phóng áp lực.",
    },
    {
      badge: "TUẦN 2",
      mainTitle: "Dự kiến ở Tuần 2 (Tái căn chỉnh & Siết eo)",
      stageName: "Tuần 2",
      deltaBadge: "-1.4 kg (Siết cơ sâu)",
      weightSubtitle: "Kích hoạt chuyển hóa và đốt mỡ sâu",
      waistDeltaText: "-1.8 cm (Cơ ngang bụng siết)",
      postureScore: 76,
      postureStatus: "Tiến triển tốt (Lưng thẳng tự nhiên)",
      cervicalText: "Hai vai hạ mềm mại, ngực nâng tự nhiên",
      waistText: "Cơ bụng sâu siết chặt, phẳng 1.8cm",
      lifestyleText: "Giữ lưng thẳng tự nhiên khi ngồi máy tính 6-8 tiếng",
      coachInsight: "Ở tuần thứ 2, sự thay đổi rõ nhất đến từ nhóm cơ ngang bụng sâu (Transverse Abdominis). Vạt áo thả thẳng thon gọn hơn mà không cần nín thở hóp bụng.",
    },
    {
      badge: "TUẦN 4",
      mainTitle: "Dự kiến ở Tuần 4 (Vóc dáng mục tiêu)",
      stageName: "Tuần 4",
      deltaBadge: userWeight && targetWeight 
        ? `-${(userWeight - targetWeight).toFixed(1)} kg (Đạt mục tiêu)`
        : "-2.5 kg (Mục tiêu 28 ngày)",
      weightSubtitle: "Đạt vóc dáng cân đối và thẳng trục",
      waistDeltaText: "-3.5 cm (Eo thon phẳng bụng)",
      postureScore: 88,
      postureStatus: "Cân bằng vững vàng (Chuẩn dáng)",
      cervicalText: "Cột sống cổ thẳng tắp, bờ vai thanh thoát",
      waistText: "Vòng eo thon gọn săn chắc -3.5cm",
      lifestyleText: "Dáng đi thẳng tự tin, chấm dứt thói quen gù lưng",
      coachInsight: "Chúc mừng bạn! Chuỗi cơ sau đã hình thành phản xạ tự động giữ thẳng trục. Thể trạng mới không chỉ đẹp mắt mà còn bảo vệ đĩa đệm và cột sống lâu dài.",
    },
  ];

  const current = milestoneTitles[milestoneIdx];

  // Calculated displayed weight without ever showing "0.0 kg" or "0.0"
  const getDisplayedWeight = (): string => {
    if (!userWeight || userWeight <= 0) return "--";

    if (milestoneIdx === 0) {
      return `${userWeight.toFixed(1)} kg`;
    }
    if (milestoneIdx === 1) {
      return `${Math.max(30, userWeight - 0.6).toFixed(1)} kg`;
    }
    if (milestoneIdx === 2) {
      return `${Math.max(30, userWeight - 1.4).toFixed(1)} kg`;
    }
    // Day 28: Target weight if available, or estimated
    if (targetWeight && targetWeight > 0) {
      return `${targetWeight.toFixed(1)} kg`;
    }
    return `${Math.max(30, userWeight - 2.5).toFixed(1)} kg`;
  };

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
          className="px-3 py-1.5 rounded-full bg-[#FF5A36]/15 hover:bg-[#FF5A36]/25 border border-[#FF5A36]/40 text-[#FF5A36] hover:text-white text-xs font-mono font-bold flex items-center justify-between sm:justify-start gap-1.5 transition-all active:scale-95 shadow-sm self-start sm:self-auto"
          title="Xem ngay mốc mục tiêu hoàn thành sau 28 ngày"
          aria-label="Xem mục tiêu Ngày 28"
        >
          <span className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>Mục Tiêu Day 28:</span>
            <strong className="text-white ml-0.5">{targetWeight ? `${targetWeight} kg` : "--"}</strong>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[#FF5A36]" />
        </button>
      </div>

      {/* 2. Grid of 2 Core Biometric Metrics (Realistic Numbers & No 0.0) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Metric 1: Real / Estimated Weight */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">
              {milestoneIdx === 0 ? "Cân Nặng Khởi Điểm" : "Cân Nặng Dự Đoán"}
            </span>
            <Flame className="w-3.5 h-3.5 text-[#FF5A36]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {getDisplayedWeight()}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-800 text-emerald-400 border border-emerald-500/20">
              {current.deltaBadge}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1 leading-snug">
            {current.weightSubtitle}
          </p>
        </div>

        {/* Metric 2: Posture Health Score & Waistline */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-mono uppercase font-semibold">Điểm Tư Thế & Vòng Bụng</span>
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {current.postureScore}
            </span>
            <span className="text-xs font-mono text-stone-500">/ 100</span>
            <span className="ml-auto text-xs font-mono text-sky-400 font-bold">
              Eo: {current.waistDeltaText}
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 truncate font-medium">
            {current.postureStatus}
          </p>
        </div>
      </div>

      {/* 3. 3 Real-Life Focus Cards */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-mono uppercase tracking-widest text-stone-400 block px-1">
          3 Thay Đổi Trọng Tâm Ở Mốc {current.stageName}
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Card 1: Neck & Shoulders */}
          <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex flex-col justify-between">
            <div className="text-[11px] font-mono text-[#FF5A36] font-bold uppercase mb-1">
              Cổ & Vai Gáy
            </div>
            <p className="text-xs text-stone-300 leading-snug">
              {current.cervicalText}
            </p>
          </div>

          {/* Card 2: Waist & Core */}
          <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex flex-col justify-between">
            <div className="text-[11px] font-mono text-sky-400 font-bold uppercase mb-1">
              Vòng Bụng & Eo
            </div>
            <p className="text-xs text-stone-300 leading-snug">
              {current.waistText}
            </p>
          </div>

          {/* Card 3: Lifestyle & Energy */}
          <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex flex-col justify-between">
            <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase mb-1">
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
        <div className="flex items-center gap-2 mb-2 text-[#FF5A36] font-mono font-bold">
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
          <p className="text-[11px] text-emerald-400 font-mono">{selectedHotspot.tip}</p>
        </div>
      )}
    </div>
  );
};
