"use client";

import React, { useState } from "react";
import { StoreProduct } from "@/types/store";
import { Check } from "lucide-react";

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
    setTimeout(() => setJustAddedSize(null), 1200);
  };

  return (
    <div
      className="group flex flex-col relative bg-transparent select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual Canvas Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ecru-100 border border-ecru-200 transition-colors duration-300 group-hover:border-stone-400">
        {/* Understated Minimalist Badge */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-20">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase ${
                product.badge === "35% OFF"
                  ? "bg-terracotta-500 text-white font-bold"
                  : "bg-pitch text-ecru-100 font-medium"
              }`}
            >
              {product.badge}
            </span>
          </div>
        )}

        {/* Dual-Angle Photographic Cross-Dissolve */}
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
            alt={`${product.name} secondary angle`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ${
              isHovered ? "opacity-100 scale-102" : "opacity-0"
            }`}
          />
        )}

        {/* Quick Add Size Bar (Discipline over flashiness) */}
        <div
          className={`absolute inset-x-0 bottom-0 p-2.5 bg-pitch/90 backdrop-blur-md text-white transition-all duration-300 z-20 ${
            isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-ecru-200 mb-1.5 px-0.5">
            <span>Add size to bag:</span>
          </div>
          <div className="flex gap-1">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={(e) => handleQuickAdd(size, e)}
                className={`flex-1 py-1 text-[11px] font-mono font-medium rounded transition-colors ${
                  justAddedSize === size
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-ecru-100 hover:bg-white hover:text-pitch"
                }`}
                title={`Select ${size}`}
              >
                {justAddedSize === size ? <Check className="w-3 h-3 mx-auto" /> : size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Typography Below */}
      <div className="pt-3 pb-1 flex flex-col justify-between flex-1">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
            <span className="uppercase">{product.subcategory || product.category}</span>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full border border-stone-300"
                style={{ backgroundColor: product.colorHex }}
                title={product.colorName}
              />
              <span>{product.colorName}</span>
            </div>
          </div>

          <h3 className="font-semibold text-pitch text-sm leading-snug group-hover:text-terracotta-600 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Tabular Price */}
        <div className="mt-2 flex items-baseline gap-2 font-mono text-xs">
          <span className="font-bold text-pitch">
            ${product.price}.00
          </span>
          {product.originalPrice && (
            <span className="text-stone-400 line-through">
              ${product.originalPrice}.00
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
