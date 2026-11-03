"use client";

import React from "react";
import { Activity, ShieldCheck, Zap, Flame, Compass, ArrowUpRight } from "lucide-react";

interface TelemetryHudProps {
  progress: number; // 0 to 1
  currentDay: number; // 0 to 28
  activeHotspot: string | null;
}

export const TelemetryHud: React.FC<TelemetryHudProps> = ({
  progress,
  currentDay,
  activeHotspot,
}) => {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Real-time calculated biometrics
  const weight = (62.5 - 6.0 * progress).toFixed(1);
  const kyphosisAngle = Math.round(lerp(36, 12, progress));
  const healthScore = Math.round(lerp(48, 95, progress));
  const coreEngagement = Math.round(lerp(35, 88, progress));
  const tdee = Math.round(lerp(1810, 1940, progress));

  // Contextual hotspot explanation
  const hotspotInfo: Record<string, { title: string; desc: string; exercise: string }> = {
    cervical: {
      title: "Cervical Alignment (Đốt Sống Cổ)",
      desc: "Giải phóng chèn ép dây thần kinh cổ, giảm tình trạng đau mỏi vai gáy do cúi đầu dùng điện thoại/máy tính.",
      exercise: "Pilates Chin Tuck & Isometric Wall Push-up",
    },
    core: {
      title: "Transverse Abdominis (Cơ Bụng Sâu)",
      desc: "Kích hoạt nhóm cơ nịt bụng tự nhiên, siết chặt vòng eo từ bên trong và nâng đỡ nội tạng.",
      exercise: "The Hundred & Deep Alignment Squat",
    },
    pelvis: {
      title: "Pelvic Girdle & Glutes (Khung Chậu & Cơ Mông)",
      desc: "Điều chỉnh tình trạng võng lưng (Anterior Pelvic Tilt), phân bổ lại trọng lực lên khớp háng và gót chân.",
      exercise: "Pelvic Glute Bridge & Quadruped Bird Dog",
    },
  };

  const selectedInfo = activeHotspot ? hotspotInfo[activeHotspot] : null;

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Top Banner Status */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-stone-400">
            Biometric Telemetry • Day {currentDay} / 28
          </span>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-stone-300">
          AI Projection Engine
        </span>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1: Projected Weight */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 transition-colors">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-mono uppercase">Cân Nặng Dự Đoán</span>
            <Flame className="w-3.5 h-3.5 text-[#FF5A36]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {weight}
            </span>
            <span className="text-xs font-mono text-stone-500">kg</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {progress === 0 ? "Thể trạng xuất phát" : `Đã giảm -${(62.5 - parseFloat(weight)).toFixed(1)}kg mỡ thừa`}
          </p>
        </div>

        {/* Metric 2: Kyphosis Posture Angle */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 transition-colors">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-mono uppercase">Góc Gù Lưng (Kyphosis)</span>
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {kyphosisAngle}°
            </span>
            <span className="text-xs font-mono text-stone-500">
              {kyphosisAngle <= 15 ? "Chuẩn" : "Lệch"}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {kyphosisAngle <= 15 ? "Cột sống đã thẳng tự nhiên" : "Cần mở vai và nâng ngực"}
          </p>
        </div>

        {/* Metric 3: Core Engagement Index */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 transition-colors">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-mono uppercase">Kích Hoạt Cơ Lõi</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {coreEngagement}%
            </span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF5A36] to-emerald-400 transition-all duration-300"
              style={{ width: `${coreEngagement}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Form Health Index */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 transition-colors">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-mono uppercase">Chỉ Số Tư Thế Chuẩn</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {healthScore}
            </span>
            <span className="text-xs font-mono text-stone-500">/ 100</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">
            {progress > 0.75 ? "Tối ưu hóa thể trạng hoàn hảo" : "Đang tái cấu trúc từng đốt sống"}
          </p>
        </div>
      </div>

      {/* Selected Hotspot Insight Card */}
      {selectedInfo ? (
        <div className="p-4 rounded-2xl bg-[#FF5A36]/10 border border-[#FF5A36]/30 text-white transition-all animate-fadeIn">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#FF5A36] uppercase tracking-wider">
              {selectedInfo.title}
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#FF5A36]" />
          </div>
          <p className="text-xs text-stone-300 leading-relaxed mb-2.5">
            {selectedInfo.desc}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-stone-400 bg-stone-900/70 px-3 py-1.5 rounded-xl border border-stone-800">
            <span className="font-mono text-stone-500">Bài tập chỉ định:</span>
            <span className="font-medium text-white">{selectedInfo.exercise}</span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-stone-900/40 border border-dashed border-stone-800 text-stone-500 text-xs text-center">
          Nhấp vào các điểm sáng trên mô hình (Cổ, Vùng Bụng, Khung Chậu) để xem phân tích cơ sinh học chi tiết.
        </div>
      )}
    </div>
  );
};
