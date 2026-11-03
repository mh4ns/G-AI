"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Activity, ShieldCheck, Flame, Compass, Play } from "lucide-react";
import { SweepHighlight, FlipTextHover } from "@/components/home/KineticText";

export const DualAthleteHero: React.FC = () => {
  const [athleteMode, setAthleteMode] = useState<"female" | "male">("female");

  // Telemetry profiles for each gender
  const athleteData = {
    female: {
      name: "Chương Trình Nữ • Pilates Sculpt & Core Alignment",
      headlinePrefix: "Khắc Phục Võng Lưng &",
      highlightWord: "Siết Eo Tự Nhiên",
      headlineSuffix: "Sau 28 Ngày",
      tagline: "Ứng dụng khoa học chuyển hóa & bài tập Pilates cơ lõi sâu. AI đồng hành qua camera sửa dáng từng centimet mà không cần tạ nặng.",
      color: "coral" as const,
      accentHex: "#FF5A36",
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
    <section className="relative w-full pt-6 pb-16 sm:pb-24 overflow-hidden select-none">
      {/* Background Radial Ambient Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000 opacity-25"
        style={{
          background: athleteMode === "female"
            ? "radial-gradient(circle, #FF5A36 0%, transparent 70%)"
            : "radial-gradient(circle, #10B981 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Tactical Gender Switcher Bar (Lando Norris Duality Style) */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md shadow-2xl">
            <button
              onClick={() => setAthleteMode("female")}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                athleteMode === "female"
                  ? "bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/25"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <span>♀ Nữ • Pilates & Vòng Eo</span>
            </button>

            <button
              onClick={() => setAthleteMode("male")}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                athleteMode === "male"
                  ? "bg-[#10B981] text-white shadow-lg shadow-[#10B981]/25"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <span>♂ Nam • Sức Mạnh & Cơ Sinh Học</span>
            </button>
          </div>
        </div>

        {/* 2. Main Hero Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-xs font-mono">
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: current.accentHex }}
              />
              <span className="text-stone-300 font-bold uppercase tracking-wider">
                {current.badge}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              {current.headlinePrefix}{" "}
              <SweepHighlight
                key={`${athleteMode}-highlight`}
                color={current.color}
                delayMs={150}
                className="text-white"
              >
                <span className="text-white">{current.highlightWord}</span>
              </SweepHighlight>{" "}
              {current.headlineSuffix}
            </h1>

            <p className="text-sm sm:text-base text-stone-400 max-w-xl leading-relaxed">
              {current.tagline}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3.5">
              <Link
                href="/quiz"
                className="px-7 py-4 rounded-2xl bg-[#FF5A36] hover:bg-[#e04825] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#FF5A36]/20 active:scale-[0.99]"
              >
                <span>Bắt Đầu Khảo Sát Thể Trạng 28 Ngày</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/prediction"
                className="px-6 py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 font-mono text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Xem Mô Hình Digital Twin</span>
              </Link>
            </div>

            {/* Live Telemetry Metrics Row */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-stone-800/80">
              {current.stats.map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-500 block truncate">
                    {s.label}
                  </span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-white block">
                    {s.value}
                  </span>
                  <span className="text-[10px] text-stone-400 block truncate">
                    {s.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual Image & Live HUD Overlay (Pinterest Aesthetic) */}
          <div className="lg:col-span-6 relative">
            <div className="relative w-full aspect-[4/5] sm:aspect-[4/4.5] rounded-3xl overflow-hidden border border-stone-800 bg-stone-950 shadow-2xl">
              {/* Image Transition Layer */}
              <Image
                key={athleteMode}
                src={current.primaryImage}
                alt={current.name}
                fill
                priority
                className="object-cover object-center filter brightness-[0.9] contrast-[1.05] transition-all duration-700 ease-out animate-fadeIn"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Gradient Vignette Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0908] via-transparent to-transparent opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0908]/40 via-transparent to-transparent" />

              {/* Floating Tactical HUD Card (Inspired by Lando Norris Telemetry) */}
              <div className="absolute bottom-5 left-5 right-5 p-4 sm:p-5 rounded-2xl bg-[#0D0C0B]/90 backdrop-blur-md border border-stone-800 text-white flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: current.accentHex }}
                    />
                    <span className="text-[11px] font-mono tracking-widest text-stone-400 uppercase">
                      AI Computer Vision • Ready
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {athleteMode === "female" ? "Tự Động Nhận Diện Võng Lưng & Khớp Gối" : "Định Vị Đường Đi Tạ & Chuỗi Cơ Sau"}
                  </h4>
                </div>

                <Link
                  href="/today"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono text-white transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>Mở Camera PT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
