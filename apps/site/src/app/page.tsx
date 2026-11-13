"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { DualAthleteHero } from "@/components/home/DualAthleteHero";
import { VelocityMarquee } from "@/components/home/VelocityMarquee";
import { DualAthleteGallery } from "@/components/home/DualAthleteGallery";
import { AiVisionTeaser } from "@/components/home/AiVisionTeaser";
import { MovementGoodsSection } from "@/components/home/MovementGoodsSection";
import { CartDrawer } from "@/components/home/CartDrawer";
import { STORE_PRODUCTS } from "@/data/mockStoreData";
import {
  MAX_QUANTITY_PER_LINE,
  cartKey,
  fetchCatalog,
  fromMockProduct,
  parseStoredCart,
  type CartLine,
  type CatalogSource,
  type StoreItem,
} from "@/lib/store-api";

const CART_STORAGE_KEY = "g_ai_cart_v2";
// Offline fallback: the same p1..p8 catalog the backend serves, browse-only.
const SAMPLE_CATALOG: StoreItem[] = STORE_PRODUCTS.map(fromMockProduct);
import { appUrl } from "@g-ai/ui";

export default function HomePage() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [catalog, setCatalog] = useState<StoreItem[]>([]);
  const [catalogSource, setCatalogSource] = useState<CatalogSource | "loading">("loading");

  // Restore theme preference and cart from this browser.
  useEffect(() => {
    try {
      const savedManual = localStorage.getItem("g_ai_theme_manual");
      const savedTheme = localStorage.getItem("g_ai_theme") as "dark" | "light" | null;
      if (savedManual === "true" && savedTheme) {
        setTheme(savedTheme);
      }
      setCartLines(parseStoredCart(localStorage.getItem(CART_STORAGE_KEY)));
    } catch {
      // Storage can be unavailable (private mode); the page still works.
    }
  }, []);

  // Live catalog from the backend; the sample catalog is browse-only.
  useEffect(() => {
    let cancelled = false;
    fetchCatalog()
      .then((items) => {
        if (cancelled) return;
        if (items.length === 0) throw new Error("empty catalog");
        setCatalog(items);
        setCatalogSource("server");
      })
      .catch(() => {
        if (cancelled) return;
        setCatalog(SAMPLE_CATALOG);
        setCatalogSource("sample");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogById = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);

  const saveCart = useCallback((update: (prev: CartLine[]) => CartLine[]) => {
    setCartLines((prev) => {
      const next = update(prev);
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleAddToCart = (product: StoreItem, size: string) => {
    const key = cartKey(product.id, size);
    const limit = Math.min(MAX_QUANTITY_PER_LINE, product.stock ?? MAX_QUANTITY_PER_LINE);
    saveCart((prev) =>
      prev.some((l) => l.key === key)
        ? prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(limit, l.quantity + 1) } : l))
        : [...prev, { key, productId: product.id, size, quantity: 1 }]
    );
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (key: string, delta: number) => {
    saveCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY_PER_LINE, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const handleRemoveItem = (key: string) => {
    saveCart((prev) => prev.filter((l) => l.key !== key));
  };

  // Stock changes on the server; refresh what the cards and the bag show.
  const refreshCatalog = useCallback(() => {
    fetchCatalog()
      .then((items) => {
        if (items.length) setCatalog(items);
      })
      .catch(() => undefined);
  }, []);

  const handleOrderPlaced = () => {
    saveCart(() => []);
    refreshCatalog();
  };

  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const totalCartCount = cartLines.reduce((sum, item) => sum + item.quantity, 0);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("g_ai_theme", nextTheme);
      localStorage.setItem("g_ai_theme_manual", "true");
    } catch {
      // Storage can be unavailable; the theme still applies for this visit.
    }
  };

  const isLight = theme === "light";

  return (
    <div
      data-theme={theme}
      className={`min-h-screen font-sans transition-colors duration-500 ${
        isLight
          ? "bg-canvas text-stone-900 selection:bg-[#FF6B4A]/20 selection:text-[#FF6B4A]"
          : "bg-canvas-dark text-stone-100 selection:bg-[#FF5A36]/30 selection:text-white"
      }`}
    >
      {/* 1. Tactical Glassmorphic Header with Light/Dark Adaptation & Streamlined Links */}
      <HomeNavbar
        isLight={isLight}
        onToggleTheme={handleToggleTheme}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 2. Hero: one headline, one action; follows data-theme above */}
      <DualAthleteHero />

      {/* 3. Physics-Driven Dynamic Velocity Marquee */}
      <VelocityMarquee />

      {/* 4. Editorial Pinterest-Curated Athlete Gallery */}
      <DualAthleteGallery />

      {/* 5. AI Live PT Computer Vision Teaser */}
      <AiVisionTeaser />

      {/* 6. Curated Movement Goods & Biomechanical Equipment Section */}
      <MovementGoodsSection items={catalog} source={catalogSource} onAddToCart={handleAddToCart} />

      {/* 7. Closing call to action: the page's one brand-coloured block */}
      <section className="bg-brand py-20 text-brand-contrast sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-[18ch] text-balance font-display text-[2.75rem] font-black uppercase leading-[1.08] tracking-[-0.01em] sm:text-6xl lg:text-7xl">
            28 ngày định hình lại tư thế &amp; vóc dáng của bạn
          </h2>

          <p className="mt-6 max-w-[58ch] text-base leading-relaxed sm:text-lg">
            Trả lời khảo sát thể trạng 2 phút. Công thức Mifflin-St Jeor sẽ ước tính cân nặng, lượng calo mục tiêu
            và lộ trình bài tập phù hợp với cơ thể bạn.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href={appUrl("/quiz")}
              className="group inline-flex h-14 items-center gap-2.5 rounded-full bg-brand-contrast px-8 text-base font-semibold text-white transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-contrast"
            >
              <span>Làm khảo sát thể trạng miễn phí</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </Link>

            <Link
              href={appUrl("/prediction")}
              className="rounded text-base font-semibold underline decoration-2 underline-offset-[6px] transition-opacity duration-200 hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-contrast"
            >
              Xem bản sao số (Digital Twin)
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Slide-over Movement Goods Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        lines={cartLines}
        catalog={catalogById}
        source={catalogSource}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onOrderPlaced={handleOrderPlaced}
        onCatalogStale={refreshCatalog}
      />
    </div>
  );
}
