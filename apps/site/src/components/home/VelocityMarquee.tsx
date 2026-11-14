"use client";

import React, { useEffect, useRef } from "react";

interface VelocityMarqueeProps {
  items?: string[];
  baseSpeed?: number; // pixels per frame
  className?: string;
}

// The list is rendered this many times so the track always overflows the
// viewport; the offset wraps after exactly one copy, which keeps the loop seamless.
const COPIES = 4;

// Plain programme facts in Vietnamese, no performance claims.
const DEFAULT_ITEMS = [
  "Khảo sát thể trạng 2 phút",
  "Lộ trình 28 ngày",
  "Chỉ cần webcam",
  "Pilates & cơ lõi · Sức mạnh",
  "Đếm rep qua camera",
  "Dự đoán vóc dáng",
];

export const VelocityMarquee: React.FC<VelocityMarqueeProps> = ({
  items = DEFAULT_ITEMS,
  baseSpeed = 1.2,
  className = "",
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Leave the band still for people who ask for less motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let copyWidth = track.scrollWidth / COPIES;
    const resizeObserver = new ResizeObserver(() => {
      copyWidth = track.scrollWidth / COPIES;
    });
    resizeObserver.observe(track);

    let lastScrollY = window.scrollY;
    let velocityBonus = 0;
    let offset = 0;
    let frame = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Temporary boost proportional to scroll speed.
      velocityBonus = Math.min(8, Math.abs(currentScrollY - lastScrollY) * 0.18);
      lastScrollY = currentScrollY;
    };

    // Writes the transform straight to the node: no React render per frame.
    const animate = () => {
      velocityBonus *= 0.94;
      offset -= baseSpeed + velocityBonus;
      if (copyWidth > 0 && -offset >= copyWidth) offset += copyWidth;
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
      frame = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    frame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [baseSpeed]);

  const repeatedItems = Array.from({ length: COPIES }, () => items).flat();

  return (
    <div className={`w-full overflow-hidden bg-ink py-4 text-page transition-colors duration-500 ${className}`}>
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div ref={trackRef} aria-hidden className="flex w-max items-center whitespace-nowrap will-change-transform">
        {repeatedItems.map((item, idx) => (
          <div key={idx} className="mx-5 flex items-center gap-10">
            <span className="font-display text-lg font-extrabold uppercase tracking-[0.02em] sm:text-2xl">{item}</span>
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
          </div>
        ))}
      </div>
    </div>
  );
};
