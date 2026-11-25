/// <reference path="./assets.d.ts" />
"use client";

import React from "react";
import Image from "next/image";
import iconBlack from "../assets/logo-icon-black.png";
import iconWhite from "../assets/logo-icon-white.png";
import wordmarkBlack from "../assets/logo-wordmark-black.png";
import wordmarkWhite from "../assets/logo-wordmark-white.png";
import fullBlack from "../assets/logo-black.png";
import fullWhite from "../assets/logo-white.png";

export interface BrandLogoProps {
  /** Legacy surface flag: true renders black artwork for light backgrounds. */
  isLight?: boolean;
  /** Surface tone ("light" renders black artwork, "dark" renders white artwork). Takes precedence over `isLight`. */
  tone?: "dark" | "light";
  variant?: "horizontal" | "icon" | "full" | "wordmark";
  size?: "sm" | "md" | "lg";
  className?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  alt?: string;
}

const ICON_SIZES = {
  sm: { width: 25, height: 26 },
  md: { width: 32, height: 34 },
  lg: { width: 44, height: 46 },
} as const;

const WORDMARK_SIZES = {
  sm: { width: 47, height: 20 },
  md: { width: 61, height: 26 },
  lg: { width: 85, height: 36 },
} as const;

const FULL_SIZES = {
  sm: { width: 31, height: 44 },
  md: { width: 45, height: 64 },
  lg: { width: 62, height: 88 },
} as const;

const HORIZONTAL_SIZES = {
  sm: { icon: { width: 23, height: 24 }, wordmark: { width: 42, height: 18 }, gap: "gap-2" },
  md: { icon: { width: 30, height: 32 }, wordmark: { width: 56, height: 24 }, gap: "gap-2.5" },
  lg: { icon: { width: 40, height: 42 }, wordmark: { width: 70, height: 30 }, gap: "gap-3" },
} as const;

export const BrandLogo: React.FC<BrandLogoProps> = ({
  isLight = false,
  tone,
  variant = "icon",
  size = "md",
  className = "",
  showSubtitle = false,
  subtitle = "Biometric Kinetic Lab",
  alt,
}) => {
  const isWhite = tone ? tone === "dark" : !isLight;

  const iconSrc = isWhite ? iconWhite : iconBlack;
  const wordmarkSrc = isWhite ? wordmarkWhite : wordmarkBlack;
  const fullSrc = isWhite ? fullWhite : fullBlack;

  const resolvedSize = size in ICON_SIZES ? size : "md";
  const primaryAlt = alt ?? "G-AI";

  let mark: React.ReactNode;

  if (variant === "horizontal") {
    const dims = HORIZONTAL_SIZES[resolvedSize];
    mark = (
      <div className={`relative shrink-0 inline-flex items-center ${dims.gap}`}>
        <Image
          src={iconSrc}
          alt={primaryAlt}
          width={dims.icon.width}
          height={dims.icon.height}
          style={{ width: dims.icon.width, height: dims.icon.height }}
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
        <Image
          src={wordmarkSrc}
          alt=""
          aria-hidden
          width={dims.wordmark.width}
          height={dims.wordmark.height}
          style={{ width: dims.wordmark.width, height: dims.wordmark.height }}
          className="object-contain"
          priority
        />
      </div>
    );
  } else if (variant === "wordmark") {
    const dims = WORDMARK_SIZES[resolvedSize];
    mark = (
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src={wordmarkSrc}
          alt={primaryAlt}
          width={dims.width}
          height={dims.height}
          style={{ width: dims.width, height: dims.height }}
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>
    );
  } else if (variant === "full") {
    const dims = FULL_SIZES[resolvedSize];
    mark = (
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src={fullSrc}
          alt={primaryAlt}
          width={dims.width}
          height={dims.height}
          style={{ width: dims.width, height: dims.height }}
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>
    );
  } else {
    const dims = ICON_SIZES[resolvedSize];
    mark = (
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src={iconSrc}
          alt={alt ?? "G"}
          width={dims.width}
          height={dims.height}
          style={{ width: dims.width, height: dims.height }}
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 select-none ${className}`}>
      {mark}

      {showSubtitle && (
        <span
          className={`text-xs hidden sm:inline ml-0.5 ${
            isWhite ? "text-white/70" : "text-ink-muted"
          }`}
        >
          / {subtitle}
        </span>
      )}
    </div>
  );
};
