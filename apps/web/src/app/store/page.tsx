"use client";

import React, { useState, useEffect } from "react";
import { STORE_PRODUCTS } from "@/data/mockStoreData";
import { StoreProduct, CartItem } from "@/types/store";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { StoreHeader } from "@/components/store/StoreHeader";
import { HeroBannerSlider } from "@/components/store/HeroBannerSlider";
import { WhatAreYouLookingFor } from "@/components/store/WhatAreYouLookingFor";
import { ProductCard } from "@/components/store/ProductCard";
import { ShopByActivity } from "@/components/store/ShopByActivity";
import { ShopByColor } from "@/components/store/ShopByColor";
import { CartDrawer } from "@/components/store/CartDrawer";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Sparkles, ArrowRight, ShieldCheck, Truck, RotateCcw, HeartHandshake } from "lucide-react";
import Link from "next/link";

export default function StorePage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "apparel" | "equipment">("all");

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("g_ai_store_cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      // fallback
    }
  }, []);

  // Sync cart to localStorage
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem("g_ai_store_cart", JSON.stringify(items));
    } catch (e) {
      // fallback
    }
  };

  const handleAddToCart = (product: StoreProduct, size: string) => {
    const existingIndex = cartItems.findIndex(
      (item) => item.productId === product.id && item.size === size
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${size}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        colorName: product.colorName,
        size: size,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.imageFront,
        quantity: 1,
      };
      saveCart([...cartItems, newItem]);
    }
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    saveCart(updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    saveCart(updated);
  };

  const filteredProducts = activeTab === "all"
    ? STORE_PRODUCTS
    : STORE_PRODUCTS.filter((p) => p.category === activeTab);

  const bestsellers = STORE_PRODUCTS.filter(
    (p) => p.badge === "Bestseller" || p.badge === "35% OFF" || p.badge === "Most gifted"
  );

  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col font-sans selection:bg-[#FF6542]/20 selection:text-[#FF6542]">
      {/* 1. Rotating Announcement Ticker Bar */}
      <AnnouncementBar />

      {/* 2. Top Navigation Header with Cart Trigger */}
      <StoreHeader
        cartCount={cartItems.reduce((acc, it) => acc + it.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1">
        {/* 3. Hero Editorial Lifestyle Slider */}
        <HeroBannerSlider />

        {/* 4. "What Are You Looking For?" Category Quick Grid */}
        <WhatAreYouLookingFor />

        {/* 5. New Arrivals Showcase with Filter Tabs */}
        <section id="new-arrivals" className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF6542] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mùa Mới 2026</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900">
                New Arrivals
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  activeTab === "all"
                    ? "bg-black text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Tất Cả Sản Phẩm
              </button>
              <button
                onClick={() => setActiveTab("apparel")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  activeTab === "apparel"
                    ? "bg-black text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Trang Phục Nữ (Apparel)
              </button>
              <button
                onClick={() => setActiveTab("equipment")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  activeTab === "equipment"
                    ? "bg-black text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Dụng Cụ Pilates & Home Gym
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 6. Shop by Activity Horizontal Slider */}
        <ShopByActivity />

        {/* 7. Bestsellers Section (-35% Promotion Banner) */}
        <section id="bestsellers" className="py-12 sm:py-20 bg-stone-50 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider">
                  Hot Deal • Giảm Đến 35%
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900 mt-2">
                  Best Sellers & Pilates Kits
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  Được hơn 50.000 học viên G-AI tin dùng để tập luyện tại nhà
                </p>
              </div>

              <a
                href="#new-arrivals"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-900 hover:text-[#FF6542] transition-colors"
              >
                <span>Xem Tất Cả</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestsellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 8. Shop by Color Aesthetics Carousel */}
        <ShopByColor />

        {/* 9. Value Proposition & Cross-Eco Banner */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-[#1C2E3C] via-stone-900 to-[#1C2E3C] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="px-3.5 py-1 rounded-full bg-[#FF6542]/20 text-[#FF6542] border border-[#FF6542]/30 text-xs font-bold uppercase tracking-wider">
                  Trải Nghiệm Đồng Bộ Hóa
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mt-4 leading-tight">
                  Tập Chuẩn Tư Thế.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6542] to-amber-400">
                    Cùng G-AI Live PT.
                  </span>
                </h2>
                <p className="text-stone-300 text-sm sm:text-base mt-4 leading-relaxed max-w-xl">
                  Mọi dụng cụ và trang phục G-AI Store đều được tối ưu màu sắc và đường nét tương phản cao, giúp thuật toán thị giác máy tính nhận diện 33 điểm khớp xương chính xác hơn gấp 2 lần qua webcam.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/quiz"
                    className="px-8 py-4 rounded-full bg-[#FF6542] hover:bg-peach-600 text-white font-bold text-sm sm:text-base transition-colors shadow-soft"
                  >
                    Bắt Đầu Khảo Sát Thể Trạng →
                  </Link>
                  <Link
                    href="/today"
                    className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-sm sm:text-base transition-colors"
                  >
                    Mở Bảng Điều Khiển
                  </Link>
                </div>
              </div>

              {/* 3 Value Pillars */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6542]/20 text-[#FF6542] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Freeship Đơn Từ $100</h3>
                    <p className="text-xs text-stone-400 mt-1">Giao hàng hỏa tốc trong 2-3 ngày làm việc trên toàn quốc.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Đổi Trả Miễn Phí Trong 30 Ngày</h3>
                    <p className="text-xs text-stone-400 mt-1">Không ưng size hoặc muốn đổi màu? Hỗ trợ đổi trả tận nhà miễn phí.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Vải Co Giãn Nén 4 Chiều (Sculpt-Fit)</h3>
                    <p className="text-xs text-stone-400 mt-1">Định hình vòng eo, nâng mông tự nhiên và thoáng khí tối đa.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 10. Store Footer */}
      <StoreFooter />

      {/* 11. Interactive Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
