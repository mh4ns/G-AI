"use client";

import React from "react";
import { Sparkles, Heart, Compass, ShieldCheck, CheckCircle2, Flame, UserCheck } from "lucide-react";

interface TelemetryHudProps {
  progress: number; // 0 to 1
  currentDay: number; // 0, 7, 14, 28
  activeHotspot: string | null;
}

export const TelemetryHud: React.FC<TelemetryHudProps> = ({
  progress,
  currentDay,
  activeHotspot,
}) => {
  // Determine active milestone index (0, 1, 2, 3)
  const milestoneIdx = currentDay <= 3 ? 0 : currentDay <= 10 ? 1 : currentDay <= 20 ? 2 : 3;

  // Realistic physiologically validated metrics across 4 milestones
  const milestoneData = [
    {
      stage: "Ngày 0 (Khởi điểm)",
      weightDelta: "0.0 kg",
      waistDelta: "0.0 cm",
      postureScore: 55,
      postureStatus: "Cần cải thiện (Đổ thân trước)",
      angleText: "18° lệch",
      cervicalText: "Cổ rùa nhẹ, vai cuộn về trước",
      waistText: "Thành bụng dưới hơi ưỡn do ngồi nhiều",
      lifestyleText: "Thường xuyên mỏi vai gáy sau 4 tiếng làm việc",
      coachInsight: "Chúng ta bắt đầu bằng việc nhận diện trục cơ thể và giải phóng các đốt sống cổ bị chèn ép. Chưa cần tập nặng, mục tiêu tuần này là thở đúng và nhận thức tư thế.",
    },
    {
      stage: "Tuần 1 (Kích hoạt)",
      weightDelta: "-0.6 kg",
      waistDelta: "-1.0 cm",
      postureScore: 66,
      postureStatus: "Đang thích nghi (Cổ vươn nhẹ)",
      angleText: "13° lệch",
      cervicalText: "Khớp vai mở nhẹ, giảm áp lực cổ gáy",
      waistText: "Giảm tích nước mô liên kết vùng bụng",
      lifestyleText: "Cổ bớt căng cứng vào cuối ngày, ngủ sâu giấc hơn",
      coachInsight: "Cơ hoành bắt đầu được đánh thức qua các nhịp thở sâu. Cảm giác nhẹ nhõm ở vùng cổ gáy là dấu hiệu dây thần kinh đang được giải phóng áp lực.",
    },
    {
      stage: "Tuần 2 (Tái căn chỉnh)",
      weightDelta: "-1.4 kg",
      waistDelta: "-1.8 cm",
      postureScore: 76,
      postureStatus: "Tiến triển tốt (Lưng thẳng tự nhiên)",
      angleText: "7° lệch",
      cervicalText: "Hai vai hạ mềm mại, ngực nâng tự nhiên",
      waistText: "Cơ bụng sâu siết chặt, phẳng 1.8cm",
      lifestyleText: "Giữ lưng thẳng tự nhiên khi ngồi máy tính 6-8 tiếng",
      coachInsight: "Ở tuần thứ 2, sự thay đổi rõ nhất đến từ nhóm cơ ngang bụng sâu (Transverse Abdominis). Vạt áo thả thẳng thon gọn hơn mà không cần nín thở hóp bụng.",
    },
    {
      stage: "Tuần 4 (Vóc dáng mới)",
      weightDelta: "-2.1 kg",
      waistDelta: "-3.0 cm",
      postureScore: 88,
      postureStatus: "Cân bằng vững vàng (Chuẩn dáng)",
      angleText: "0° lệch (Trục chuẩn)",
      cervicalText: "Cột sống cổ thẳng tắp, bờ vai thanh thoát",
      waistText: "Vòng eo thon gọn săn chắc -3.0cm",
      lifestyleText: "Dáng đi thẳng tự tin, chấm dứt thói quen gù lưng",
      coachInsight: "Chúc mừng bạn! Chuỗi cơ sau đã hình thành phản xạ tự động giữ thẳng trục. Thể trạng mới không chỉ đẹp mắt mà còn bảo vệ đĩa đệm và cột sống lâu dài.",
    },
  ];

  const current = milestoneData[milestoneIdx];

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
      {/* 1. Header Banner (User-Centric & Transparent) */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-stone-300 font-bold">
            Kết Quả Dự Kiến Sau 28 Ngày
          </span>
        </div>
        <span className="text-[11px] font-mono text-stone-400">
          Mốc: <strong className="text-white">{current.stage}</strong>
        </span>
      </div>

      {/* 2. Grid of 2 Core Biometric Metrics (Realistic Numbers) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1: Sustainable Weight Progress */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-mono uppercase">Cân Nặng Dự Đoán</span>
            <Flame className="w-3.5 h-3.5 text-[#FF5A36]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {current.weightDelta}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {milestoneIdx === 0 ? "Thể trạng xuất phát điểm" : "Mức giảm lành mạnh & duy trì bền vững"}
          </p>
        </div>

        {/* Metric 2: Posture Health Score & State */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-mono uppercase">Điểm Tư Thế Trục Thẳng</span>
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {current.postureScore}
            </span>
            <span className="text-xs font-mono text-stone-500">/ 100</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 truncate">
            {current.postureStatus}
          </p>
        </div>
      </div>

      {/* 3. 3 Real-Life Focus Cards (Cổ & Vai, Vòng Eo, Cảm Nhận Thực Tế) */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-mono uppercase tracking-widest text-stone-400 block px-1">
          3 Thay Đổi Trọng Tâm Ở Mốc Này
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
