"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Info, ShoppingBag, Star } from "lucide-react";

import type { CatalogSource, StoreItem } from "@/lib/store-api";
import { canOptimizeImage, formatPrice } from "@/lib/store-api";
import { FOCUS_RING, SECTION_HEADING, SegmentedControl } from "@/components/home/SegmentedControl";

interface MovementGoodsSectionProps {
  items: StoreItem[];
  source: CatalogSource | "loading";
  onAddToCart?: (item: StoreItem, size: string) => void;
}

type GoodsFilter = "all" | StoreItem["group"];

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "equipment", label: "Dụng cụ studio" },
  { id: "apparel", label: "Trang phục" },
] as const;

const GUARANTEES = [
  "Bảo hành chính hãng 12 tháng",
  "Tương thích 100% bài tập trong khảo sát 28 ngày",
  "Đổi trả miễn phí 30 ngày nếu không vừa vặn",
];

export const MovementGoodsSection: React.FC<MovementGoodsSectionProps> = ({ items, source, onAddToCart }) => {
  const [selectedFilter, setSelectedFilter] = useState<GoodsFilter>("all");
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
      className="scroll-mt-20 border-t border-line bg-page py-16 text-ink transition-colors duration-500 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className={SECTION_HEADING}>Dụng cụ &amp; trang phục cơ sinh học</h2>
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-ink-muted">
              Tuyển tập dụng cụ chuyên biệt hỗ trợ lộ trình 28 ngày tại nhà. Được tinh chỉnh để hỗ trợ phát hiện điểm
              khớp camera AI và kích hoạt sâu nhóm cơ mục tiêu.
            </p>
          </div>

          <SegmentedControl
            label="Lọc sản phẩm"
            options={FILTERS}
            value={selectedFilter}
            onChange={setSelectedFilter}
            className="self-start md:self-auto"
          />
        </div>

        {source === "sample" && (
          <p
            role="status"
            className="mb-6 flex items-start gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Cửa hàng đang ở chế độ xem thử (chưa kết nối máy chủ). Bạn có thể xem sản phẩm, nhưng chưa thể đặt hàng.
            </span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={source === "loading"}>
          {source === "loading" &&
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-[480px] animate-pulse rounded-3xl bg-sunken" />
            ))}
          {source !== "loading" && filteredGoods.length === 0 && (
            <p className="col-span-full py-12 text-center text-base text-ink-muted">Chưa có sản phẩm trong mục này.</p>
          )}
          {source !== "loading" &&
            filteredGoods.map((product) => {
              const isAdded = addedProductId === product.id;
              const soldOut = product.stock === 0;
              const lowStock = product.stock != null && product.stock > 0 && product.stock <= 5;
              const size = chosenSize[product.id] ?? product.sizes[0];

              return (
                <article
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-colors duration-300 hover:border-ink-faint"
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
                    <div className="flex items-center justify-between gap-3 text-sm text-ink-muted">
                      <span>{product.categoryLabel}</span>
                      <span className="flex items-center gap-1.5 tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-current text-brand" aria-hidden />
                        <span className="font-semibold text-ink">{product.rating}</span>
                        <span>({product.reviews} đánh giá)</span>
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">{product.name}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{product.description}</p>

                    {product.specs.length > 0 && (
                      <p className="mt-3 text-sm leading-relaxed text-ink-faint">{product.specs.join(" · ")}</p>
                    )}

                    {product.sizes.length > 1 && (
                      <fieldset className="mt-4" disabled={soldOut}>
                        <legend className="mb-2 text-sm text-ink-muted">Chọn size</legend>
                        <div className="flex flex-wrap gap-1.5">
                          {product.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setChosenSize((prev) => ({ ...prev, [product.id]: s }))}
                              aria-pressed={size === s}
                              className={`h-9 min-w-9 rounded-full border px-3 text-sm font-semibold transition-colors duration-200 disabled:opacity-40 ${FOCUS_RING} ${
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
                    )}

                    <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                      <div>
                        <span className={`text-sm ${lowStock ? "font-medium text-brand-text" : "text-ink-muted"}`}>
                          {lowStock ? `Chỉ còn ${product.stock}` : product.sizes.length === 1 ? product.sizes[0] : "Giá"}
                        </span>
                        <div className="flex items-baseline gap-2 tabular-nums">
                          <span className="text-xl font-bold tracking-tight text-ink">{formatPrice(product.price)}</span>
                          {product.originalPrice != null && (
                            <span className="text-sm text-ink-faint line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickAdd(product)}
                        disabled={soldOut}
                        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-page transition-[background-color,opacity,transform] duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${
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
                    </div>
                  </div>
                </article>
              );
            })}
        </div>

        <ul className="mt-12 flex flex-col gap-x-10 gap-y-3 border-t border-line pt-6 text-sm text-ink-muted sm:flex-row sm:flex-wrap sm:justify-center">
          {GUARANTEES.map((guarantee) => (
            <li key={guarantee} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-ink" aria-hidden />
              <span>{guarantee}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
