"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SweepHighlight } from "@/components/home/KineticText";
import { appUrl } from "@g-ai/ui";

/**
 * Landing hero: one headline, one action, one photograph.
 *
 * The two programmes share the photograph: the switch on it swaps the picture
 * and its caption only. Colours come from the themed tokens, so the section
 * follows `data-theme` on the page wrapper and takes no theme prop.
 */

type ProgrammeId = "pilates" | "strength";

interface Programme {
  id: ProgrammeId;
  tab: string;
  name: string;
  focus: string;
  image: string;
  alt: string;
}

const PROGRAMMES: Programme[] = [
  {
    id: "pilates",
    tab: "Nữ · Pilates",
    name: "Pilates Sculpt · 28 ngày",
    focus: "AI Live PT phân tích cột sống và khớp hông",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
    alt: "Chương trình nữ: Pilates Sculpt & Core Alignment",
  },
  {
    id: "strength",
    tab: "Nam · Strength",
    name: "Athletic Power · 28 ngày",
    focus: "AI Live PT định vị đường đi tạ và chuỗi cơ sau",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85",
    alt: "Chương trình nam: Athletic Strength & Biomechanics",
  },
];

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export const DualAthleteHero: React.FC = () => {
  const [programmeId, setProgrammeId] = useState<ProgrammeId>("pilates");
  const current = PROGRAMMES.find((p) => p.id === programmeId) ?? PROGRAMMES[0];

  return (
    <section className="bg-page text-ink transition-colors duration-500">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:grid-cols-12 lg:items-center lg:gap-14 lg:px-8">
        <div className="lg:col-span-7">
          <h1 className="text-balance font-display text-[2.75rem] font-black uppercase leading-[1.08] tracking-[-0.01em] text-ink sm:text-6xl sm:leading-[1.06] lg:text-[5rem]">
            Sửa tư thế, định hình vóc dáng trong{" "}
            <SweepHighlight color="orange" delayMs={200} className="!mx-0">
              28 ngày
            </SweepHighlight>
          </h1>

          <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-ink-muted sm:text-lg">
            Khảo sát thể trạng 2 phút, nhận lộ trình Pilates hoặc Strength theo cơ thể bạn. AI đồng hành qua camera
            và sửa tư thế theo thời gian thực.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href={appUrl("/quiz")}
              className={`group inline-flex h-14 items-center gap-2.5 rounded-full bg-brand px-8 text-base font-semibold text-brand-contrast transition-[background-color,transform] duration-200 hover:bg-brand-soft active:scale-[0.98] ${FOCUS_RING}`}
            >
              <span>Bắt đầu khảo sát</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </Link>
            <p className="text-sm text-ink-muted">Miễn phí · 2 phút</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sunken">
            {PROGRAMMES.map((programme) => {
              const active = programme.id === current.id;
              return (
                <Image
                  key={programme.id}
                  src={programme.image}
                  alt={active ? programme.alt : ""}
                  aria-hidden={!active}
                  fill
                  priority={programme.id === "pilates"}
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 448px, 100vw"
                  className={`object-cover object-center transition-opacity duration-500 ease-out ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              );
            })}

            <div
              role="group"
              aria-label="Chọn chương trình"
              className="absolute left-4 top-4 inline-flex rounded-full bg-surface p-1 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]"
            >
              {PROGRAMMES.map((programme) => {
                const active = programme.id === current.id;
                return (
                  <button
                    key={programme.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setProgrammeId(programme.id)}
                    className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors duration-200 ${FOCUS_RING} ${
                      active ? "bg-ink text-page" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {programme.tab}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            aria-live="polite"
            className="absolute bottom-4 left-4 right-4 rounded-2xl border border-line bg-surface px-5 py-4 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.45)] sm:right-auto sm:max-w-xs lg:-left-8 lg:bottom-8"
          >
            <p className="text-base font-semibold text-ink">{current.name}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{current.focus}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
