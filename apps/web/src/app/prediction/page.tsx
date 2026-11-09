"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Compass,
  ArrowRight,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { MorphingAvatar } from "@/components/prediction/MorphingAvatar";
import { TelemetryHud } from "@/components/prediction/TelemetryHud";
import { TimelineScrubber } from "@/components/prediction/TimelineScrubber";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BodyCalibrationModal } from "@/components/prediction/BodyCalibrationModal";

export default function PredictionPage() {
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"profile" | "front" | "threeQuarter">("profile");
  const [activeHotspot, setActiveHotspot] = useState<string | null>("cervical");
  const [archetype, setArchetype] = useState<"female_pilates" | "male_strength">("female_pilates");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [customMilestones, setCustomMilestones] = useState<string[] | null>(null);

  // Read archetype, photo, and milestones from localStorage if exists
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem("g_ai_user_plan");
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        if (parsed.archetype) {
          setArchetype(parsed.archetype);
        }
        if (parsed.userPhotoBase64) {
          setUserPhoto(parsed.userPhotoBase64);
        }
      }

      const savedPhoto = localStorage.getItem("g_ai_user_twin_photo");
      if (savedPhoto) {
        setUserPhoto(savedPhoto);
      }

      const savedMilestones = localStorage.getItem("g_ai_twin_milestones");
      if (savedMilestones) {
        setCustomMilestones(JSON.parse(savedMilestones));
      }
    } catch (e) {
      // LocalStorage safety fallback
    }
  }, []);

  const progress = currentDay / 28.0;

  const handleCalibrationSave = async (updated: {
    archetype: "female_pilates" | "male_strength";
    height: number;
    weight: number;
    targetWeight: number;
    postureIssue: string;
  }) => {
    setArchetype(updated.archetype);

    // Regenerate twin milestones if needed
    try {
      const res = await fetch("/api/generate-twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype: updated.archetype,
          height: updated.height,
          weight: updated.weight,
          targetWeight: updated.targetWeight,
          postureIssue: updated.postureIssue,
          userPhotoBase64: userPhoto,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.milestoneImages) {
          setCustomMilestones(data.milestoneImages);
          localStorage.setItem("g_ai_twin_milestones", JSON.stringify(data.milestoneImages));
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handlePhotoUpdate = (newPhoto: string) => {
    setUserPhoto(newPhoto);
    try {
      localStorage.setItem("g_ai_user_twin_photo", newPhoto);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-stone-100 font-sans selection:bg-[#FF5A36]/30 selection:text-white">
      {/* 1. Tactical Navigation Bar (Empathetic & Clear) */}
      <header className="sticky top-0 z-40 bg-[#0A0908]/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/today"
              className="p-2 -ml-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
              title="Quay lại Today Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/" className="flex items-center group">
              <BrandLogo isLight={false} size="sm" showSubtitle subtitle="Dự Đoán Vóc Dáng 28 Ngày" />
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Body Calibration Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-mono text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Hiệu chỉnh số đo và tình trạng cơ thể"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span className="hidden sm:inline">Hiệu Chỉnh Chỉ Số</span>
            </button>

            <Link
              href="/quiz"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-800 text-xs font-mono text-stone-400 hover:text-white hover:border-stone-600 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Khảo Sát Lại</span>
            </Link>

            <Link
              href="/today"
              className="px-5 py-2 rounded-full bg-white hover:bg-stone-200 text-stone-900 text-xs font-bold font-mono transition-all shadow-md"
            >
              Bắt Đầu Ngày 1
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main 2-Column Desktop Split View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Sticky Pinned Visualizer with Plumb Line) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 flex flex-col items-center">
            {/* Header info */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trục Trọng Tâm & Dáng Đứng</span>
              </div>
              <span className="text-xs font-mono text-stone-500">
                Góc nhìn: {viewMode === "profile" ? "Góc Nghiêng (Profile)" : "Chính Diện (Front)"}
              </span>
            </div>

            {/* Visualizer Container with Fluid Morphing Avatar */}
            <div className="w-full rounded-3xl bg-stone-950/80 border border-stone-800/80 p-2 sm:p-4 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <MorphingAvatar
                progress={progress}
                viewMode={viewMode}
                activeHotspot={activeHotspot}
                onSelectHotspot={(hotspot) => setActiveHotspot(hotspot)}
                archetype={archetype}
                currentDay={currentDay}
                customMilestones={customMilestones || undefined}
                userPhoto={userPhoto}
                onOpenUploadModal={() => setIsModalOpen(true)}
              />
            </div>

            {/* Interactive Anatomical Hotspots Filter */}
            <div className="w-full flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 text-xs text-stone-400 select-none">
              <button
                onClick={() => setActiveHotspot("cervical")}
                className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-lg ${
                  activeHotspot === "cervical" ? "text-white font-bold bg-stone-900" : "hover:text-stone-300"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36]"></span>
                <span>Cổ & Vai Gáy</span>
              </button>
              <button
                onClick={() => setActiveHotspot("thoracic")}
                className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-lg ${
                  activeHotspot === "thoracic" ? "text-white font-bold bg-stone-900" : "hover:text-stone-300"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>Lưng Trên (Gù)</span>
              </button>
              <button
                onClick={() => setActiveHotspot("core")}
                className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-lg ${
                  activeHotspot === "core" ? "text-white font-bold bg-stone-900" : "hover:text-stone-300"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Cơ Bụng Sâu & Eo</span>
              </button>
              <button
                onClick={() => setActiveHotspot("pelvis")}
                className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-lg ${
                  activeHotspot === "pelvis" ? "text-white font-bold bg-stone-900" : "hover:text-stone-300"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Khung Chậu & Mông</span>
              </button>
            </div>

            {/* Transparent Methodology Caption */}
            <div className="w-full mt-4 flex items-start gap-2 p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-[11px] text-stone-500 leading-relaxed font-mono">
              <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <span>
                Dự đoán dựa trên dữ liệu cải thiện tư thế chuẩn y sinh học kết hợp với bài tập cá nhân hóa của bạn. Không can thiệp ăn kiêng cực đoan.
              </span>
            </div>
          </div>

          {/* Right Column: 4-Step Scrubber, Real-Life Telemetry & Chapters */}
          <div className="lg:col-span-6 space-y-6">
            {/* 1. Snap-to-Step 4-Week Milestone Timeline */}
            <TimelineScrubber
              currentDay={currentDay}
              onDayChange={setCurrentDay}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              archetype={archetype}
            />

            {/* 2. Realistic Telemetry & 3 Focus Cards */}
            <TelemetryHud
              progress={progress}
              currentDay={currentDay}
              activeHotspot={activeHotspot}
            />

            {/* 3. 4-Week Physiological Adaptation Chapters */}
            <div className="pt-2 space-y-3.5">
              <span className="text-xs font-mono uppercase tracking-widest text-stone-400 block px-1">
                Lộ Trình Thích Nghi Cơ Sinh Học
              </span>

              {/* Week 1 */}
              <div
                onClick={() => setCurrentDay(7)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay === 7
                    ? "bg-stone-900 border-[#FF5A36]/70 shadow-lg"
                    : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-[#FF5A36] font-bold">TUẦN 1 • DAY 01 — 07</span>
                  <span className="text-xs font-mono text-stone-400">Giảm -0.6kg (Thải nước)</span>
                </div>
                <h5 className="text-base font-bold text-white mb-1">
                  Đánh Thức Cơ Hoành & Giảm Căng Cứng Cổ Gáy
                </h5>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Tập trung vào nhịp thở Pilates sâu và các động tác kéo giãn cột sống cạnh tường. Cơ hoành được kích hoạt giúp lồng ngực mở nhẹ, giảm 40% cảm giác mỏi vai gáy.
                </p>
              </div>

              {/* Week 2 */}
              <div
                onClick={() => setCurrentDay(14)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay === 14
                    ? "bg-stone-900 border-[#FF5A36]/70 shadow-lg"
                    : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-emerald-400 font-bold">TUẦN 2 • DAY 08 — 14</span>
                  <span className="text-xs font-mono text-stone-400">Giảm -1.4kg (Siết cơ bụng sâu)</span>
                </div>
                <h5 className="text-base font-bold text-white mb-1">
                  Căn Chỉnh Cột Sống & Làm Phẳng Bụng Dưới
                </h5>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Kích hoạt cơ ngang bụng sâu (Transverse Abdominis). Nhóm cơ này đóng vai trò như đai nịt tự nhiên kéo phẳng thành bụng dưới 1.8cm mà không cần nín thở hóp bụng.
                </p>
              </div>

              {/* Week 3 */}
              <div
                onClick={() => setCurrentDay(21)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay === 21
                    ? "bg-stone-900 border-[#FF5A36]/70 shadow-lg"
                    : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-amber-400 font-bold">TUẦN 3 • DAY 15 — 21</span>
                  <span className="text-xs font-mono text-stone-400">Giảm -1.8kg (Săn chắc chuỗi cơ sau)</span>
                </div>
                <h5 className="text-base font-bold text-white mb-1">
                  Cân Bằng Khung Chậu & Khắc Phục Võng Lưng
                </h5>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Các bài Glute Bridge và Bird Dog điều chỉnh triệt để tật võng lưng do ngồi làm việc nhiều. Cơ mông được nâng đỡ, đưa trọng tâm cơ thể về vị trí cân bằng tự nhiên.
                </p>
              </div>

              {/* Week 4 */}
              <div
                onClick={() => setCurrentDay(28)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentDay === 28
                    ? "bg-stone-900 border-emerald-500/70 shadow-lg"
                    : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-emerald-400 font-bold">TUẦN 4 • DAY 22 — 28</span>
                  <span className="text-xs font-mono text-stone-400">Hoàn tất -2.1kg & Eo -3.0cm</span>
                </div>
                <h5 className="text-base font-bold text-white mb-1">
                  Vóc Dáng Chuẩn Mực & Bước Đi Tự Tin
                </h5>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Điểm tư thế đạt 88/100. Vai mở rộng thanh thoát, thắt lưng khỏe mạnh, thói quen giữ thẳng lưng đã trở thành phản xạ vô điều kiện suốt cả ngày.
                </p>
              </div>
            </div>

            {/* 4. Bottom High-Impact Call To Action */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/today"
                className="flex-1 py-4 rounded-2xl bg-[#FF5A36] hover:bg-[#e04825] text-white font-bold text-sm text-center transition-all shadow-xl shadow-[#FF5A36]/25 flex items-center justify-center gap-2"
              >
                <span>Bắt Đầu Kế Hoạch Tập Ngày 1 Ngay Hôm Nay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#movement-goods"
                className="px-6 py-4 rounded-2xl border border-stone-800 text-stone-300 hover:text-white hover:border-stone-600 font-mono text-xs text-center transition-colors flex items-center justify-center"
              >
                Dụng Cụ Khuyên Dùng
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Personal Calibration Modal */}
      <BodyCalibrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        archetype={archetype}
        currentPhoto={userPhoto}
        onPhotoChange={handlePhotoUpdate}
        onSave={handleCalibrationSave}
      />
    </div>
  );
}
