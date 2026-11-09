"use client";

import React from "react";
import { CartItem } from "@/types/store";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

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
        className="fixed inset-0 bg-pitch/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Body - Architectural Minimalist Style */}
      <div className="relative w-full max-w-md bg-ecru-50 h-full shadow-2xl flex flex-col z-10 border-l border-ecru-300 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-ecru-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-pitch text-base tracking-tight">
              Shopping Bag
            </span>
            <span className="text-xs font-mono text-stone-400">
              ({items.reduce((acc, it) => acc + it.quantity, 0)} items)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-pitch transition-colors"
            aria-label="Close bag"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Free Shipping Milestone Meter */}
        <div className="bg-white px-5 py-3 border-b border-ecru-200 font-mono text-[11px]">
          <div className="flex items-center justify-between text-pitch mb-1.5">
            {amountToFreeShipping > 0 ? (
              <span>Add ${amountToFreeShipping}.00 for complimentary delivery</span>
            ) : (
              <span className="text-emerald-700 font-semibold">Complimentary delivery unlocked</span>
            )}
            <span className="text-stone-400">{shippingProgress}%</span>
          </div>
          <div className="w-full h-1 bg-ecru-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-pitch transition-all duration-300"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto stroke-[1.25]" />
              <h4 className="font-bold text-pitch text-sm">
                Your bag is empty
              </h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Explore Series 01 kinetic knitwear and residential Pilates apparatus to begin.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-pitch text-ecru-50 text-xs font-mono hover:bg-espresso-800 transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 p-3 rounded-xl border border-ecru-200 bg-white"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-18 h-22 object-cover object-center rounded-lg bg-ecru-100 shrink-0"
                />

                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-pitch text-xs truncate">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-pitch transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                      </button>
                    </div>
                    <div className="text-[11px] font-mono text-stone-500 mt-0.5 space-x-1.5">
                      <span>{item.colorName}</span>
                      <span>/</span>
                      <span>Size {item.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-ecru-100">
                    <div className="flex items-center border border-ecru-300 rounded font-mono text-xs">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="px-2 py-0.5 text-pitch hover:bg-ecru-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-pitch font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="px-2 py-0.5 text-pitch hover:bg-ecru-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-mono font-bold text-pitch text-xs">
                      ${item.price * item.quantity}.00
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Receipt Summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-ecru-200 bg-white space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Subtotal</span>
              <span className="font-bold text-pitch text-sm">
                ${subtotal}.00
              </span>
            </div>

            <p className="text-[10px] text-stone-400">
              Shipping & taxes calculated during final secure checkout.
            </p>

            <button
              onClick={() => alert("Checkout gateway is connected to sandbox.")}
              className="w-full py-3.5 rounded-full bg-pitch text-ecru-50 hover:bg-espresso-800 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
