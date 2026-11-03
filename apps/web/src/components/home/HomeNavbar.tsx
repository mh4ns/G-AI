"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Menu } from "lucide-react";
import { FlipTextHover } from "@/components/home/KineticText";

export const HomeNavbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#0A0908]/90 backdrop-blur-md border-b border-stone-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Typographic Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="font-black text-xl sm:text-2xl tracking-tighter text-white group-hover:text-[#FF5A36] transition-colors">
              G—AI
            </span>
            <span className="text-[10px] font-mono tracking-widest text-stone-500 uppercase hidden sm:inline">
              / Biometric Kinetic Lab
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links with Flip-Text Stagger */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-stone-300">
          <Link href="/quiz" className="hover:text-white transition-colors">
            <FlipTextHover text="Khảo Sát 28 Ngày" activeClassName="text-[#FF5A36]" />
          </Link>

          <Link href="/prediction" className="hover:text-white transition-colors flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <FlipTextHover text="Bản Sao Số (Digital Twin)" activeClassName="text-emerald-400" />
          </Link>

          <Link href="/today" className="hover:text-white transition-colors">
            <FlipTextHover text="Today Dashboard" activeClassName="text-[#FF5A36]" />
          </Link>

          <Link href="/store" className="hover:text-white transition-colors">
            <FlipTextHover text="Apparatus & Apparel" activeClassName="text-white" />
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/prediction"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-800 hover:border-stone-600 bg-stone-900/60 text-xs font-mono text-stone-300 hover:text-white transition-colors"
          >
            <span>Mô Hình 28 Ngày</span>
          </Link>

          <Link
            href="/quiz"
            className="px-5 py-2.5 rounded-full bg-[#FF5A36] hover:bg-[#e04825] text-white text-xs font-bold font-mono transition-all shadow-lg shadow-[#FF5A36]/20 active:scale-[0.98] flex items-center gap-1.5"
          >
            <span>Bắt Đầu Khảo Sát</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
