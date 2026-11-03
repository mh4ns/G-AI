"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const EDITIONS = [
  {
    series: "Series 01 — Kinetic Knitwear",
    title: "Kinetic architecture for unrestricted form.",
    description: "Engineered with 240 GSM continuous ribbed micro-fibers. High-contrast geometric seamlines calibrated specifically for real-time computer vision joint tracking.",
    primaryAction: "Explore Series 01",
    primaryTarget: "#catalog",
    secondaryAction: "View Specifications",
    secondaryTarget: "#apparatus",
    specs: [
      { label: "Fabric Density", value: "240 GSM" },
      { label: "Compression Index", value: "Level II (Targeted)" },
      { label: "Optical Contrast", value: "Vision-Calibrated" },
    ],
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=85",
  },
  {
    series: "Series 02 — Apparatus & Balance",
    title: "Tactile resistance for deep core activation.",
    description: "Studio-grade Pilates apparatus scaled for residential practice. Natural dense rubber, anodized aluminum joints, and non-slip textured handles.",
    primaryAction: "View Apparatus",
    primaryTarget: "#apparatus",
    secondaryAction: "Explore Pigments",
    secondaryTarget: "#pigments",
    specs: [
      { label: "Mat Core", value: "8mm High-Density Rubber" },
      { label: "Apparatus Ring", value: "Aircraft Grade 6061-T6" },
      { label: "Surface Texture", value: "Hydrophobic Matte" },
    ],
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=85",
  },
];

export const HeroBannerSlider: React.FC = () => {
  const [activeEdition, setActiveEdition] = useState(0);
  const item = EDITIONS[activeEdition];

  return (
    <section className="relative bg-ecru-50 border-b border-ecru-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Typographic Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6 sm:space-y-8">
            {/* Edition Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-ecru-200 pb-3">
              {EDITIONS.map((ed, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveEdition(idx)}
                  className={`text-xs font-mono tracking-wider transition-colors py-1 px-2.5 rounded ${
                    idx === activeEdition
                      ? "bg-pitch text-ecru-50 font-semibold"
                      : "text-stone-500 hover:text-pitch"
                  }`}
                >
                  [{idx === 0 ? "01 / KNITWEAR" : "02 / APPARATUS"}]
                </button>
              ))}
            </div>

            {/* Monolithic Headline - No cheap gradient text */}
            <div className="space-y-4">
              <span className="text-xs font-mono tracking-widest text-espresso-700 uppercase">
                {item.series}
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-pitch leading-[1.08] max-w-xl">
                {item.title}
              </h1>
              <p className="text-pitch/75 text-sm sm:text-base leading-relaxed max-w-lg">
                {item.description}
              </p>
            </div>

            {/* Material Spec Matrix */}
            <div className="grid grid-cols-3 gap-3 py-4 border-y border-ecru-200 text-xs font-mono">
              {item.specs.map((spec, i) => (
                <div key={i} className="space-y-0.5">
                  <span className="text-stone-400 block text-[10px]">{spec.label}</span>
                  <span className="text-pitch font-semibold block">{spec.value}</span>
                </div>
              ))}
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={item.primaryTarget}
                className="px-7 py-3.5 rounded-full bg-pitch text-ecru-50 text-xs font-mono font-medium hover:bg-espresso-800 transition-colors shadow-sm"
              >
                {item.primaryAction}
              </a>
              <Link
                href="/quiz"
                className="px-6 py-3.5 rounded-full border border-pitch/30 text-pitch text-xs font-mono font-medium hover:border-pitch hover:bg-white transition-colors"
              >
                Fit & Movement Quiz
              </Link>
            </div>
          </div>

          {/* Editorial Visual Column (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-ecru-200 border border-ecru-300 shadow-card">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover object-center transition-all duration-700 ease-out"
              />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-pitch/80 backdrop-blur-md text-ecru-100 flex items-center justify-between text-[11px] font-mono">
                <span>Natural Studio Daylight</span>
                <span className="text-ecru-300">Kinetic Series</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
