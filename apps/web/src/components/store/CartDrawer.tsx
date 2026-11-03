"use client";

import React from "react";
import { CartItem } from "@/types/store";
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight, Gift } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = 100;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stone-800" />
            <h3 className="font-extrabold text-stone-900 text-lg">
              Giỏ Hàng Của Bạn ({items.reduce((acc, it) => acc + it.quantity, 0)})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            aria-label="Đóng giỏ hàng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="bg-peach-50/70 p-3.5 border-b border-peach-100">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
            {amountToFreeShipping > 0 ? (
              <span>
                Thêm <span className="text-[#FF6542] font-bold">${amountToFreeShipping}.00</span> để được <strong>FREESHIP</strong> toàn quốc!
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" /> Chúc mừng! Bạn đã đủ điều kiện Miễn Phí Vận Chuyển.
              </span>
            )}
            <span className="text-stone-400 font-normal">{shippingProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF6542] to-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-stone-800 text-base">
                Giỏ hàng của bạn đang trống
              </h4>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Hãy khám phá các trang phục và dụng cụ Pilates mới nhất để thêm vào giỏ.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-stone-900 text-white font-semibold text-xs hover:bg-[#FF6542] transition-colors"
              >
                Tiếp Tục Mua Sắm
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 p-3 rounded-2xl border border-stone-200/80 bg-stone-50/50"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-24 object-cover object-center rounded-xl bg-stone-200 shrink-0"
                />

                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-red-500 p-1 transition-colors"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 space-x-2">
                      <span>Màu: <strong>{item.colorName}</strong></span>
                      <span>•</span>
                      <span>Cỡ: <strong>{item.size}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60">
                    <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-stone-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold text-stone-900 text-sm">
                      ${item.price * item.quantity}.00
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500 font-medium">Tạm tính (Subtotal)</span>
              <span className="font-extrabold text-stone-900 text-lg">
                ${subtotal}.00
              </span>
            </div>

            <p className="text-[11px] text-stone-400">
              Thuế và phí vận chuyển sẽ được tính tại bước thanh toán.
            </p>

            <button
              onClick={() => alert("Chức năng thanh toán đang kết nối cổng Checkout!")}
              className="w-full py-4 rounded-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 hover:from-[#FF6542] hover:to-peach-600 text-white font-bold text-sm sm:text-base transition-all duration-300 shadow-soft flex items-center justify-center gap-2"
            >
              <span>Tiến Hành Thanh Toán</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-stone-400 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Thanh toán bảo mật • Đổi trả dễ dàng trong 30 ngày</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
