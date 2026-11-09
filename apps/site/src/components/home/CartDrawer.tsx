"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, Tag } from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  badge?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  isLight?: boolean;
}

const FREE_SHIPPING_THRESHOLD = 150;

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  isLight = false,
}) => {
  const [voucherCode, setVoucherCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setIsOrderComplete(false);
      setIsCheckingOut(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = subtotal > 0 ? (isFreeShipping ? 0 : 15) : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError("");
    setVoucherSuccess("");
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    if (code === "GAI10" || code === "PILATES10" || code === "BETTERME") {
      setDiscountPercent(10);
      setVoucherSuccess("Áp dụng mã giảm 10% thành công!");
    } else if (code === "VIP20") {
      setDiscountPercent(20);
      setVoucherSuccess("Áp dụng mã VIP độc quyền -20% thành công!");
    } else {
      setVoucherError("Mã giảm giá không hợp lệ hoặc đã hết lượt.");
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setIsOrderComplete(true);
      onClearCart();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide-over Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          className={`w-screen max-w-md sm:max-w-lg flex flex-col shadow-2xl transition-transform duration-300 border-l ${
            isLight
              ? "bg-canvas text-stone-900 border-stone-200"
              : "bg-[#0E0D0C] text-stone-100 border-stone-800"
          }`}
        >
          {/* Top Bar */}
          <div
            className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
              isLight ? "border-stone-200/80 bg-white/70" : "border-stone-800/80 bg-stone-900/40"
            } backdrop-blur-md`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base sm:text-lg tracking-tight">Giỏ Hàng Dụng Cụ</h2>
                  {totalCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FF5A36] text-white">
                      {totalCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-stone-400">G-AI Movement Goods Studio</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? "hover:bg-stone-200/70 text-stone-600" : "hover:bg-stone-800 text-stone-300"
              }`}
              aria-label="Đóng giỏ hàng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          {items.length > 0 && !isOrderComplete && (
            <div
              className={`px-5 py-3 border-b text-xs font-mono flex flex-col gap-1.5 shrink-0 ${
                isLight ? "bg-amber-50/60 border-amber-200/60 text-stone-800" : "bg-stone-900/60 border-stone-800 text-stone-300"
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                  {isFreeShipping ? (
                    <strong className="text-emerald-500 font-bold">Bạn đã đạt tiêu chuẩn Freeship toàn quốc!</strong>
                  ) : (
                    <span>
                      Mua thêm <strong className="text-[#FF5A36]">${FREE_SHIPPING_THRESHOLD - subtotal}</strong> để nhận Freeship
                    </span>
                  )}
                </span>
                <span className="font-bold">{Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-300/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF5A36] to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {isOrderComplete ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Đặt Hàng Thành Công!</h3>
                  <p className="text-xs text-stone-400 max-w-xs">
                    Mã đơn hàng <strong>#GAI-{Math.floor(100000 + Math.random() * 900000)}</strong> đã được chuyển tới trung tâm phân phối thiết bị định tuyến.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#FF5A36] hover:bg-[#e04825] text-white font-mono text-xs font-bold transition-all shadow-md"
                >
                  Tiếp Tục Luyện Tập
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-800/10 dark:bg-stone-800/40 text-stone-400 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold">Giỏ hàng của bạn đang trống</h3>
                  <p className="text-xs text-stone-400 max-w-xs">
                    Khám phá các thiết bị định tuyến và trang phục chuẩn hóa camera AI để hỗ trợ lộ trình 28 ngày.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full border border-stone-300 dark:border-stone-700 hover:border-[#FF5A36] text-xs font-mono font-semibold transition-colors"
                >
                  Xem Dụng Cụ Studio
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex gap-3.5 items-center transition-all ${
                      isLight
                        ? "bg-white border-stone-200/80 shadow-sm"
                        : "bg-stone-900/60 border-stone-800/80"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-stone-950">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider truncate">
                          {item.category}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-stone-400 hover:text-rose-500 p-1 transition-colors"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm truncate">{item.name}</h4>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono font-bold text-sm text-[#FF5A36]">
                          ${item.price}
                        </span>

                        {/* Quantity Counter */}
                        <div
                          className={`flex items-center rounded-lg border overflow-hidden ${
                            isLight ? "border-stone-200 bg-stone-50" : "border-stone-800 bg-stone-900"
                          }`}
                        >
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 sm:p-1.5 hover:bg-stone-300/40 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                            aria-label="Giảm"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 font-mono text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 sm:p-1.5 hover:bg-stone-300/40 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                            aria-label="Tăng"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && !isOrderComplete && (
            <div
              className={`p-5 sm:p-6 border-t shrink-0 space-y-4 ${
                isLight ? "bg-white/90 border-stone-200" : "bg-stone-950/90 border-stone-800"
              }`}
            >
              {/* Voucher Form */}
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Mã voucher (thử GAI10)"
                    className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono uppercase border outline-none transition-all ${
                      isLight
                        ? "bg-stone-50 border-stone-200 focus:border-[#FF5A36]"
                        : "bg-stone-900 border-stone-800 focus:border-[#FF5A36] text-white"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-stone-800 hover:bg-stone-700 text-white transition-colors shrink-0"
                >
                  Áp Dụng
                </button>
              </form>

              {voucherError && <p className="text-[11px] text-rose-500 font-mono">{voucherError}</p>}
              {voucherSuccess && <p className="text-[11px] text-emerald-500 font-mono">{voucherSuccess}</p>}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs font-mono text-stone-400">
                <div className="flex justify-between">
                  <span>Tạm tính ({totalCount} món):</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-200">${subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Mã ưu đãi (-{discountPercent}%):</span>
                    <span>-${discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí vận chuyển tiêu chuẩn:</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-200">
                    {shippingFee === 0 ? "MIỄN PHÍ" : `$${shippingFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-stone-900 dark:text-white">Tổng thanh toán:</span>
                  <span className="text-xl font-bold font-mono text-[#FF5A36]">${total}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-stone-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Bảo hành 1 đổi 1 trong 30 ngày
                </span>
                <span>•</span>
                <span>Chính hãng G-AI</span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF6B4A] hover:from-[#e04825] hover:to-[#e85838] text-white text-xs sm:text-sm font-bold font-mono transition-all shadow-glow flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang tạo đơn hàng an toàn...
                  </span>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Hàng (${total})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
