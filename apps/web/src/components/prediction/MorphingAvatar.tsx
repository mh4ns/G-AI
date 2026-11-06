"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";

export interface MorphingAvatarProps {
  progress: number; // 0.0 to 1.0 (from currentDay / 28)
  viewMode: "profile" | "front" | "threeQuarter";
  activeHotspot: string | null;
  onSelectHotspot: (hotspot: string) => void;
  archetype?: "female_pilates" | "male_strength";
  currentDay?: number;
}

export const MorphingAvatar: React.FC<MorphingAvatarProps> = ({
  progress,
  viewMode,
  activeHotspot,
  onSelectHotspot,
  archetype = "female_pilates",
  currentDay = 0,
}) => {
  const [showPlumbLine, setShowPlumbLine] = useState(true);
  const isMale = archetype === "male_strength";

  // Map currentDay (0, 7, 14, 28) to the single sharp milestone image (No ghosting artifacts!)
  const getMilestoneIndex = (day: number) => {
    if (day <= 3) return 0; // Day 0
    if (day <= 10) return 1; // Day 7
    if (day <= 20) return 2; // Day 14
    return 3; // Day 28
  };

  const milestoneIndex = getMilestoneIndex(currentDay);

  const femaleImages = [
    "/twins/female-day-0.jpg",
    "/twins/female-day-7.jpg",
    "/twins/female-day-14.jpg",
    "/twins/female-day-28.jpg",
  ];

  const maleImages = [
    "/twins/male-day-0.jpg",
    "/twins/male-day-7.jpg",
    "/twins/male-day-14.jpg",
    "/twins/male-day-28.jpg",
  ];

  const activeImage = isMale ? maleImages[milestoneIndex] : femaleImages[milestoneIndex];

  // Anatomical Plumb Line offsets across the 4 milestones (measured in degrees °)
  const milestonePlumbData = [
    {
      stage: "Ngày 0",
      headOffset: 24,
      kyphosisOffset: 22,
      pelvicOffset: 16,
      angleDeg: 18,
      statusText: "Độ đổ thân trên: Cần cải thiện (18° lệch)",
      color: "#FF5A36", // Coral/Amber alert
      isOptimal: false,
    },
    {
      stage: "Tuần 1",
      headOffset: 18,
      kyphosisOffset: 16,
      pelvicOffset: 11,
      angleDeg: 13,
      statusText: "Đang mở khớp vai & giảm phù (13° lệch)",
      color: "#F59E0B", // Amber
      isOptimal: false,
    },
    {
      stage: "Tuần 2",
      headOffset: 10,
      kyphosisOffset: 9,
      pelvicOffset: 6,
      angleDeg: 7,
      statusText: "Cơ dựng sống thẳng tự nhiên (7° lệch)",
      color: "#10B981", // Emerald
      isOptimal: false,
    },
    {
      stage: "Tuần 4",
      headOffset: 2,
      kyphosisOffset: 3,
      pelvicOffset: 1,
      angleDeg: 0,
      statusText: "Trục cơ thể: Cân bằng vững vàng (0° lệch)",
      color: "#10B981", // Emerald optimum
      isOptimal: true,
    },
  ];

  const currentPlumb = milestonePlumbData[milestoneIndex] || milestonePlumbData[0];

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] flex items-center justify-center select-none overflow-hidden rounded-3xl bg-gradient-to-b from-[#141210] to-[#0A0908] border border-stone-800 shadow-2xl">
      {/* Subtle Anatomical Ambient Glow */}
      <div
        className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-25"
        style={{
          background: `radial-gradient(circle, ${currentPlumb.color} 0%, transparent 70%)`,
        }}
      />

      {/* Top Status Bar (User-centric terminology - No LERP/RIG/Dev-speak) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-xs font-mono">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-stone-200">
          <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
          <span>MÔ PHỎNG PHỤC HỒI VÓC DÁNG</span>
        </div>

        {/* Plumb Line Toggle Button */}
        <button
          onClick={() => setShowPlumbLine(!showPlumbLine)}
          className={`px-3 py-1.5 rounded-full border backdrop-blur-md transition-all flex items-center gap-1.5 font-bold ${
            showPlumbLine
              ? "bg-[#FF5A36]/20 border-[#FF5A36]/60 text-white shadow-md shadow-[#FF5A36]/20"
              : "bg-black/60 border-white/10 text-stone-400 hover:text-white"
          }`}
          title="Bật/Tắt đường dóng giải phẫu học"
        >
          {showPlumbLine ? <Eye className="w-3.5 h-3.5 text-[#FF5A36]" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showPlumbLine ? "Trục Dóng: Bật" : "Trục Dóng: Tắt"}</span>
        </button>
      </div>

      {/* Central Sharp Visualizer (Zero Ghosting Artifacts) */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-[420px] h-full max-h-[500px] rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src={activeImage}
            alt={`Hình thể mô phỏng ${currentPlumb.stage}`}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover object-center filter contrast-[1.05] transition-opacity duration-300"
            priority
          />

          {/* Vignette Edge Shading for Studio Integration */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0908] via-transparent to-[#0A0908]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0908]/50 via-transparent to-[#0A0908]/50 pointer-events-none" />
        </div>
      </div>

      {/* Anatomical Vector Plumb Line Overlay (Trục Dóng Trọng Tâm Tai -> Vai -> Hông -> Gót chân) */}
      {showPlumbLine && (
        <svg
          viewBox="0 0 320 500"
          className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible"
        >
          <defs>
            <filter id="plumbGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Vertical Datum Baseline (Zero Alignment Plumb Line) */}
          <line
            x1="160"
            y1="40"
            x2="160"
            y2="460"
            stroke="#57534E"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {viewMode === "profile" ? (
            /* LATERAL VIEW: Ear -> Shoulder -> Hip -> Ankle Plumb Alignment */
            <g className="transition-all duration-300">
              {/* Dynamic Plumb Line Deviation Curve */}
              <path
                d={`M ${160 + currentPlumb.headOffset * 0.7} 85 
                    Q ${160 - currentPlumb.kyphosisOffset * 0.7} 175, ${160 + currentPlumb.headOffset * 0.4} 255 
                    T ${160 - currentPlumb.pelvicOffset * 0.4} 340`}
                fill="none"
                stroke={currentPlumb.color}
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#plumbGlow)"
              />

              {/* 1. Ear / Cervical Node */}
              <circle
                cx={160 + currentPlumb.headOffset * 0.7}
                cy="85"
                r="6.5"
                fill={activeHotspot === "cervical" ? "#FFFFFF" : currentPlumb.color}
                stroke="#FFFFFF"
                strokeWidth={activeHotspot === "cervical" ? "2" : "0"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("cervical")}
              />

              {/* 2. Shoulder Girdle Node */}
              <circle
                cx={160 - currentPlumb.kyphosisOffset * 0.7 + 6}
                cy="175"
                r="6.5"
                fill={activeHotspot === "thoracic" ? "#FFFFFF" : currentPlumb.color}
                stroke="#FFFFFF"
                strokeWidth={activeHotspot === "thoracic" ? "2" : "0"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("thoracic")}
              />

              {/* 3. Lumbar / Core Node */}
              <circle
                cx={160 + currentPlumb.headOffset * 0.4}
                cy="255"
                r="6.5"
                fill={activeHotspot === "core" ? "#FFFFFF" : currentPlumb.color}
                stroke="#FFFFFF"
                strokeWidth={activeHotspot === "core" ? "2" : "0"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("core")}
              />

              {/* 4. Hip / Pelvis Node */}
              <circle
                cx={160 - currentPlumb.pelvicOffset * 0.4}
                cy="340"
                r="6.5"
                fill={activeHotspot === "pelvis" ? "#FFFFFF" : currentPlumb.color}
                stroke="#FFFFFF"
                strokeWidth={activeHotspot === "pelvis" ? "2" : "0"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("pelvis")}
              />

              {/* Knee to Ankle Plumb Foundation */}
              <line
                x1={160 - currentPlumb.pelvicOffset * 0.4}
                y1="340"
                x2="158"
                y2="410"
                stroke={currentPlumb.color}
                strokeWidth="2.5"
              />
              <circle cx="158" cy="410" r="4.5" fill={currentPlumb.color} />

              <line x1="158" y1="410" x2="160" y2="460" stroke={currentPlumb.color} strokeWidth="2.5" />
              <circle cx="160" cy="460" r="4.5" fill={currentPlumb.color} />
            </g>
          ) : (
            /* FRONTAL VIEW: Symmetrical Center Axis & Transverse Alignment */
            <g className="transition-all duration-300">
              <line
                x1="160"
                y1="85"
                x2="160"
                y2="340"
                stroke={currentPlumb.color}
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#plumbGlow)"
              />

              {/* Shoulder Horizontal Level Line */}
              <line
                x1={115}
                y1={135 - currentPlumb.headOffset * 0.15}
                x2={205}
                y2={135 + currentPlumb.headOffset * 0.15}
                stroke={currentPlumb.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle
                cx={115}
                cy={135 - currentPlumb.headOffset * 0.15}
                r="5.5"
                fill={currentPlumb.color}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("cervical")}
              />
              <circle
                cx={205}
                cy={135 + currentPlumb.headOffset * 0.15}
                r="5.5"
                fill={currentPlumb.color}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("cervical")}
              />

              {/* Core Transverse Ring */}
              <ellipse
                cx="160"
                cy="240"
                rx={45 - (3 - milestoneIndex) * 3}
                ry="14"
                fill="none"
                stroke={currentPlumb.color}
                strokeWidth="2"
                strokeDasharray="3 3"
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("core")}
              />

              {/* Pelvis Level Line */}
              <line x1="125" y1="340" x2="195" y2="340" stroke={currentPlumb.color} strokeWidth="3" strokeLinecap="round" />
              <circle
                cx="160"
                cy="340"
                r="6.5"
                fill={activeHotspot === "pelvis" ? "#FFFFFF" : currentPlumb.color}
                stroke="#FFFFFF"
                strokeWidth={activeHotspot === "pelvis" ? "2" : "0"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("pelvis")}
              />
            </g>
          )}
        </svg>
      )}

      {/* Bottom Medical / Anatomical Alignment Note */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-stone-300 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: currentPlumb.color }}
          />
          <span className="font-bold">{currentPlumb.statusText}</span>
        </div>
        <div className="text-stone-400">
          Trọng tâm: <span className="text-white font-bold">{currentPlumb.isOptimal ? "Tối ưu hóa" : "Đang căn chỉnh"}</span>
        </div>
      </div>
    </div>
  );
};
