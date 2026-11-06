"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Compass,
  CheckCircle2,
  ChevronRight,
  Share2,
  Download,
  Brain,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MorphingAvatar } from "@/components/prediction/MorphingAvatar";
import { TelemetryHud } from "@/components/prediction/TelemetryHud";
import { TimelineScrubber } from "@/components/prediction/TimelineScrubber";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { GenerateTwinModal } from "@/components/prediction/GenerateTwinModal";

export default function PredictionPage() {
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"profile" | "front" | "threeQuarter">("profile");
  const [activeHotspot, setActiveHotspot] = useState<string | null>("core");
  const [archetype, setArchetype] = useState<"female_pilates" | "male_strength">("female_pilates");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [customMilestones, setCustomMilestones] = useState<string[] | undefined>(undefined);
  const [generatedPrompts, setGeneratedPrompts] = useState<any[] | undefined>(undefined);
  const [showPromptsView, setShowPromptsView] = useState<boolean>(false);

  // Read archetype & cached twin images from localStorage
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem("g_ai_user_plan");
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        if (parsed.archetype) {
          setArchetype(parsed.archetype);
        }
      }
      const savedTwin = localStorage.getItem("g_ai_twin_milestones");
      if (savedTwin) {
        setCustomMilestones(JSON.parse(savedTwin));
      }
    } catch (e) {
      // LocalStorage safety fallback
    }
  }, []);

  // Normalized progress from 0.0 (Day 0) to 1.0 (Day 28)
  const progress = currentDay / 28.0;

  // Jump to specific milestone day
  const setChapter = (targetDay: number) => {
    setCurrentDay(targetDay);
  };

  const handleGenerated = (images: string[], prompts: any[]) => {
    setCustomMilestones(images);
    setGeneratedPrompts(prompts);
    try {
      localStorage.setItem("g_ai_twin_milestones", JSON.stringify(images));
    } catch (e) {
      // LocalStorage safety fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-stone-100 font-sans selection:bg-[#FF5A36]/30 selection:text-white">
      {/* 1. Tactical Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0A0908]/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/today"
              className="p-2 -ml-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/" className="flex items-center group">
              <BrandLogo isLight={false} size="sm" showSubtitle subtitle="Biometric Digital Twin" />
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {/* AI Generation Trigger Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF5A36] to-amber-500 hover:from-[#ff6b4a] hover:to-amber-400 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-[#FF5A36]/25 flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Cá Nhân Hóa Bằng AI</span>
              <span className="sm:hidden">Tạo Lại AI</span>
            </button>

            <Link
              href="/quiz"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-700 text-xs font-mono text-stone-300 hover:text-white hover:border-stone-500 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Khảo Sát Lại</span>
            </Link>

            <Link
              href="/today"
              className="px-5 py-2 rounded-full bg-white hover:bg-stone-200 text-stone-900 text-xs font-bold font-mono transition-all shadow-md"
            >
              Mở Today Hub
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Scrollytelling Grid Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Sticky Pinned Avatar Canvas) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 flex flex-col items-center">
            {/* Visual Header Pill */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300 text-xs font-mono">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bản Sao Số Tạo Sinh • ChatGPT & Gemini</span>
              </div>
              <span className="text-xs font-mono text-stone-500">
                Góc nhìn: {viewMode === "profile" ? "Cột Sống (Profile)" : "Chính Diện (Front)"}
              </span>
            </div>

            {/* Avatar Visual Container with 60 FPS Continuous Crossfade */}
            <div className="w-full rounded-3xl bg-stone-950/80 border border-stone-800/80 p-2 sm:p-4 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <MorphingAvatar
                progress={progress}
                viewMode={viewMode}
                activeHotspot={activeHotspot}
                onSelectHotspot={(hotspot) => setActiveHotspot(hotspot)}
                archetype={archetype}
                customImages={customMilestones}
              />
            </div>

            {/* Hotspot Quick Legend */}
            <div className="w-full flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 text-xs text-stone-400 select-none">
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
                onClick={() => setActiveHotspot("thoracic")}
                className={`flex items-center gap-1.5 transition-colors ${
                  activeHotspot === "thoracic" ? "text-white font-bold" : "hover:text-stone-300"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Lưng Trên (Gù)</span>
              </button>
              <button
                onClick={() => setActiveHotspot("core")}
                className={`flex items-center gap-1.5 transition-colors ${
                  activeHotspot === "core" ? "text-white font-bold" : "hover:text-stone-300"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Cơ Lõi & Eo</span>
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

            {/* AI Prompt Transparency Drawer Trigger */}
            {generatedPrompts && generatedPrompts.length > 0 && (
              <div className="w-full mt-4 p-4 rounded-2xl bg-stone-900/60 border border-stone-800 text-xs font-mono">
                <button
                  onClick={() => setShowPromptsView(!showPromptsView)}
                  className="w-full flex items-center justify-between text-stone-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#FF5A36]" />
                    <span>Xem 5 Visual Prompts Giải Phẫu Do ChatGPT Tạo</span>
                  </div>
                  {showPromptsView ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showPromptsView && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-stone-800 text-[11px] text-stone-400">
                    {generatedPrompts.map((p, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80">
                        <span className="text-emerald-400 font-bold block mb-1">
                          {p.stage}: {p.title}
                        </span>
                        <p className="line-clamp-2 text-stone-300 font-sans">{p.prompt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (Timeline Scrubber + Telemetry HUD + Scrollytelling Story Chapters) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Interactive Timeline Scrubber Bar with 60 FPS Float precision & Ticker */}
            <TimelineScrubber
              currentDay={currentDay}
              onDayChange={setCurrentDay}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              archetype={archetype}
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
                  <span className="text-xs font-mono text-stone-400">Đạt vóc dáng tối ưu (-6.0kg)</span>
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
                href="/#movement-goods"
                className="px-6 py-4 rounded-2xl border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 font-mono text-xs text-center transition-colors"
              >
                Dụng Cụ & Đồ Tập AI
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Multi-stage Generative Twin Modal */}
      <GenerateTwinModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        archetype={archetype}
        onGenerated={handleGenerated}
      />
    </div>
  );
}
