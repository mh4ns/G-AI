/**
 * Movement Goods store client.
 *
 * Requests go to the same-origin `/api/v1/*` path, which next.config.mjs
 * rewrites to BACKEND_URL (as in apps/web, see ADR-0001). The contract lives in
 * packages/shared-types/api/store.ts: the server owns names, prices and
 * stock; the client only picks product, size and quantity.
 */

import type { OrderCreateRequest, OrderDTO, ProductDTO } from "@g-ai/shared-types";
import { ApiError, createApiRequest, type CreateApiRequestConfig } from "@g-ai/ui/api";
import type { StoreProduct } from "@/types/store";

export { API_BASE, ApiError } from "@g-ai/ui/api";

/**
 * Prices and ordering stay hidden until the launch prices are confirmed.
 * Set NEXT_PUBLIC_STORE_PRICES=true to show prices, the bag and checkout.
 */
export const STORE_PRICES_PUBLISHED = process.env.NEXT_PUBLIC_STORE_PRICES === "true";

/** Product as the storefront renders it, from the backend or the sample catalog. */
export interface StoreItem {
  id: string;
  name: string;
  /** Display group used by the filter tabs. */
  group: "equipment" | "apparel";
  /** Category label shown on the card. */
  categoryLabel: string;
  badge: string | null;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  image: string;
  /** Product colour, shown as the card's swatch tile. */
  colorHex: string;
  colorName: string;
  specs: string[];
  description: string;
  sizes: string[];
  /** Units in stock; null when unknown (sample data). */
  stock: number | null;
}

export type CatalogSource = "server" | "sample";

export interface StoreClient {
  fetchCatalog(timeoutMs?: number): Promise<StoreItem[]>;
  createOrder(payload: OrderCreateRequest): Promise<OrderDTO>;
}

const CATEGORY_LABELS: Record<string, string> = {
  apparel: "Trang Phục",
  equipment: "Dụng cụ tập",
  device: "Thiết Bị",
  supplement: "Dinh Dưỡng",
};

function groupOf(category: string): StoreItem["group"] {
  return category.toLowerCase() === "apparel" ? "apparel" : "equipment";
}

function labelOf(category: string, subcategory?: string | null): string {
  return subcategory || CATEGORY_LABELS[category.toLowerCase()] || category;
}

export function fromApiProduct(p: ProductDTO): StoreItem {
  const categoryLabel = labelOf(p.category, p.subcategory);
  return {
    id: p.id,
    name: p.name,
    group: groupOf(p.category),
    categoryLabel,
    badge: p.badge,
    price: p.price,
    originalPrice: p.original_price != null && p.original_price > p.price ? p.original_price : null,
    rating: p.rating,
    reviews: p.review_count,
    image: p.image_front,
    colorHex: p.color_hex,
    colorName: p.color_name,
    specs: Array.from(
      new Set([p.material, p.discipline].filter((s): s is string => Boolean(s) && s !== categoryLabel))
    ),
    description: p.description || p.subtitle,
    sizes: p.sizes_available?.length ? p.sizes_available : ["One Size"],
    stock: p.stock_quantity,
  };
}

/** Maps the bundled mock catalog (same ids as the backend) for the offline fallback. */
export function fromMockProduct(p: StoreProduct): StoreItem {
  return {
    id: p.id,
    name: p.name,
    group: groupOf(p.category),
    categoryLabel: labelOf(p.category, p.subcategory),
    badge: p.badge ?? null,
    price: p.price,
    originalPrice: p.originalPrice != null && p.originalPrice > p.price ? p.originalPrice : null,
    rating: p.rating ?? 0,
    reviews: p.reviewsCount ?? 0,
    image: p.imageFront,
    colorHex: p.colorHex,
    colorName: p.colorName,
    specs: [],
    description: p.description,
    sizes: p.sizes.length ? p.sizes : ["One Size"],
    stock: null,
  };
}

/** Creates a store API client using the shared `/api/v1` transport seam. */
export function createStoreClient(config?: CreateApiRequestConfig): StoreClient {
  const request = createApiRequest({ defaultTimeoutMs: 5000, ...config });

  return {
    async fetchCatalog(timeoutMs = 5000): Promise<StoreItem[]> {
      const rows = await request<ProductDTO[]>("/store/products", { timeoutMs });
      if (!Array.isArray(rows)) {
        throw new ApiError(500, "Unexpected catalog response");
      }
      return rows.filter((r) => r.is_active).map(fromApiProduct);
    },

    async createOrder(payload: OrderCreateRequest): Promise<OrderDTO> {
      return request<OrderDTO>("/store/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}

const defaultClient = createStoreClient();
export const fetchCatalog = defaultClient.fetchCatalog;
export const createOrder = defaultClient.createOrder;

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `$${rounded}` : `$${rounded.toFixed(2)}`;
}

/** next/image can only optimise hosts listed in next.config.mjs. */
export function canOptimizeImage(url: string): boolean {
  try {
    return new URL(url).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}
