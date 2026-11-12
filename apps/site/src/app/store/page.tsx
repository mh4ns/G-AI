"use client";

import { MovementGoodsSection } from "@/components/home/MovementGoodsSection";
import { Storefront } from "@/components/store/Storefront";

export default function StorePage() {
  return (
    <Storefront>
      <main>
        <MovementGoodsSection mode="full" />
      </main>
    </Storefront>
  );
}
