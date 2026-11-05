"use client";

import React from "react";
import Image from "next/image";

export interface BrandLogoProps {
  isLight?: boolean;
  variant?: "horizontal" | "icon" | "full" | "wordmark";
  size?: "sm" | "md" | "lg";
  className?: string;
  showSubtitle?: boolean;
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  isLight = false,
  size = "md",
  className = "",
  showSubtitle = false,
  subtitle = "Biometric Kinetic Lab",
}) => {
  const isWhite = !isLight;

  // Calibrated dimensions for the tight geometric G emblem (230x242 aspect ratio ~0.95)
  const sizeMap = {
    sm: { height: 26, width: 25 },
    md: { height: 34, width: 32 },
    lg: { height: 46, width: 44 },
  };

  const { height, width } = sizeMap[size] || sizeMap.md;

  const iconSrc = isWhite
    ? "/brand/logo-icon-white.png"
    : "/brand/logo-icon-black.png";

  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 select-none ${className}`}>
      {/* Pure Geometric "G" Monogram Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src={iconSrc}
          alt="G"
          width={width}
          height={height}
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>

      {/* Optional Subtitle (e.g., / Biometric Kinetic Lab) */}
      {showSubtitle && (
        <span
          className={`text-[10px] font-mono tracking-widest uppercase hidden sm:inline ml-0.5 ${
            isLight ? "text-stone-400" : "text-stone-500"
          }`}
        >
          / {subtitle}
        </span>
      )}
    </div>
  );
};
