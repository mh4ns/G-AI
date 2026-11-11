"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { DualAthleteHero } from "@/components/home/DualAthleteHero";
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
  const [athleteMode, setAthleteMode] = useState<"female" | "male">("female");
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

  // The programme switch changes content only, never the theme.
  const handleSelectAthlete = (mode: "female" | "male") => setAthleteMode(mode);

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
          ? "bg-canvas text-stone-900 selection:bg-brand/20 selection:text-brand-action"
          : "bg-canvas-dark text-stone-100 selection:bg-brand/30 selection:text-white"
      }`}
    >
      {/* 1. Tactical Glassmorphic Header with Light/Dark Adaptation & Streamlined Links */}
      <HomeNavbar
        isLight={isLight}
        onToggleTheme={handleToggleTheme}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 2. Interactive Dual-Athlete Hero Stage with Lightbulb Switcher */}
      <DualAthleteHero
        athleteMode={athleteMode}
        theme={theme}
        onSelectAthlete={handleSelectAthlete}
      />

      {/* 4. Editorial Pinterest-Curated Athlete Gallery */}
      <DualAthleteGallery />

      {/* 5. AI Live PT Computer Vision Teaser */}
      <AiVisionTeaser />

      {/* 6. Curated Movement Goods & Biomechanical Equipment Section */}
      <MovementGoodsSection isLight={isLight} items={catalog} source={catalogSource} onAddToCart={handleAddToCart} />

      {/* 7. Ecosystem Call to Action Banner */}
      <section className={`py-20 sm:py-28 border-t text-center relative overflow-hidden transition-colors duration-500 ${
        isLight
          ? "bg-white border-stone-200"
          : "bg-[#0D0C0B] border-stone-800"
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight ${
            isLight ? "text-stone-950" : "text-white"
          }`}>
            Bắt đầu lộ trình 28 ngày theo cơ thể bạn
          </h2>

          <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${
            isLight ? "text-stone-600" : "text-stone-300"
          }`}>
            Trả lời khảo sát thể trạng 2 phút. G-AI ước tính lượng calo mỗi ngày bằng công thức Mifflin-St Jeor, rồi dựng lộ trình bài tập theo cơ thể và mục tiêu của bạn.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <Link
              href={appUrl("/quiz")}
              className="w-full sm:w-auto min-h-12 px-8 rounded-full bg-brand-action hover:bg-brand-action-hover text-white font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors active:translate-y-px"
            >
              <span>Làm khảo sát 2 phút</span>
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>

            <Link
              href={appUrl("/prediction")}
              className={`min-h-11 inline-flex items-center justify-center text-base font-semibold underline-offset-4 decoration-2 hover:underline ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Xem dự đoán vóc dáng
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
        isLight={isLight}
      />
    </div>
  );
}
