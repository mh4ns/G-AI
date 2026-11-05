"use client";

import React, { useState, useEffect } from "react";

interface SweepHighlightProps {
  children: React.ReactNode;
  color?: "coral" | "emerald" | "amber" | "white" | "orange";
  delayMs?: number;
  className?: string;
}

export const SweepHighlight: React.FC<SweepHighlightProps> = ({
  children,
  color = "coral",
  delayMs = 150,
  className = "",
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  const colorStyles = {
    coral: "bg-[#FF6B4A] text-white shadow-lg shadow-[#FF6B4A]/25",
    orange: "bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/25",
    emerald: "bg-[#10B981] text-white shadow-lg shadow-[#10B981]/25",
    amber: "bg-[#F59E0B] text-stone-950 shadow-lg shadow-[#F59E0B]/25",
    white: "bg-white text-stone-900 shadow-md",
  };

  const activeStyle = colorStyles[color] || colorStyles.coral;

  return (
    <span className={`relative inline-block align-baseline whitespace-nowrap mx-1 my-0.5 ${className}`}>
      {/* 1. Background Highlight Pill (Always underneath text at z-0) */}
      <span
        className={`absolute inset-0 rounded-2xl ${activeStyle} z-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left`}
        style={{
          transform: isRevealed ? "scaleX(1)" : "scaleX(0)",
        }}
      />

      {/* 2. Text Container (Always on top at z-20, 100% visible, never obstructed) */}
      <span className="relative z-20 inline-block px-3 py-1 text-white font-black tracking-tight select-none">
        {children}
      </span>
    </span>
  );
};

interface FlipTextHoverProps {
  text: string;
  className?: string;
  activeClassName?: string;
}

export const FlipTextHover: React.FC<FlipTextHoverProps> = ({
  text,
  className = "",
  activeClassName = "text-[#FF5A36]",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className={`relative inline-flex overflow-hidden cursor-pointer select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="flex">
        {text.split("").map((char, index) => (
          <span
            key={index}
            className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform: isHovered ? "translateY(-100%)" : "translateY(0%)",
              transitionDelay: `${index * 18}ms`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>

      {/* Duplicate Row rolling in from bottom */}
      <span className={`absolute inset-0 flex ${activeClassName}`}>
        {text.split("").map((char, index) => (
          <span
            key={index}
            className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform: isHovered ? "translateY(0%)" : "translateY(100%)",
              transitionDelay: `${index * 18}ms`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    </span>
  );
};
