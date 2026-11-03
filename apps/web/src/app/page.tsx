"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Flame, Compass, HeartHandshake } from "lucide-react";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { DualAthleteHero } from "@/components/home/DualAthleteHero";
import { VelocityMarquee } from "@/components/home/VelocityMarquee";
import { DualAthleteGallery } from "@/components/home/DualAthleteGallery";
import { AiVisionTeaser } from "@/components/home/AiVisionTeaser";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0908] text-stone-100 font-sans selection:bg-[#FF5A36]/30 selection:text-white">
      {/* 1. Tactical Glassmorphic Header */}
      <HomeNavbar />

      {/* 2. Interactive Dual-Athlete Hero Stage (Gender Toggle + Telemetry HUD + Pinterest Imagery) */}
      <DualAthleteHero />

      {/* 3. Physics-Driven Dynamic Velocity Marquee (Accelerates on Scroll) */}
      <VelocityMarquee />

      {/* 4. Editorial Pinterest-Curated Athlete Gallery (Male & Female) */}
      <DualAthleteGallery />

      {/* 5. AI Live PT Computer Vision Teaser */}
      <AiVisionTeaser />

      {/* 6. Ecosystem Call to Action Banner */}
      <section className="py-20 sm:py-28 bg-[#0D0C0B] border-t border-stone-800 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-xs font-mono text-[#FF5A36]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hành Trình Chuyển Hóa Cá Nhân Hóa</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            28 Ngày Định Hình Lại Tư Thế & Vóc Dáng Của Bạn
          </h2>

          <p className="text-sm sm:text-base text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Trả lời khảo sát thể trạng 2 phút. Thuật toán khoa học chuyển hóa Mifflin-St Jeor sẽ dự đoán chính xác cân nặng, lượng calo mục tiêu và lộ trình bài tập phù hợp với cơ thể bạn.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/quiz"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#FF5A36] hover:bg-[#e04825] text-white font-bold text-sm transition-all shadow-xl shadow-[#FF5A36]/25 flex items-center justify-center gap-2"
            >
              <span>Làm Khảo Sát Thể Trạng Miễn Phí</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/prediction"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white font-mono text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Xem Bản Sao Số (Digital Twin)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-12 bg-[#080706] border-t border-stone-800/80 text-xs text-stone-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">G—AI ECOSYSTEM</span>
            <span>•</span>
            <span>Khoa học vận động & Trí tuệ nhân tạo</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/quiz" className="hover:text-stone-300 transition-colors">Khảo Sát</Link>
            <Link href="/prediction" className="hover:text-stone-300 transition-colors">Digital Twin</Link>
            <Link href="/today" className="hover:text-stone-300 transition-colors">Today Hub</Link>
            <Link href="/store" className="hover:text-stone-300 transition-colors">Store</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
