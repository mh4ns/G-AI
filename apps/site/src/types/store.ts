import type { ProductActivity, ProductCategory } from "@g-ai/shared-types";

export interface StoreProduct {
  id: string;
  name: string;
  category: ProductCategory;
  subcategory?: string;
  activity: ProductActivity;
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
