"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Activity, ShieldCheck, Flame, Compass, Play, Lightbulb } from "lucide-react";
import { SweepHighlight, FlipTextHover } from "@/components/home/KineticText";
import { appUrl } from "@g-ai/ui";

interface DualAthleteHeroProps {
  athleteMode: "female" | "male";
  theme: "dark" | "light";
  onSelectAthlete: (mode: "female" | "male") => void;
  onToggleTheme: () => void;
}

export const DualAthleteHero: React.FC<DualAthleteHeroProps> = ({
  athleteMode,
  theme,
  onSelectAthlete,
  onToggleTheme,
}) => {
  const isLight = theme === "light";

  // Telemetry profiles for each gender
  const athleteData = {
    female: {
      name: "Chương Trình Nữ • Pilates Sculpt & Core Alignment",
      headlinePrefix: "Khắc Phục Võng Lưng &",
      highlightWord: "Siết Eo Tự Nhiên",
      headlineSuffix: "Sau 28 Ngày",
      tagline: "Ứng dụng khoa học chuyển hóa & bài tập Pilates cơ lõi sâu. AI đồng hành qua camera sửa dáng từng centimet mà không cần tạ nặng.",
      color: "coral" as const,
      accentHex: "#FF6B4A",
      stats: [
        { label: "BMR Trung Bình", value: "1,350 kcal", desc: "Năng lượng trao đổi chất cơ bản" },
        { label: "Góc Gù Lưng (Kyphosis)", value: "36° → 12°", desc: "Cột sống thẳng tự nhiên" },
        { label: "Kích Hoạt Cơ Bụng Sâu", value: "+48%", desc: "Transverse Abdominis" },
      ],
      primaryImage: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
      badge: "PILATES SCULPT • 28 DAYS",
    },
    male: {
      name: "Chương Trình Nam • Athletic Strength & Biomechanics",
      headlinePrefix: "Tái Tạo Chuỗi Cơ Sau &",
      highlightWord: "Bức Phá Thể Lực",
      headlineSuffix: "Chuẩn Cơ Sinh Học",
      tagline: "Phát triển sức mạnh chức năng, giải phóng khớp vai cổ và xây dựng cơ bắp cân đối. AI cảnh báo sai khớp gối và đếm rep theo thời gian thực.",
      color: "emerald" as const,
      accentHex: "#10B981",
      stats: [
        { label: "BMR Trung Bình", value: "1,820 kcal", desc: "Đốt mỡ liên tục cả ngày" },
        { label: "Độ Mở Khớp Háng & Lưng", value: "+38°", desc: "Giải phóng chèn ép thắt lưng" },
        { label: "Hiệu Suất Phát Lực Lưng Xô", value: "92%", desc: "Posterior Chain Symmetry" },
      ],
      primaryImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85",
      badge: "ATHLETIC POWER • 28 DAYS",
    },
  };

  const current = athleteData[athleteMode];

  return (
    <section className="relative w-full pt-4 pb-16 sm:pb-24 overflow-hidden select-none">
      {/* Background Radial Ambient Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000 opacity-20"
        style={{
          background: athleteMode === "female"
            ? "radial-gradient(circle, #FF6B4A 0%, transparent 70%)"
            : "radial-gradient(circle, #10B981 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Tactical Gender Switcher Bar + Lightbulb Theme Toggle Button */}
        <div className="flex items-center justify-center gap-3 mb-8 sm:mb-12">
          {/* Dual Pill Switcher */}
          <div className={`inline-flex p-1.5 rounded-2xl border backdrop-blur-md shadow-xl transition-colors duration-300 ${
            isLight
              ? "bg-white/90 border-stone-200 shadow-stone-200/50"
              : "bg-stone-900/90 border-stone-800 shadow-black/50"
          }`}>
            <button
              onClick={() => onSelectAthlete("female")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                athleteMode === "female"
                  ? "bg-[#FF6B4A] text-white shadow-lg shadow-[#FF6B4A]/25"
                  : isLight ? "text-stone-600 hover:text-black" : "text-stone-400 hover:text-white"
              }`}
            >
              <span>♀ Nữ • Pilates & Vòng Eo</span>
            </button>

            <button
              onClick={() => onSelectAthlete("male")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                athleteMode === "male"
                  ? "bg-[#10B981] text-white shadow-lg shadow-[#10B981]/25"
                  : isLight ? "text-stone-600 hover:text-black" : "text-stone-400 hover:text-white"
              }`}
            >
              <span>♂ Nam • Sức Mạnh & Cơ Sinh Học</span>
            </button>
          </div>

          {/* Lightbulb Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-center group shadow-md hover:scale-105 active:scale-95 ${
              isLight
                ? "bg-white border-amber-300/80 text-amber-500 shadow-amber-500/10 hover:border-amber-400"
                : "bg-stone-900 border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-400/50"
            }`}
            title={`Chuyển sang nền ${isLight ? "Tối (Đen)" : "Sáng (Trắng)"}`}
            aria-label="Đổi màu nền"
          >
            <Lightbulb className={`w-5 h-5 transition-transform group-hover:rotate-12 ${
              isLight ? "fill-amber-400 text-amber-500 stroke-[2.5]" : "stroke-[2]"
            }`} />
          </button>
        </div>

        {/* 2. Main Hero Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono transition-colors ${
              isLight 
                ? "bg-stone-100 border-stone-200 text-stone-700" 
                : "bg-stone-900 border-stone-800 text-stone-300"
            }`}>
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: current.accentHex }}
              />
              <span className="font-bold uppercase tracking-wider">
                {current.badge}
              </span>
            </div>

            {/* Headline with Safe Non-Obstructing SweepHighlight */}
            <h1 className={`text-3xl sm:text-5xl lg:text-[52px] font-black tracking-tight leading-[1.18] transition-colors ${
              isLight ? "text-stone-950" : "text-white"
            }`}>
              {current.headlinePrefix} <br className="hidden sm:inline" />
              <SweepHighlight
                key={`${athleteMode}-${theme}-highlight`}
                color={current.color}
                delayMs={120}
              >
                {current.highlightWord}
              </SweepHighlight>{" "}
              {current.headlineSuffix}
            </h1>

            <p className={`text-sm sm:text-base max-w-xl leading-relaxed transition-colors ${
              isLight ? "text-stone-600" : "text-stone-400"
            }`}>
              {current.tagline}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3.5">
              <Link
                href={appUrl("/quiz")}
                className={`px-7 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.99] text-white ${
                  athleteMode === "male"
                    ? "bg-[#10B981] hover:bg-[#0da06f] shadow-[#10B981]/25"
                    : "bg-[#FF6B4A] hover:bg-[#ff5530] shadow-[#FF6B4A]/25"
                }`}
              >
                <span>Bắt Đầu Khảo Sát Thể Trạng 28 Ngày</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={appUrl("/prediction")}
                className={`px-6 py-4 rounded-2xl font-mono text-xs flex items-center justify-center gap-2 transition-colors border ${
                  isLight
                    ? "bg-white hover:bg-stone-50 text-stone-800 border-stone-300 shadow-sm"
                    : "bg-stone-900 hover:bg-stone-800 text-stone-200 border-stone-800"
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Xem Mô Hình Digital Twin</span>
              </Link>
            </div>

            {/* Live Telemetry Metrics Row */}
            <div className={`pt-4 grid grid-cols-3 gap-3 border-t transition-colors ${
              isLight ? "border-stone-200" : "border-stone-800/80"
            }`}>
              {current.stats.map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <span className={`text-[10px] font-mono uppercase block truncate ${
                    isLight ? "text-stone-500" : "text-stone-500"
                  }`}>
                    {s.label}
                  </span>
                  <span className={`text-lg sm:text-xl font-bold font-mono block ${
                    isLight ? "text-stone-900" : "text-white"
                  }`}>
                    {s.value}
                  </span>
                  <span className={`text-[10px] block truncate ${
                    isLight ? "text-stone-500" : "text-stone-400"
                  }`}>
                    {s.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual Image & Live HUD Overlay */}
          <div className="lg:col-span-6 relative">
            <div className={`relative w-full aspect-[4/5] sm:aspect-[4/4.5] rounded-3xl overflow-hidden border shadow-2xl transition-all duration-500 ${
              isLight 
                ? "border-stone-200/90 bg-white" 
                : "border-stone-800 bg-stone-950"
            }`}>
              {/* Responsive Photography with Smooth Cross-Dissolve */}
              <Image
                key={athleteMode}
                src={current.primaryImage}
                alt={current.name}
                fill
                priority
                className="object-cover object-center animate-in fade-in zoom-in-95 duration-700"
              />

              {/* Dynamic Gradient Scrim for Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

              {/* Top Glass Badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-mono">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: current.accentHex }}
                />
                <span className="font-semibold tracking-wider">{current.name}</span>
              </div>

              {/* Bottom Telemetry HUD Card */}
              <div className="absolute bottom-4 inset-x-4 z-10 p-4 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>AI COMPUTER VISION • READY</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    {athleteMode === "female" ? "Phân Tích Cột Sống & Khớp Hông" : "Định Vị Đường Đi Tạ & Chuỗi Cơ Sau"}
                  </h4>
                </div>

                <Link
                  href={appUrl("/quiz")}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-stone-200 border border-white/20 transition-colors"
                >
                  Mở Camera PT →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
