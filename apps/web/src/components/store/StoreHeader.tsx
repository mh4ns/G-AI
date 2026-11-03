"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, Menu, X, Globe, User, Heart } from "lucide-react";
import Link from "next/link";

interface StoreHeaderProps {
  cartCount: number;
  onOpenCart: () => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({ cartCount, onOpenCart }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "VND">("USD");

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:text-black hover:bg-stone-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/store" className="flex items-center gap-2 group">
              <span className="w-9 h-9 rounded-xl bg-[#1C2E3C] text-white flex items-center justify-center font-black text-lg tracking-wider shadow-sm group-hover:bg-[#FF6542] transition-colors">
                G
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-stone-900 group-hover:text-[#FF6542] transition-colors">
                  G-AI <span className="font-light text-stone-400">STORE</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold -mt-1">
                  Activewear & Gear
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-stone-700">
            <Link href="/store?category=new" className="hover:text-black transition-colors">
              New Arrivals
            </Link>
            <Link href="/store?category=bestsellers" className="hover:text-black transition-colors">
              Bestsellers
            </Link>
            <Link href="/store?category=women" className="hover:text-black transition-colors">
              Women
            </Link>
            <Link href="/store?category=equipment" className="hover:text-black transition-colors">
              Equipment & Kits
            </Link>
            <Link href="/store?activity=pilates" className="hover:text-black transition-colors">
              Pilates
            </Link>
            <Link href="/store?category=sale" className="text-[#FF6542] font-semibold hover:underline">
              Sale -35%
            </Link>
            
            {/* Quick cross-links to App Ecosystem */}
            <div className="h-4 w-px bg-stone-200 mx-1" />
            <Link
              href="/quiz"
              className="text-xs px-3 py-1.5 rounded-full bg-peach-50 text-peach-700 font-semibold border border-peach-200 hover:bg-peach-100 transition-colors"
            >
              Làm Quiz Thể Trạng →
            </Link>
            <Link
              href="/today"
              className="text-xs px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 font-medium hover:bg-stone-200 transition-colors"
            >
              Today Hub
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Currency selector */}
            <div className="hidden sm:flex items-center text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
              <Globe className="w-3.5 h-3.5 mr-1 text-stone-400" />
              <button
                onClick={() => setCurrency(currency === "USD" ? "VND" : "USD")}
                className="hover:text-black uppercase"
                title="Đổi loại tiền tệ"
              >
                {currency}
              </button>
            </div>

            {/* Search */}
            <button
              className="p-2 rounded-full text-stone-600 hover:text-black hover:bg-stone-100 transition-colors"
              aria-label="Tìm kiếm sản phẩm"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Shopping Bag Trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-full text-stone-800 hover:text-[#FF6542] hover:bg-stone-100 transition-colors"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#FF6542] text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-in zoom-in shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200 shadow-xl">
          <Link
            href="/store?category=new"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800 border-b border-stone-100"
          >
            New Arrivals
          </Link>
          <Link
            href="/store?category=bestsellers"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800 border-b border-stone-100"
          >
            Bestsellers
          </Link>
          <Link
            href="/store?category=women"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800 border-b border-stone-100"
          >
            Women Collection
          </Link>
          <Link
            href="/store?category=equipment"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800 border-b border-stone-100"
          >
            Equipment & Pilates Kits
          </Link>
          <Link
            href="/store?category=sale"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-bold text-[#FF6542] border-b border-stone-100"
          >
            Sale - Giảm đến 35%
          </Link>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/quiz"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-peach-50 text-peach-700 font-semibold border border-peach-200"
            >
              Làm Khảo Sát Thể Trạng (Quiz)
            </Link>
            <Link
              href="/today"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-stone-100 text-stone-700 font-medium"
            >
              Vào Bảng Điều Khiển Today Hub
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
