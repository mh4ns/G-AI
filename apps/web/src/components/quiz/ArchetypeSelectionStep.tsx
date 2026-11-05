"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, ArrowRight, Flame, HeartPulse, CheckCircle2 } from "lucide-react";
import { AthleticArchetype } from "@/types/quiz";

interface ArchetypeSelectionStepProps {
  selectedArchetype: AthleticArchetype;
  onSelect: (archetype: AthleticArchetype) => void;
}

export const ArchetypeSelectionStep: React.FC<ArchetypeSelectionStepProps> = ({
  selectedArchetype,
  onSelect,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center animate-in fade-in duration-500">
      {/* Top Studio Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-peach-50/80 border border-peach-200/60 text-[#FF5A36] text-xs font-semibold mb-6 shadow-sm backdrop-blur-sm">
        <Sparkles className="w-3.5 h-3.5 fill-[#FF5A36]" />
        <span>G—AI Adaptive Studio Onboarding</span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl font-black text-center tracking-tight leading-[1.1] mb-3 text-stone-900">
        Chọn Trường Phái & Thể Trạng Mục Tiêu
      </h1>

      <p className="text-sm sm:text-base text-stone-600 text-center max-w-xl mb-10 leading-relaxed">
        G-AI sẽ điều chỉnh toàn bộ giao diện, giáo án luyện tập khoa học và khẩu phần dinh dưỡng 28 ngày cá nhân hóa phù hợp với thể trạng của bạn.
      </p>

      {/* Dual Archetype Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Card 1: Female Pilates & Core */}
        <div
          onClick={() => onSelect("female_pilates")}
          className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 text-left p-6 sm:p-8 flex flex-col justify-between min-h-[460px] ${
            selectedArchetype === "female_pilates"
              ? "border-[#FF6B4A] shadow-xl shadow-[#FF6B4A]/10 ring-4 ring-[#FF6B4A]/20 bg-gradient-to-b from-white to-[#FFF5F0]"
              : "border-stone-200 bg-white hover:border-[#FF6B4A]/50 hover:shadow-lg hover:-translate-y-1"
          }`}
        >
          {/* Background Photography Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80"
              alt="Female Pilates & Core"
              fill
              className="object-cover object-center opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />
          </div>

          {/* Top Card Details */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-peach-100 text-[#FF5A36] text-[11px] font-bold uppercase tracking-wider">
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Nữ Giới • Pilates & Core</span>
              </span>
              {selectedArchetype === "female_pilates" && (
                <CheckCircle2 className="w-6 h-6 text-[#FF6B4A] fill-peach-100" />
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mb-2">
              Pilates & Thon Gọn Cơ Lõi
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
              Định hình eo thon phẳng bụng, nâng mông quả đào, cải thiện độ cong cột sống và tăng độ dẻo dai cơ thể toàn diện.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2.5 py-1 rounded-lg bg-stone-100/80 text-stone-700 text-xs font-medium">
                Wall Pilates
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-100/80 text-stone-700 text-xs font-medium">
                Core & Pelvic Floor
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-100/80 text-stone-700 text-xs font-medium">
                Spine Care & Giảm Đau
              </span>
            </div>
          </div>

          {/* Bottom Card Action */}
          <div className="relative z-10 pt-4 border-t border-stone-200/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">
              Bảng màu: Sáng Luminous Peach
            </span>
            <div className="w-10 h-10 rounded-full bg-[#FF6B4A] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Male Strength & Hypertrophy */}
        <div
          onClick={() => onSelect("male_strength")}
          className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 text-left p-6 sm:p-8 flex flex-col justify-between min-h-[460px] ${
            selectedArchetype === "male_strength"
              ? "border-[#FF5A36] shadow-xl shadow-[#FF5A36]/20 ring-4 ring-[#FF5A36]/30 bg-gradient-to-b from-stone-900 to-black text-white"
              : "border-stone-800 bg-[#141312] text-white hover:border-[#FF5A36]/60 hover:shadow-lg hover:-translate-y-1"
          }`}
        >
          {/* Background Photography Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80"
              alt="Male Strength & Conditioning"
              fill
              className="object-cover object-center opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0908] via-[#0A0908]/85 to-transparent" />
          </div>

          {/* Top Card Details */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A36]/20 border border-[#FF5A36]/40 text-[#FF5A36] text-[11px] font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                <span>Nam Giới • Strength & Sức Bền</span>
              </span>
              {selectedArchetype === "male_strength" && (
                <CheckCircle2 className="w-6 h-6 text-[#FF5A36] fill-[#FF5A36]/20" />
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Strength & Tăng Khối Cơ Nạc
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-6">
              Xây dựng khối cơ ngực - vai - xô dày dặn, siết mỡ cắt nét 6 múi, bùng nổ sức mạnh gân khớp và tối ưu thể lực.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2.5 py-1 rounded-lg bg-stone-800/90 text-stone-200 text-xs font-medium border border-stone-700">
                Hypertrophy
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-800/90 text-stone-200 text-xs font-medium border border-stone-700">
                Calisthenics & Tạ Đơn
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-800/90 text-stone-200 text-xs font-medium border border-stone-700">
                Lưng Xô & Lõi Bụng
              </span>
            </div>
          </div>

          {/* Bottom Card Action */}
          <div className="relative z-10 pt-4 border-t border-stone-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">
              Bảng màu: Dark Kinetic Obsidian
            </span>
            <div className="w-10 h-10 rounded-full bg-[#FF5A36] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
