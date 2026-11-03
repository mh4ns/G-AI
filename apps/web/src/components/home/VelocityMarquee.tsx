"use client";

import React, { useEffect, useState, useRef } from "react";

interface VelocityMarqueeProps {
  items?: string[];
  baseSpeed?: number; // pixels per frame
  className?: string;
}

export const VelocityMarquee: React.FC<VelocityMarqueeProps> = ({
  items = [
    "REAL-TIME AI POSTURE CORRECTION",
    "28-DAY DIGITAL TWIN TRANSFORMATION",
    "ZERO WEARABLE HARDWARE REQUIRED",
    "PILATES SCULPT & BIOMECHANICAL STRENGTH",
    "PRECISION CAMERA REP COUNTING",
  ],
  baseSpeed = 1.2,
  className = "",
}) => {
  const [offset, setOffset] = useState(0);
  const lastScrollY = useRef(0);
  const velocityBonus = useRef(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollY.current);
      lastScrollY.current = currentScrollY;

      // Add temporary velocity boost proportional to scroll speed
      velocityBonus.current = Math.min(8.0, delta * 0.18);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    let currentOffset = 0;
    const animate = () => {
      // Decay velocity bonus back to 0
      velocityBonus.current *= 0.94;
      const currentSpeed = baseSpeed + velocityBonus.current;

      currentOffset -= currentSpeed;
      if (currentOffset <= -1200) {
        currentOffset = 0;
      }
      setOffset(currentOffset);

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [baseSpeed]);

  const repeatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className={`w-full overflow-hidden py-3 bg-[#0D0C0B] border-y border-stone-800/80 select-none ${className}`}>
      <div
        className="flex whitespace-nowrap items-center will-change-transform"
        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
      >
        {repeatedItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 mx-5">
            <span className="text-xs sm:text-sm font-mono tracking-widest uppercase font-bold text-stone-300">
              {item}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
