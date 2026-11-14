"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from "lucide-react";
import {
  MAX_QUANTITY_PER_LINE,
  StoreApiError,
  canOptimizeImage,
  createOrder,
  formatPrice,
  type CartLine,
  type CatalogSource,
  type OrderResponse,
  type StoreItem,
} from "@/lib/store-api";
import { FOCUS_RING } from "@/components/home/SegmentedControl";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lines: CartLine[];
  catalog: ReadonlyMap<string, StoreItem>;
  source: CatalogSource | "loading";
  onUpdateQuantity: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  /** Called after the server accepted the order; the parent clears the cart. */
  onOrderPlaced: (order: OrderResponse) => void;
  /** Called when the server rejected the order over stock or availability. */
  onCatalogStale?: () => void;
}

type Step = "cart" | "checkout" | "done";

/** Why a line cannot be ordered right now, or null when it can. */
function lineProblem(line: CartLine, item: StoreItem | undefined): string | null {
  if (!item) return "Sản phẩm không còn bán";
  if (!item.sizes.includes(line.size)) return `Size ${line.size} không còn`;
  if (item.stock === 0) return "Hết hàng";
  if (item.stock != null && line.quantity > item.stock) return `Chỉ còn ${item.stock} sản phẩm`;
  return null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  lines,
  catalog,
  source,
  onUpdateQuantity,
  onRemoveItem,
  onOrderPlaced,
  onCatalogStale,
}) => {
  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const formId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // A finished order is shown once; reopening the bag starts fresh.
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      if (step === "done") {
        setStep("cart");
        setOrder(null);
      }
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const rows = lines.map((line) => {
    const item = catalog.get(line.productId);
    return { line, item, problem: lineProblem(line, item) };
  });
  const orderable = rows.filter((r) => !r.problem);
  const hasProblems = rows.some((r) => r.problem);
  const subtotal = orderable.reduce((sum, r) => sum + (r.item?.price ?? 0) * r.line.quantity, 0);
  const totalCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const canCheckout = source === "server" && orderable.length > 0 && !hasProblems;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCheckout || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await createOrder({
        customer_name: name.trim(),
        customer_email: email.trim(),
        shipping_address: address.trim(),
        items: orderable.map(({ line }) => ({ product_id: line.productId, size: line.size, quantity: line.quantity })),
      });
      setOrder(created);
      setStep("done");
      onOrderPlaced(created);
    } catch (err) {
      setError(err instanceof StoreApiError ? err.message : "Không tạo được đơn hàng. Vui lòng thử lại.");
      if (err instanceof StoreApiError && (err.status === 409 || err.status === 422)) onCatalogStale?.();
    } finally {
      setSubmitting(false);
    }
  };

  const title = step === "checkout" ? "Thông tin giao hàng" : step === "done" ? "Đã nhận đơn" : "Giỏ hàng";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-lg">
        <div className="flex w-full flex-col border-l border-line bg-page text-ink shadow-[-24px_0_60px_-30px_rgba(0,0,0,0.5)]">
          {/* Top bar */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              {step === "checkout" && (
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className={`-ml-2 ${ICON_BUTTON}`}
                  aria-label="Quay lại giỏ hàng"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </button>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="truncate text-lg font-semibold tracking-tight">{title}</h2>
                  {step === "cart" && totalCount > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold tabular-nums text-brand-contrast">
                      {totalCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-muted">G-AI Movement · cửa hàng</p>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className={`-mr-2 ${ICON_BUTTON}`}
              aria-label="Đóng giỏ hàng"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {step === "done" && order ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-positive text-page">
                  <Check className="h-7 w-7" strokeWidth={3} aria-hidden />
                </div>
                <h3 className="mt-5 text-xl font-semibold">Đơn hàng đã được tạo</h3>
                <p className="mt-2 text-base text-ink-muted">
                  Mã đơn <strong className="font-semibold text-ink">{order.id}</strong> · Tổng{" "}
                  <strong className="font-semibold tabular-nums text-ink">{formatPrice(order.total_amount)}</strong>
                </p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
                  Đơn đang <strong className="font-semibold text-ink">chờ thanh toán</strong>; chưa có khoản nào bị
                  trừ. Chúng tôi sẽ liên hệ qua {order.customer_email} để hoàn tất.
                </p>
                <button type="button" onClick={onClose} className={`mt-7 ${SECONDARY_BUTTON}`}>
                  Tiếp tục xem sản phẩm
                </button>
              </div>
            ) : lines.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sunken text-ink-muted">
                  <ShoppingBag className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mt-5 text-xl font-semibold">Giỏ hàng đang trống</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
                  Khám phá dụng cụ và trang phục hỗ trợ lộ trình 28 ngày.
                </p>
                <button type="button" onClick={onClose} className={`mt-7 ${SECONDARY_BUTTON}`}>
                  Xem sản phẩm
                </button>
              </div>
            ) : step === "checkout" ? (
              <form id={formId} onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
                <label className="block">
                  <span className={FIELD_LABEL}>Họ và tên</span>
                  <input
                    className={FIELD_INPUT}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className={FIELD_LABEL}>Email</span>
                  <input
                    className={FIELD_INPUT}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={254}
                    autoComplete="email"
                    inputMode="email"
                  />
                </label>
                <label className="block">
                  <span className={FIELD_LABEL}>Địa chỉ giao hàng</span>
                  <textarea
                    className={`${FIELD_INPUT} min-h-24 resize-y py-2.5`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    minLength={5}
                    maxLength={500}
                    autoComplete="street-address"
                  />
                </label>

                <ul className="divide-y divide-line rounded-2xl border border-line bg-surface text-sm">
                  {orderable.map(({ line, item }) => (
                    <li key={line.key} className="flex justify-between gap-3 px-4 py-3">
                      <span className="min-w-0 truncate">
                        {line.quantity} × {item!.name} <span className="text-ink-muted">({line.size})</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">{formatPrice(item!.price * line.quantity)}</span>
                    </li>
                  ))}
                </ul>

                {error && (
                  <p role="alert" className="flex items-start gap-2 text-sm font-medium text-danger">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{error}</span>
                  </p>
                )}
              </form>
            ) : (
              <ul className="-my-4 divide-y divide-line">
                {rows.map(({ line, item, problem }) => (
                  <li key={line.key} className="flex gap-4 py-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sunken">
                      {item && (
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          unoptimized={!canOptimizeImage(item.image)}
                          className={`object-cover ${problem ? "opacity-60 grayscale" : ""}`}
                          sizes="80px"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-semibold">{item?.name ?? line.productId}</h3>
                          <p className="truncate text-sm text-ink-muted">
                            {item?.categoryLabel ?? "—"} · Size {line.size}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(line.key)}
                          className={`-mr-2 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-sunken hover:text-danger ${FOCUS_RING}`}
                          aria-label={`Xoá ${item?.name ?? "sản phẩm"}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      {problem && <p className="mt-1 text-sm font-medium text-danger">{problem}</p>}
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-base font-semibold tabular-nums">
                          {item ? formatPrice(item.price * line.quantity) : "—"}
                        </span>
                        <div className="flex items-center rounded-full border border-line">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(line.key, -1)}
                            className={STEPPER_BUTTON}
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(line.key, 1)}
                            disabled={
                              line.quantity >= MAX_QUANTITY_PER_LINE ||
                              (item?.stock != null && line.quantity >= item.stock)
                            }
                            className={STEPPER_BUTTON}
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {lines.length > 0 && step !== "done" && (
            <div className="shrink-0 border-t border-line bg-surface px-4 py-5 sm:px-6">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold">Tạm tính</span>
                <span className="text-2xl font-bold tabular-nums tracking-tight">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                Giá cuối cùng do máy chủ xác nhận khi tạo đơn. Đơn ở trạng thái chờ thanh toán — chưa thu tiền.
              </p>

              {source === "sample" && (
                <p className="mt-3 flex items-start gap-2 text-sm text-ink">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>Cửa hàng chưa kết nối máy chủ nên tạm thời chưa thể đặt hàng.</span>
                </p>
              )}
              {source === "server" && hasProblems && step === "cart" && (
                <p className="mt-3 flex items-start gap-2 text-sm font-medium text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>Hãy xoá hoặc điều chỉnh các sản phẩm được đánh dấu trước khi đặt hàng.</span>
                </p>
              )}

              {step === "cart" ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("checkout");
                  }}
                  disabled={!canCheckout}
                  className={`mt-4 ${PRIMARY_BUTTON}`}
                >
                  <span>Tiến hành đặt hàng</span>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="submit"
                  form={formId}
                  disabled={!canCheckout || submitting}
                  className={`mt-4 ${PRIMARY_BUTTON}`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      <span>Đang tạo đơn…</span>
                    </>
                  ) : (
                    <span>Xác nhận đặt hàng</span>
                  )}
                </button>
              )}

              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                <span>Đổi trả miễn phí 30 ngày</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ICON_BUTTON = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-sunken hover:text-ink ${FOCUS_RING}`;

const PRIMARY_BUTTON = `flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-brand-contrast transition-[background-color,transform] duration-200 hover:bg-brand-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand ${FOCUS_RING}`;

const SECONDARY_BUTTON = `inline-flex h-11 items-center rounded-full border border-ink-faint px-6 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-sunken ${FOCUS_RING}`;

const STEPPER_BUTTON = `flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink disabled:opacity-30 disabled:hover:text-ink-muted ${FOCUS_RING}`;

const FIELD_LABEL = "mb-1.5 block text-sm font-medium text-ink";

// 16px text keeps iOS from zooming the page when a field takes focus.
const FIELD_INPUT =
  "block min-h-11 w-full rounded-xl border border-ink-faint bg-surface px-3.5 text-base text-ink caret-brand outline-none transition-colors duration-200 focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
