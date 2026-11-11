"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Moon, ShoppingBag, Sun } from "lucide-react";
import { BrandLogo, appUrl, hubUrl } from "@g-ai/ui";

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
  const iconButton = `relative w-11 h-11 rounded-full border flex items-center justify-center transition-colors duration-200 ${
    isLight
      ? "bg-white border-stone-200 text-stone-700 hover:text-stone-950 hover:border-stone-400"
      : "bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:border-stone-600"
  }`;
  const navLink = `min-h-11 inline-flex items-center underline-offset-4 decoration-2 hover:underline transition-colors ${
    isLight ? "text-stone-700 hover:text-stone-950" : "text-stone-300 hover:text-white"
  }`;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        isLight ? "bg-canvas/95 border-stone-200 text-stone-900" : "bg-canvas-dark/95 border-stone-800 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        <Link href={hubUrl("/")} className="min-h-11 min-w-11 flex items-center" aria-label="G-AI – trang chính">
          <BrandLogo isLight={isLight} size="md" />
        </Link>

        <nav aria-label="Chính" className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href={appUrl("/prediction")} className={navLink}>
            Dự đoán vóc dáng
          </Link>
          <Link href="/#movement-goods" className={navLink}>
            Dụng cụ tập
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className={iconButton}
              aria-label={cartCount > 0 ? `Mở giỏ hàng, ${cartCount} sản phẩm` : "Mở giỏ hàng"}
            >
              <ShoppingBag className="w-[18px] h-[18px]" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-brand-action text-white text-xs font-semibold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={iconButton}
              aria-label={isLight ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
              title={isLight ? "Giao diện tối" : "Giao diện sáng"}
            >
              {isLight ? <Moon className="w-[18px] h-[18px]" aria-hidden /> : <Sun className="w-[18px] h-[18px]" aria-hidden />}
            </button>
          )}

          <Link
            href={appUrl("/login")}
            className={`hidden sm:inline-flex min-h-11 items-center px-1 text-sm font-medium transition-colors ${
              isLight ? "text-stone-700 hover:text-stone-950" : "text-stone-300 hover:text-white"
            }`}
          >
            Đăng nhập
          </Link>

          <Link
            href={appUrl("/quiz")}
            className="min-h-11 px-5 rounded-full bg-brand-action hover:bg-brand-action-hover text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors active:translate-y-px"
          >
            <span>Làm khảo sát</span>
            <ArrowRight className="w-4 h-4 hidden sm:block" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
};
