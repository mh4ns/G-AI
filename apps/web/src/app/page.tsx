"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { DualAthleteHero } from "@/components/home/DualAthleteHero";
import { VelocityMarquee } from "@/components/home/VelocityMarquee";
import { DualAthleteGallery } from "@/components/home/DualAthleteGallery";
import { AiVisionTeaser } from "@/components/home/AiVisionTeaser";
import { MovementGoodsSection, CuratedProduct } from "@/components/home/MovementGoodsSection";
import { CartDrawer, CartItem } from "@/components/home/CartDrawer";

export default function HomePage() {
  const [athleteMode, setAthleteMode] = useState<"female" | "male">("female");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [isManualTheme, setIsManualTheme] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Restore persistent theme & cart preference from LocalStorage
  useEffect(() => {
    try {
      const savedManual = localStorage.getItem("g_ai_theme_manual");
      const savedTheme = localStorage.getItem("g_ai_theme") as "dark" | "light" | null;
      if (savedManual === "true" && savedTheme) {
        setIsManualTheme(true);
        setTheme(savedTheme);
      }
      const savedCart = localStorage.getItem("g_ai_cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      // LocalStorage safety fallback
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem("g_ai_cart", JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  };

  const handleAddToCart = (product: CuratedProduct) => {
    const existingIndex = cartItems.findIndex((item) => item.id === product.id);
    let nextItems: CartItem[];
    if (existingIndex > -1) {
      nextItems = cartItems.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      nextItems = [
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          image: product.image,
          quantity: 1,
          badge: product.badge,
        },
      ];
    }
    saveCart(nextItems);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const nextItems = cartItems
      .map((item) => {
        if (item.id === id) {
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    saveCart(nextItems);
  };

  const handleRemoveItem = (id: string) => {
    const nextItems = cartItems.filter((item) => item.id !== id);
    saveCart(nextItems);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
    } catch (e) {
      // LocalStorage safety fallback
    }
  };

  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-500 ${
        isLight
          ? "bg-[#FFFDF9] text-stone-900 selection:bg-[#FF6B4A]/20 selection:text-[#FF6B4A]"
          : "bg-[#0A0908] text-stone-100 selection:bg-[#FF5A36]/30 selection:text-white"
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
      <MovementGoodsSection isLight={isLight} onAddToCart={handleAddToCart} />

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
              href="/quiz"
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
              href="/prediction"
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
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        isLight={isLight}
      />
    </div>
  );
}
