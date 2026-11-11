"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Timer, CalendarDays, Webcam } from "lucide-react";
import { appUrl } from "@g-ai/ui";

interface DualAthleteHeroProps {
  athleteMode: "female" | "male";
  theme: "dark" | "light";
  onSelectAthlete: (mode: "female" | "male") => void;
}

// The two programmes differ in content only; colour and theme stay the same.
const PROGRAMMES = {
  female: {
    tab: "Pilates & cơ lõi",
    headline: "Sửa dáng võng lưng và tập cơ lõi trong 28 ngày",
    tagline:
      "Bài tập Pilates cho cơ lõi sâu và lượng calo tính theo cơ thể bạn. AI theo dõi tư thế qua camera và nhắc khi bạn sai form, không cần tạ nặng.",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Người tập Pilates trên thảm, giữ lưng thẳng",
  },
  male: {
    tab: "Sức mạnh",
    headline: "Xây sức mạnh và chuỗi cơ sau trong 28 ngày",
    tagline:
      "Phát triển sức mạnh chức năng, mở khớp vai cổ và xây cơ cân đối. AI đếm rep qua camera và nhắc khi bạn sai form.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Người tập sức mạnh với tạ trong phòng tập",
  },
} as const;

// Facts about the programme itself, not outcomes: G-AI has no measured results
// to show yet, so the hero promises none.
const FACTS = [
  { icon: Timer, text: "Khảo sát 2 phút" },
  { icon: CalendarDays, text: "Lộ trình 28 ngày" },
  { icon: Webcam, text: "Chỉ cần webcam" },
];

export const DualAthleteHero: React.FC<DualAthleteHeroProps> = ({ athleteMode, theme, onSelectAthlete }) => {
  const isLight = theme === "light";
  const current = PROGRAMMES[athleteMode];

  return (
    <section className="w-full pt-10 pb-16 sm:pt-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-6">
          {/* Programme switch: a segmented control, not a gender toggle. */}
          <div
            role="tablist"
            aria-label="Chọn chương trình"
            className={`inline-flex p-1 rounded-full border ${
              isLight ? "bg-white border-stone-200" : "bg-stone-900 border-stone-800"
            }`}
          >
            {(Object.keys(PROGRAMMES) as Array<keyof typeof PROGRAMMES>).map((mode) => {
              const active = athleteMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectAthlete(mode)}
                  className={`min-h-11 px-5 rounded-full text-sm font-semibold transition-colors duration-200 ${
                    active
                      ? isLight
                        ? "bg-stone-900 text-white"
                        : "bg-white text-stone-900"
                      : isLight
                        ? "text-stone-600 hover:text-stone-900"
                        : "text-stone-300 hover:text-white"
                  }`}
                >
                  {PROGRAMMES[mode].tab}
                </button>
              );
            })}
          </div>

          <h1
            className={`font-display mt-8 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-balance ${
              isLight ? "text-stone-950" : "text-white"
            }`}
          >
            {current.headline}
          </h1>

          <p className={`mt-5 text-base sm:text-lg max-w-xl leading-relaxed ${isLight ? "text-stone-600" : "text-stone-300"}`}>
            {current.tagline}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <Link
              href={appUrl("/quiz")}
              className="min-h-12 px-7 rounded-full bg-brand-action hover:bg-brand-action-hover text-white font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors active:translate-y-px"
            >
              <span>Làm khảo sát 2 phút</span>
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>

            <Link
              href={appUrl("/prediction")}
              className={`min-h-11 inline-flex items-center justify-center gap-1.5 text-base font-semibold underline-offset-4 decoration-2 hover:underline ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Xem dự đoán vóc dáng
            </Link>
          </div>

          <ul className={`mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm ${isLight ? "text-stone-600" : "text-stone-300"}`}>
            {FACTS.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-2">
                <Icon className="w-4 h-4 text-brand-action" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6">
          <div
            className={`relative w-full aspect-[4/5] sm:aspect-[5/5.4] rounded-3xl overflow-hidden ${
              isLight ? "bg-stone-200" : "bg-stone-900"
            }`}
          >
            <Image
              key={athleteMode}
              src={current.image}
              alt={current.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
