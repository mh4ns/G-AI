"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLOR_SWATCH_ITEMS } from "@/data/mockStoreData";
import Link from "next/link";

export const ShopByColor: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="py-12 sm:py-20 bg-white border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900">
              Shop by Color
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              Khám phá trang phục theo bảng màu thẩm mỹ bạn yêu thích
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-black hover:text-white hover:border-black transition-colors shadow-sm"
              aria-label="Previous color"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-black hover:text-white hover:border-black transition-colors shadow-sm"
              aria-label="Next color"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Color Cards Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4"
        >
          {COLOR_SWATCH_ITEMS.map((item, idx) => (
            <Link
              key={idx}
              href={`/store?color=${encodeURIComponent(item.name)}`}
              className="group relative flex-none w-[200px] sm:w-[240px] aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-soft"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Floating Pill Badge with color dot indicator */}
              <div className="absolute bottom-4 inset-x-4">
                <div className="px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md flex items-center gap-2.5 shadow-md group-hover:bg-black group-hover:text-white transition-colors">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-sm shrink-0"
                    style={{ backgroundColor: item.hex }}
                  />
                  <span className="text-xs font-bold truncate">
                    {item.name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
