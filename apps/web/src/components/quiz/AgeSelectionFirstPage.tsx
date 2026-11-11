"use client";

import React from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";

interface AgeCard {
  range: string;
  image: string;
  numericAge: number;
  label: string;
}

const AGE_CARDS: AgeCard[] = [
  {
    range: "18-29",
    image: "/images/quiz/age-18-29.png",
    numericAge: 24,
    label: "Age: 18-29",
  },
  {
    range: "30-39",
    image: "/images/quiz/age-30-39.png",
    numericAge: 34,
    label: "Age: 30-39",
  },
  {
    range: "40-49",
    image: "/images/quiz/age-40-49.png",
    numericAge: 44,
    label: "Age: 40-49",
  },
  {
    range: "50+",
    image: "/images/quiz/age-50-plus.png",
    numericAge: 54,
    label: "Age: 50+",
  },
];

interface AgeSelectionFirstPageProps {
  onSelectAge: (age: number, range: string) => void;
}

export const AgeSelectionFirstPage: React.FC<AgeSelectionFirstPageProps> = ({ onSelectAge }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center animate-in fade-in duration-500">
      {/* Top Studio Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-peach-50 border border-peach-200 text-brand-action text-xs font-semibold mb-6 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 fill-brand" />
        <span>G—AI Home Pilates & Kinetic Studio</span>
      </div>

      {/* Main Title - Inspired by BetterMe Pilates */}
      <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 text-center tracking-tight leading-[1.1] mb-2">
        Home Pilates <br className="hidden sm:block" />
        Workout Studio
      </h1>

      {/* Subtitle - All caps tracked out clean */}
      <p className="text-xs sm:text-sm font-bold text-stone-500 text-center mb-8 sm:mb-12">
        Choose Your Age
      </p>

      {/* 4 Photo Cards Grid (2x2 on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 w-full max-w-3xl mb-10">
        {AGE_CARDS.map((card) => (
          <button
            key={card.range}
            onClick={() => onSelectAge(card.numericAge, card.range)}
            className="group relative flex flex-col rounded-3xl overflow-hidden bg-white border border-stone-200/90 hover:border-brand hover:shadow-[0_12px_32px_rgba(255,90,54,0.14)] transition-all duration-300 active:scale-[0.98] text-center"
          >
            {/* Model Photo Container with Soft Radiant Glow */}
            <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-peach-50/40 via-white to-stone-50 flex items-end justify-center overflow-hidden p-2">
              <Image
                src={card.image}
                alt={card.label}
                width={492}
                height={390}
                sizes="(max-width: 768px) 50vw, 180px"
                className="w-full h-auto max-h-full object-contain object-bottom group-hover:scale-105 transition-transform duration-500 ease-out"
                priority
              />
            </div>

            {/* Footer Age Label */}
            <div className="py-3.5 px-2 bg-white border-t border-stone-100 group-hover:bg-brand-action-hover transition-colors duration-300">
              <span className="font-extrabold text-sm sm:text-base text-stone-800 group-hover:text-white transition-colors duration-300">
                {card.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Trust & Legal Footer */}
      <div className="text-center space-y-3 max-w-lg text-xs text-stone-500 leading-relaxed">
        <div className="flex items-center justify-center gap-1.5 text-stone-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Hệ thống phân tích thể trạng chuẩn y khoa • Bảo mật thông tin 100%</span>
        </div>
        <p>
          Bằng việc chọn độ tuổi và tiếp tục, bạn đồng ý với{" "}
          <a href="#" className="underline hover:text-stone-700">Điều khoản sử dụng</a> và{" "}
          <a href="#" className="underline hover:text-stone-700">Chính sách bảo mật</a> của G—AI.
        </p>
      </div>
    </div>
  );
};
