import type { OrderItemRequest } from "@g-ai/shared-types";
import { ApiError, type FastApiValidationItem } from "@g-ai/ui/api";
import type { CatalogSource, StoreItem } from "./store-api";

export const CART_STORAGE_KEY = "g_ai_cart_v2";
export const MAX_QUANTITY_PER_LINE = 20;
export const MAX_ORDER_LINES = 50;

export interface CartLine {
  /** `${productId}::${size}` so the same product in two sizes is two lines. */
  key: string;
  productId: string;
  size: string;
  quantity: number;
}

export interface CartRow {
  line: CartLine;
  item: StoreItem | undefined;
  problem: string | null;
  lineTotal: number;
}

export interface CartSummary {
  rows: CartRow[];
  orderable: CartRow[];
  subtotal: number;
  itemCount: number;
  hasProblems: boolean;
  canCheckout: boolean;
}

export type CartStorage = Pick<Storage, "getItem" | "setItem">;

function getDefaultStorage(): CartStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function cartKey(productId: string, size: string): string {
  return `${productId}::${size}`;
}

export function maxQuantityForProduct(product?: Pick<StoreItem, "stock">): number {
  if (!product || product.stock == null) return MAX_QUANTITY_PER_LINE;
  if (!Number.isFinite(product.stock) || product.stock <= 0) return 0;
  return Math.min(MAX_QUANTITY_PER_LINE, Math.floor(product.stock));
}

export function addCartItem(
  lines: readonly CartLine[],
  product: StoreItem,
  size: string,
  quantity = 1
): CartLine[] {
  if (!size || !product.sizes.includes(size) || !Number.isFinite(quantity)) {
    return [...lines];
  }

  const delta = Math.floor(quantity);
  if (delta < 1) {
    return [...lines];
  }

  const limit = maxQuantityForProduct(product);
  if (limit <= 0) {
    return [...lines];
  }

  const key = cartKey(product.id, size);
  const existing = lines.find((l) => l.key === key);
  if (existing) {
    const nextQty = Math.min(limit, existing.quantity + delta);
    return lines.map((l) => (l.key === key ? { ...l, quantity: nextQty } : l));
  }

  return [...lines, { key, productId: product.id, size, quantity: Math.min(limit, delta) }];
}

export function updateCartItemQuantity(
  lines: readonly CartLine[],
  key: string,
  quantity: number,
  product?: StoreItem
): CartLine[] {
  if (!Number.isFinite(quantity)) {
    return [...lines];
  }

  const target = Math.floor(quantity);
  if (target <= 0) {
    return lines.filter((l) => l.key !== key);
  }

  const limit = maxQuantityForProduct(product);
  if (limit <= 0) {
    return lines.filter((l) => l.key !== key);
  }

  const clamped = Math.min(limit, target);
  return lines.map((l) => (l.key === key ? { ...l, quantity: clamped } : l));
}

export function removeCartItem(lines: readonly CartLine[], key: string): CartLine[] {
  return lines.filter((l) => l.key !== key);
}

/** Why a line cannot be ordered right now, or null when it can. */
export function lineProblem(line: CartLine, product: StoreItem | undefined): string | null {
  if (!product) return "Sản phẩm không còn bán";
  if (!product.sizes.includes(line.size)) return `Size ${line.size} không còn`;
  if (product.stock === 0) return "Hết hàng";
  if (!Number.isFinite(line.quantity) || line.quantity < 1) return "Số lượng không hợp lệ";
  if (product.stock != null && line.quantity > product.stock) return `Chỉ còn ${product.stock} sản phẩm`;
  if (line.quantity > MAX_QUANTITY_PER_LINE) return `Tối đa ${MAX_QUANTITY_PER_LINE} sản phẩm mỗi dòng`;
  return null;
}

export function summarizeCart(
  lines: readonly CartLine[],
  catalog: ReadonlyMap<string, StoreItem>,
  source: CatalogSource | "loading" = "server"
): CartSummary {
  const cumulativeByProduct = new Map<string, number>();

  const rows: CartRow[] = lines.map((line) => {
    const item = catalog.get(line.productId);
    let problem = lineProblem(line, item);

    if (problem === null && item && item.stock != null) {
      const nextTotal = (cumulativeByProduct.get(line.productId) ?? 0) + line.quantity;
      cumulativeByProduct.set(line.productId, nextTotal);
      if (nextTotal > item.stock) {
        problem = `Chỉ còn ${item.stock} sản phẩm`;
      }
    }

    const lineTotal =
      item && problem === null ? (Math.round(item.price * 100) * line.quantity) / 100 : 0;

    return { line, item, problem, lineTotal };
  });

  const orderable = rows.filter((r) => r.problem === null);
  const subtotalCents = orderable.reduce(
    (sum, r) => sum + Math.round((r.item?.price ?? 0) * 100) * r.line.quantity,
    0
  );
  const subtotal = subtotalCents / 100;
  const itemCount = lines.reduce(
    (sum, l) => sum + (Number.isFinite(l.quantity) && l.quantity > 0 ? Math.floor(l.quantity) : 0),
    0
  );
  const hasProblems = rows.some((r) => r.problem !== null);
  const canCheckout =
    source === "server" &&
    orderable.length > 0 &&
    orderable.length <= MAX_ORDER_LINES &&
    !hasProblems;

  return { rows, orderable, subtotal, itemCount, hasProblems, canCheckout };
}

/** Reads a persisted cart, dropping malformed lines and merging duplicate keys. */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const byKey = new Map<string, CartLine>();
    for (const d of data) {
      if (!d || typeof d !== "object" || Array.isArray(d)) continue;
      const { productId, size, quantity } = d as Record<string, unknown>;
      if (
        typeof productId !== "string" ||
        productId.trim().length === 0 ||
        typeof size !== "string" ||
        size.trim().length === 0 ||
        typeof quantity !== "number" ||
        !Number.isFinite(quantity)
      ) {
        continue;
      }
      const floored = Math.floor(quantity);
      if (floored < 1) continue;
      const key = cartKey(productId, size);
      const existing = byKey.get(key);
      const merged = Math.min(MAX_QUANTITY_PER_LINE, (existing?.quantity ?? 0) + floored);
      byKey.set(key, { key, productId, size, quantity: merged });
    }
    return Array.from(byKey.values());
  } catch {
    return [];
  }
}

export function readStoredCart(storage?: CartStorage | null): CartLine[] {
  const target = storage !== undefined ? storage : getDefaultStorage();
  if (!target) return [];
  try {
    return parseStoredCart(target.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeStoredCart(lines: readonly CartLine[], storage?: CartStorage | null): void {
  const target = storage !== undefined ? storage : getDefaultStorage();
  if (!target) return;
  try {
    target.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage can be unavailable (quota exceeded or private mode).
  }
}

export function buildOrderItems(orderable: readonly CartRow[]): OrderItemRequest[] {
  return orderable.map(({ line }) => ({
    product_id: line.productId,
    size: line.size,
    quantity: line.quantity,
  }));
}

/** Turns API errors (network, HTTP status, FastAPI detail) into one Vietnamese sentence. */
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Không tạo được đơn hàng. Vui lòng thử lại.";
  }

  if (error.status === 0) {
    return "Không kết nối được máy chủ cửa hàng. Kiểm tra mạng rồi thử lại.";
  }

  if (error.status === 409) {
    return "Một số sản phẩm không còn đủ hàng. Hãy giảm số lượng hoặc chọn sản phẩm khác.";
  }

  if (error.status === 429) {
    return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  }

  const { detail } = error;
  if (typeof detail === "string") {
    // 422 with a plain message = unknown product or size (see store.ts contract).
    if (error.status === 422 || /not available/i.test(detail)) {
      return "Có sản phẩm hoặc size không còn bán. Hãy kiểm tra lại giỏ hàng.";
    }
    if (error.status >= 500) {
      return "Máy chủ cửa hàng đang gặp sự cố. Vui lòng thử lại sau.";
    }
    return detail.trim() || `Không tạo được đơn hàng (mã ${error.status}).`;
  }

  if (Array.isArray(detail)) {
    const fields = detail
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const entry = item as FastApiValidationItem;
        return Array.isArray(entry.loc) && entry.loc.length > 0
          ? String(entry.loc[entry.loc.length - 1])
          : "";
      })
      .filter(Boolean);

    if (fields.includes("customer_email")) return "Email chưa hợp lệ.";
    if (fields.includes("customer_name")) return "Họ tên cần từ 2 đến 100 ký tự.";
    if (fields.includes("shipping_address")) return "Địa chỉ giao hàng cần ít nhất 5 ký tự.";
    return "Thông tin đơn hàng chưa hợp lệ.";
  }

  if (error.status >= 500) {
    return "Máy chủ cửa hàng đang gặp sự cố. Vui lòng thử lại sau.";
  }

  return `Không tạo được đơn hàng (mã ${error.status}).`;
}
