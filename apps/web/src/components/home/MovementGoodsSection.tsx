"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, ShoppingBag, Check, Star, ArrowUpRight, ShieldCheck } from "lucide-react";

interface MovementGoodsSectionProps {
  isLight?: boolean;
}

interface CuratedProduct {
  id: string;
  name: string;
  category: "Dụng Cụ Studio" | "Trang Phục Định Hình";
  badge: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  specs: string[];
  description: string;
}

const CURATED_GOODS: CuratedProduct[] = [
  {
    id: "g1",
    name: "Pilates Essential Alignment Kit",
    category: "Dụng Cụ Studio",
    badge: "Bestseller",
    price: 129,
    originalPrice: 198,
    rating: 4.9,
    reviews: 215,
    image: "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=800&q=80",
    specs: ["Thảm định tuyến 8mm", "Vòng kháng lực đa sợi", "Bóng mini chống nổ"],
    description: "Bộ dụng cụ hoàn chỉnh cho lộ trình 28 ngày tại nhà, tối ưu hóa góc tiếp đất và định vị trục cột sống chuẩn AI.",
  },
  {
    id: "g2",
    name: "Full-Length Sculpt Landmark Catsuit",
    category: "Trang Phục Định Hình",
    badge: "AI Vision Ready",
    price: 109,
    originalPrice: 145,
    rating: 5.0,
    reviews: 342,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    specs: ["Dải tương phản nhận diện khớp", "Nén 4 chiều", "Vải kháng khuẩn siêu nhẹ"],
    description: "Thiết kế với các đường sọc tương phản tại khớp gối và đốt sống lưng, tăng độ nhận diện của camera AI lên 38%.",
  },
  {
    id: "g3",
    name: "Biomechanical Home Reformer Slider",
    category: "Dụng Cụ Studio",
    badge: "Công Nghệ Mới",
    price: 119,
    originalPrice: 189,
    rating: 4.9,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=800&q=80",
    specs: ["Gấp gọn gầm giường", "Trợ lực lò xo kép", "Bánh xe chịu tải 150kg"],
    description: "Mô phỏng cơ chế giường tập Reformer studio, kích hoạt chuỗi cơ sau và siết chặt nhóm cơ lõi sâu an toàn.",
  },
  {
    id: "g4",
    name: "Aesthetic Ergonomic Wrist & Ankle Bands",
    category: "Dụng Cụ Studio",
    badge: "1.0kg / Đôi",
    price: 49,
    originalPrice: 65,
    rating: 4.8,
    reviews: 310,
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
    specs: ["Silicon y tế kháng nước", "Khóa dán micro-velcro", "Phân bổ trọng lượng đều"],
    description: "Tạ đeo cổ tay và cổ chân công thái học, gia tăng mức tiêu hao calo khi thực hiện các bài giãn cơ và cardio.",
  },
  {
    id: "g5",
    name: "Toning Resistance Ring & Stability Ball",
    category: "Dụng Cụ Studio",
    badge: "Siết Cơ Sâu",
    price: 69,
    originalPrice: 89,
    rating: 4.8,
    reviews: 92,
    image: "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=800&q=80",
    specs: ["Khung sợi thủy tinh dẻo", "Đệm mút chống trượt", "Đường kính 38cm"],
    description: "Chuyên dụng cho các bài tập cô lập nhóm cơ đùi trong, sàn chậu và cơ thẳng bụng dưới.",
  },
  {
    id: "g6",
    name: "Thermal Ribbed Recovery Cropped Knit",
    category: "Trang Phục Định Hình",
    badge: "Edition 01",
    price: 99,
    originalPrice: 120,
    rating: 4.9,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    specs: ["Len dệt tăm thoáng khí", "Giữ nhiệt sau tập", "Đường may phẳng không cọ xát"],
    description: "Giữ ấm nhóm cơ vai cổ và thân trên sau các buổi tập cường độ cao, ngăn ngừa căng cơ và hỗ trợ phục hồi.",
  },
];

export const MovementGoodsSection: React.FC<MovementGoodsSectionProps> = ({ isLight = false }) => {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "Dụng Cụ Studio" | "Trang Phục Định Hình">("all");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const filteredGoods = selectedFilter === "all" 
    ? CURATED_GOODS 
    : CURATED_GOODS.filter((p) => p.category === selectedFilter);

  const handleQuickAdd = (productId: string) => {
    setAddedProductId(productId);
    setTimeout(() => {
      setAddedProductId(null);
    }, 2200);
  };

  return (
    <section
      id="movement-goods"
      className={`py-20 sm:py-28 border-t select-none transition-colors duration-500 scroll-mt-20 ${
        isLight
          ? "bg-[#FAF8F5] border-stone-200 text-stone-900"
          : "bg-[#090807] border-stone-800 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
              isLight
                ? "bg-stone-200/80 text-stone-700 border border-stone-300"
                : "bg-stone-900 border border-stone-800 text-stone-300"
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>MOVEMENT GOODS • CALIBRATED EQUIPMENT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Dụng Cụ & Trang Phục Cơ Sinh Học
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-stone-600" : "text-stone-400"
            }`}>
              Tuyển tập dụng cụ chuyên biệt hỗ trợ lộ trình 28 ngày tại nhà. Được tinh chỉnh để hỗ trợ phát hiện điểm khớp camera AI và kích hoạt sâu nhóm cơ mục tiêu.
            </p>
          </div>

          {/* Minimalist Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-stone-500/10 border border-stone-500/20 text-xs font-mono">
            {(
              [
                { id: "all", label: "Tất Cả" },
                { id: "Dụng Cụ Studio", label: "Dụng Cụ Studio" },
                { id: "Trang Phục Định Hình", label: "Trang Phục" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  selectedFilter === tab.id
                    ? isLight
                      ? "bg-stone-900 text-white shadow-sm font-bold"
                      : "bg-white text-stone-900 shadow-sm font-bold"
                    : isLight
                    ? "text-stone-600 hover:text-stone-900"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6-Item Curated Editorial Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredGoods.map((product) => {
            const isAdded = addedProductId === product.id;

            return (
              <div
                key={product.id}
                className={`group relative rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                  isLight
                    ? "bg-white border-stone-200/90 shadow-sm hover:shadow-xl hover:border-stone-300"
                    : "bg-[#11100F] border-stone-800/80 hover:border-stone-700 hover:shadow-2xl hover:shadow-black/50"
                }`}
              >
                {/* Image Container with Hover Scale */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900/40">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/75 text-white backdrop-blur-md border border-white/10">
                      {product.badge}
                    </span>
                  </div>

                  {/* Category Pill Right */}
                  <div className="absolute top-3.5 right-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium backdrop-blur-md ${
                      isLight
                        ? "bg-white/90 text-stone-800 border border-stone-200"
                        : "bg-stone-900/90 text-stone-300 border border-stone-700"
                    }`}>
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Star Rating & Reviews */}
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-mono">
                      <div className="flex items-center">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                      </div>
                      <span className="font-bold text-stone-700 dark:text-stone-300">
                        {product.rating}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        ({product.reviews} đánh giá)
                      </span>
                    </div>

                    <h3 className={`text-base sm:text-lg font-bold tracking-tight leading-snug group-hover:text-[#FF5A36] transition-colors ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}>
                      {product.name}
                    </h3>

                    <p className={`text-xs line-clamp-2 leading-relaxed ${
                      isLight ? "text-stone-500" : "text-stone-400"
                    }`}>
                      {product.description}
                    </p>
                  </div>

                  {/* Specs Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {product.specs.map((spec, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                          isLight
                            ? "bg-stone-100 border-stone-200 text-stone-600"
                            : "bg-stone-900 border-stone-800 text-stone-400"
                        }`}
                      >
                        • {spec}
                      </span>
                    ))}
                  </div>

                  {/* Price & Action Bottom Row */}
                  <div className={`pt-4 border-t flex items-center justify-between ${
                    isLight ? "border-stone-100" : "border-stone-800/70"
                  }`}>
                    <div>
                      <span className="text-xs font-mono text-stone-400">Giá ưu đãi</span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                          isLight ? "text-stone-900" : "text-white"
                        }`}>
                          ${product.price}
                        </span>
                        <span className="text-xs font-mono text-stone-400 line-through">
                          ${product.originalPrice}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuickAdd(product.id)}
                      className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : isLight
                          ? "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
                          : "bg-white text-stone-950 hover:bg-stone-200 shadow-sm"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã Thêm</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Đặt Hàng</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Trust Guarantee Strip */}
        <div className={`mt-12 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-around gap-4 text-xs font-mono ${
          isLight
            ? "bg-stone-100/70 border-stone-200 text-stone-600"
            : "bg-stone-900/50 border-stone-800 text-stone-400"
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Bảo hành chính hãng 12 tháng</span>
          </div>
          <div className="hidden sm:block text-stone-300 dark:text-stone-700">•</div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF5A36]" />
            <span>Tương thích 100% bài tập trong Khảo sát 28 ngày</span>
          </div>
          <div className="hidden sm:block text-stone-300 dark:text-stone-700">•</div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-sky-500" />
            <span>Đổi trả miễn phí 30 ngày nếu không vừa vặn</span>
          </div>
        </div>
      </div>
    </section>
  );
};
