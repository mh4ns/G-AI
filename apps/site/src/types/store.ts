export interface StoreProduct {
  id: string;
  name: string;
  category: "apparel" | "equipment" | "device" | "supplement";
  subcategory?: string;
  activity: "pilates" | "gym" | "running" | "lounge" | "yoga";
  colorName: string;
  colorHex: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  badge?: "Mới";
  imageFront: string;
  imageBack?: string;
  sizes: string[];
  description: string;
  rating?: number;
  reviewsCount?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  colorName: string;
  size: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
}
