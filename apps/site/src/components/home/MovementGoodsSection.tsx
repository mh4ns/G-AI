"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Info, ShoppingBag } from "lucide-react";

import { SlidingTabs, type SlidingTabOption } from "@g-ai/ui";
import { useStorefront } from "@/components/store/Storefront";
import { STORE_PRICES_PUBLISHED, canOptimizeImage, formatPrice, type StoreItem } from "@/lib/store-api";
import { FOCUS_RING, SECTION_HEADING } from "@/components/home/styles";

interface MovementGoodsSectionProps {
  /**
   * featured: a short row on the home page linking to /store.
   * full: the store page, with filters; its heading is the page's h1.
   */
  mode: "featured" | "full";
}

type GoodsFilter = "all" | StoreItem["group"];

const FEATURED_COUNT = 3;

const FILTERS: readonly SlidingTabOption<GoodsFilter>[] = [
  { value: "all", label: "Tất cả" },
  { value: "equipment", label: "Dụng cụ" },
  { value: "apparel", label: "Trang phục" },
];

export const MovementGoodsSection: React.FC<MovementGoodsSectionProps> = ({ mode }) => {
  const { catalog, source, addToCart } = useStorefront();
  const [selectedFilter, setSelectedFilter] = useState<GoodsFilter>("all");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [chosenSize, setChosenSize] = useState<Record<string, string>>({});
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  const full = mode === "full";
  const filteredGoods = selectedFilter === "all" ? catalog : catalog.filter((p) => p.group === selectedFilter);
  const products = full ? filteredGoods : catalog.slice(0, FEATURED_COUNT);
  const Heading = full ? "h1" : "h2";

  const handleQuickAdd = (product: StoreItem) => {
    if (!addToCart) return;
    const size = chosenSize[product.id] ?? product.sizes[0] ?? "One Size";
    setAddedProductId(product.id);
    addToCart(product, size);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedProductId(null), 2200);
  };

  return (
    <section
      id="movement-goods"
      className={`scroll-mt-20 bg-page text-ink transition-colors duration-500 ${
        full ? "pb-16 pt-10 sm:pb-24 sm:pt-16" : "border-t border-line py-16 sm:py-24"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Heading className={SECTION_HEADING}>Dụng cụ &amp; trang phục tập</Heading>
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-ink-muted">
              Trang phục và dụng cụ dùng được với các bài tập trong lộ trình 28 ngày, tập ngay tại nhà.
            </p>
          </div>

          {full ? (
            <SlidingTabs
              ariaLabel="Lọc sản phẩm"
              options={FILTERS}
              value={selectedFilter}
              onChange={setSelectedFilter}
              size="lg"
              className="self-start overflow-x-auto md:self-auto"
            />
          ) : (
            <Link
              href="/store"
              className={`inline-flex min-h-11 items-center gap-1.5 self-start rounded text-base font-semibold text-ink underline decoration-2 underline-offset-[6px] transition-opacity duration-200 hover:opacity-75 md:self-auto ${FOCUS_RING}`}
            >
              Xem tất cả sản phẩm
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>

        {full && (!STORE_PRICES_PUBLISHED || source === "sample") && (
          <p
            role="status"
            className="mb-6 flex items-start gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              {STORE_PRICES_PUBLISHED
                ? "Cửa hàng đang ở chế độ xem thử (chưa kết nối máy chủ). Bạn có thể xem sản phẩm, nhưng chưa thể đặt hàng."
                : "Giá và đặt hàng sẽ mở khi cửa hàng ra mắt. Hiện bạn có thể xem sản phẩm và size có sẵn."}
            </span>
          </p>
        )}

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={source === "loading"}>
          {source === "loading" &&
            Array.from({ length: FEATURED_COUNT }, (_, i) => (
              <li key={i} className="h-[480px] animate-pulse rounded-3xl bg-sunken" />
            ))}
          {source !== "loading" && products.length === 0 && (
            <li className="col-span-full py-12 text-center text-base text-ink-muted">Chưa có sản phẩm trong mục này.</li>
          )}
          {source !== "loading" &&
            products.map((product, index) => {
              const isAdded = addedProductId === product.id;
              const soldOut = product.stock === 0;
              const lowStock = product.stock != null && product.stock > 0 && product.stock <= 5;
              const size = chosenSize[product.id] ?? product.sizes[0];
              const specs = [product.colorName, ...product.specs].filter(Boolean);

              return (
                <li
                  key={product.id}
                  className={`group flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-colors duration-300 hover:border-ink-faint ${
                    // Featured row: two cards on phones, three from sm up.
                    !full && index >= 2 ? "hidden sm:flex" : "flex"
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-sunken">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      unoptimized={!canOptimizeImage(product.image)}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
                        soldOut ? "opacity-70 grayscale" : ""
                      }`}
                    />
                    {(soldOut || product.badge) && (
                      <span className="absolute left-3.5 top-3.5 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white">
                        {soldOut ? "Hết hàng" : product.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <p className="text-sm text-ink-muted">{product.categoryLabel}</p>

                    <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">{product.name}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{product.description}</p>

                    {specs.length > 0 && (
                      <p className="mt-3 text-sm leading-relaxed text-ink-faint">{specs.join(" · ")}</p>
                    )}

                    {/* Ordering needs prices; until then show which sizes exist. */}
                    {addToCart && product.sizes.length > 1 ? (
                      <fieldset className="mt-4" disabled={soldOut}>
                        <legend className="mb-2 text-sm text-ink-muted">Chọn size</legend>
                        <div className="flex flex-wrap gap-1.5">
                          {product.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setChosenSize((prev) => ({ ...prev, [product.id]: s }))}
                              aria-pressed={size === s}
                              className={`h-11 min-w-11 rounded-full border px-3 text-sm font-semibold transition-colors duration-200 disabled:opacity-40 ${FOCUS_RING} ${
                                size === s
                                  ? "border-ink bg-ink text-page"
                                  : "border-line text-ink-muted hover:border-ink-faint hover:text-ink"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    ) : (
                      <p className="mt-4 text-sm text-ink-muted">
                        {product.sizes.length > 1 ? `Size ${product.sizes.join(", ")}` : product.sizes[0]}
                      </p>
                    )}

                    <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                      {STORE_PRICES_PUBLISHED ? (
                        <div>
                          <span className={`text-sm ${lowStock ? "font-medium text-brand-text" : "text-ink-muted"}`}>
                            {lowStock ? `Chỉ còn ${product.stock}` : "Giá"}
                          </span>
                          <div className="text-xl font-bold tracking-tight tabular-nums text-ink">
                            {formatPrice(product.price)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-ink-muted">Giá sẽ công bố</span>
                      )}

                      {addToCart && (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          disabled={soldOut}
                          className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-page transition-[background-color,opacity,transform] duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${
                            isAdded ? "bg-positive" : "bg-ink hover:opacity-85"
                          }`}
                        >
                          {soldOut ? (
                            <span>Hết hàng</span>
                          ) : isAdded ? (
                            <>
                              <Check className="h-4 w-4" aria-hidden />
                              <span>Đã thêm</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="h-4 w-4" aria-hidden />
                              <span>Thêm vào giỏ</span>
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
