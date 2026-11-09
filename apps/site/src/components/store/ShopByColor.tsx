"use client";

import React from "react";
import { COLOR_SWATCH_ITEMS } from "@/data/mockStoreData";
import Link from "next/link";

export const ShopByColor: React.FC = () => {
  return (
    <section id="pigments" className="py-16 sm:py-24 bg-white border-b border-ecru-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 pb-4 border-b border-ecru-200">
          <span className="text-xs font-mono tracking-widest text-stone-500 uppercase">
            Material Palette
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-pitch mt-1">
            Pigment Studies
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-lg mt-1">
            Natural mineral pigments and unbleached fiber bases developed to harmonize with both studio wood and living room environments.
          </p>
        </div>

        {/* Tactile Swatch Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {COLOR_SWATCH_ITEMS.map((item, idx) => (
            <Link
              key={idx}
              href={`/store?color=${encodeURIComponent(item.name)}`}
              className="group flex flex-col rounded-xl overflow-hidden bg-ecru-100 border border-ecru-200 hover:border-stone-400 transition-colors"
            >
              <div className="relative aspect-square overflow-hidden bg-ecru-200">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute bottom-2.5 right-2.5 w-5 h-5 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: item.hex }}
                />
              </div>

              <div className="p-3 bg-white">
                <h4 className="font-semibold text-pitch text-xs truncate group-hover:text-terracotta-600 transition-colors">
                  {item.name}
                </h4>
                <span className="text-[10px] font-mono text-stone-400 block uppercase">
                  {item.hex}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
