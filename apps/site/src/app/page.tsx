"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { appUrl } from "@g-ai/ui";
import { DualAthleteHero } from "@/components/home/DualAthleteHero";
import { VelocityMarquee } from "@/components/home/VelocityMarquee";
import { DualAthleteGallery } from "@/components/home/DualAthleteGallery";
import { AiVisionTeaser } from "@/components/home/AiVisionTeaser";
import { MovementGoodsSection } from "@/components/home/MovementGoodsSection";
import { Storefront } from "@/components/store/Storefront";

function HomeContent() {
  return (
    <main>
      {/* Hero: one headline, one action; follows data-theme on the Storefront frame */}
      <DualAthleteHero />

      <VelocityMarquee />

      <DualAthleteGallery />

      <AiVisionTeaser />

      {/* A few featured products; the full catalog lives on /store */}
      <MovementGoodsSection mode="featured" />

      {/* Closing call to action: the page's one brand-coloured block */}
      <section className="bg-brand py-20 text-brand-contrast sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-[18ch] text-balance font-display text-[2.75rem] font-black uppercase leading-[1.08] tracking-[-0.01em] sm:text-6xl lg:text-7xl">
            28 ngày định hình lại tư thế &amp; vóc dáng của bạn
          </h2>

          <p className="mt-6 max-w-[58ch] text-base leading-relaxed sm:text-lg">
            Trả lời khảo sát thể trạng 2 phút. G-AI ước tính lượng calo mỗi ngày bằng công thức Mifflin-St Jeor, rồi
            dựng lộ trình bài tập theo cơ thể và mục tiêu của bạn.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <a
              href={appUrl("/quiz")}
              className="group inline-flex h-14 items-center gap-2.5 rounded-full bg-brand-contrast px-8 text-base font-semibold text-white transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-contrast"
            >
              <span>Làm khảo sát thể trạng miễn phí</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </a>

            <a
              href={appUrl("/prediction")}
              className="inline-flex min-h-11 items-center rounded text-base font-semibold underline decoration-2 underline-offset-[6px] transition-opacity duration-200 hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-contrast"
            >
              Xem dự đoán vóc dáng
            </a>
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
