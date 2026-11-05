"use client";

import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  isLight?: boolean;
  variant?: "horizontal" | "icon" | "full" | "wordmark";
  size?: "sm" | "md" | "lg";
  className?: string;
  showSubtitle?: boolean;
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  isLight = false,
  variant = "horizontal",
  size = "md",
  className = "",
  showSubtitle = false,
  subtitle = "Biometric Kinetic Lab",
}) => {
  const isWhite = !isLight;

  // Sizing maps
  const heightMap = {
    sm: { icon: 24, wordmark: 16, full: 32 },
    md: { icon: 32, wordmark: 20, full: 40 },
    lg: { icon: 42, wordmark: 26, full: 54 },
  };

  const currentHeight = heightMap[size] || heightMap.md;

  const iconSrc = isWhite
    ? "/brand/logo-icon-white.png"
    : "/brand/logo-icon-black.png";

  const wordmarkSrc = isWhite
    ? "/brand/logo-wordmark-white.png"
    : "/brand/logo-wordmark-black.png";

  const fullSrc = isWhite
    ? "/brand/logo-white.png"
    : "/brand/logo-black.png";

  if (variant === "icon") {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${className}`}>
        <Image
          src={iconSrc}
          alt="G Logo"
          width={Math.round(currentHeight.icon * (243 / 255))}
          height={currentHeight.icon}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${className}`}>
        <Image
          src={wordmarkSrc}
          alt="GAi"
          width={Math.round(currentHeight.wordmark * (270 / 115))}
          height={currentHeight.wordmark}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={`relative inline-flex flex-col items-center shrink-0 ${className}`}>
        <Image
          src={fullSrc}
          alt="G-AI Brand Logo"
          width={Math.round(currentHeight.full * (270 / 385))}
          height={currentHeight.full}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  // Default: Horizontal lockup (Geometric G emblem + GAi wordmark)
  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      {/* Geometric G Monogram */}
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src={iconSrc}
          alt="G"
          width={Math.round(currentHeight.icon * (243 / 255))}
          height={currentHeight.icon}
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>

      {/* GAi Stylized Wordmark */}
      <div className="relative shrink-0 flex items-center">
        <Image
          src={wordmarkSrc}
          alt="GAi"
          width={Math.round(currentHeight.wordmark * (270 / 115))}
          height={currentHeight.wordmark}
          className="object-contain transition-opacity duration-300 group-hover:opacity-90"
          priority
        />
      </div>

      {showSubtitle && (
        <span className={`text-[10px] font-mono tracking-widest uppercase hidden sm:inline ml-1 ${
          isLight ? "text-stone-400" : "text-stone-500"
        }`}>
          / {subtitle}
        </span>
      )}
    </div>
  );
};
