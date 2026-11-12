"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Dumbbell, Info, Shirt, ShoppingBag } from "lucide-react";
import { SlidingTabs } from "@g-ai/ui";

import { useStorefront } from "@/components/store/Storefront";
import { STORE_PRICES_PUBLISHED, formatPrice, type StoreItem } from "@/lib/store-api";

interface MovementGoodsSectionProps {
  /**
   * featured: a short row on the home page linking to /store.
   * full: the store page, with filters; its heading is the page's h1.
   */
  mode: "featured" | "full";
}

const FEATURED_COUNT = 3;

/** Readable foreground for a product colour tile. */
function inkFor(hex: string): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "#1c1917";
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#1c1917" : "#ffffff";
}

export const MovementGoodsSection: React.FC<MovementGoodsSectionProps> = ({ mode }) => {
  const { isLight, catalog, source, addToCart } = useStorefront();
  const [filter, setFilter] = useState<"all" | StoreItem["group"]>("all");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [chosenSize, setChosenSize] = useState<Record<string, string>>({});
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  const full = mode === "full";
  const filtered = filter === "all" ? catalog : catalog.filter((p) => p.group === filter);
  const products = full ? filtered : catalog.slice(0, FEATURED_COUNT);
  const Heading = full ? "h1" : "h2";

  const handleQuickAdd = (product: StoreItem) => {
    if (!addToCart) return;
    const size = chosenSize[product.id] ?? product.sizes[0] ?? "One Size";
    setAddedProductId(product.id);
    addToCart(product, size);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedProductId(null), 2200);
  };

  const card = isLight ? "bg-white border-stone-200 hover:border-stone-400" : "bg-[#11100F] border-stone-800 hover:border-stone-600";
  const chip = isLight ? "bg-stone-100 text-stone-700" : "bg-stone-900 text-stone-300";

  return (
    <section
      id="movement-goods"
      className={`${full ? "pt-10 sm:pt-16" : "py-20 sm:py-28 border-t"} pb-20 sm:pb-28 scroll-mt-20 transition-colors duration-500 ${
        isLight ? "border-stone-200" : "border-stone-800"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <Heading className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Dụng cụ & trang phục tập
            </Heading>
            <p className={`mt-3 text-base leading-relaxed ${isLight ? "text-stone-600" : "text-stone-300"}`}>
              Trang phục và dụng cụ dùng được với các bài tập trong lộ trình 28 ngày, tập ngay tại nhà.
            </p>
          </div>

          {full ? (
            <SlidingTabs
              ariaLabel="Lọc sản phẩm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "equipment", label: "Dụng cụ" },
                { value: "apparel", label: "Trang phục" },
              ]}
            />
          ) : (
            <Link
              href="/store"
              className={`min-h-11 inline-flex items-center gap-1.5 text-base font-semibold underline-offset-4 decoration-2 hover:underline ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              Xem tất cả sản phẩm
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          )}
        </div>

        {full && (!STORE_PRICES_PUBLISHED || source === "sample") && (
          <p
            role="status"
            className={`mb-8 flex items-start gap-2 p-3.5 rounded-2xl border text-sm ${
              isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-amber-500/10 border-amber-500/30 text-amber-100"
            }`}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            {STORE_PRICES_PUBLISHED
              ? "Cửa hàng đang ở chế độ xem thử (chưa kết nối máy chủ). Bạn có thể xem sản phẩm, nhưng chưa thể đặt hàng."
              : "Giá và đặt hàng sẽ mở khi cửa hàng ra mắt. Hiện bạn có thể xem sản phẩm và size có sẵn."}
          </p>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" aria-busy={source === "loading"}>
          {source === "loading" &&
            Array.from({ length: FEATURED_COUNT }, (_, i) => (
              <li key={i} className={`rounded-3xl border h-80 animate-pulse ${card}`} />
            ))}
          {source !== "loading" && products.length === 0 && (
            <li className="col-span-full text-center text-sm text-muted py-12">Chưa có sản phẩm trong mục này.</li>
          )}
          {source !== "loading" &&
            products.map((product) => {
              const soldOut = product.stock === 0;
              const lowStock = product.stock != null && product.stock > 0 && product.stock <= 5;
              const size = chosenSize[product.id] ?? product.sizes[0];
              const Icon = product.group === "apparel" ? Shirt : Dumbbell;
              const ink = inkFor(product.colorHex);
              const isAdded = addedProductId === product.id;
              // Skip specs that repeat the category label shown above the name.
              const specs = product.specs.filter((spec) => spec !== product.categoryLabel);

              const index = products.indexOf(product);
              return (
                <li
                  key={product.id}
                  className={`group rounded-3xl overflow-hidden border flex-col transition-[border-color,transform] duration-200 hover:-translate-y-0.5 ${card} ${
                    !full && index >= 2 ? "hidden sm:flex" : "flex"
                  }`}
                >
                  {/* No product photography yet: the tile shows the product's own colour. */}
                  <div
                    className="relative aspect-[4/3] flex items-center justify-center"
                    style={{ backgroundColor: product.colorHex }}
                  >
                    <Icon
                      className="w-14 h-14 transition-transform duration-300 group-hover:scale-[1.03]"
                      style={{ color: ink, opacity: 0.55 }}
                      strokeWidth={1.25}
                      aria-hidden
                    />
                    {(soldOut || product.badge) && (
                      <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-stone-900">
                        {soldOut ? "Hết hàng" : product.badge}
                      </span>
                    )}
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col gap-4">
                    <div>
                      <p className="text-sm text-muted">
                        {product.categoryLabel} · {product.colorName}
                      </p>
                      <h3 className={`mt-1 text-lg font-bold tracking-tight leading-snug ${isLight ? "text-stone-950" : "text-white"}`}>
                        {product.name}
                      </h3>
                      <p className={`mt-1.5 text-sm line-clamp-2 leading-relaxed ${isLight ? "text-stone-600" : "text-stone-300"}`}>
                        {product.description}
                      </p>
                    </div>

                    {full && specs.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {specs.map((spec) => (
                          <li key={spec} className={`text-xs px-2 py-0.5 rounded-md ${chip}`}>
                            {spec}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Ordering needs prices; until then show which sizes exist. */}
                    {addToCart && product.sizes.length > 1 ? (
                      <fieldset disabled={soldOut}>
                        <legend className="text-sm text-muted mb-1.5">Chọn size</legend>
                        <div className="flex flex-wrap gap-1.5">
                          {product.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setChosenSize((prev) => ({ ...prev, [product.id]: s }))}
                              aria-pressed={size === s}
                              className={`min-w-11 min-h-11 px-2.5 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-40 ${
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
                    ) : (
                      <p className="text-sm text-muted">
                        {product.sizes.length > 1 ? `Size ${product.sizes.join(", ")}` : product.sizes[0]}
                      </p>
                    )}

                    <div
                      className={`mt-auto pt-4 border-t flex items-center justify-between gap-3 ${
                        isLight ? "border-stone-100" : "border-stone-800"
                      }`}
                    >
                      {STORE_PRICES_PUBLISHED ? (
                        <div>
                          <span className="text-sm text-muted">{lowStock ? `Chỉ còn ${product.stock}` : "Giá"}</span>
                          <div className={`text-xl font-extrabold tracking-tight ${isLight ? "text-stone-950" : "text-white"}`}>
                            {formatPrice(product.price)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-muted">Giá sẽ công bố</span>
                      )}

                      {addToCart && (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          disabled={soldOut}
                          className={`min-h-11 px-4 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 active:translate-y-px shrink-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isAdded
                              ? "bg-emerald-700 text-white"
                              : isLight
                                ? "bg-stone-900 text-white hover:bg-stone-800"
                                : "bg-white text-stone-950 hover:bg-stone-200"
                          }`}
                        >
                          {soldOut ? (
                            "Hết hàng"
                          ) : isAdded ? (
                            <>
                              <Check className="w-4 h-4" aria-hidden /> Đã thêm
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4" aria-hidden /> Thêm vào giỏ
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      </div>
    </section>
  );
};
