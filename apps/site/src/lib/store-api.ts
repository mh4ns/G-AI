/**
 * Movement Goods store client.
 *
 * Requests go to the same-origin `/api/v1/*` path, which next.config.mjs
 * rewrites to BACKEND_URL (as in apps/web, see ADR-0001). The contract lives in
 * packages/shared-types/api/store.ts: the server owns names, prices and
 * stock; the client only picks product, size and quantity.
 */

import type { StoreProduct } from "@/types/store";

export const API_BASE = "/api/v1";

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

export interface CartLine {
  /** `${productId}::${size}` so the same product in two sizes is two lines. */
  key: string;
  productId: string;
  size: string;
  quantity: number;
}

/**
 * GET /store/products row. Mirrors packages/shared-types/api/store.ts
 * (ProductDTO); ids match src/data/mockStoreData.ts ("p1".."p8").
 */
export interface ApiProduct {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  subcategory: string | null;
  activity: string | null;
  description: string | null;
  discipline: string;
  material: string;
  price: number;
  original_price: number | null;
  discount_percent?: number | null;
  color_name: string;
  color_hex: string;
  rating: number;
  review_count: number;
  badge: string | null;
  image_front: string;
  image_hover: string;
  sizes_available: string[];
  stock_quantity: number;
  is_active: boolean;
}

export interface OrderRequest {
  customer_email: string;
  customer_name: string;
  shipping_address: string;
  items: { product_id: string; size: string; quantity: number }[];
}

export interface OrderResponse {
  id: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  shipping_address: string;
  payment_status: string;
  order_status: string;
  items: {
    product_id: string;
    name: string;
    size: string;
    unit_price: number;
    quantity: number;
    image: string;
    color_name: string | null;
  }[];
  created_at: string;
}

export class StoreApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "StoreApiError";
  }
}

export const MAX_QUANTITY_PER_LINE = 20;

export function cartKey(productId: string, size: string): string {
  return `${productId}::${size}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  apparel: "Trang Phục",
  equipment: "Dụng Cụ Studio",
  device: "Thiết Bị",
  supplement: "Dinh Dưỡng",
};

function groupOf(category: string): StoreItem["group"] {
  return category.toLowerCase() === "apparel" ? "apparel" : "equipment";
}

function labelOf(category: string, subcategory?: string | null): string {
  return subcategory || CATEGORY_LABELS[category.toLowerCase()] || category;
}

export function fromApiProduct(p: ApiProduct): StoreItem {
  return {
    id: p.id,
    name: p.name,
    group: groupOf(p.category),
    categoryLabel: labelOf(p.category, p.subcategory),
    badge: p.badge,
    price: p.price,
    originalPrice: p.original_price != null && p.original_price > p.price ? p.original_price : null,
    rating: p.rating,
    reviews: p.review_count,
    image: p.image_front,
    colorHex: p.color_hex,
    colorName: p.color_name,
    specs: [p.material, p.discipline].filter(Boolean),
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
    specs: [p.subcategory ?? ""].filter(Boolean),
    description: p.description,
    sizes: p.sizes.length ? p.sizes : ["One Size"],
    stock: null,
  };
}

/** Loads the live catalog. Throws when the backend is unreachable or returns nothing usable. */
export async function fetchCatalog(timeoutMs = 5000): Promise<StoreItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/store/products`, { signal: controller.signal, credentials: "same-origin" });
    if (!res.ok) throw new StoreApiError(res.status, `Catalog request failed (${res.status})`);
    const rows = (await res.json()) as ApiProduct[];
    if (!Array.isArray(rows)) throw new StoreApiError(500, "Unexpected catalog response");
    return rows.filter((r) => r.is_active).map(fromApiProduct);
  } finally {
    clearTimeout(timer);
  }
}

/** Turns FastAPI error bodies (string or validation list) into one Vietnamese sentence. */
function describeError(status: number, detail: unknown): string {
  if (status === 409) return "Một số sản phẩm không còn đủ hàng. Hãy giảm số lượng hoặc chọn sản phẩm khác.";
  if (typeof detail === "string") {
    // 422 with a plain message = unknown product or size (see store.ts contract).
    if (status === 422 || /not available/i.test(detail)) {
      return "Có sản phẩm hoặc size không còn bán. Hãy kiểm tra lại giỏ hàng.";
    }
    if (status === 429) return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
    return status >= 500 ? "Máy chủ cửa hàng đang gặp sự cố. Vui lòng thử lại sau." : detail;
  }
  if (Array.isArray(detail)) {
    const fields = detail
      .map((d) => (Array.isArray(d?.loc) ? String(d.loc[d.loc.length - 1]) : ""))
      .filter(Boolean);
    if (fields.includes("customer_email")) return "Email chưa hợp lệ.";
    if (fields.includes("customer_name")) return "Họ tên cần từ 2 đến 100 ký tự.";
    if (fields.includes("shipping_address")) return "Địa chỉ giao hàng cần ít nhất 5 ký tự.";
    return "Thông tin đơn hàng chưa hợp lệ.";
  }
  if (status >= 500) return "Máy chủ cửa hàng đang gặp sự cố. Vui lòng thử lại sau.";
  return `Không tạo được đơn hàng (mã ${status}).`;
}

export async function createOrder(payload: OrderRequest): Promise<OrderResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/store/orders`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new StoreApiError(0, "Không kết nối được máy chủ cửa hàng. Kiểm tra mạng rồi thử lại.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new StoreApiError(res.status, describeError(res.status, body?.detail));
  return body as OrderResponse;
}

export function formatPrice(value: number): string {
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
}

/** next/image can only optimise hosts listed in next.config.mjs. */
export function canOptimizeImage(url: string): boolean {
  try {
    return new URL(url).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

/** Reads a persisted cart, dropping anything that is not a well-formed line. */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const lines: CartLine[] = [];
    for (const d of data) {
      if (!d || typeof d !== "object") continue;
      const { productId, size, quantity } = d as Record<string, unknown>;
      if (typeof productId !== "string" || typeof size !== "string" || typeof quantity !== "number") continue;
      const q = Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, Math.floor(quantity)));
      lines.push({ key: cartKey(productId, size), productId, size, quantity: q });
    }
    return lines;
  } catch {
    return [];
  }
}
