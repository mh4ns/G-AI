"use client";

import React, { useState, useEffect } from "react";

interface SweepHighlightProps {
  children: React.ReactNode;
  color?: "coral" | "emerald" | "amber" | "white";
  direction?: "left" | "right";
  delayMs?: number;
  className?: string;
}

export const SweepHighlight: React.FC<SweepHighlightProps> = ({
  children,
  color = "coral",
  direction = "right",
  delayMs = 0,
  className = "",
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  const colorMap = {
    coral: "bg-[#FF5A36]",
    emerald: "bg-[#10B981]",
    amber: "bg-[#F59E0B]",
    white: "bg-white",
  };

  const sweepBg = colorMap[color];

  return (
    <span className={`relative inline-block overflow-hidden align-baseline ${className}`}>
      {/* Moving Curtain Div (Curtain scales from 1 to 0 after revealing text) */}
      <span
        className={`absolute inset-0 ${sweepBg} z-10 transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
          direction === "right" ? "origin-right" : "origin-left"
        }`}
        style={{
          transform: isRevealed ? "scaleX(0)" : "scaleX(1)",
          transitionDelay: `${delayMs + 200}ms`,
        }}
      />

      {/* Text Container with Clip-path wipe */}
      <span
        className="inline-block transition-all duration-700 ease-out"
        style={{
          clipPath: isRevealed ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
          transitionDelay: `${delayMs}ms`,
        }}
      >
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
