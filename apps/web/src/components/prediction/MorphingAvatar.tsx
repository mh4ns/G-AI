"use client";

import React from "react";

interface MorphingAvatarProps {
  progress: number; // 0 (Day 0) to 1 (Day 28)
  viewMode: "profile" | "front" | "threeQuarter";
  activeHotspot: string | null;
  onSelectHotspot: (hotspot: string) => void;
}

export const MorphingAvatar: React.FC<MorphingAvatarProps> = ({
  progress,
  viewMode,
  activeHotspot,
  onSelectHotspot,
}) => {
  // Interpolation helper
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Anatomic morphing parameters based on progress (0 to 1)
  // Profile view posture parameters
  const headForwardOffset = lerp(28, 6, progress); // Forward head slump reduces from 28px to 6px
  const thoracicKyphosis = lerp(24, 8, progress);  // Upper back hump flattens to natural curvature
  const lumbarLordosis = lerp(22, 10, progress);    // Lumbar hyperextension / anterior pelvic tilt normalizes
  const bellyProtrusion = lerp(32, 6, progress);    // Abdominal protrusion flattens
  const gluteTuck = lerp(-6, 8, progress);          // Glutes activate and lift
  const chestLift = lerp(-8, 10, progress);         // Ribcage lifts out of pelvis

  // Color transitions: Amber/Red (Deconditioned) -> Emerald/Coral (Sculpted & Aligned)
  const kineticColor = progress < 0.5 ? "#FF5A36" : "#10B981";
  const glowOpacity = lerp(0.35, 0.85, progress);

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] flex items-center justify-center select-none">
      {/* Background Radial Glow */}
      <div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${kineticColor}25 0%, transparent 70%)`,
          transform: `scale(${1 + progress * 0.15})`,
        }}
      />

      <svg
        viewBox="0 0 320 500"
        className="w-full h-full max-h-[520px] drop-shadow-xl overflow-visible"
      >
        <defs>
          <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A2826" />
            <stop offset="60%" stopColor="#1C1A19" />
            <stop offset="100%" stopColor="#0F0E0D" />
          </linearGradient>

          <linearGradient id="spineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5A36" />
            <stop offset="50%" stopColor={kineticColor} />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <filter id="kineticGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Vertical Alignment Plumb Line (Zero Baseline) */}
        <line
          x1="160"
          y1="40"
          x2="160"
          y2="460"
          stroke="#44403C"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.4"
        />

        {/* Profile / Lateral View (Best for Posture & Transformation visualization) */}
        {viewMode === "profile" && (
          <g className="transition-all duration-300">
            {/* Center of Gravity Marker */}
            <circle
              cx={160 + headForwardOffset * 0.6}
              cy="230"
              r="4"
              fill={kineticColor}
              opacity={glowOpacity}
              filter="url(#kineticGlow)"
            />
            <text
              x={175 + headForwardOffset * 0.6}
              y="234"
              fill="#A8A29E"
              fontSize="9"
              fontFamily="monospace"
            >
              COG {progress === 1 ? "OPTIMAL" : `${Math.round(headForwardOffset * 1.5)}mm OFFSET`}
            </text>

            {/* Dynamic Spine Curve */}
            <path
              d={`M ${160 + headForwardOffset} 85 
                  C ${160 + thoracicKyphosis + headForwardOffset * 0.5} 140, 
                    ${160 - lumbarLordosis} 210, 
                    ${160 + gluteTuck * 0.5} 270`}
              fill="none"
              stroke="url(#spineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#kineticGlow)"
            />

            {/* Kinetic Biomechanical Hotspots along Spine & Core */}
            {/* 1. Cervical / Head Hotspot */}
            <g
              className="cursor-pointer group"
              onClick={() => onSelectHotspot("cervical")}
            >
              <circle
                cx={160 + headForwardOffset}
                cy="85"
                r={activeHotspot === "cervical" ? 8 : 5}
                fill={activeHotspot === "cervical" ? "#FF5A36" : "#FFFFFF"}
                stroke={kineticColor}
                strokeWidth="2"
              />
              <circle
                cx={160 + headForwardOffset}
                cy="85"
                r="12"
                fill="none"
                stroke={kineticColor}
                strokeWidth="1"
                opacity="0.5"
                className="animate-ping"
              />
            </g>

            {/* Head Silhouette */}
            <circle
              cx={160 + headForwardOffset}
              cy="60"
              r="24"
              fill="url(#avatarGradient)"
              stroke="#57534E"
              strokeWidth="1.5"
            />
            {/* Chin & Jawline */}
            <path
              d={`M ${175 + headForwardOffset} 65 Q ${168 + headForwardOffset} 82 ${155 + headForwardOffset} 82`}
              fill="none"
              stroke="#78716C"
              strokeWidth="1.5"
            />

            {/* Torso Silhouette (Sculpts and contours with progress) */}
            <path
              d={`M ${155 + headForwardOffset} 85
                  C ${195 + chestLift} 125, ${190 + bellyProtrusion} 185, ${168 + bellyProtrusion * 0.4} 245
                  C ${162} 265, ${150 + gluteTuck} 280, ${145 + gluteTuck} 285
                  C ${130 + gluteTuck * 1.5} 275, ${130 - thoracicKyphosis * 0.5} 180, ${140} 115
                  Z`}
              fill="url(#avatarGradient)"
              stroke={kineticColor}
              strokeWidth="1.8"
              strokeOpacity="0.8"
            />

            {/* Core Activation Grid Lines (Transverse Abdominis) */}
            <path
              d={`M ${150} 175 Q ${175 + bellyProtrusion * 0.6} 185 ${180} 180`}
              fill="none"
              stroke={kineticColor}
              strokeWidth="2"
              strokeDasharray="3 3"
              opacity={glowOpacity}
            />
            <path
              d={`M ${152} 205 Q ${172 + bellyProtrusion * 0.5} 212 ${175} 210`}
              fill="none"
              stroke={kineticColor}
              strokeWidth="2"
              strokeDasharray="3 3"
              opacity={glowOpacity}
            />

            {/* 2. Core Abdominal Hotspot */}
            <g
              className="cursor-pointer group"
              onClick={() => onSelectHotspot("core")}
            >
              <circle
                cx={175 + bellyProtrusion * 0.5}
                cy="195"
                r={activeHotspot === "core" ? 8 : 5}
                fill={activeHotspot === "core" ? "#FF5A36" : "#FFFFFF"}
                stroke={kineticColor}
                strokeWidth="2"
              />
            </g>

            {/* 3. Pelvic & Glute Hotspot */}
            <g
              className="cursor-pointer group"
              onClick={() => onSelectHotspot("pelvis")}
            >
              <circle
                cx={138 + gluteTuck}
                cy="270"
                r={activeHotspot === "pelvis" ? 8 : 5}
                fill={activeHotspot === "pelvis" ? "#FF5A36" : "#FFFFFF"}
                stroke={kineticColor}
                strokeWidth="2"
              />
            </g>

            {/* Upper Leg & Knee */}
            <path
              d={`M ${155} 280 
                  C ${162} 320, ${164} 360, ${160 + progress * 2} 370
                  C ${152} 415, ${150} 450, ${152} 460`}
              fill="none"
              stroke="url(#avatarGradient)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d={`M ${155} 280 
                  C ${162} 320, ${164} 360, ${160 + progress * 2} 370
                  C ${152} 415, ${150} 450, ${152} 460`}
              fill="none"
              stroke={kineticColor}
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />

            {/* Knee Alignment Joint */}
            <circle
              cx={160 + progress * 2}
              cy="370"
              r="4"
              fill="#292524"
              stroke={kineticColor}
              strokeWidth="1.5"
            />

            {/* Ankle & Foot Base */}
            <path
              d="M 148 460 L 175 460"
              stroke="#78716C"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Front Anatomic View */}
        {viewMode === "front" && (
          <g className="transition-all duration-300">
            {/* Head */}
            <circle cx="160" cy="60" r="24" fill="url(#avatarGradient)" stroke="#57534E" strokeWidth="1.5" />
            
            {/* Shoulders & Torso (Hourglass / V-Taper morphs wider or sculpted) */}
            <path
              d={`M 115 105 
                  C 120 140, ${136 - progress * 8} 190, ${142 - progress * 10} 220 
                  C ${144 - progress * 6} 240, 126 270, 125 285
                  L 195 285
                  C 194 270, ${176 + progress * 6} 240, ${178 + progress * 10} 220
                  C ${184 + progress * 8} 190, 200 140, 205 105
                  Z`}
              fill="url(#avatarGradient)"
              stroke={kineticColor}
              strokeWidth="2"
            />

            {/* Abdominal Definition (Six Pack Lines Fading In) */}
            <line
              x1="160"
              y1="130"
              x2="160"
              y2="235"
              stroke={kineticColor}
              strokeWidth="2"
              opacity={glowOpacity}
            />
            {/* Transverse Lines */}
            <line x1="148" y1="160" x2="172" y2="160" stroke={kineticColor} strokeWidth="1.5" opacity={glowOpacity * 0.8} />
            <line x1="150" y1="185" x2="170" y2="185" stroke={kineticColor} strokeWidth="1.5" opacity={glowOpacity * 0.8} />
            <line x1="152" y1="210" x2="168" y2="210" stroke={kineticColor} strokeWidth="1.5" opacity={glowOpacity * 0.8} />

            {/* Core Hotspot Front */}
            <g className="cursor-pointer" onClick={() => onSelectHotspot("core")}>
              <circle cx="160" cy="185" r={activeHotspot === "core" ? 8 : 5} fill={activeHotspot === "core" ? "#FF5A36" : "#FFFFFF"} stroke={kineticColor} strokeWidth="2" />
            </g>

            {/* Legs */}
            <path d="M 135 285 L 138 460" stroke="url(#avatarGradient)" strokeWidth="18" strokeLinecap="round" />
            <path d="M 185 285 L 182 460" stroke="url(#avatarGradient)" strokeWidth="18" strokeLinecap="round" />
          </g>
        )}

        {/* Dynamic Biomechanical Metric Readout Pointer */}
        <g transform="translate(20, 40)">
          <rect width="90" height="26" rx="6" fill="#1C1917" stroke="#44403C" strokeWidth="1" />
          <text x="8" y="17" fill="#E7E5E4" fontSize="10" fontFamily="monospace" fontWeight="bold">
            {progress < 0.25 ? "DAY 0 BASELINE" : progress < 0.5 ? "DAY 7 REPAIR" : progress < 0.75 ? "DAY 14 TONE" : progress < 1 ? "DAY 21 SCULPT" : "DAY 28 PEAK"}
          </text>
        </g>
      </svg>
    </div>
  );
};
