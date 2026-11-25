"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME, readStoredTheme, toggleStoredTheme, type ThemeMode } from "@g-ai/ui/theme";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { CartDrawer } from "@/components/home/CartDrawer";
import { STORE_PRODUCTS } from "@/data/mockStoreData";
import {
  STORE_PRICES_PUBLISHED,
  fetchCatalog,
  fromMockProduct,
  type CatalogSource,
  type StoreItem,
} from "@/lib/store-api";
import {
  addCartItem,
  readStoredCart,
  removeCartItem,
  summarizeCart,
  updateCartItemQuantity,
  writeStoredCart,
  type CartLine,
} from "@/lib/store-cart";

// Offline fallback: the same p1..p8 catalog the backend serves, browse-only.
const SAMPLE_CATALOG: StoreItem[] = STORE_PRODUCTS.map(fromMockProduct);

interface StorefrontValue {
  theme: ThemeMode;
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
  const [theme, setTheme] = useState<ThemeMode>(DEFAULT_THEME);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [catalog, setCatalog] = useState<StoreItem[]>([]);
  const [source, setSource] = useState<CatalogSource | "loading">("loading");

  // Restore theme preference and bag from this browser.
  useEffect(() => {
    setTheme(readStoredTheme());
    if (STORE_PRICES_PUBLISHED) setCartLines(readStoredCart());
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
      writeStoredCart(next);
      return next;
    });
  }, []);

  const addToCart = useCallback(
    (product: StoreItem, size: string) => {
      saveCart((prev) => addCartItem(prev, product, size));
      setIsCartOpen(true);
    },
    [saveCart]
  );

  const updateQuantity = useCallback(
    (key: string, delta: number) => {
      saveCart((prev) => {
        const target = prev.find((l) => l.key === key);
        if (!target) return prev;
        return updateCartItemQuantity(prev, key, target.quantity + delta, catalogById.get(target.productId));
      });
    },
    [saveCart, catalogById]
  );

  const removeItem = useCallback(
    (key: string) => saveCart((prev) => removeCartItem(prev, key)),
    [saveCart]
  );

  // Stock changes on the server; refresh what the cards and the bag show.
  const refreshCatalog = useCallback(() => {
    fetchCatalog()
      .then((items) => {
        if (items.length > 0) {
          setCatalog(items);
          setSource("server");
        }
      })
      .catch(() => undefined);
  }, []);

  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const toggleTheme = useCallback(() => {
    const next = toggleStoredTheme(theme);
    setTheme(next);
  }, [theme]);

  const isLight = theme === "light";
  const cartCount = useMemo(
    () => summarizeCart(cartLines, catalogById, source).itemCount,
    [cartLines, catalogById, source]
  );
  const value = useMemo<StorefrontValue>(
    () => ({ theme, isLight, catalog, source, addToCart: STORE_PRICES_PUBLISHED ? addToCart : null }),
    [theme, isLight, catalog, source, addToCart]
  );

  return (
    <StorefrontContext.Provider value={value}>
      <div
        data-theme={theme}
        className="min-h-screen bg-page font-sans text-ink transition-colors duration-500"
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
          />
        )}
      </div>
    </StorefrontContext.Provider>
  );
}
