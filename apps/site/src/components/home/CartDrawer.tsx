"use client";

import React, { useEffect, useId, useRef, useState, useLayoutEffect } from "react";
import Image from "next/image";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
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
  isLight?: boolean;
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
  isLight = false,
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

  // Panel reveal (transitions.dev 07): stay mounted while the close plays.
  // Opening flips data-open only after the closed state has been laid out,
  // so the transition always has a start state.
  const [mounted, setMounted] = useState(isOpen);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }
    setShown(false);
    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--panel-close-dur")) || 350;
    const id = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(id);
  }, [isOpen]);
  useLayoutEffect(() => {
    if (!mounted || !isOpen) return;
    void panelRef.current?.offsetHeight; // commit the closed state first
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [mounted, isOpen]);

  if (!mounted) return null;

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

  const panel = isLight ? "bg-canvas text-stone-900 border-stone-200" : "bg-[#0E0D0C] text-stone-100 border-stone-800";
  const card = isLight ? "bg-white border-stone-200/80 shadow-sm" : "bg-stone-900/60 border-stone-800/80";
  const input = `w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors focus:border-brand ${
    isLight ? "bg-white border-stone-300 text-stone-900" : "bg-stone-900 border-stone-700 text-white"
  }`;
  const muted = isLight ? "text-stone-500" : "text-stone-400";

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${isOpen ? "" : "pointer-events-none"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Giỏ hàng"
    >
      <div onClick={onClose} data-open={shown} className="t-backdrop absolute inset-0 bg-black/60" />

      <div ref={panelRef} data-open={shown} className="t-panel-slide t-panel--drawer absolute inset-y-0 right-0 w-full max-w-lg flex">
        <div className={`w-full flex flex-col shadow-2xl border-l ${panel}`}>
          {/* Top bar */}
          <div
            className={`p-4 sm:p-6 border-b flex items-center justify-between shrink-0 backdrop-blur-md ${
              isLight ? "border-stone-200/80 bg-white/70" : "border-stone-800/80 bg-stone-900/40"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {step === "checkout" ? (
                <button
                  onClick={() => setStep("cart")}
                  className={`p-2 rounded-xl transition-colors ${isLight ? "hover:bg-stone-200/70" : "hover:bg-stone-800"}`}
                  aria-label="Quay lại giỏ hàng"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base sm:text-lg tracking-tight truncate">
                    {step === "checkout" ? "Thông tin giao hàng" : step === "done" ? "Đã nhận đơn" : "Giỏ hàng"}
                  </h2>
                  {step === "cart" && totalCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand text-white">
                      {totalCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">G-AI Movement Goods</p>
              </div>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? "hover:bg-stone-200/70 text-stone-600" : "hover:bg-stone-800 text-stone-300"
              }`}
              aria-label="Đóng giỏ hàng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {step === "done" && order ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-2 sm:p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Đơn hàng đã được tạo</h3>
                  <p className={`text-sm ${muted}`}>
                    Mã đơn <strong className="">{order.id}</strong> · Tổng{" "}
                    <strong className="">{formatPrice(order.total_amount)}</strong>
                  </p>
                  <p className={`text-xs max-w-xs mx-auto ${muted}`}>
                    Đơn đang <strong>chờ thanh toán</strong>; chưa có khoản nào bị trừ. Chúng tôi sẽ liên hệ qua{" "}
                    {order.customer_email} để hoàn tất.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-brand hover:bg-brand-deep text-white text-xs font-bold transition-colors"
                >
                  Tiếp tục xem sản phẩm
                </button>
              </div>
            ) : lines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-500/10 text-muted flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold">Giỏ hàng đang trống</h3>
                  <p className="text-xs text-muted max-w-xs">
                    Khám phá dụng cụ và trang phục hỗ trợ lộ trình 28 ngày.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={`px-5 py-2.5 rounded-full border text-xs font-semibold transition-colors hover:border-brand ${
                    isLight ? "border-stone-300" : "border-stone-700"
                  }`}
                >
                  Xem sản phẩm
                </button>
              </div>
            ) : step === "checkout" ? (
              <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Họ và tên</span>
                  <input
                    className={input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Email</span>
                  <input
                    className={input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={254}
                    autoComplete="email"
                    inputMode="email"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Địa chỉ giao hàng</span>
                  <textarea
                    className={`${input} min-h-24 resize-y`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    minLength={5}
                    maxLength={500}
                    autoComplete="street-address"
                  />
                </label>

                <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${card}`}>
                  {orderable.map(({ line, item }) => (
                    <div key={line.key} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">
                        {line.quantity} × {item!.name} <span className={muted}>({line.size})</span>
                      </span>
                      <span className=" shrink-0">{formatPrice(item!.price * line.quantity)}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <p role="alert" className="flex items-start gap-2 text-xs text-rose-500">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </form>
            ) : (
              <ul className="space-y-3">
                {rows.map(({ line, item, problem }) => (
                  <li key={line.key} className={`p-3.5 rounded-2xl border flex gap-3.5 items-center ${card}`}>
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-stone-950">
                      {item && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized={!canOptimizeImage(item.image)}
                          className={`object-cover ${problem ? "grayscale opacity-60" : ""}`}
                          sizes="80px"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted truncate">
                          {item?.categoryLabel ?? "—"} · Size {line.size}
                        </span>
                        <button
                          onClick={() => onRemoveItem(line.key)}
                          className="text-muted hover:text-rose-500 p-1 transition-colors"
                          aria-label={`Xoá ${item?.name ?? "sản phẩm"}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm truncate">{item?.name ?? line.productId}</h4>
                      {problem && <p className="text-xs text-rose-500 font-semibold">{problem}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-bold text-sm text-accent">
                          {item ? formatPrice(item.price * line.quantity) : "—"}
                        </span>
                        <div
                          className={`flex items-center rounded-lg border overflow-hidden ${
                            isLight ? "border-stone-200 bg-stone-50" : "border-stone-800 bg-stone-900"
                          }`}
                        >
                          <button
                            onClick={() => onUpdateQuantity(line.key, -1)}
                            className="p-1.5 text-muted hover:text-current transition-colors"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold" aria-live="polite">
                            {line.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(line.key, 1)}
                            disabled={
                              line.quantity >= MAX_QUANTITY_PER_LINE ||
                              (item?.stock != null && line.quantity >= item.stock)
                            }
                            className="p-1.5 text-muted hover:text-current transition-colors disabled:opacity-30"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="w-3 h-3" />
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
            <div
              className={`p-4 sm:p-6 border-t shrink-0 space-y-3 ${
                isLight ? "bg-white/90 border-stone-200" : "bg-stone-950/90 border-stone-800"
              }`}
            >
              <div className="flex justify-between items-baseline text-sm">
                <span className="font-bold">Tạm tính</span>
                <span className="text-xl font-bold text-accent">{formatPrice(subtotal)}</span>
              </div>
              <p className={`text-xs ${muted}`}>
                Giá cuối cùng do máy chủ xác nhận khi tạo đơn. Đơn ở trạng thái chờ thanh toán — chưa thu tiền.
              </p>

              {source === "sample" && (
                <p className="flex items-start gap-2 text-xs text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Cửa hàng chưa kết nối máy chủ nên tạm thời chưa thể đặt hàng.</span>
                </p>
              )}
              {source === "server" && hasProblems && step === "cart" && (
                <p className="flex items-start gap-2 text-xs text-rose-500">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Hãy xoá hoặc điều chỉnh các sản phẩm được đánh dấu trước khi đặt hàng.</span>
                </p>
              )}

              {step === "cart" ? (
                <button
                  onClick={() => {
                    setError(null);
                    setStep("checkout");
                  }}
                  disabled={!canCheckout}
                  className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-deep text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Tiến hành đặt hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  form={formId}
                  disabled={!canCheckout || submitting}
                  className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-deep text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo đơn…</span>
                    </>
                  ) : (
                    <span>Xác nhận đặt hàng</span>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Đổi trả miễn phí 30 ngày</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
