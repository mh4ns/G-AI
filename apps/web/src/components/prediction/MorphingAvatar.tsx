"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Sparkles, User, Activity } from "lucide-react";

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
  const [displayMode, setDisplayMode] = useState<"model" | "cutout">("model");
  const isMale = archetype === "male_strength";

  // Map currentDay (0, 7, 14, 28) to the single sharp milestone index
  const getMilestoneIndex = (day: number) => {
    if (day <= 3) return 0; // Day 0
    if (day <= 10) return 1; // Day 7
    if (day <= 20) return 2; // Day 14
    return 3; // Day 28
  };

  const milestoneIndex = getMilestoneIndex(currentDay);

  // Pristine transparent PNGs (100% background-removed cutouts - zero photo background)
  const femaleCutouts = [
    "/twins/female-day-0.png",
    "/twins/female-day-7.png",
    "/twins/female-day-14.png",
    "/twins/female-day-28.png",
  ];

  const maleCutouts = [
    "/twins/male-day-0.png",
    "/twins/male-day-7.png",
    "/twins/male-day-14.png",
    "/twins/male-day-28.png",
  ];

  const activeCutout = isMale ? maleCutouts[milestoneIndex] : femaleCutouts[milestoneIndex];

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

  // Dynamic Biomechanical Model Coordinates (Zero background image, pure biometric digital twin)
  const headX = 160 + currentPlumb.headOffset * 0.7;
  const headY = 76;
  const kyphosisX = 160 - currentPlumb.kyphosisOffset * 0.7;
  const thoracicY = 175;
  const coreX = 160 + currentPlumb.headOffset * 0.4;
  const coreY = 255;
  const pelvicX = 160 - currentPlumb.pelvicOffset * 0.4;
  const pelvicY = 340;

  // Front view dynamic metrics
  const waistHalf = (isMale ? 36 : 30) - milestoneIndex * (isMale ? 2.5 : 3.5);
  const chestHalf = (isMale ? 48 : 42) + milestoneIndex * 1.5;
  const hipHalf = isMale ? 38 : 44;

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] flex items-center justify-center select-none overflow-hidden rounded-3xl bg-gradient-to-b from-[#141210] to-[#0A0908] border border-stone-800 shadow-2xl">
      {/* Subtle Studio Floor Radial Ambient Glow */}
      <div
        className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-20"
        style={{
          background: `radial-gradient(circle, ${currentPlumb.color} 0%, transparent 70%)`,
        }}
      />

      {/* Holographic Ground Light Ellipse (Directly Under Model Feet) */}
      <div className="absolute bottom-6 w-64 h-12 rounded-[100%] bg-stone-900/80 blur-md pointer-events-none border border-stone-800/40" />
      <div
        className="absolute bottom-6 w-44 h-7 rounded-[100%] blur-sm pointer-events-none transition-all duration-500 opacity-70"
        style={{
          background: `radial-gradient(ellipse at center, ${currentPlumb.color} 0%, transparent 70%)`,
        }}
      />

      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-stone-200">
          <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
          <span>MÔ HÌNH VÓC DÁNG 28 NGÀY</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher: 3D Biomechanical Model vs Clean Cutout Model (Both with ZERO background photo) */}
          <button
            onClick={() => setDisplayMode(displayMode === "model" ? "cutout" : "model")}
            className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-stone-800 border border-white/10 text-stone-300 hover:text-white backdrop-blur-md transition-all flex items-center gap-1.5"
            title="Chuyển đổi giữa Mô hình 3D và Hình thể Tách nền"
          >
            {displayMode === "model" ? (
              <>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Mô hình Giải Phẫu</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span className="hidden sm:inline">Người Mẫu Tách Nền</span>
              </>
            )}
          </button>

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
      </div>

      {/* Mode A: Transparent Cutout Model (Zero Background Photo, Only Character Model) */}
      {displayMode === "cutout" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 pb-12 pointer-events-none">
          <div className="relative w-full max-w-[360px] h-full max-h-[460px] flex items-end justify-center">
            <Image
              src={activeCutout}
              alt={`Hình thể mô phỏng ${currentPlumb.stage}`}
              fill
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] filter contrast-[1.08] brightness-105 transition-all duration-300"
              priority
            />
          </div>
        </div>
      )}

      {/* SVG Canvas for Biomechanical Model & Plumb Line Overlay (Zero Photo Background) */}
      <svg
        viewBox="0 0 320 500"
        className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible"
      >
        <defs>
          {/* Subtle Anatomical Gradient for Humanoid Model */}
          <linearGradient id="humanoidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#383533" />
            <stop offset="45%" stopColor="#242120" />
            <stop offset="100%" stopColor="#141312" />
          </linearGradient>

          <linearGradient id="spineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5A36" />
            <stop offset="50%" stopColor={currentPlumb.color} />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <filter id="plumbGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Mode B: Pure Biomechanical 3D Model Silhouette (Default: No Background Photo) */}
        {displayMode === "model" && (
          <g className="transition-all duration-500">
            {viewMode === "profile" ? (
              /* PROFILE VIEW SILHOUETTE */
              <g>
                {/* Athletic Head */}
                <circle
                  cx={headX}
                  cy={headY}
                  r="22"
                  fill="url(#humanoidGradient)"
                  stroke="#57534E"
                  strokeWidth="1.5"
                />

                {/* Neck & Cervical */}
                <path
                  d={`M ${headX - 6} ${headY + 18} 
                      Q ${kyphosisX + 10} 115, ${kyphosisX} 145
                      L ${kyphosisX + 28} 145
                      Q ${headX + 10} 115, ${headX + 14} ${headY + 16} Z`}
                  fill="url(#humanoidGradient)"
                />

                {/* Torso & Spine Structure (Morphs based on week) */}
                <path
                  d={`M ${kyphosisX} 145
                      C ${kyphosisX - 10} 185, ${kyphosisX + 6} 230, ${pelvicX} 270
                      C ${pelvicX - 18} 300, ${pelvicX - 12} 335, ${pelvicX} 345
                      L ${coreX + 12} 335
                      C ${coreX + 18} 280, ${coreX + (currentPlumb.headOffset * 0.4 + 10)} 240, ${coreX + 14} 200
                      C ${coreX + 22} 175, ${headX + 18} 150, ${kyphosisX + 28} 145
                      Z`}
                  fill="url(#humanoidGradient)"
                  stroke={currentPlumb.color}
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />

                {/* Chest & Muscle Definition Arc */}
                <path
                  d={`M ${headX + 14} 150 Q ${coreX + 18} 185, ${coreX + 10} 220`}
                  fill="none"
                  stroke="#57534E"
                  strokeWidth="1.5"
                />

                {/* Abdominal Toning Indicator Line */}
                <path
                  d={`M ${coreX + 10} 220 Q ${coreX + 8} 265, ${coreX + 4} 310`}
                  fill="none"
                  stroke={currentPlumb.color}
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                  strokeDasharray={milestoneIndex === 3 ? "none" : "3 3"}
                />

                {/* Legs (Hip to Knee to Ankle) */}
                <path
                  d={`M ${pelvicX} 345 
                      C ${pelvicX + 6} 380, 162 410, 160 460
                      L 174 460
                      C 176 410, ${coreX + 8} 380, ${coreX + 12} 335
                      Z`}
                  fill="url(#humanoidGradient)"
                  stroke="#57534E"
                  strokeWidth="1.2"
                />

                {/* Foot on Studio Floor Line */}
                <path
                  d="M 148 460 L 178 460"
                  stroke="#78716C"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              /* FRONTAL VIEW SILHOUETTE */
              <g>
                {/* Head */}
                <circle cx="160" cy="72" r="23" fill="url(#humanoidGradient)" stroke="#57534E" strokeWidth="1.5" />
                
                {/* Torso V-Taper / Hourglass */}
                <path
                  d={`M ${160 - chestHalf} 125 
                      C ${160 - chestHalf + 4} 165, ${160 - waistHalf} 215, ${160 - waistHalf} 240 
                      C ${160 - waistHalf} 265, ${160 - hipHalf} 280, ${160 - hipHalf} 320
                      L ${160 + hipHalf} 320
                      C ${160 + hipHalf} 280, ${160 + waistHalf} 265, ${160 + waistHalf} 240
                      C ${160 + waistHalf} 215, ${160 + chestHalf - 4} 165, ${160 + chestHalf} 125
                      Z`}
                  fill="url(#humanoidGradient)"
                  stroke={currentPlumb.color}
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />

                {/* Abdominal Definition Lines */}
                <line x1="160" y1="145" x2="160" y2="255" stroke={currentPlumb.color} strokeWidth="1.5" strokeOpacity="0.7" />
                <line x1="148" y1="180" x2="172" y2="180" stroke="#57534E" strokeWidth="1.2" />
                <line x1="150" y1="210" x2="170" y2="210" stroke="#57534E" strokeWidth="1.2" />
                <line x1="152" y1="235" x2="168" y2="235" stroke="#57534E" strokeWidth="1.2" />

                {/* Legs */}
                <path d="M 132 320 L 138 460" stroke="url(#humanoidGradient)" strokeWidth="20" strokeLinecap="round" />
                <path d="M 188 320 L 182 460" stroke="url(#humanoidGradient)" strokeWidth="20" strokeLinecap="round" />
                <line x1="126" y1="462" x2="148" y2="462" stroke="#78716C" strokeWidth="3" strokeLinecap="round" />
                <line x1="172" y1="462" x2="194" y2="462" stroke="#78716C" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
          </g>
        )}

        {/* 2. Anatomical Vector Plumb Line Overlay (Trục Dóng Trọng Tâm) */}
        {showPlumbLine && (
          <g>
            {/* Vertical Datum Baseline (Zero Alignment Plumb Line) */}
            <line
              x1="160"
              y1="40"
              x2="160"
              y2="465"
              stroke="#57534E"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.65"
            />

            {viewMode === "profile" ? (
              /* LATERAL VIEW: Ear -> Shoulder -> Hip -> Ankle Plumb Alignment */
              <g className="transition-all duration-300">
                {/* Dynamic Plumb Line Deviation Curve */}
                <path
                  d={`M ${headX} ${headY + 6} 
                      Q ${kyphosisX} ${thoracicY}, ${coreX} ${coreY} 
                      T ${pelvicX} ${pelvicY}`}
                  fill="none"
                  stroke={currentPlumb.color}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  filter="url(#plumbGlow)"
                />

                {/* 1. Ear / Cervical Node */}
                <circle
                  cx={headX}
                  cy={headY + 6}
                  r="7"
                  fill={activeHotspot === "cervical" ? "#FFFFFF" : currentPlumb.color}
                  stroke="#FFFFFF"
                  strokeWidth={activeHotspot === "cervical" ? "2.5" : "1"}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("cervical")}
                />

                {/* 2. Shoulder Girdle / Thoracic Node */}
                <circle
                  cx={kyphosisX + 8}
                  cy={thoracicY}
                  r="7"
                  fill={activeHotspot === "thoracic" ? "#FFFFFF" : currentPlumb.color}
                  stroke="#FFFFFF"
                  strokeWidth={activeHotspot === "thoracic" ? "2.5" : "1"}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("thoracic")}
                />

                {/* 3. Lumbar / Core Node */}
                <circle
                  cx={coreX}
                  cy={coreY}
                  r="7"
                  fill={activeHotspot === "core" ? "#FFFFFF" : currentPlumb.color}
                  stroke="#FFFFFF"
                  strokeWidth={activeHotspot === "core" ? "2.5" : "1"}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("core")}
                />

                {/* 4. Hip / Pelvis Node */}
                <circle
                  cx={pelvicX}
                  cy={pelvicY}
                  r="7"
                  fill={activeHotspot === "pelvis" ? "#FFFFFF" : currentPlumb.color}
                  stroke="#FFFFFF"
                  strokeWidth={activeHotspot === "pelvis" ? "2.5" : "1"}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("pelvis")}
                />

                {/* Knee to Ankle Plumb Foundation */}
                <line
                  x1={pelvicX}
                  y1={pelvicY}
                  x2="158"
                  y2="410"
                  stroke={currentPlumb.color}
                  strokeWidth="2.5"
                />
                <circle cx="158" cy="410" r="4.5" fill={currentPlumb.color} />

                <line x1="158" y1="410" x2="160" y2="460" stroke={currentPlumb.color} strokeWidth="2.5" />
                <circle cx="160" cy="460" r="5" fill="#FFFFFF" stroke={currentPlumb.color} strokeWidth="2" />
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
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  filter="url(#plumbGlow)"
                />

                {/* Shoulder Level Line */}
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
                  r="6"
                  fill={currentPlumb.color}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("cervical")}
                />
                <circle
                  cx={205}
                  cy={135 + currentPlumb.headOffset * 0.15}
                  r="6"
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
                  r="7"
                  fill={activeHotspot === "pelvis" ? "#FFFFFF" : currentPlumb.color}
                  stroke="#FFFFFF"
                  strokeWidth={activeHotspot === "pelvis" ? "2.5" : "1"}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("pelvis")}
                />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Bottom Medical / Anatomical Alignment Note */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-stone-300 bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
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
