"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Sparkles, User, Activity, Camera, Upload } from "lucide-react";

export interface MorphingAvatarProps {
  progress: number; // 0.0 to 1.0 (from currentDay / 28)
  viewMode: "profile" | "front" | "threeQuarter";
  activeHotspot: string | null;
  onSelectHotspot: (hotspot: string) => void;
  archetype?: "female_pilates" | "male_strength";
  currentDay?: number;
  customMilestones?: string[];
  userPhoto?: string | null;
  onOpenUploadModal?: () => void;
}

export const MorphingAvatar: React.FC<MorphingAvatarProps> = ({
  progress,
  viewMode,
  activeHotspot,
  onSelectHotspot,
  archetype = "female_pilates",
  currentDay = 0,
  customMilestones,
  userPhoto,
  onOpenUploadModal,
}) => {
  const [showPlumbLine, setShowPlumbLine] = useState(true);
  const [displayMode, setDisplayMode] = useState<"model" | "cutout">("cutout");
  const isMale = archetype === "male_strength";

  // 5 Calibrated Milestone Cutouts for 28-day kinetic protocol (0, 7, 14, 21, 28)
  const defaultFemaleCutouts = [
    userPhoto || "/twins/female-day-0.png",
    "/twins/female-day-7.png",
    "/twins/female-day-14.png",
    "/twins/female-day-21.png",
    "/twins/female-day-28.png",
  ];

  const defaultMaleCutouts = [
    userPhoto || "/twins/male-day-0.png",
    "/twins/male-day-7.png",
    "/twins/male-day-14.png",
    "/twins/male-day-21.png",
    "/twins/male-day-28.png",
  ];

  const activeMilestones = (customMilestones && customMilestones.length >= 5)
    ? customMilestones
    : (isMale ? defaultMaleCutouts : defaultFemaleCutouts);

  // Continuous interpolation between milestones across 28 days
  // Milestones: Day 0 (idx 0), Day 7 (idx 1), Day 14 (idx 2), Day 21 (idx 3), Day 28 (idx 4)
  const clampedDay = Math.max(0, Math.min(28, currentDay));
  const segmentDuration = 7;
  const baseSegment = Math.min(3, Math.floor(clampedDay / segmentDuration));
  const nextSegment = Math.min(4, baseSegment + 1);
  const segmentAlpha = (clampedDay - baseSegment * segmentDuration) / segmentDuration; // 0.0 -> 1.0

  const primaryImage = activeMilestones[baseSegment] || activeMilestones[0];
  const secondaryImage = activeMilestones[nextSegment] || activeMilestones[baseSegment];

  // Continuous Plumb Line Offsets interpolation
  // Day 0: 22° / 18° deviation -> Day 28: 0° optimal plumb line
  const headOffset = 24 * (1 - progress) + 2 * progress;
  const kyphosisOffset = 22 * (1 - progress) + 3 * progress;
  const pelvicOffset = 16 * (1 - progress) + 1 * progress;
  const currentAngleDeg = Math.round(18 * (1 - progress));

  const statusColor = progress > 0.75 
    ? "#10B981" 
    : progress > 0.35 
    ? "#F59E0B" 
    : "#FF5A36";

  const statusText = progress > 0.75
    ? "Trục cơ thể: Cân bằng vững vàng (0° lệch)"
    : progress > 0.35
    ? `Cơ dựng sống đang nâng thẳng (${currentAngleDeg}° lệch)`
    : `Độ đổ thân trên & gù lưng (${currentAngleDeg}° lệch)`;

  // Dynamic Biomechanical Model Coordinates
  const headX = 160 + headOffset * 0.7;
  const headY = 76;
  const kyphosisX = 160 - kyphosisOffset * 0.7;
  const thoracicY = 175;
  const coreX = 160 + headOffset * 0.4;
  const coreY = 255;
  const pelvicX = 160 - pelvicOffset * 0.4;
  const pelvicY = 340;

  // Front view dynamic metrics
  const waistHalf = (isMale ? 36 : 30) - progress * (isMale ? 6 : 8);
  const chestHalf = (isMale ? 48 : 42) + progress * 2.5;
  const hipHalf = isMale ? 38 : 44;

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] flex items-center justify-center select-none overflow-hidden rounded-3xl bg-gradient-to-b from-[#141210] to-[#0A0908] border border-stone-800 shadow-2xl">
      {/* Subtle Studio Floor Radial Ambient Glow */}
      <div
        className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-300 opacity-20"
        style={{
          background: `radial-gradient(circle, ${statusColor} 0%, transparent 70%)`,
        }}
      />

      {/* Holographic Ground Light Ellipse (Under Model Feet) */}
      <div className="absolute bottom-6 w-64 h-12 rounded-[100%] bg-stone-900/80 blur-md pointer-events-none border border-stone-800/40" />
      <div
        className="absolute bottom-6 w-44 h-7 rounded-[100%] blur-sm pointer-events-none transition-all duration-300 opacity-70"
        style={{
          background: `radial-gradient(ellipse at center, ${statusColor} 0%, transparent 70%)`,
        }}
      />

      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-stone-200">
          <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
          <span>BẢN SAO SỐ • NGÀY {clampedDay}/28</span>
          {userPhoto && (
            <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/30">
              ẢNH THẬT
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Photo Re-upload Trigger */}
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="px-3 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-200 hover:text-white backdrop-blur-md transition-all flex items-center gap-1.5 active:scale-95"
              title="Cập nhật hoặc chụp ảnh thể trạng mới"
            >
              <Camera className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span className="hidden sm:inline">Đổi Ảnh Thật</span>
            </button>
          )}

          {/* Mode Switcher: Wireframe vs Cutout */}
          <button
            onClick={() => setDisplayMode(displayMode === "model" ? "cutout" : "model")}
            className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-stone-800 border border-white/10 text-stone-300 hover:text-white backdrop-blur-md transition-all flex items-center gap-1.5"
            title="Chuyển đổi giữa Mô hình 3D và Hình thể Tách nền"
          >
            {displayMode === "model" ? (
              <>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Mô hình 3D</span>
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

      {/* Mode A: Transparent Cutout Model with Fluid Continuous Crossfade */}
      {displayMode === "cutout" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 pb-12 pointer-events-none">
          <div className="relative w-full max-w-[360px] h-full max-h-[460px] flex items-end justify-center">
            {/* Primary Base Milestone Image */}
            <div
              className="absolute inset-0 transition-opacity duration-150"
              style={{ opacity: 1 - segmentAlpha * 0.95 }}
            >
              <Image
                src={primaryImage}
                alt={`Mốc ${baseSegment * 7}`}
                fill
                sizes="(max-width: 768px) 100vw, 360px"
                className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] filter contrast-[1.06] brightness-105"
                priority
              />
            </div>

            {/* Secondary Next Milestone Image for Smooth Interpolation */}
            {baseSegment !== nextSegment && (
              <div
                className="absolute inset-0 transition-opacity duration-150"
                style={{ opacity: segmentAlpha * 0.95 }}
              >
                <Image
                  src={secondaryImage}
                  alt={`Mốc ${nextSegment * 7}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] filter contrast-[1.06] brightness-105"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SVG Canvas for Biomechanical Model & Plumb Line Overlay */}
      <svg
        viewBox="0 0 320 500"
        className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible"
      >
        <defs>
          <linearGradient id="humanoidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#383533" />
            <stop offset="45%" stopColor="#242120" />
            <stop offset="100%" stopColor="#141312" />
          </linearGradient>

          <linearGradient id="spineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5A36" />
            <stop offset="50%" stopColor={statusColor} />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <filter id="plumbGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Mode B: Biomechanical 3D Model Wireframe Silhouette */}
        {displayMode === "model" && (
          <g className="transition-all duration-300">
            {viewMode === "profile" ? (
              /* PROFILE VIEW SILHOUETTE */
              <g>
                <circle
                  cx={headX}
                  cy={headY}
                  r="22"
                  fill="url(#humanoidGradient)"
                  stroke="#57534E"
                  strokeWidth="1.5"
                />

                <path
                  d={`M ${headX - 6} ${headY + 18} 
                      Q ${kyphosisX + 10} 115, ${kyphosisX} 145
                      L ${kyphosisX + 28} 145
                      Q ${headX + 10} 115, ${headX + 14} ${headY + 16} Z`}
                  fill="url(#humanoidGradient)"
                />

                <path
                  d={`M ${kyphosisX} 145
                      C ${kyphosisX - 10} 185, ${kyphosisX + 6} 230, ${pelvicX} 270
                      C ${pelvicX - 18} 300, ${pelvicX - 12} 335, ${pelvicX} 345
                      L ${coreX + 12} 335
                      C ${coreX + 18} 280, ${coreX + (headOffset * 0.4 + 10)} 240, ${coreX + 14} 200
                      C ${coreX + 22} 175, ${headX + 18} 150, ${kyphosisX + 28} 145
                      Z`}
                  fill="url(#humanoidGradient)"
                  stroke={statusColor}
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />

                <path
                  d={`M ${headX + 14} 150 Q ${coreX + 18} 185, ${coreX + 10} 220`}
                  fill="none"
                  stroke="#57534E"
                  strokeWidth="1.5"
                />

                <path
                  d={`M ${coreX + 10} 220 Q ${coreX + 8} 265, ${coreX + 4} 310`}
                  fill="none"
                  stroke={statusColor}
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                  strokeDasharray={progress > 0.8 ? "none" : "3 3"}
                />

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
                <circle cx="160" cy="72" r="23" fill="url(#humanoidGradient)" stroke="#57534E" strokeWidth="1.5" />
                <path
                  d={`M ${160 - chestHalf} 125 
                      C ${160 - chestHalf + 4} 165, ${160 - waistHalf} 215, ${160 - waistHalf} 240 
                      C ${160 - waistHalf} 265, ${160 - hipHalf} 280, ${160 - hipHalf} 320
                      L ${160 + hipHalf} 320
                      C ${160 + hipHalf} 280, ${160 + waistHalf} 265, ${160 + waistHalf} 240
                      C ${160 + waistHalf} 215, ${160 + chestHalf - 4} 165, ${160 + chestHalf} 125
                      Z`}
                  fill="url(#humanoidGradient)"
                  stroke={statusColor}
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />
                <line x1="160" y1="145" x2="160" y2="255" stroke={statusColor} strokeWidth="1.5" strokeOpacity="0.7" />
                <path d="M 132 320 L 138 460" stroke="url(#humanoidGradient)" strokeWidth="20" strokeLinecap="round" />
                <path d="M 188 320 L 182 460" stroke="url(#humanoidGradient)" strokeWidth="20" strokeLinecap="round" />
                <line x1="126" y1="462" x2="148" y2="462" stroke="#78716C" strokeWidth="3" strokeLinecap="round" />
                <line x1="172" y1="462" x2="194" y2="462" stroke="#78716C" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
          </g>
        )}

        {/* Anatomical Vector Plumb Line Overlay */}
        {showPlumbLine && (
          <g>
            {/* Vertical Reference Axis */}
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
              <g className="transition-all duration-150">
                <path
                  d={`M ${headX} ${headY + 6} 
                      Q ${kyphosisX} ${thoracicY}, ${coreX} ${coreY} 
                      T ${pelvicX} ${pelvicY}`}
                  fill="none"
                  stroke={statusColor}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  filter="url(#plumbGlow)"
                />

                {/* Ear / Cervical Node */}
                <circle
                  cx={headX}
                  cy={headY + 6}
                  r="7"
                  fill={activeHotspot === "cervical" ? "#FFFFFF" : statusColor}
                  stroke="#FFFFFF"
                  strokeWidth={activeHotspot === "cervical" ? "2.5" : "1"}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("cervical")}
                />

                {/* Thoracic Node */}
                <circle
                  cx={kyphosisX + 8}
                  cy={thoracicY}
                  r="7"
                  fill={activeHotspot === "thoracic" ? "#FFFFFF" : statusColor}
                  stroke="#FFFFFF"
                  strokeWidth={activeHotspot === "thoracic" ? "2.5" : "1"}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("thoracic")}
                />

                {/* Core Node */}
                <circle
                  cx={coreX}
                  cy={coreY}
                  r="7"
                  fill={activeHotspot === "core" ? "#FFFFFF" : statusColor}
                  stroke="#FFFFFF"
                  strokeWidth={activeHotspot === "core" ? "2.5" : "1"}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("core")}
                />

                {/* Pelvis Node */}
                <circle
                  cx={pelvicX}
                  cy={pelvicY}
                  r="7"
                  fill={activeHotspot === "pelvis" ? "#FFFFFF" : statusColor}
                  stroke="#FFFFFF"
                  strokeWidth={activeHotspot === "pelvis" ? "2.5" : "1"}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("pelvis")}
                />

                {/* Legs alignment */}
                <line x1={pelvicX} y1={pelvicY} x2="158" y2="410" stroke={statusColor} strokeWidth="2.5" />
                <circle cx="158" cy="410" r="4.5" fill={statusColor} />
                <line x1="158" y1="410" x2="160" y2="460" stroke={statusColor} strokeWidth="2.5" />
                <circle cx="160" cy="460" r="5" fill="#FFFFFF" stroke={statusColor} strokeWidth="2" />
              </g>
            ) : (
              <g className="transition-all duration-150">
                <line x1="160" y1="85" x2="160" y2="340" stroke={statusColor} strokeWidth="3.2" strokeLinecap="round" filter="url(#plumbGlow)" />
                <line
                  x1={115}
                  y1={135 - headOffset * 0.15}
                  x2={205}
                  y2={135 + headOffset * 0.15}
                  stroke={statusColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx={115} cy={135 - headOffset * 0.15} r="6" fill={statusColor} className="pointer-events-auto cursor-pointer" onClick={() => onSelectHotspot("cervical")} />
                <circle cx={205} cy={135 + headOffset * 0.15} r="6" fill={statusColor} className="pointer-events-auto cursor-pointer" onClick={() => onSelectHotspot("cervical")} />
                <ellipse
                  cx="160"
                  cy="240"
                  rx={45 - (1 - progress) * 8}
                  ry="14"
                  fill="none"
                  stroke={statusColor}
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onSelectHotspot("core")}
                />
                <line x1="125" y1="340" x2="195" y2="340" stroke={statusColor} strokeWidth="3" strokeLinecap="round" />
                <circle cx="160" cy="340" r="7" fill={activeHotspot === "pelvis" ? "#FFFFFF" : statusColor} stroke="#FFFFFF" strokeWidth={activeHotspot === "pelvis" ? "2.5" : "1"} className="pointer-events-auto cursor-pointer" onClick={() => onSelectHotspot("pelvis")} />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Bottom Medical Alignment Status Note */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-stone-300 bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <span className="font-bold">{statusText}</span>
        </div>
        <div className="text-stone-400">
          Trọng tâm: <span className="text-white font-bold">{progress >= 0.8 ? "Tối ưu hóa" : "Đang căn chỉnh"}</span>
        </div>
      </div>
    </div>
  );
};
