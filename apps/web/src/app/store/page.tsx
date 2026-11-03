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
import Link from "next/link";

export default function StorePage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "apparel" | "equipment">("all");

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

  const apparatusList = STORE_PRODUCTS.filter((p) => p.category === "equipment");

  return (
    <div className="min-h-screen bg-ecru-50 text-pitch font-sans selection:bg-pitch selection:text-ecru-50">
      {/* 1. Minimal Monospace Ticker */}
      <AnnouncementBar />

      {/* 2. Architectural Header */}
      <StoreHeader
        cartCount={cartItems.reduce((acc, it) => acc + it.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main>
        {/* 3. Asymmetric Editorial Hero */}
        <HeroBannerSlider />

        {/* 4. Curated Primary Divisions Index */}
        <WhatAreYouLookingFor />

        {/* 5. Main Catalog Collection */}
        <section id="catalog" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-ecru-200 gap-4">
            <div>
              <span className="text-xs font-mono tracking-widest text-stone-500 uppercase">
                Catalog Index
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-pitch mt-1">
                Kinetic Knitwear & Essentials
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  activeTab === "all"
                    ? "bg-pitch text-ecru-50 font-medium"
                    : "bg-white text-stone-600 hover:text-pitch border border-ecru-200"
                }`}
              >
                All Units
              </button>
              <button
                onClick={() => setActiveTab("apparel")}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  activeTab === "apparel"
                    ? "bg-pitch text-ecru-50 font-medium"
                    : "bg-white text-stone-600 hover:text-pitch border border-ecru-200"
                }`}
              >
                Apparel
              </button>
              <button
                onClick={() => setActiveTab("equipment")}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  activeTab === "equipment"
                    ? "bg-pitch text-ecru-50 font-medium"
                    : "bg-white text-stone-600 hover:text-pitch border border-ecru-200"
                }`}
              >
                Apparatus
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-6 sm:gap-y-12">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 6. Apparatus Highlight Feature */}
        <section id="apparatus" className="py-16 sm:py-24 bg-white border-y border-ecru-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-ecru-200 gap-4">
              <div>
                <span className="text-xs font-mono tracking-widest text-espresso-700 uppercase">
                  Division 02
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-pitch mt-1">
                  Residential Pilates Apparatus
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm">
                Foldable mini reformer carriages, dense 8mm natural rubber mats, and calibrated resistance rings.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 sm:gap-x-6">
              {apparatusList.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 7. Movement Disciplines Widescreen Study */}
        <ShopByActivity />

        {/* 8. Pigment Studies Carousel */}
        <ShopByColor />

        {/* 9. Biomechanical Vision Integration Banner */}
        <section className="py-20 sm:py-28 bg-pitch text-ecru-100 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-6">
              <span className="text-xs font-mono tracking-widest text-ecru-300 uppercase">
                Kinetic Vision Compatibility
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.035em] text-white leading-tight">
                Designed for posture refinement via on-device artificial vision.
              </h2>
              <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-2xl font-light">
                Our knitwear utilizes targeted contrast bands across the lumbar spine and patella joints. When pairing this gear with the G—AI live webcam coach, landmark detection confidence increases by up to 38%, ensuring real-time feedback during deep squats and pelvic curls.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/quiz"
                  className="px-7 py-3.5 rounded-full bg-white text-pitch text-xs font-mono font-medium hover:bg-ecru-200 transition-colors"
                >
                  Start 28-Day Assessment
                </Link>
                <Link
                  href="/today"
                  className="px-7 py-3.5 rounded-full border border-white/30 text-white text-xs font-mono font-medium hover:bg-white/10 transition-colors"
                >
                  Open Today Hub
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 10. Minimalist Footer */}
      <StoreFooter />

      {/* 11. Precise Slide-Over Bag Drawer */}
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
