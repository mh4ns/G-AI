"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Compass, CheckCircle2, ChevronRight, Share2, Download } from "lucide-react";
import { MorphingAvatar } from "@/components/prediction/MorphingAvatar";
import { TelemetryHud } from "@/components/prediction/TelemetryHud";
import { TimelineScrubber } from "@/components/prediction/TimelineScrubber";

export default function PredictionPage() {
  const [currentDay, setCurrentDay] = useState(0);
  const [viewMode, setViewMode] = useState<"profile" | "front" | "threeQuarter">("profile");
  const [activeHotspot, setActiveHotspot] = useState<string | null>("core");

  // Normalized progress from 0.0 (Day 0) to 1.0 (Day 28)
  const progress = currentDay / 28.0;

  // Sync scroll or chapter clicks to day
  const setChapter = (targetDay: number) => {
    setCurrentDay(targetDay);
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-stone-100 font-sans selection:bg-[#FF5A36]/30 selection:text-white">
      {/* 1. Tactical Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0A0908]/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/today"
              className="p-2 -ml-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-baseline gap-2">
              <span className="font-black text-xl tracking-tighter text-white">G—AI</span>
              <span className="text-[10px] font-mono tracking-widest text-[#FF5A36] uppercase font-semibold">
                / Biometric Digital Twin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/quiz"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-700 text-xs font-mono text-stone-300 hover:text-white hover:border-stone-500 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Khảo Sát Lại Thể Trạng</span>
            </Link>
            <Link
              href="/today"
              className="px-5 py-2 rounded-full bg-[#FF5A36] hover:bg-[#e04825] text-white text-xs font-bold font-mono transition-all shadow-lg shadow-[#FF5A36]/20"
            >
              Mở Today Hub
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Scrollytelling Grid Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Sticky Pinned Avatar Canvas - Inspired by Mecha XYZ) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 flex flex-col items-center">
            {/* Visual Header Pill */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-400 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mô Hình Cơ Sinh Học 28 Ngày</span>
              </div>
              <span className="text-xs font-mono text-stone-500">
                Góc nhìn: {viewMode === "profile" ? "Cột Sống (Profile)" : "Chính Diện (Front)"}
              </span>
            </div>

            {/* Avatar Visual Container */}
            <div className="w-full rounded-3xl bg-stone-950/80 border border-stone-800/80 p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              {/* Corner Sci-Fi Telemetry Accents */}
              <div className="absolute top-4 left-4 text-[9px] font-mono text-stone-600">
                AXIS: 160.00 / SCALE: 1.0X
              </div>
              <div className="absolute top-4 right-4 text-[9px] font-mono text-stone-600">
                FPS: 60 / LATENCY: 0MS
              </div>
              <div className="absolute bottom-4 left-4 text-[9px] font-mono text-stone-600">
                ALGORITHM: MIFFLIN-ST JEOR V2
              </div>

              {/* The Morphing Biomechanical Avatar */}
              <MorphingAvatar
                progress={progress}
                viewMode={viewMode}
                activeHotspot={activeHotspot}
                onSelectHotspot={(hotspot) => setActiveHotspot(hotspot)}
              />
            </div>

            {/* Hotspot Quick Legend */}
            <div className="w-full flex justify-center gap-6 mt-4 text-xs text-stone-400 select-none">
              <button
                onClick={() => setActiveHotspot("cervical")}
                className={`flex items-center gap-1.5 transition-colors ${
                  activeHotspot === "cervical" ? "text-white font-bold" : "hover:text-stone-300"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#FF5A36]"></span>
                <span>Cổ & Vai Gáy</span>
              </button>
              <button
                onClick={() => setActiveHotspot("core")}
                className={`flex items-center gap-1.5 transition-colors ${
                  activeHotspot === "core" ? "text-white font-bold" : "hover:text-stone-300"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Vùng Bụng Sâu</span>
              </button>
              <button
                onClick={() => setActiveHotspot("pelvis")}
                className={`flex items-center gap-1.5 transition-colors ${
                  activeHotspot === "pelvis" ? "text-white font-bold" : "hover:text-stone-300"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Khung Chậu & Mông</span>
              </button>
            </div>
          </div>

          {/* Right Column (Timeline Scrubber + Telemetry HUD + Scrollytelling Story Chapters) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Interactive Timeline Scrubber Bar */}
            <TimelineScrubber
              currentDay={currentDay}
              onDayChange={setCurrentDay}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Reactive Telemetry HUD */}
            <TelemetryHud
              progress={progress}
              currentDay={currentDay}
              activeHotspot={activeHotspot}
            />

            {/* Scrollytelling Story Chapters */}
            <div className="pt-4 space-y-4">
              <h4 className="text-sm font-mono uppercase tracking-widest text-stone-400">
                Lộ Trình Tái Tạo Từng Giai Đoạn
              </h4>

              {/* Chapter 1: Day 0 - 7 */}
              <div
                onClick={() => setChapter(7)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay <= 7
                    ? "bg-stone-900 border-[#FF5A36]/60 shadow-lg"
                    : "bg-stone-900/40 border-stone-800 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#FF5A36] font-bold">TUẦN 1 • DAY 01 — 07</span>
                  <span className="text-xs font-mono text-stone-400">Giảm -1.3kg (Thải nước)</span>
                </div>
                <h5 className="text-base font-bold text-white mb-1.5">
                  Đánh Thức Thần Kinh - Cơ & Giảm Gù Lưng
                </h5>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Tập trung vào các bài thở Pilates sâu và bài tập chống tường (Isometric Wall Push-up). Cột sống được kéo giãn giải phóng chèn ép, góc gù lưng bắt đầu giảm từ 36° xuống 28°.
                </p>
              </div>

              {/* Chapter 2: Day 8 - 14 */}
              <div
                onClick={() => setChapter(14)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay > 7 && currentDay <= 14
                    ? "bg-stone-900 border-[#FF5A36]/60 shadow-lg"
                    : "bg-stone-900/40 border-stone-800 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold">TUẦN 2 • DAY 08 — 14</span>
                  <span className="text-xs font-mono text-stone-400">Giảm -2.7kg (Kích hoạt đốt mỡ)</span>
                </div>
                <h5 className="text-base font-bold text-white mb-1.5">
                  Siết Chặt Cơ Bụng Sâu (Transverse Abdominis)
                </h5>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Áp dụng nhịp thở sườn bên kết hợp cùng The Hundred. Nhóm cơ bụng sâu hoạt động như chiếc nịt bụng tự nhiên kéo phẳng thành bụng dưới, giảm 3.5cm vòng bụng.
                </p>
              </div>

              {/* Chapter 3: Day 15 - 21 */}
              <div
                onClick={() => setChapter(21)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay > 14 && currentDay <= 21
                    ? "bg-stone-900 border-[#FF5A36]/60 shadow-lg"
                    : "bg-stone-900/40 border-stone-800 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-amber-400 font-bold">TUẦN 3 • DAY 15 — 21</span>
                  <span className="text-xs font-mono text-stone-400">Giảm -4.5kg (Săn chắc cơ bắp)</span>
                </div>
                <h5 className="text-base font-bold text-white mb-1.5">
                  Cân Bằng Khung Chậu & Nâng Cơ Mông
                </h5>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Các bài Pelvic Glute Bridge và Quadruped Bird Dog điều chỉnh triệt để tật võng lưng do ngồi nhiều. Cơ mông được nâng cao và trọng tâm cơ thể dịch chuyển về vị trí lý tưởng.
                </p>
              </div>

              {/* Chapter 4: Day 22 - 28 */}
              <div
                onClick={() => setChapter(28)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay > 21
                    ? "bg-stone-900 border-emerald-500/60 shadow-lg"
                    : "bg-stone-900/40 border-stone-800 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold">TUẦN 4 • DAY 22 — 28</span>
                  <span className="text-xs font-mono text-stone-400">Đạt 56.5kg (-6.0kg hoàn thành)</span>
                </div>
                <h5 className="text-base font-bold text-white mb-1.5">
                  Vóc Dáng Điêu Khắc & Khí Chất Tự Tin
                </h5>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Điểm sức khỏe tư thế đạt 94/100. Vai mở rộng tự nhiên, thắt lưng khỏe mạnh không còn đau mỏi, thói quen tập luyện 15 phút mỗi ngày đã trở thành phản xạ vô điều kiện.
                </p>
              </div>
            </div>

            {/* Bottom Call to Action */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/today"
                className="flex-1 py-4 rounded-2xl bg-white text-stone-900 hover:bg-stone-200 font-bold text-sm text-center transition-colors shadow-xl"
              >
                Bắt Đầu Lộ Trình Ngay Hôm Nay
              </Link>
              <Link
                href="/store"
                className="px-6 py-4 rounded-2xl border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 font-mono text-xs text-center transition-colors"
              >
                Trang Phục Tương Thích AI
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
