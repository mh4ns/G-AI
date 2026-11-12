"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { appUrl } from "@g-ai/ui";
import { DualAthleteHero } from "@/components/home/DualAthleteHero";
import { DualAthleteGallery } from "@/components/home/DualAthleteGallery";
import { AiVisionTeaser } from "@/components/home/AiVisionTeaser";
import { MovementGoodsSection } from "@/components/home/MovementGoodsSection";
import { Storefront, useStorefront } from "@/components/store/Storefront";

function HomeContent() {
  const { theme, isLight } = useStorefront();
  // The programme switch changes content only, never the theme.
  const [athleteMode, setAthleteMode] = useState<"female" | "male">("female");

  return (
    <main>
      <DualAthleteHero athleteMode={athleteMode} theme={theme} onSelectAthlete={setAthleteMode} />
      <DualAthleteGallery />
      <AiVisionTeaser />
      <MovementGoodsSection mode="featured" />

      {/* 7. Ecosystem Call to Action Banner */}
      <section className={`py-20 sm:py-28 border-t text-center relative overflow-hidden transition-colors duration-500 ${
        isLight
          ? "bg-white border-stone-200"
          : "bg-[#0D0C0B] border-stone-800"
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight ${
            isLight ? "text-stone-950" : "text-white"
          }`}>
            Bắt đầu lộ trình 28 ngày theo cơ thể bạn
          </h2>

          <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${
            isLight ? "text-stone-600" : "text-stone-300"
          }`}>
            Trả lời khảo sát thể trạng 2 phút. G-AI ước tính lượng calo mỗi ngày bằng công thức Mifflin-St Jeor, rồi dựng lộ trình bài tập theo cơ thể và mục tiêu của bạn.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <Link
              href={appUrl("/quiz")}
              className="w-full sm:w-auto min-h-12 px-8 rounded-full bg-brand-action hover:bg-brand-action-hover text-white font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors active:translate-y-px"
            >
              <span>Làm khảo sát 2 phút</span>
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>

            <Link
              href={appUrl("/prediction")}
              className={`min-h-11 inline-flex items-center justify-center text-base font-semibold underline-offset-4 decoration-2 hover:underline ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Xem dự đoán vóc dáng
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <Storefront>
      <HomeContent />
    </Storefront>
  );
}
