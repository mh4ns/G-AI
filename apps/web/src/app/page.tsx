"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { DualAthleteHero } from "@/components/home/DualAthleteHero";
import { VelocityMarquee } from "@/components/home/VelocityMarquee";
import { DualAthleteGallery } from "@/components/home/DualAthleteGallery";
import { AiVisionTeaser } from "@/components/home/AiVisionTeaser";

export default function HomePage() {
  const [athleteMode, setAthleteMode] = useState<"female" | "male">("female");
  const [theme, setTheme] = useState<"dark" | "light">("light");

  const handleSelectAthlete = (mode: "female" | "male") => {
    setAthleteMode(mode);
    // Automatic default: male -> dark, female -> light
    setTheme(mode === "male" ? "dark" : "light");
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-500 ${
        isLight
          ? "bg-[#FFFDF9] text-stone-900 selection:bg-[#FF6B4A]/20 selection:text-[#FF6B4A]"
          : "bg-[#0A0908] text-stone-100 selection:bg-[#FF5A36]/30 selection:text-white"
      }`}
    >
      {/* 1. Tactical Glassmorphic Header with Light/Dark Adaptation */}
      <HomeNavbar isLight={isLight} />

      {/* 2. Interactive Dual-Athlete Hero Stage with Lightbulb Switcher */}
      <DualAthleteHero
        athleteMode={athleteMode}
        theme={theme}
        onSelectAthlete={handleSelectAthlete}
        onToggleTheme={handleToggleTheme}
      />

      {/* 3. Physics-Driven Dynamic Velocity Marquee */}
      <VelocityMarquee />

      {/* 4. Editorial Pinterest-Curated Athlete Gallery */}
      <DualAthleteGallery />

      {/* 5. AI Live PT Computer Vision Teaser */}
      <AiVisionTeaser />

      {/* 6. Ecosystem Call to Action Banner */}
      <section className={`py-20 sm:py-28 border-t text-center relative overflow-hidden transition-colors duration-500 ${
        isLight
          ? "bg-white border-stone-200"
          : "bg-[#0D0C0B] border-stone-800"
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono ${
            isLight
              ? "bg-peach-50 border-peach-200 text-[#FF6B4A]"
              : "bg-stone-900 border-stone-800 text-[#FF5A36]"
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hành Trình Chuyển Hóa Cá Nhân Hóa</span>
          </div>

          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight leading-tight ${
            isLight ? "text-stone-950" : "text-white"
          }`}>
            28 Ngày Định Hình Lại Tư Thế & Vóc Dáng Của Bạn
          </h2>

          <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${
            isLight ? "text-stone-600" : "text-stone-400"
          }`}>
            Trả lời khảo sát thể trạng 2 phút. Thuật toán khoa học chuyển hóa Mifflin-St Jeor sẽ dự đoán chính xác cân nặng, lượng calo mục tiêu và lộ trình bài tập phù hợp với cơ thể bạn.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/quiz"
              className={`w-full sm:w-auto px-8 py-4 rounded-full text-white font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                isLight
                  ? "bg-[#FF6B4A] hover:bg-[#ff5530] shadow-[#FF6B4A]/25"
                  : "bg-[#FF5A36] hover:bg-[#e04825] shadow-[#FF5A36]/25"
              }`}
            >
              <span>Làm Khảo Sát Thể Trạng Miễn Phí</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/prediction"
              className={`w-full sm:w-auto px-8 py-4 rounded-full font-mono text-xs transition-colors flex items-center justify-center gap-2 border ${
                isLight
                  ? "bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800"
                  : "bg-stone-900 hover:bg-stone-800 border-stone-700 text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Xem Bản Sao Số (Digital Twin)</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
