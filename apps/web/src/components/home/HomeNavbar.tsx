"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { FlipTextHover } from "@/components/home/KineticText";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface HomeNavbarProps {
  isLight?: boolean;
}

export const HomeNavbar: React.FC<HomeNavbarProps> = ({ isLight = false }) => {
  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b select-none transition-colors duration-300 ${
      isLight 
        ? "bg-white/90 border-stone-200 text-stone-900" 
        : "bg-[#0A0908]/90 border-stone-800 text-white"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Typographic Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center group">
            <BrandLogo isLight={isLight} size="md" showSubtitle subtitle="Biometric Kinetic Lab" />
          </Link>
        </div>

        {/* Desktop Navigation Links with Flip-Text Stagger */}
        <nav className={`hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider ${
          isLight ? "text-stone-700" : "text-stone-300"
        }`}>
          <Link href="/quiz" className={`transition-colors ${isLight ? "hover:text-black" : "hover:text-white"}`}>
            <FlipTextHover text="Khảo Sát 28 Ngày" activeClassName={isLight ? "text-[#FF6B4A]" : "text-[#FF5A36]"} />
          </Link>

          <Link href="/prediction" className={`flex items-center gap-1.5 transition-colors ${isLight ? "hover:text-black" : "hover:text-white"}`}>
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <FlipTextHover text="Bản Sao Số (Digital Twin)" activeClassName="text-emerald-500" />
          </Link>

          <Link href="/today" className={`transition-colors ${isLight ? "hover:text-black" : "hover:text-white"}`}>
            <FlipTextHover text="Today Dashboard" activeClassName={isLight ? "text-[#FF6B4A]" : "text-[#FF5A36]"} />
          </Link>

          <Link href="/store" className={`transition-colors ${isLight ? "hover:text-black" : "hover:text-white"}`}>
            <FlipTextHover text="Apparatus & Apparel" activeClassName={isLight ? "text-black" : "text-white"} />
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/prediction"
            className={`hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-mono transition-colors ${
              isLight
                ? "border-stone-300 bg-stone-100/80 text-stone-800 hover:border-stone-400"
                : "border-stone-800 bg-stone-900/60 text-stone-300 hover:text-white hover:border-stone-600"
            }`}
          >
            <span>Mô Hình 28 Ngày</span>
          </Link>

          <Link
            href="/quiz"
            className={`px-5 py-2.5 rounded-full text-white text-xs font-bold font-mono transition-all shadow-lg active:scale-[0.98] flex items-center gap-1.5 ${
              isLight
                ? "bg-[#FF6B4A] hover:bg-[#ff5530] shadow-[#FF6B4A]/25"
                : "bg-[#FF5A36] hover:bg-[#e04825] shadow-[#FF5A36]/20"
            }`}
          >
            <span>Bắt Đầu Khảo Sát</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
