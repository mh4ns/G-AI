import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "@g-ai/ui/api";
import type { StoreItem } from "../store-api";
import {
  CART_STORAGE_KEY,
  MAX_ORDER_LINES,
  MAX_QUANTITY_PER_LINE,
  addCartItem,
  buildOrderItems,
  cartKey,
  describeError,
  lineProblem,
  maxQuantityForProduct,
  parseStoredCart,
  readStoredCart,
  removeCartItem,
  summarizeCart,
  updateCartItemQuantity,
  writeStoredCart,
  type CartLine,
  type CartStorage,
} from "../store-cart";

function makeItem(overrides: Partial<StoreItem> = {}): StoreItem {
  return {
    id: "p1",
    name: "Áo len dệt kim",
    group: "apparel",
    categoryLabel: "Áo",
    badge: null,
    price: 99,
    originalPrice: null,
    rating: 4.9,
    reviews: 10,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    colorHex: "#4A2215",
    colorName: "Nâu",
    specs: [],
    description: "Mô tả",
    sizes: ["S", "M", "L"],
    stock: 10,
    ...overrides,
  };
}

describe("addCartItem & maxQuantityForProduct", () => {
  it("computes maxQuantityForProduct across null, zero, negative, fractional, and large stock", () => {
    assert.equal(maxQuantityForProduct(undefined), MAX_QUANTITY_PER_LINE);
    assert.equal(maxQuantityForProduct({ stock: null }), MAX_QUANTITY_PER_LINE);
    assert.equal(maxQuantityForProduct({ stock: 0 }), 0);
    assert.equal(maxQuantityForProduct({ stock: -3 }), 0);
    assert.equal(maxQuantityForProduct({ stock: Number.NaN }), 0);
    assert.equal(maxQuantityForProduct({ stock: 4.9 }), 4);
    assert.equal(maxQuantityForProduct({ stock: 50 }), MAX_QUANTITY_PER_LINE);
  });

  it("adds a new line, increments existing line, and clamps to min(MAX_QUANTITY_PER_LINE, stock)", () => {
    const item = makeItem({ stock: 3 });

    let lines = addCartItem([], item, "M");
    assert.deepEqual(lines, [{ key: "p1::M", productId: "p1", size: "M", quantity: 1 }]);

    lines = addCartItem(lines, item, "M", 2);
    assert.equal(lines[0].quantity, 3);

    lines = addCartItem(lines, item, "M", 5);
    assert.equal(lines[0].quantity, 3);
  });

  it("refuses to add out-of-stock products, invalid sizes, or invalid quantities", () => {
    const outOfStock = makeItem({ stock: 0 });
    assert.deepEqual(addCartItem([], outOfStock, "M"), []);

    const inStock = makeItem({ stock: 5, sizes: ["S", "M"] });
    assert.deepEqual(addCartItem([], inStock, "XL"), []);
    assert.deepEqual(addCartItem([], inStock, ""), []);
    assert.deepEqual(addCartItem([], inStock, "M", 0), []);
    assert.deepEqual(addCartItem([], inStock, "M", -1), []);
    assert.deepEqual(addCartItem([], inStock, "M", Number.NaN), []);
  });

  it("treats null stock as MAX_QUANTITY_PER_LINE", () => {
    const sampleItem = makeItem({ stock: null });
    const lines = addCartItem([], sampleItem, "S", 25);
    assert.equal(lines[0].quantity, MAX_QUANTITY_PER_LINE);
  });
});

describe("updateCartItemQuantity & removeCartItem", () => {
  it("clamps updated quantity to product.stock and MAX_QUANTITY_PER_LINE", () => {
    const item = makeItem({ stock: 4 });
    const initial: CartLine[] = [{ key: "p1::M", productId: "p1", size: "M", quantity: 2 }];

    const clampedToStock = updateCartItemQuantity(initial, "p1::M", 9, item);
    assert.equal(clampedToStock[0].quantity, 4);

    const unlimited = makeItem({ stock: 50 });
    const clampedToMax = updateCartItemQuantity(initial, "p1::M", 30, unlimited);
    assert.equal(clampedToMax[0].quantity, MAX_QUANTITY_PER_LINE);
  });

  it("removes line when quantity <= 0 or product stock is 0", () => {
    const item = makeItem({ stock: 5 });
    const initial: CartLine[] = [
      { key: "p1::M", productId: "p1", size: "M", quantity: 2 },
      { key: "p1::L", productId: "p1", size: "L", quantity: 1 },
    ];

    assert.deepEqual(updateCartItemQuantity(initial, "p1::M", 0, item), [initial[1]]);
    assert.deepEqual(updateCartItemQuantity(initial, "p1::M", -2, item), [initial[1]]);
    assert.deepEqual(updateCartItemQuantity(initial, "p1::M", 2, makeItem({ stock: 0 })), [
      initial[1],
    ]);
    assert.deepEqual(removeCartItem(initial, "p1::L"), [initial[0]]);
  });

  it("ignores non-finite quantities without mutating", () => {
    const initial: CartLine[] = [{ key: "p1::M", productId: "p1", size: "M", quantity: 2 }];
    assert.deepEqual(updateCartItemQuantity(initial, "p1::M", Number.NaN, makeItem()), initial);
    assert.deepEqual(
      updateCartItemQuantity(initial, "p1::M", Number.POSITIVE_INFINITY, makeItem()),
      initial
    );
  });
});

describe("lineProblem & summarizeCart", () => {
  it("reports specific Vietnamese problems for missing product, discontinued size, stock, and bounds", () => {
    const product = makeItem({ sizes: ["S", "M"], stock: 2 });

    assert.equal(lineProblem({ key: "p1::M", productId: "p1", size: "M", quantity: 1 }, undefined), "Sản phẩm không còn bán");
    assert.equal(lineProblem({ key: "p1::XL", productId: "p1", size: "XL", quantity: 1 }, product), "Size XL không còn");
    assert.equal(
      lineProblem({ key: "p1::M", productId: "p1", size: "M", quantity: 1 }, makeItem({ stock: 0 })),
      "Hết hàng"
    );
    assert.equal(lineProblem({ key: "p1::M", productId: "p1", size: "M", quantity: 3 }, product), "Chỉ còn 2 sản phẩm");
    assert.equal(
      lineProblem(
        { key: "p1::M", productId: "p1", size: "M", quantity: 21 },
        makeItem({ stock: 50 })
      ),
      "Tối đa 20 sản phẩm mỗi dòng"
    );
    assert.equal(lineProblem({ key: "p1::M", productId: "p1", size: "M", quantity: 2 }, product), null);
  });

  it("computes integer-cents subtotal without IEEE-754 drift and gates canCheckout on source and bounds", () => {
    const p1 = makeItem({ id: "p1", price: 19.99, stock: 10 });
    const p2 = makeItem({ id: "p2", price: 0.01, stock: 10 });
    const catalog = new Map([
      ["p1", p1],
      ["p2", p2],
    ]);
    const lines: CartLine[] = [
      { key: "p1::S", productId: "p1", size: "S", quantity: 3 },
      { key: "p2::M", productId: "p2", size: "M", quantity: 1 },
    ];

    const serverSummary = summarizeCart(lines, catalog, "server");
    assert.equal(serverSummary.subtotal, 59.98);
    assert.equal(serverSummary.rows[0].lineTotal, 59.97);
    assert.equal(serverSummary.itemCount, 4);
    assert.equal(serverSummary.hasProblems, false);
    assert.equal(serverSummary.canCheckout, true);
    assert.deepEqual(buildOrderItems(serverSummary.orderable), [
      { product_id: "p1", size: "S", quantity: 3 },
      { product_id: "p2", size: "M", quantity: 1 },
    ]);

    assert.equal(summarizeCart(lines, catalog, "sample").canCheckout, false);
    assert.equal(summarizeCart(lines, catalog, "loading").canCheckout, false);
    assert.equal(summarizeCart([], catalog, "server").canCheckout, false);
  });

  it("flags combined multi-size excess stock for the same productId and enforces MAX_ORDER_LINES", () => {
    const limited = makeItem({ id: "p1", stock: 3 });
    const catalog = new Map([["p1", limited]]);
    const lines: CartLine[] = [
      { key: "p1::S", productId: "p1", size: "S", quantity: 2 },
      { key: "p1::M", productId: "p1", size: "M", quantity: 2 },
    ];

    const summary = summarizeCart(lines, catalog, "server");
    assert.equal(summary.rows[0].problem, null);
    assert.equal(summary.rows[1].problem, "Chỉ còn 3 sản phẩm");
    assert.equal(summary.hasProblems, true);
    assert.equal(summary.canCheckout, false);

    const sizes = Array.from({ length: MAX_ORDER_LINES + 1 }, (_, i) => `S${i}`);
    const manyItem = makeItem({ id: "many", sizes, stock: null });
    const manyCatalog = new Map([["many", manyItem]]);
    const manyLines: CartLine[] = sizes.map((size) => ({
      key: cartKey("many", size),
      productId: "many",
      size,
      quantity: 1,
    }));
    const manySummary = summarizeCart(manyLines, manyCatalog, "server");
    assert.equal(manySummary.canCheckout, false);
  });
});

describe("parseStoredCart, readStoredCart & writeStoredCart", () => {
  it("drops malformed entries, NaN/Infinity/non-positive quantities, empty ids, and merges duplicate keys", () => {
    const raw = JSON.stringify([
      null,
      [],
      { productId: "", size: "M", quantity: 1 },
      { productId: "p1", size: "   ", quantity: 1 },
      { productId: "p1", size: "M", quantity: 0 },
      { productId: "p1", size: "M", quantity: -3 },
      { productId: "p1", size: "M", quantity: "2" },
      { productId: "p1", size: "M", quantity: 12.9 },
      { productId: "p1", size: "M", quantity: 15 },
      { productId: "p2", size: "S", quantity: 2 },
    ]);

    assert.deepEqual(parseStoredCart(raw), [
      { key: "p1::M", productId: "p1", size: "M", quantity: MAX_QUANTITY_PER_LINE },
      { key: "p2::S", productId: "p2", size: "S", quantity: 2 },
    ]);

    assert.deepEqual(parseStoredCart('{ "not": "array" }'), []);
    assert.deepEqual(parseStoredCart("not-json"), []);
    assert.deepEqual(parseStoredCart(null), []);
  });

  it("reads and writes through injected CartStorage and handles throwing/null storage safely", () => {
    const store = new Map<string, string>();
    const memoryStorage: CartStorage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, value);
      },
    };

    const lines: CartLine[] = [{ key: "p1::M", productId: "p1", size: "M", quantity: 2 }];
    writeStoredCart(lines, memoryStorage);
    assert.equal(store.has(CART_STORAGE_KEY), true);
    assert.deepEqual(readStoredCart(memoryStorage), lines);

    const throwingStorage: CartStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    assert.deepEqual(readStoredCart(throwingStorage), []);
    assert.doesNotThrow(() => writeStoredCart(lines, throwingStorage));
    assert.deepEqual(readStoredCart(null), []);
    assert.doesNotThrow(() => writeStoredCart(lines, null));
  });
});

describe("describeError", () => {
  it("translates ApiError statuses and validation payloads into Vietnamese UX strings", () => {
    assert.equal(
      describeError(new Error("boom")),
      "Không tạo được đơn hàng. Vui lòng thử lại."
    );
    assert.equal(
      describeError(new ApiError(0, "Network request failed")),
      "Không kết nối được máy chủ cửa hàng. Kiểm tra mạng rồi thử lại."
    );
    assert.equal(
      describeError(new ApiError(409, "Conflict")),
      "Một số sản phẩm không còn đủ hàng. Hãy giảm số lượng hoặc chọn sản phẩm khác."
    );
    assert.equal(
      describeError(new ApiError(429, "Rate limited")),
      "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút."
    );
    assert.equal(
      describeError(new ApiError(422, "Unprocessable", "Size XL is not available for p1")),
      "Có sản phẩm hoặc size không còn bán. Hãy kiểm tra lại giỏ hàng."
    );
    assert.equal(
      describeError(new ApiError(400, "Bad", "Product p1 is not available")),
      "Có sản phẩm hoặc size không còn bán. Hãy kiểm tra lại giỏ hàng."
    );
    assert.equal(
      describeError(
        new ApiError(422, "Validation", [{ loc: ["body", "customer_email"], msg: "invalid" }])
      ),
      "Email chưa hợp lệ."
    );
    assert.equal(
      describeError(
        new ApiError(422, "Validation", [{ loc: ["body", "customer_name"], msg: "too short" }])
      ),
      "Họ tên cần từ 2 đến 100 ký tự."
    );
    assert.equal(
      describeError(
        new ApiError(422, "Validation", [{ loc: ["body", "shipping_address"], msg: "too short" }])
      ),
      "Địa chỉ giao hàng cần ít nhất 5 ký tự."
    );
    assert.equal(
      describeError(new ApiError(422, "Validation", [{ loc: ["body", "items"], msg: "empty" }])),
      "Thông tin đơn hàng chưa hợp lệ."
    );
    assert.equal(
      describeError(new ApiError(502, "Bad Gateway")),
      "Máy chủ cửa hàng đang gặp sự cố. Vui lòng thử lại sau."
    );
    assert.equal(
      describeError(new ApiError(400, "Bad Request", "Custom message")),
      "Custom message"
    );
    assert.equal(
      describeError(new ApiError(418, "Teapot")),
      "Không tạo được đơn hàng (mã 418)."
    );
  });
});
