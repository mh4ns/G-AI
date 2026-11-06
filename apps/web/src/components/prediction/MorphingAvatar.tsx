"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Sparkles, Activity, ShieldCheck } from "lucide-react";

export interface MorphingAvatarProps {
  progress: number; // 0.0 (Day 0) to 1.0 (Day 28)
  viewMode: "profile" | "front" | "threeQuarter";
  activeHotspot: string | null;
  onSelectHotspot: (hotspot: string) => void;
  archetype?: "female_pilates" | "male_strength";
  customImages?: string[]; // Optional user-generated images from Gemini/ChatGPT pipeline
}

export const MorphingAvatar: React.FC<MorphingAvatarProps> = ({
  progress,
  viewMode,
  activeHotspot,
  onSelectHotspot,
  archetype = "female_pilates",
  customImages,
}) => {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const isMale = archetype === "male_strength";

  // Default photorealistic generative milestones (Day 0, 7, 14, 21, 28)
  const defaultImages = isMale
    ? [
        "/twins/male-day-0.jpg",
        "/twins/male-day-7.jpg",
        "/twins/male-day-14.jpg",
        "/twins/male-day-21.jpg",
        "/twins/male-day-28.jpg",
      ]
    : [
        "/twins/female-day-0.jpg",
        "/twins/female-day-7.jpg",
        "/twins/female-day-14.jpg",
        "/twins/female-day-21.jpg",
        "/twins/female-day-28.jpg",
      ];

  const milestoneImages = (customImages && customImages.length === 5)
    ? customImages
    : defaultImages;

  // 60 FPS Continuous Crossfade Interpolation
  // Split progress (0 to 1) across 4 inter-milestone segments
  const scaled = Math.min(3.999, Math.max(0, progress * 4));
  const segmentIndex = Math.floor(scaled); // 0: 0-7, 1: 7-14, 2: 14-21, 3: 21-28
  const segmentFraction = scaled - segmentIndex; // 0.0 to 1.0

  const activeImageA = milestoneImages[segmentIndex];
  const activeImageB = milestoneImages[segmentIndex + 1] || milestoneImages[segmentIndex];

  // Helper for linear interpolation
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Dynamic biomechanical skeletal parameters
  const spineOffset = lerp(26, 4, progress); // Curvature misalignment straightening
  const kyphosisCurve = lerp(28, 8, progress); // Thoracic hump flattening
  const pelvicAngle = lerp(18, 0, progress); // Anterior pelvic tilt leveling out
  const shoulderHeightDelta = lerp(14, 0, progress); // Shoulder height imbalance resolving
  const kineticColor = progress < 0.5 ? "#FF5A36" : "#10B981";

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] flex items-center justify-center select-none overflow-hidden rounded-3xl bg-gradient-to-b from-[#141210] to-[#0A0908] border border-stone-800 shadow-2xl">
      {/* 1. Atmospheric Studio Ambient Glow */}
      <div
        className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 opacity-30"
        style={{
          background: `radial-gradient(circle, ${kineticColor} 0%, transparent 70%)`,
          transform: `scale(${1 + progress * 0.2})`,
        }}
      />

      {/* 2. Top Interactive HUD Status Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-xs font-mono">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-stone-300">
          <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
          <span>AI TWIN LERP • {(progress * 100).toFixed(0)}% OPTIMAL</span>
        </div>

        {/* Skeleton Toggle Button */}
        <button
          onClick={() => setShowSkeleton(!showSkeleton)}
          className={`px-3 py-1.5 rounded-full border backdrop-blur-md transition-all flex items-center gap-1.5 font-bold ${
            showSkeleton
              ? "bg-[#FF5A36]/20 border-[#FF5A36]/60 text-white shadow-md shadow-[#FF5A36]/20"
              : "bg-black/60 border-white/10 text-stone-400 hover:text-white"
          }`}
          title="Bật/Tắt khung xương MediaPipe"
        >
          {showSkeleton ? <Eye className="w-3.5 h-3.5 text-[#FF5A36]" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showSkeleton ? "Khung Xương: Bật" : "Khung Xương: Tắt"}</span>
        </button>
      </div>

      {/* 3. Layer A & Layer B: Photorealistic AI Generative Image Crossfade */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-[420px] h-full max-h-[500px] rounded-2xl overflow-hidden shadow-2xl">
          {/* Base Image A */}
          <div
            className="absolute inset-0 w-full h-full transition-opacity duration-75"
            style={{ opacity: 1 - segmentFraction }}
          >
            <Image
              src={activeImageA}
              alt="Digital Twin Stage A"
              fill
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover object-center filter contrast-[1.05]"
              priority
            />
          </div>

          {/* Morphing Image B */}
          <div
            className="absolute inset-0 w-full h-full transition-opacity duration-75"
            style={{ opacity: segmentFraction }}
          >
            <Image
              src={activeImageB}
              alt="Digital Twin Stage B"
              fill
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover object-center filter contrast-[1.05]"
              priority
            />
          </div>

          {/* Vignette Edge Shading for Seamless Studio Blending */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0908] via-transparent to-[#0A0908]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0908]/50 via-transparent to-[#0A0908]/50 pointer-events-none" />
        </div>
      </div>

      {/* 4. Layer C: Dynamic Biomechanical SVG Skeletal Overlay */}
      {showSkeleton && (
        <svg
          viewBox="0 0 320 500"
          className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible"
        >
          <defs>
            <filter id="skeletonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Vertical Alignment Plumb Baseline (Center Datum) */}
          <line
            x1="160"
            y1="35"
            x2="160"
            y2="465"
            stroke="#57534E"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {viewMode === "profile" ? (
            /* LATERAL / PROFILE VIEW SKELETON */
            <g className="transition-all duration-75">
              {/* Cervical to Lumbar Spine Curve */}
              <path
                d={`M ${160 + spineOffset * 0.7} 85 
                    Q ${160 - kyphosisCurve * 0.8} 175, ${160 + spineOffset * 0.5} 250 
                    T ${160 - pelvicAngle * 0.4} 340`}
                fill="none"
                stroke={kineticColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#skeletonGlow)"
              />

              {/* Head / Cervical Node */}
              <circle
                cx={160 + spineOffset * 0.7}
                cy="85"
                r="6"
                fill={kineticColor}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("cervical")}
              />

              {/* Thoracic Node */}
              <circle
                cx={160 - kyphosisCurve * 0.8 + 8}
                cy="175"
                r="6.5"
                fill={activeHotspot === "thoracic" ? "#FFFFFF" : kineticColor}
                stroke="#FFFFFF"
                strokeWidth={activeHotspot === "thoracic" ? "2" : "0"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("thoracic")}
              />

              {/* Lumbar Lordosis Node */}
              <circle
                cx={160 + spineOffset * 0.5}
                cy="250"
                r="7"
                fill={activeHotspot === "core" ? "#FFFFFF" : kineticColor}
                stroke="#FFFFFF"
                strokeWidth={activeHotspot === "core" ? "2" : "0"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("core")}
              />

              {/* Pelvis & Sacrum Node */}
              <circle
                cx={160 - pelvicAngle * 0.4}
                cy="340"
                r="6.5"
                fill={activeHotspot === "pelvis" ? "#FFFFFF" : kineticColor}
                stroke="#FFFFFF"
                strokeWidth={activeHotspot === "pelvis" ? "2" : "0"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("pelvis")}
              />

              {/* Femur & Knee Line */}
              <line
                x1={160 - pelvicAngle * 0.4}
                y1="340"
                x2="158"
                y2="410"
                stroke={kineticColor}
                strokeWidth="2.5"
              />
              <circle cx="158" cy="410" r="5" fill={kineticColor} />

              {/* Tibia & Ankle Line */}
              <line x1="158" y1="410" x2="160" y2="465" stroke={kineticColor} strokeWidth="2.5" />
              <circle cx="160" cy="465" r="4.5" fill={kineticColor} />
            </g>
          ) : (
            /* FRONTAL / ANTERIOR VIEW SKELETON */
            <g className="transition-all duration-75">
              {/* Spine Central Column */}
              <line
                x1="160"
                y1="85"
                x2="160"
                y2="335"
                stroke={kineticColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#skeletonGlow)"
              />

              {/* Shoulder Clavicle Girdle */}
              <line
                x1={115}
                y1={130 - shoulderHeightDelta * 0.3}
                x2={205}
                y2={130 + shoulderHeightDelta * 0.3}
                stroke={kineticColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle
                cx="115"
                cy={130 - shoulderHeightDelta * 0.3}
                r="5.5"
                fill={kineticColor}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("cervical")}
              />
              <circle
                cx="205"
                cy={130 + shoulderHeightDelta * 0.3}
                r="5.5"
                fill={kineticColor}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("cervical")}
              />

              {/* Ribcage / Core Transverse Ring */}
              <ellipse
                cx="160"
                cy="230"
                rx={lerp(48, 38, progress)}
                ry={lerp(18, 12, progress)}
                fill="none"
                stroke={kineticColor}
                strokeWidth="2"
                strokeDasharray="3 3"
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("core")}
              />

              {/* Pelvis Iliac Crest */}
              <line
                x1="125"
                y1="335"
                x2="195"
                y2="335"
                stroke={kineticColor}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle
                cx="160"
                cy="335"
                r="6.5"
                fill={activeHotspot === "pelvis" ? "#FFFFFF" : kineticColor}
                stroke="#FFFFFF"
                strokeWidth={activeHotspot === "pelvis" ? "2" : "0"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("pelvis")}
              />

              {/* Legs / Knee Alignment */}
              <line x1="130" y1="335" x2="135" y2="415" stroke={kineticColor} strokeWidth="2.5" />
              <line x1="190" y1="335" x2="185" y2="415" stroke={kineticColor} strokeWidth="2.5" />
              <circle cx="135" cy="415" r="5" fill={kineticColor} />
              <circle cx="185" cy="415" r="5" fill={kineticColor} />

              <line x1="135" y1="415" x2="135" y2="465" stroke={kineticColor} strokeWidth="2" />
              <line x1="185" y1="415" x2="185" y2="465" stroke={kineticColor} strokeWidth="2" />
              <circle cx="135" cy="465" r="4" fill={kineticColor} />
              <circle cx="185" cy="465" r="4" fill={kineticColor} />
            </g>
          )}
        </svg>
      )}

      {/* 5. Bottom Live Calibration Badge */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-[11px] font-mono text-stone-400">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>GÓC LỆCH: {(spineOffset).toFixed(1)}mm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>MEDIAPIPE 33-POINT RIG</span>
        </div>
      </div>
    </div>
  );
};
