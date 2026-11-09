"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import Link from "next/link";
import { BrandLogo, appUrl, hubUrl } from "@g-ai/ui";

interface StoreHeaderProps {
  cartCount: number;
  onOpenCart: () => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({ cartCount, onOpenCart }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-ecru-50/95 backdrop-blur-md border-b border-ecru-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile hamburger button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 text-pitch hover:opacity-70 transition-opacity"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
            </button>
          </div>

          {/* Architectural Brand Identity */}
          <div className="flex items-center gap-4">
            <Link href={hubUrl("/")} className="flex items-center group" aria-label="G-AI – trang chính">
              <BrandLogo isLight={true} size="sm" showSubtitle subtitle="Movement Goods" />
            </Link>
          </div>

          {/* Intentional Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium tracking-tight text-pitch/80">
            <Link href="/store#catalog" className="hover:text-pitch transition-colors">
              Collection
            </Link>
            <Link href="/store#apparatus" className="hover:text-pitch transition-colors">
              Pilates Apparatus
            </Link>
            <Link href="/store#disciplines" className="hover:text-pitch transition-colors">
              Disciplines
            </Link>
            <Link href="/store#pigments" className="hover:text-pitch transition-colors">
              Pigment Study
            </Link>
            <Link href={appUrl("/quiz")} className="hover:text-pitch transition-colors text-stone-500 hover:text-pitch">
              28-Day Assessment
            </Link>
            <Link href={appUrl("/today")} className="hover:text-pitch transition-colors text-stone-500 hover:text-pitch">
              Daily Hub
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              className="p-2 text-pitch hover:opacity-70 transition-opacity hidden sm:block"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4 stroke-[1.75]" />
            </button>

            {/* Shopping Bag Trigger with Tabular Count */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2.5 py-1.5 px-3 rounded-full bg-pitch text-ecru-50 hover:bg-espresso-800 transition-colors text-xs font-mono"
              aria-label="View shopping bag"
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Bag ({cartCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-ecru-200 bg-ecru-50 px-6 py-6 space-y-4 animate-in fade-in duration-200">
          <Link
            href="/store#catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-pitch border-b border-ecru-200 pb-2"
          >
            Collection Overview
          </Link>
          <Link
            href="/store#apparatus"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-pitch border-b border-ecru-200 pb-2"
          >
            Pilates Apparatus & Kits
          </Link>
          <Link
            href="/store#disciplines"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-pitch border-b border-ecru-200 pb-2"
          >
            Movement Disciplines
          </Link>
          <Link
            href="/store#pigments"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-pitch border-b border-ecru-200 pb-2"
          >
            Pigment Study
          </Link>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={appUrl("/quiz")}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 rounded-xl bg-pitch text-ecru-50 text-xs font-mono text-center"
            >
              Complete Physical Assessment
            </Link>
            <Link
              href={appUrl("/today")}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-ecru-300 text-pitch text-xs font-mono text-center"
            >
              Open Daily Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
