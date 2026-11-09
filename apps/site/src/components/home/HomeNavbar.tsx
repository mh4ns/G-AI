"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Lightbulb, ShoppingBag } from "lucide-react";
import { FlipTextHover } from "@/components/home/KineticText";
import { BrandLogo, appUrl } from "@g-ai/ui";

interface HomeNavbarProps {
  isLight?: boolean;
  onToggleTheme?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const HomeNavbar: React.FC<HomeNavbarProps> = ({
  isLight = false,
  onToggleTheme,
  cartCount = 0,
  onOpenCart,
}) => {
  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b select-none transition-colors duration-300 ${
      isLight 
        ? "bg-white/90 border-stone-200 text-stone-900" 
        : "bg-canvas-dark/90 border-stone-800 text-white"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Typographic Identity (Pure Geometric G Monogram) */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center group">
            <BrandLogo isLight={isLight} size="md" showSubtitle subtitle="Biometric Kinetic Lab" />
          </Link>
        </div>

        {/* Streamlined Desktop Navigation (Only 2 Core Links - No Duplicates) */}
        <nav className={`hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider ${
          isLight ? "text-stone-700" : "text-stone-300"
        }`}>
          <Link href={appUrl("/prediction")} className={`flex items-center gap-1.5 transition-colors ${isLight ? "hover:text-black" : "hover:text-white"}`}>
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <FlipTextHover text="Bản Sao Số (Digital Twin)" activeClassName="text-emerald-500" />
          </Link>

          <Link href="/#movement-goods" className={`flex items-center gap-1.5 transition-colors ${isLight ? "hover:text-black" : "hover:text-white"}`}>
            <ShoppingBag className="w-3.5 h-3.5 text-[#FF5A36]" />
            <FlipTextHover text="Dụng Cụ Tập" activeClassName={isLight ? "text-stone-950" : "text-white"} />
          </Link>
        </nav>

        {/* Action Controls: Cart + Theme Switcher + Single Primary CTA */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Shopping Bag Cart Drawer Trigger */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className={`relative p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 ${
                isLight
                  ? "bg-stone-100 border-stone-300 text-stone-700 hover:text-[#FF5A36] hover:border-stone-400"
                  : "bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:border-stone-700"
              }`}
              title="Mở Giỏ Hàng"
              aria-label="Mở giỏ hàng"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF5A36] text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Lightbulb Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 ${
                isLight
                  ? "bg-stone-100 border-stone-300 text-amber-500 hover:border-amber-400"
                  : "bg-stone-900 border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-400/50"
              }`}
              title={isLight ? "Chuyển sang Chế độ Tối (Dark Mode)" : "Chuyển sang Chế độ Sáng (Light Mode)"}
              aria-label="Toggle Theme"
            >
              <Lightbulb className={`w-4 h-4 transition-colors ${isLight ? "fill-amber-400 text-amber-500" : "text-stone-400"}`} />
            </button>
          )}

          <Link
            href={appUrl("/login")}
            className={`hidden sm:inline text-xs font-semibold transition-colors ${
              isLight ? "text-stone-600 hover:text-black" : "text-stone-300 hover:text-white"
            }`}
          >
            Đăng nhập
          </Link>

          {/* Single High-Impact CTA Button */}
          <Link
            href={appUrl("/quiz")}
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
