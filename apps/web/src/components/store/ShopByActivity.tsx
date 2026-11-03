"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ACTIVITY_SLIDER_ITEMS } from "@/data/mockStoreData";
import Link from "next/link";

export const ShopByActivity: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleScroll = (dir: "left" | "right") => {
    if (trackRef.current) {
      const delta = dir === "left" ? -340 : 340;
      trackRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  };

  return (
    <section id="disciplines" className="py-16 sm:py-24 bg-ecru-100 border-b border-ecru-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-ecru-200">
          <div>
            <span className="text-xs font-mono tracking-widest text-stone-500 uppercase">
              Kinetic Domains
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-pitch mt-1">
              Movement Disciplines
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScroll("left")}
              className="w-9 h-9 rounded-full bg-white border border-ecru-300 flex items-center justify-center text-pitch hover:bg-pitch hover:text-white transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="w-9 h-9 rounded-full bg-white border border-ecru-300 flex items-center justify-center text-pitch hover:bg-pitch hover:text-white transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Scroll Track */}
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2"
        >
          {ACTIVITY_SLIDER_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={`/store?activity=${item.id}`}
              className="group relative flex-none w-[260px] sm:w-[300px] aspect-[3/4] rounded-xl overflow-hidden bg-ecru-200 border border-ecru-300"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pitch/80 via-pitch/10 to-transparent" />

              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-white">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-terracotta-500 transition-colors">
                  {item.name}
                </span>
                <span className="text-[11px] font-mono text-ecru-200">
                  {item.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
