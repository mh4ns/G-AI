"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const SLIDES = [
  {
    tag: "BỘ SƯU TẬP MỚI 2026",
    headline: "NEW GEAR. NEW WAYS TO MOVE.",
    subline: "Trang phục tập luyện định hình vóc dáng kết hợp dụng cụ Pilates tối giản, đồng hành cùng trợ lý AI trên từng chuyển động.",
    ctaText: "Khám Phá Ngay",
    ctaLink: "#bestsellers",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1920&q=85",
    theme: "dark",
  },
  {
    tag: "PILATES ESSENTIALS",
    headline: "THE PILATES PRINCESS EDIT",
    subline: "Bộ dụng cụ thảm 8mm, vòng siết đùi kháng lực và bóng mini tông màu đất Chocolate & Grounded Green sang trọng.",
    ctaText: "Mua Bộ Dụng Cụ (-35%)",
    ctaLink: "#equipment",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1920&q=85",
    theme: "light",
  },
];

export const HeroBannerSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] lg:h-[700px] overflow-hidden bg-stone-900 select-none">
      {/* Background Image with smooth transition */}
      {SLIDES.map((s, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
          style={{ transition: "opacity 1s ease-in-out, transform 8s ease-out" }}
        >
          <img
            src={s.image}
            alt={s.headline}
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient Overlay for high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent lg:w-2/3" />
        </div>
      ))}

      {/* Hero Content Overlay */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center text-white z-10">
        <div className="max-w-2xl space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold tracking-wider uppercase border border-white/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{slide.tag}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
            {slide.headline}
          </h1>

          <p className="text-stone-200 text-sm sm:text-lg font-normal leading-relaxed max-w-xl">
            {slide.subline}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              href={slide.ctaLink}
              className="px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-white text-stone-900 font-bold text-sm sm:text-base hover:bg-[#FF6542] hover:text-white transition-all duration-300 shadow-xl flex items-center gap-2 group active:scale-95"
            >
              <span>{slide.ctaText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <Link
              href="/quiz"
              className="px-6 py-3.5 sm:px-7 sm:py-4 rounded-full bg-black/40 backdrop-blur-md border border-white/40 text-white font-semibold text-sm hover:bg-white/20 transition-all duration-300"
            >
              Khảo Sát Size & Dáng
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
