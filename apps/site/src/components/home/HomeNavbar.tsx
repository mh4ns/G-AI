"use client";

import React from "react";
import Link from "next/link";
import { Lightbulb, ShoppingBag } from "lucide-react";
import { BrandLogo, appUrl } from "@g-ai/ui";

interface HomeNavbarProps {
  /** Picks the black or white logo artwork; colours follow `data-theme`. */
  isLight?: boolean;
  onToggleTheme?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

// 44px: the minimum tap target.
const ICON_BUTTON = `relative flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-sunken hover:text-ink ${FOCUS_RING}`;

const NAV_LINK = `rounded text-sm font-medium text-ink-muted underline-offset-8 transition-colors duration-200 hover:text-ink hover:underline ${FOCUS_RING}`;

export const HomeNavbar: React.FC<HomeNavbarProps> = ({
  isLight = false,
  onToggleTheme,
  cartCount = 0,
  onOpenCart,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-page/85 text-ink backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="G-AI – trang chủ"
          className={`group flex shrink-0 items-center rounded-lg ${FOCUS_RING}`}
        >
          <BrandLogo isLight={isLight} size="md" />
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-8 md:flex">
          <Link href={appUrl("/prediction")} className={NAV_LINK}>
            Dự đoán vóc dáng
          </Link>
          <Link href="/store" className={NAV_LINK}>
            Dụng cụ tập
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              title="Mở giỏ hàng"
              aria-label={cartCount > 0 ? `Mở giỏ hàng, ${cartCount} sản phẩm` : "Mở giỏ hàng"}
              className={ICON_BUTTON}
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
              {cartCount > 0 && (
                <span
                  aria-hidden
                  className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold tabular-nums leading-none text-brand-contrast"
                >
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title="Đổi giao diện sáng / tối"
              aria-label="Đổi giao diện sáng / tối"
              aria-pressed={!isLight}
              className={ICON_BUTTON}
            >
              <Lightbulb className="h-[18px] w-[18px]" aria-hidden />
            </button>
          )}

          <Link href={appUrl("/login")} className={`mx-2 hidden sm:inline ${NAV_LINK}`}>
            Đăng nhập
          </Link>

          {/* Ink, not brand: the hero button is the one brand-coloured action. */}
          <Link
            href={appUrl("/quiz")}
            className={`ml-1 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-page transition-[opacity,transform] duration-200 hover:opacity-85 active:scale-[0.98] ${FOCUS_RING}`}
          >
            Bắt đầu khảo sát
          </Link>
        </div>
      </div>
    </header>
  );
};
