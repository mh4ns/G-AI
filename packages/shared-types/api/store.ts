/**
 * Backend store & auth API contract (`/api/v1`), snake_case as sent on the wire.
 * Generated schema: ../openapi/backend-v1.json (`python -m app.export_openapi` in apps/backend).
 * Keep in sync with apps/backend/app/schemas/{store,user}.py.
 */

export type ProductCategory = 'apparel' | 'equipment' | 'device' | 'supplement';
export type ProductActivity = 'pilates' | 'gym' | 'running' | 'lounge' | 'yoga';

/** GET /store/products[?category=&activity=], GET /store/products/{id} */
export interface ProductDTO {
  id: string; // "p1".."p8"
  name: string;
  subtitle: string;
  category: ProductCategory;
  subcategory: string | null;
  activity: ProductActivity | null;
  description: string | null;
  discipline: string;
  material: string;
  price: number;
  original_price: number | null;
  /** Server-computed: round((1 - price / original_price) * 100), null when not discounted. */
  discount_percent: number | null;
  color_name: string;
  color_hex: string;
  rating: number;
  review_count: number;
  badge: string | null;
  image_front: string;
  /** The website's `imageBack`. */
  image_hover: string;
  sizes_available: string[];
  stock_quantity: number;
  is_active: boolean;
}

/** POST /store/orders body. Prices, names and images are always taken from the catalog. */
export interface OrderCreateRequest {
  customer_email: string;
  customer_name: string; // 2..100 chars
  shipping_address: string; // 5..500 chars
  items: Array<{ product_id: string; size: string; quantity: number /* 1..20 */ }>; // 1..50 lines
}

export interface OrderLineItemDTO {
  product_id: string;
  name: string;
  size: string;
  unit_price: number;
  quantity: number;
  image: string;
  color_name: string | null;
}

/** POST /store/orders (201) and GET /store/orders/me (array, newest first, requires sign-in). */
export interface OrderDTO {
  id: string; // "ORD-XXXXXXXXXXXX"
  customer_email: string;
  customer_name: string;
  total_amount: number;
  shipping_address: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  order_status: 'awaiting_payment' | 'processing' | 'shipped' | 'delivered';
  items: OrderLineItemDTO[];
  created_at: string; // ISO 8601
}

export interface UserDTO {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

/** POST /auth/register (201), /auth/login, /auth/password. The session itself is an httpOnly cookie. */
export interface SessionDTO {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: UserDTO;
}

/** POST /auth/password body. Success revokes every other session and returns a fresh one. */
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string; // 8..128 chars
}
