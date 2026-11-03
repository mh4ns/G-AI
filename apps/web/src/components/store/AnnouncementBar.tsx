"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ANNOUNCEMENTS = [
  "IT'S OFFICIALLY FITNESS SEASON • ƯU ĐÃI LÊN ĐẾN 35%",
  "NEW GEAR. NEW WAYS TO MOVE. • BỘ SƯU TẬP MỚI ĐÃ LÊN KỆ",
  "THE G-AI ATHLEISURE & PILATES EDIT • PHONG CÁCH TỐI GIẢN CAO CẤP",
  "GIẢM 15% CHO ĐƠN HÀNG ĐẦU TIÊN 🔥 • MÃ: WELCOME15",
];

export const AnnouncementBar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
  };

  return (
    <div className="bg-[#1C2E3C] text-white h-10 sm:h-11 px-4 flex items-center justify-between text-xs tracking-wider font-medium select-none z-50 relative overflow-hidden">
      <button
        onClick={handlePrev}
        className="text-stone-400 hover:text-white transition-colors p-1"
        aria-label="Previous announcement"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <div className="text-center truncate px-2 transition-all duration-500 ease-in-out font-mono sm:font-sans uppercase">
        <span className="hover:underline cursor-pointer">{ANNOUNCEMENTS[currentIndex]}</span>
      </div>

      <button
        onClick={handleNext}
        className="text-stone-400 hover:text-white transition-colors p-1"
        aria-label="Next announcement"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
