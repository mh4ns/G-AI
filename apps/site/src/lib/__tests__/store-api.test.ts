import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { OrderCreateRequest, OrderDTO, ProductDTO } from "@g-ai/shared-types";
import type { FetchLike } from "@g-ai/ui/api";
import type { StoreProduct } from "../../types/store";
import {
  API_BASE,
  ApiError,
  canOptimizeImage,
  createStoreClient,
  formatPrice,
  fromApiProduct,
  fromMockProduct,
} from "../store-api";

function makeApiProduct(overrides: Partial<ProductDTO> = {}): ProductDTO {
  return {
    id: "p1",
    name: "Áo len dệt kim",
    subtitle: "Subtitle fallback",
    category: "apparel",
    subcategory: "Áo",
    activity: "lounge",
    description: "Mô tả sản phẩm",
    discipline: "Pilates",
    material: "Cotton hữu cơ",
    price: 99,
    original_price: 120,
    discount_percent: 18,
    color_name: "Nâu",
    color_hex: "#4A2215",
    rating: 4.9,
    review_count: 128,
    badge: "Mới",
    image_front: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    image_hover: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b",
    sizes_available: ["S", "M", "L"],
    stock_quantity: 12,
    is_active: true,
    ...overrides,
  };
}

function makeMockProduct(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: "p3",
    name: "Bộ dụng cụ Pilates",
    category: "equipment",
    subcategory: "Dụng cụ Pilates",
    activity: "pilates",
    colorName: "Xanh rêu",
    colorHex: "#839B89",
    price: 129,
    originalPrice: 198,
    discountPercent: 35,
    imageFront: "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e",
    sizes: ["One Size"],
    description: "Mô tả mock",
    rating: 4.8,
    reviewsCount: 215,
    ...overrides,
  };
}

describe("fromApiProduct & fromMockProduct", () => {
  it("maps ProductDTO fields, deduplicates specs against categoryLabel, and filters empty values", () => {
    const item = fromApiProduct(
      makeApiProduct({
        category: "equipment",
        subcategory: "Pilates",
        material: "Pilates",
        discipline: "Pilates",
      })
    );

    assert.equal(item.group, "equipment");
    assert.equal(item.categoryLabel, "Pilates");
    assert.deepEqual(item.specs, []);
    assert.equal(item.originalPrice, 120);
    assert.equal(item.stock, 12);
  });

  it("drops originalPrice when null or not greater than price and defaults empty sizes", () => {
    const samePrice = fromApiProduct(
      makeApiProduct({
        original_price: 99,
        sizes_available: [],
        description: null,
      })
    );
    assert.equal(samePrice.originalPrice, null);
    assert.deepEqual(samePrice.sizes, ["One Size"]);
    assert.equal(samePrice.description, "Subtitle fallback");

    const lowerOriginal = fromApiProduct(makeApiProduct({ original_price: 80 }));
    assert.equal(lowerOriginal.originalPrice, null);
  });

  it("deduplicates repeated material/discipline values while preserving distinct specs", () => {
    const item = fromApiProduct(
      makeApiProduct({
        material: "Cao su tự nhiên",
        discipline: "Cao su tự nhiên",
      })
    );
    assert.deepEqual(item.specs, ["Cao su tự nhiên"]);
  });

  it("maps StoreProduct without repeating categoryLabel in specs and leaves stock null", () => {
    const item = fromMockProduct(makeMockProduct());
    assert.equal(item.categoryLabel, "Dụng cụ Pilates");
    assert.deepEqual(item.specs, []);
    assert.equal(item.stock, null);
    assert.equal(item.originalPrice, 198);

    const noSizes = fromMockProduct(makeMockProduct({ sizes: [], originalPrice: 129 }));
    assert.deepEqual(noSizes.sizes, ["One Size"]);
    assert.equal(noSizes.originalPrice, null);
  });
});

describe("createStoreClient", () => {
  it("fetchCatalog calls /api/v1/store/products with same-origin credentials and filters inactive rows", async () => {
    let seenUrl = "";
    let seenCredentials: RequestCredentials | undefined;

    const fakeFetch: FetchLike = async (input, init) => {
      seenUrl = String(input);
      seenCredentials = init?.credentials;
      return new Response(
        JSON.stringify([
          makeApiProduct({ id: "p1", is_active: true }),
          makeApiProduct({ id: "p2", is_active: false }),
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const client = createStoreClient({ fetch: fakeFetch });
    const items = await client.fetchCatalog();

    assert.equal(seenUrl, `${API_BASE}/store/products`);
    assert.equal(seenCredentials, "same-origin");
    assert.equal(items.length, 1);
    assert.equal(items[0].id, "p1");
  });

  it("fetchCatalog throws ApiError(500) on non-array response and propagates HTTP/network errors", async () => {
    const badShapeClient = createStoreClient({
      fetch: async () =>
        new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    });
    await assert.rejects(
      () => badShapeClient.fetchCatalog(),
      (err: unknown) => err instanceof ApiError && err.status === 500
    );

    const serverErrClient = createStoreClient({
      fetch: async () =>
        new Response(JSON.stringify({ detail: "DB down" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
    });
    await assert.rejects(
      () => serverErrClient.fetchCatalog(),
      (err: unknown) => err instanceof ApiError && err.status === 503 && err.detail === "DB down"
    );

    const networkErrClient = createStoreClient({
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });
    await assert.rejects(
      () => networkErrClient.fetchCatalog(),
      (err: unknown) => err instanceof ApiError && err.status === 0
    );
  });

  it("createOrder posts JSON payload and returns OrderDTO", async () => {
    let seenUrl = "";
    let seenMethod = "";
    let seenContentType = "";
    let seenBody = "";

    const orderDto: OrderDTO = {
      id: "ORD-ABCDEF123456",
      customer_email: "linh@example.com",
      customer_name: "Linh Nguyen",
      total_amount: 198,
      shipping_address: "123 Nguyen Hue, Q1",
      payment_status: "pending",
      order_status: "awaiting_payment",
      items: [
        {
          product_id: "p1",
          name: "Áo len dệt kim",
          size: "M",
          unit_price: 99,
          quantity: 2,
          image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
          color_name: "Nâu",
        },
      ],
      created_at: "2026-11-25T00:00:00Z",
    };

    const client = createStoreClient({
      fetch: async (input, init) => {
        seenUrl = String(input);
        seenMethod = init?.method ?? "";
        seenContentType = new Headers(init?.headers).get("Content-Type") ?? "";
        seenBody = String(init?.body ?? "");
        return new Response(JSON.stringify(orderDto), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    const payload: OrderCreateRequest = {
      customer_email: "linh@example.com",
      customer_name: "Linh Nguyen",
      shipping_address: "123 Nguyen Hue, Q1",
      items: [{ product_id: "p1", size: "M", quantity: 2 }],
    };

    const created = await client.createOrder(payload);
    assert.equal(seenUrl, `${API_BASE}/store/orders`);
    assert.equal(seenMethod, "POST");
    assert.equal(seenContentType, "application/json");
    assert.deepEqual(JSON.parse(seenBody), payload);
    assert.deepEqual(created, orderDto);
  });

  it("createOrder preserves status, detail, and Retry-After on API failures", async () => {
    const rateLimitedClient = createStoreClient({
      fetch: async () =>
        new Response(JSON.stringify({ detail: "Too many requests" }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "45" },
        }),
    });

    await assert.rejects(
      () =>
        rateLimitedClient.createOrder({
          customer_email: "linh@example.com",
          customer_name: "Linh",
          shipping_address: "123 Street",
          items: [{ product_id: "p1", size: "M", quantity: 1 }],
        }),
      (err: unknown) =>
        err instanceof ApiError &&
        err.status === 429 &&
        err.detail === "Too many requests" &&
        err.retryAfterSeconds === 45
    );
  });
});

describe("formatPrice & canOptimizeImage", () => {
  it("formats integer, decimal, rounded cents, and non-finite prices safely", () => {
    assert.equal(formatPrice(99), "$99");
    assert.equal(formatPrice(19.99), "$19.99");
    assert.equal(formatPrice(19.999), "$20");
    assert.equal(formatPrice(19.99 * 3), "$59.97");
    assert.equal(formatPrice(Number.NaN), "$0");
    assert.equal(formatPrice(Number.POSITIVE_INFINITY), "$0");
  });

  it("allows only images.unsplash.com and rejects invalid URLs", () => {
    assert.equal(canOptimizeImage("https://images.unsplash.com/photo-123"), true);
    assert.equal(canOptimizeImage("https://cdn.example.com/photo-123.jpg"), false);
    assert.equal(canOptimizeImage("not-a-valid-url"), false);
  });
});
