"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Timer, Webcam } from "lucide-react";
import { SlidingTabs, appUrl } from "@g-ai/ui";

interface DualAthleteHeroProps {
  athleteMode: "female" | "male";
  theme: "dark" | "light";
  onSelectAthlete: (mode: "female" | "male") => void;
}

// The two programmes differ in content only; colour and theme stay the same.
// Each shows the real plan screen the app builds for that programme
// (apps/site/public/images/plan-*.webp, captured from apps/web; see
// docs/brand/stand-in-photos.md for how to recapture).
const PROGRAMMES = {
  female: {
    tab: "Pilates & cơ lõi",
    headline: "Sửa dáng võng lưng và tập cơ lõi trong 28 ngày",
    tagline:
      "Bài tập Pilates cho cơ lõi sâu và lượng calo tính theo cơ thể bạn. AI theo dõi tư thế qua camera và nhắc khi bạn sai form, không cần tạ nặng.",
    screen: "/images/plan-female.webp",
    screenAlt: "Lộ trình Pilates trong ứng dụng G-AI: 14 tuần từ 62 kg đến 57 kg, ăn ít hơn khoảng 400 kcal mỗi ngày",
  },
  male: {
    tab: "Sức mạnh",
    headline: "Xây sức mạnh và chuỗi cơ sau trong 28 ngày",
    tagline:
      "Phát triển sức mạnh chức năng, mở khớp vai cổ và xây cơ cân đối. AI đếm rep qua camera và nhắc khi bạn sai form.",
    screen: "/images/plan-male.webp",
    screenAlt: "Lộ trình sức mạnh trong ứng dụng G-AI, với ngày dự kiến đạt mục tiêu và lượng calo mỗi ngày",
  },
} as const;

const FACTS = [
  { icon: Timer, text: "Khảo sát 2 phút" },
  { icon: CalendarDays, text: "Lộ trình 28 ngày" },
  { icon: Webcam, text: "Chỉ cần webcam" },
];

export const DualAthleteHero: React.FC<DualAthleteHeroProps> = ({ athleteMode, theme, onSelectAthlete }) => {
  const isLight = theme === "light";
  const current = PROGRAMMES[athleteMode];
  const copyRef = useRef<HTMLDivElement>(null);

  // Texts reveal (transitions.dev 18): the hero enters once, on load.
  useEffect(() => {
    const el = copyRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => el.classList.add("is-shown"));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="w-full min-h-[calc(100svh-4rem)] sm:min-h-[calc(100svh-5rem)] flex items-center py-10 sm:py-14">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div ref={copyRef} className="t-stagger lg:col-span-7">
          <div className="t-stagger-line t-stagger-line--1">
            <SlidingTabs
              ariaLabel="Chọn chương trình"
              value={athleteMode}
              onChange={onSelectAthlete}
              options={[
                { value: "female", label: PROGRAMMES.female.tab },
                { value: "male", label: PROGRAMMES.male.tab },
              ]}
            />

            <h1
              className={`font-display mt-8 text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.06] ${
                isLight ? "text-stone-950" : "text-white"
              }`}
            >
              {current.headline}
            </h1>
          </div>

          <p
            className={`t-stagger-line t-stagger-line--2 mt-5 text-base sm:text-lg max-w-xl leading-relaxed ${
              isLight ? "text-stone-600" : "text-stone-300"
            }`}
          >
            {current.tagline}
          </p>

          <div className="t-stagger-line t-stagger-line--3">
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
                className={`min-h-11 inline-flex items-center justify-center text-base font-semibold underline-offset-4 decoration-2 hover:underline ${
                  isLight ? "text-stone-900" : "text-white"
                }`}
              >
                Xem dự đoán vóc dáng
              </Link>
            </div>

            <ul className={`mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm ${isLight ? "text-stone-600" : "text-stone-300"}`}>
              {FACTS.map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-2">
                  <Icon className="w-4 h-4 text-accent" aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* The product itself: the plan screen G-AI builds, in a phone frame. */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div
            className={`relative w-[min(78vw,320px)] aspect-[390/844] rounded-[2.75rem] p-2.5 shadow-2xl ${
              isLight ? "bg-stone-900" : "bg-stone-800"
            }`}
          >
            <div className="relative w-full h-full rounded-[2.25rem] overflow-hidden bg-canvas">
              {(Object.keys(PROGRAMMES) as Array<keyof typeof PROGRAMMES>).map((mode) => (
                <Image
                  key={mode}
                  src={PROGRAMMES[mode].screen}
                  alt={mode === athleteMode ? PROGRAMMES[mode].screenAlt : ""}
                  aria-hidden={mode !== athleteMode}
                  fill
                  priority={mode === "female"}
                  sizes="320px"
                  className={`object-cover object-top transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-in-out)] motion-reduce:transition-none ${
                    mode === athleteMode ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
