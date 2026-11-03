"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { ACTIVITY_SLIDER_ITEMS } from "@/data/mockStoreData";
import Link from "next/link";

export const ShopByActivity: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="py-12 sm:py-20 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Navigation Arrows */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900">
              Shop by Activity
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              Khám phá trang phục & dụng cụ tối ưu theo từng bộ môn vận động
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-black hover:text-white hover:border-black transition-colors shadow-sm"
              aria-label="Previous activities"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-black hover:text-white hover:border-black transition-colors shadow-sm"
              aria-label="Next activities"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4"
        >
          {ACTIVITY_SLIDER_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={`/store?activity=${item.id}`}
              className="group relative flex-none w-[240px] sm:w-[280px] lg:w-[320px] aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200 shadow-card"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Bottom Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Floating Pill Badge at bottom */}
              <div className="absolute bottom-5 inset-x-5 flex items-center justify-between">
                <span className="px-4 py-2 rounded-full bg-white text-stone-900 text-xs sm:text-sm font-bold shadow-md group-hover:bg-[#FF6542] group-hover:text-white transition-colors">
                  {item.name}
                </span>

                <span className="text-white/80 text-xs font-medium">
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
