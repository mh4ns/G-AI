"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { DualAthleteHero } from "@/components/home/DualAthleteHero";
import { VelocityMarquee } from "@/components/home/VelocityMarquee";
import { DualAthleteGallery } from "@/components/home/DualAthleteGallery";
import { AiVisionTeaser } from "@/components/home/AiVisionTeaser";
import { MovementGoodsSection } from "@/components/home/MovementGoodsSection";
import { CartDrawer } from "@/components/home/CartDrawer";
import { SAMPLE_CATALOG } from "@/data/sampleCatalog";
import {
  MAX_QUANTITY_PER_LINE,
  cartKey,
  fetchCatalog,
  parseStoredCart,
  type CartLine,
  type CatalogSource,
  type StoreItem,
} from "@/lib/store-api";

const CART_STORAGE_KEY = "g_ai_cart_v2";
import { appUrl } from "@g-ai/ui";

export default function HomePage() {
  const [athleteMode, setAthleteMode] = useState<"female" | "male">("female");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [isManualTheme, setIsManualTheme] = useState<boolean>(false);
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
        setIsManualTheme(true);
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

  const handleSelectAthlete = (mode: "female" | "male") => {
    setAthleteMode(mode);
    // Only apply automatic color default if the user hasn't chosen a manual theme
    if (!isManualTheme) {
      setTheme(mode === "male" ? "dark" : "light");
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setIsManualTheme(true);
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

      {/* 2. Interactive Dual-Athlete Hero Stage with Lightbulb Switcher */}
      <DualAthleteHero
        athleteMode={athleteMode}
        theme={theme}
        onSelectAthlete={handleSelectAthlete}
        onToggleTheme={handleToggleTheme}
      />

      {/* 3. Physics-Driven Dynamic Velocity Marquee */}
      <VelocityMarquee />

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
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono ${
            isLight
              ? "bg-peach-50 border-peach-200 text-[#FF6B4A]"
              : "bg-stone-900 border-stone-800 text-[#FF5A36]"
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hành Trình Chuyển Hóa Cá Nhân Hóa</span>
          </div>

          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight leading-tight ${
            isLight ? "text-stone-950" : "text-white"
          }`}>
            28 Ngày Định Hình Lại Tư Thế & Vóc Dáng Của Bạn
          </h2>

          <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${
            isLight ? "text-stone-600" : "text-stone-400"
          }`}>
            Trả lời khảo sát thể trạng 2 phút. Thuật toán khoa học chuyển hóa Mifflin-St Jeor sẽ dự đoán chính xác cân nặng, lượng calo mục tiêu và lộ trình bài tập phù hợp với cơ thể bạn.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={appUrl("/quiz")}
              className={`w-full sm:w-auto px-8 py-4 rounded-full text-white font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                isLight
                  ? "bg-[#FF6B4A] hover:bg-[#ff5530] shadow-[#FF6B4A]/25"
                  : "bg-[#FF5A36] hover:bg-[#e04825] shadow-[#FF5A36]/25"
              }`}
            >
              <span>Làm Khảo Sát Thể Trạng Miễn Phí</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={appUrl("/prediction")}
              className={`w-full sm:w-auto px-8 py-4 rounded-full font-mono text-xs transition-colors flex items-center justify-center gap-2 border ${
                isLight
                  ? "bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800"
                  : "bg-stone-900 hover:bg-stone-800 border-stone-700 text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Xem Bản Sao Số (Digital Twin)</span>
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
