"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { CartDrawer } from "@/components/home/CartDrawer";
import { STORE_PRODUCTS } from "@/data/mockStoreData";
import {
  MAX_QUANTITY_PER_LINE,
  STORE_PRICES_PUBLISHED,
  cartKey,
  fetchCatalog,
  fromMockProduct,
  parseStoredCart,
  type CartLine,
  type CatalogSource,
  type StoreItem,
} from "@/lib/store-api";

const CART_STORAGE_KEY = "g_ai_cart_v2";
// Offline fallback: the same p1..p8 catalog the backend serves, browse-only.
const SAMPLE_CATALOG: StoreItem[] = STORE_PRODUCTS.map(fromMockProduct);

interface StorefrontValue {
  theme: "dark" | "light";
  isLight: boolean;
  catalog: StoreItem[];
  source: CatalogSource | "loading";
  /** Null while prices are unpublished: there is no bag to add to. */
  addToCart: ((item: StoreItem, size: string) => void) | null;
}

const StorefrontContext = createContext<StorefrontValue | null>(null);

export function useStorefront(): StorefrontValue {
  const value = useContext(StorefrontContext);
  if (!value) throw new Error("useStorefront must be used inside <Storefront>");
  return value;
}

/**
 * Shared frame for the brand site's pages: theme, navigation, the live
 * catalog and (once prices are published) the bag and checkout drawer.
 */
export function Storefront({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [catalog, setCatalog] = useState<StoreItem[]>([]);
  const [source, setSource] = useState<CatalogSource | "loading">("loading");

  // Restore theme preference and bag from this browser.
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("g_ai_theme") as "dark" | "light" | null;
      if (localStorage.getItem("g_ai_theme_manual") === "true" && savedTheme) setTheme(savedTheme);
      if (STORE_PRICES_PUBLISHED) setCartLines(parseStoredCart(localStorage.getItem(CART_STORAGE_KEY)));
    } catch {
      // Storage can be unavailable (private mode); the page still works.
    }
  }, []);

  // Live catalog from the backend; the sample catalog is browse-only.
  useEffect(() => {
    let cancelled = false;
    fetchCatalog()
      .then((items) => {
        if (cancelled) return;
        if (items.length === 0) throw new Error("empty catalog");
        setCatalog(items);
        setSource("server");
      })
      .catch(() => {
        if (cancelled) return;
        setCatalog(SAMPLE_CATALOG);
        setSource("sample");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogById = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);

  const saveCart = useCallback((update: (prev: CartLine[]) => CartLine[]) => {
    setCartLines((prev) => {
      const next = update(prev);
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const addToCart = useCallback(
    (product: StoreItem, size: string) => {
      const key = cartKey(product.id, size);
      const limit = Math.min(MAX_QUANTITY_PER_LINE, product.stock ?? MAX_QUANTITY_PER_LINE);
      saveCart((prev) =>
        prev.some((l) => l.key === key)
          ? prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(limit, l.quantity + 1) } : l))
          : [...prev, { key, productId: product.id, size, quantity: 1 }]
      );
      setIsCartOpen(true);
    },
    [saveCart]
  );

  const updateQuantity = (key: string, delta: number) =>
    saveCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY_PER_LINE, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0)
    );

  const removeItem = (key: string) => saveCart((prev) => prev.filter((l) => l.key !== key));

  // Stock changes on the server; refresh what the cards and the bag show.
  const refreshCatalog = useCallback(() => {
    fetchCatalog()
      .then((items) => {
        if (items.length) setCatalog(items);
      })
      .catch(() => undefined);
  }, []);

  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("g_ai_theme", next);
      localStorage.setItem("g_ai_theme_manual", "true");
    } catch {
      // Storage can be unavailable; the theme still applies for this visit.
    }
  };

  const isLight = theme === "light";
  const cartCount = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const value = useMemo<StorefrontValue>(
    () => ({ theme, isLight, catalog, source, addToCart: STORE_PRICES_PUBLISHED ? addToCart : null }),
    [theme, isLight, catalog, source, addToCart]
  );

  return (
    <StorefrontContext.Provider value={value}>
      <div
        data-theme={theme}
        className={`min-h-screen font-sans transition-colors duration-500 ${
          isLight ? "bg-canvas text-stone-900" : "bg-canvas-dark text-stone-100"
        }`}
      >
        <HomeNavbar
          isLight={isLight}
          onToggleTheme={toggleTheme}
          cartCount={cartCount}
          onOpenCart={STORE_PRICES_PUBLISHED ? () => setIsCartOpen(true) : undefined}
        />

        {children}

        {STORE_PRICES_PUBLISHED && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={closeCart}
            lines={cartLines}
            catalog={catalogById}
            source={source}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onOrderPlaced={() => {
              saveCart(() => []);
              refreshCatalog();
            }}
            onCatalogStale={refreshCatalog}
            isLight={isLight}
          />
        )}
      </div>
    </StorefrontContext.Provider>
  );
}
