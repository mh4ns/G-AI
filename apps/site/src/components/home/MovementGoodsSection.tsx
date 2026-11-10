"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Sparkles, ShoppingBag, Check, Star, ShieldCheck, Info } from "lucide-react";

import type { CatalogSource, StoreItem } from "@/lib/store-api";
import { canOptimizeImage, formatPrice } from "@/lib/store-api";

interface MovementGoodsSectionProps {
  isLight?: boolean;
  items: StoreItem[];
  source: CatalogSource | "loading";
  onAddToCart?: (item: StoreItem, size: string) => void;
}

export const MovementGoodsSection: React.FC<MovementGoodsSectionProps> = ({
  isLight = false,
  items,
  source,
  onAddToCart,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<"all" | StoreItem["group"]>("all");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [chosenSize, setChosenSize] = useState<Record<string, string>>({});
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  const filteredGoods = selectedFilter === "all" ? items : items.filter((p) => p.group === selectedFilter);

  const handleQuickAdd = (product: StoreItem) => {
    const size = chosenSize[product.id] ?? product.sizes[0] ?? "One Size";
    setAddedProductId(product.id);
    onAddToCart?.(product, size);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedProductId(null), 2200);
  };

  return (
    <section
      id="movement-goods"
      className={`py-20 sm:py-28 border-t select-none transition-colors duration-500 scroll-mt-20 ${
        isLight
          ? "bg-canvas border-stone-200 text-stone-900"
          : "bg-[#090807] border-stone-800 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
              isLight
                ? "bg-stone-200/80 text-stone-700 border border-stone-300"
                : "bg-stone-900 border border-stone-800 text-stone-300"
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>MOVEMENT GOODS • CALIBRATED EQUIPMENT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Dụng Cụ & Trang Phục Cơ Sinh Học
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-stone-600" : "text-stone-400"
            }`}>
              Tuyển tập dụng cụ chuyên biệt hỗ trợ lộ trình 28 ngày tại nhà. Được tinh chỉnh để hỗ trợ phát hiện điểm khớp camera AI và kích hoạt sâu nhóm cơ mục tiêu.
            </p>
          </div>

          {/* Minimalist Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-stone-500/10 border border-stone-500/20 text-xs font-mono">
            {(
              [
                { id: "all", label: "Tất Cả" },
                { id: "equipment", label: "Dụng Cụ Studio" },
                { id: "apparel", label: "Trang Phục" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  selectedFilter === tab.id
                    ? isLight
                      ? "bg-stone-900 text-white shadow-sm font-bold"
                      : "bg-white text-stone-900 shadow-sm font-bold"
                    : isLight
                    ? "text-stone-600 hover:text-stone-900"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {source === "sample" && (
          <div
            role="status"
            className={`mb-6 flex items-start gap-2 p-3.5 rounded-2xl border text-xs ${
              isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-amber-500/10 border-amber-500/30 text-amber-200"
            }`}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Cửa hàng đang ở chế độ xem thử (chưa kết nối máy chủ). Bạn có thể xem sản phẩm, nhưng chưa thể đặt hàng.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" aria-busy={source === "loading"}>
          {source === "loading" &&
            Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={`rounded-3xl border h-[480px] animate-pulse ${
                  isLight ? "bg-white border-stone-200" : "bg-[#11100F] border-stone-800"
                }`}
              />
            ))}
          {source !== "loading" && filteredGoods.length === 0 && (
            <p className="col-span-full text-center text-sm text-stone-500 py-12">Chưa có sản phẩm trong mục này.</p>
          )}
          {source !== "loading" &&
            filteredGoods.map((product) => {
              const isAdded = addedProductId === product.id;
              const soldOut = product.stock === 0;
              const lowStock = product.stock != null && product.stock > 0 && product.stock <= 5;
              const size = chosenSize[product.id] ?? product.sizes[0];

              return (
                <div
                  key={product.id}
                  className={`group relative rounded-3xl overflow-hidden border transition-[box-shadow,border-color] duration-300 flex flex-col justify-between ${
                    isLight
                      ? "bg-white border-stone-200/90 shadow-sm hover:shadow-xl hover:border-stone-300"
                      : "bg-[#11100F] border-stone-800/80 hover:border-stone-700 hover:shadow-2xl hover:shadow-black/50"
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900/40">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      unoptimized={!canOptimizeImage(product.image)}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${soldOut ? "grayscale opacity-70" : ""}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />

                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      {(soldOut || product.badge) && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/75 text-white backdrop-blur-md border border-white/10">
                          {soldOut ? "Hết hàng" : product.badge}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3.5 right-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium backdrop-blur-md ${
                          isLight
                            ? "bg-white/90 text-stone-800 border border-stone-200"
                            : "bg-stone-900/90 text-stone-300 border border-stone-700"
                        }`}
                      >
                        {product.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-mono">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span className={`font-bold ${isLight ? "text-stone-700" : "text-stone-300"}`}>{product.rating}</span>
                        <span className="text-[11px] text-stone-400">({product.reviews} đánh giá)</span>
                      </div>

                      <h3
                        className={`text-base sm:text-lg font-bold tracking-tight leading-snug group-hover:text-brand transition-colors ${
                          isLight ? "text-stone-900" : "text-white"
                        }`}
                      >
                        {product.name}
                      </h3>

                      <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? "text-stone-500" : "text-stone-400"}`}>
                        {product.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {product.specs.map((spec) => (
                        <span
                          key={spec}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                            isLight ? "bg-stone-100 border-stone-200 text-stone-600" : "bg-stone-900 border-stone-800 text-stone-400"
                          }`}
                        >
                          • {spec}
                        </span>
                      ))}
                    </div>

                    {product.sizes.length > 1 && (
                      <fieldset className="space-y-1.5" disabled={soldOut}>
                        <legend className="text-[11px] font-mono text-stone-400 mb-1.5">Chọn size</legend>
                        <div className="flex flex-wrap gap-1.5">
                          {product.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setChosenSize((prev) => ({ ...prev, [product.id]: s }))}
                              aria-pressed={size === s}
                              className={`min-w-9 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-colors disabled:opacity-40 ${
                                size === s
                                  ? isLight
                                    ? "bg-stone-900 border-stone-900 text-white"
                                    : "bg-white border-white text-stone-950"
                                  : isLight
                                    ? "border-stone-300 text-stone-700 hover:border-stone-500"
                                    : "border-stone-700 text-stone-300 hover:border-stone-500"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    <div
                      className={`pt-4 border-t flex items-center justify-between gap-3 ${
                        isLight ? "border-stone-100" : "border-stone-800/70"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-mono text-stone-400">
                          {lowStock ? `Chỉ còn ${product.stock}` : product.sizes.length === 1 ? product.sizes[0] : "Giá"}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                              isLight ? "text-stone-900" : "text-white"
                            }`}
                          >
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice != null && (
                            <span className="text-xs font-mono text-stone-400 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickAdd(product)}
                        disabled={soldOut}
                        className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-colors flex items-center gap-1.5 active:scale-95 shrink-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : isLight
                              ? "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
                              : "bg-white text-stone-950 hover:bg-stone-200 shadow-sm"
                        }`}
                      >
                        {soldOut ? (
                          <span>Hết hàng</span>
                        ) : isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã thêm</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Thêm vào giỏ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Bottom Trust Guarantee Strip */}
        <div className={`mt-12 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-around gap-4 text-xs font-mono ${
          isLight
            ? "bg-stone-100/70 border-stone-200 text-stone-600"
            : "bg-stone-900/50 border-stone-800 text-stone-400"
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Bảo hành chính hãng 12 tháng</span>
          </div>
          <div className="hidden sm:block text-stone-300 dark:text-stone-700">•</div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <span>Tương thích 100% bài tập trong Khảo sát 28 ngày</span>
          </div>
          <div className="hidden sm:block text-stone-300 dark:text-stone-700">•</div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-sky-500" />
            <span>Đổi trả miễn phí 30 ngày nếu không vừa vặn</span>
          </div>
        </div>
      </div>
    </section>
  );
};
