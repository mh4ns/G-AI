"use client";

import React from "react";
import Link from "next/link";

export const WhatAreYouLookingFor: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-ecru-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-ecru-200 gap-4">
          <div>
            <span className="text-xs font-mono tracking-widest text-stone-500 uppercase">
              Curated Index
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-pitch mt-1">
              Primary Divisions
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm">
            Disciplined garment cuts and tactile Pilates instruments structured for daily functional practice.
          </p>
        </div>

        {/* Asymmetric 3-Tile Architectural Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tile 1: Dominant Portrait Feature (7 cols) */}
          <Link
            href="/store#catalog"
            className="lg:col-span-7 group relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[4/4] rounded-2xl overflow-hidden bg-ecru-100 border border-ecru-200 flex flex-col justify-end p-6 sm:p-8"
          >
            <img
              src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80"
              alt="Full-Length Catsuits & Sculpt Bodysuits"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-pitch/80 via-pitch/20 to-transparent" />

            <div className="relative z-10 text-white space-y-1.5">
              <span className="text-[11px] font-mono tracking-widest text-ecru-300 uppercase">
                Division 01 — Seamless Architecture
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Catsuits & Compression Bodysuits
              </h3>
              <p className="text-xs text-ecru-200/90 max-w-md hidden sm:block">
                Continuous seamlines, zero waistline pinching, and full kinematic freedom for dynamic Pilates postures.
              </p>
            </div>
          </Link>

          {/* Tiles 2 & 3: Stacked Landscape Tiles (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Link
              href="/store#apparatus"
              className="group relative flex-1 aspect-[16/9] sm:aspect-[16/8] lg:aspect-auto rounded-2xl overflow-hidden bg-ecru-100 border border-ecru-200 flex flex-col justify-end p-6"
            >
              <img
                src="https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=800&q=80"
                alt="Pilates Apparatus & Essential Kits"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pitch/75 via-pitch/20 to-transparent" />

              <div className="relative z-10 text-white">
                <span className="text-[10px] font-mono tracking-widest text-ecru-300 uppercase">
                  Division 02 — Apparatus
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Pilates Resistance Kits & Reformer
                </h3>
              </div>
            </Link>

            <Link
              href="/store#catalog"
              className="group relative flex-1 aspect-[16/9] sm:aspect-[16/8] lg:aspect-auto rounded-2xl overflow-hidden bg-ecru-100 border border-ecru-200 flex flex-col justify-end p-6"
            >
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
                alt="Coordinated Sets in Chocolate and Raw Ecru"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pitch/75 via-pitch/20 to-transparent" />

              <div className="relative z-10 text-white">
                <span className="text-[10px] font-mono tracking-widest text-ecru-300 uppercase">
                  Division 03 — Coordinated Sets
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Chocolate Knitwear & High-Waist Capris
                </h3>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
