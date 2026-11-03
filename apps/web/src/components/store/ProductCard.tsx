"use client";

import React, { useState } from "react";
import { StoreProduct } from "@/types/store";
import { ShoppingBag, Star, Check } from "lucide-react";

interface ProductCardProps {
  product: StoreProduct;
  onAddToCart: (product: StoreProduct, size: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [justAddedSize, setJustAddedSize] = useState<string | null>(null);

  const handleQuickAdd = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product, size);
    setJustAddedSize(size);
    setTimeout(() => setJustAddedSize(null), 1500);
  };

  return (
    <div
      className="group flex flex-col relative bg-white rounded-2xl overflow-hidden border border-stone-200/80 hover:border-stone-400 transition-all duration-300 hover:shadow-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        {/* Badges Top-Left */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm ${
                product.badge === "35% OFF"
                  ? "bg-[#FF6542] text-white"
                  : product.badge === "Bestseller"
                  ? "bg-[#1C2E3C] text-white"
                  : product.badge === "New"
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              {product.badge}
            </span>
          </div>
        )}

        {/* Product Images with alternate view on hover */}
        <img
          src={product.imageFront}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${
            isHovered && product.imageBack ? "opacity-0" : "opacity-100"
          }`}
        />
        {product.imageBack && (
          <img
            src={product.imageBack}
            alt={`${product.name} back angle`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${
              isHovered ? "opacity-100 scale-105" : "opacity-0"
            }`}
          />
        )}

        {/* Quick Add Size Bar (Slides up on hover) */}
        <div
          className={`absolute inset-x-0 bottom-0 p-3 bg-white/95 backdrop-blur-md border-t border-stone-200 transition-all duration-300 z-20 ${
            isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Quick Add</span>
            <span className="text-stone-400 font-normal">Chọn cỡ:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={(e) => handleQuickAdd(size, e)}
                className={`flex-1 min-w-[36px] py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                  justAddedSize === size
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-stone-800 border-stone-300 hover:border-black hover:bg-black hover:text-white"
                }`}
                title={`Thêm cỡ ${size}`}
              >
                {justAddedSize === size ? <Check className="w-3.5 h-3.5 mx-auto" /> : size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span className="capitalize">{product.subcategory || product.category}</span>
            {product.rating && (
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{product.rating}</span>
                <span className="text-stone-400 font-normal">({product.reviewsCount})</span>
              </div>
            )}
          </div>

          <h3 className="font-bold text-stone-900 text-sm sm:text-base line-clamp-1 group-hover:text-[#FF6542] transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-inner"
              style={{ backgroundColor: product.colorHex }}
              title={product.colorName}
            />
            <span className="text-xs text-stone-500 font-medium">
              {product.colorName}
            </span>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-stone-900 text-base sm:text-lg">
              ${product.price}.00
            </span>
            {product.originalPrice && (
              <span className="text-xs text-stone-400 line-through">
                ${product.originalPrice}.00
              </span>
            )}
          </div>

          <button
            onClick={(e) => handleQuickAdd(product.sizes[0], e)}
            className="p-2 rounded-xl text-stone-600 hover:text-black hover:bg-stone-100 transition-colors"
            title="Thêm nhanh vào giỏ"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
