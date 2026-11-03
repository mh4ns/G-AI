"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Compass } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  category: "Nữ • Pilates & Sculpt" | "Nam • Strength & Calisthenics";
  gender: "female" | "male";
  targetMuscle: string;
  image: string;
  spanClass: string;
  correctionTip: string;
}

export const DualAthleteGallery: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "female" | "male">("all");

  const galleryItems: GalleryItem[] = [
    {
      id: "f1",
      title: "Reformer Carriage Long Stretch",
      category: "Nữ • Pilates & Sculpt",
      gender: "female",
      targetMuscle: "Vùng Bụng Sâu & Vai",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-2 md:row-span-2",
      correctionTip: "Giữ xương chậu trung tính, không để võng thắt lưng khi đẩy cáp.",
    },
    {
      id: "m1",
      title: "Tactical Weighted Pull-Up",
      category: "Nam • Strength & Calisthenics",
      gender: "male",
      targetMuscle: "Lưng Xô & Khớp Bả Vai",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-1 md:row-span-1",
      correctionTip: "Hạ bả vai trước khi kéo để kích hoạt tối đa nhóm cơ xô (Lats).",
    },
    {
      id: "f2",
      title: "Pelvic Bridge & Glute Alignment",
      category: "Nữ • Pilates & Sculpt",
      gender: "female",
      targetMuscle: "Cơ Mông & Đùi Sau",
      image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-1 md:row-span-1",
      correctionTip: "Cuộn từng đốt sống rời sàn, thở ra ở điểm siết cao nhất.",
    },
    {
      id: "m2",
      title: "Biomechanical Barbell Back Squat",
      category: "Nam • Strength & Calisthenics",
      gender: "male",
      targetMuscle: "Tứ Đầu Đùi & Khung Chậu",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-1 md:row-span-2",
      correctionTip: "AI Live PT kiểm soát góc gối 90° song song sàn, ấn lực qua gót chân.",
    },
    {
      id: "f3",
      title: "Isometric Wall Alignment & Spine Lengthening",
      category: "Nữ • Pilates & Sculpt",
      gender: "female",
      targetMuscle: "Cột Sống Cổ & Thắt Lưng",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-1 md:row-span-1",
      correctionTip: "Kéo dài đỉnh đầu lên trần nhà, giải tỏa áp lực đĩa đệm lưng.",
    },
    {
      id: "m3",
      title: "Explosive Kettlebell Clean & Press",
      category: "Nam • Strength & Calisthenics",
      gender: "male",
      targetMuscle: "Toàn Thân & Chuỗi Cơ Sau",
      image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-1 md:row-span-1",
      correctionTip: "Phát lực dứt khoát từ hông, gồng chặt cơ bụng khi tạ lên đỉnh.",
    },
  ];

  const filtered = filter === "all" ? galleryItems : galleryItems.filter((i) => i.gender === filter);

  return (
    <section className="py-16 sm:py-24 bg-[#0A0908] text-white border-t border-stone-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-stone-800 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pinterest Curated Aesthetic</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Vẻ Đẹp Vận Động & Tư Thế Chuẩn
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-xl">
              Nguồn cảm hứng thị giác thể thao kết hợp khoa học cơ sinh học cho cả nam và nữ. Mỗi động tác đều có sự đồng hành hướng dẫn của trợ lý AI.
            </p>
          </div>

          {/* Gallery Category Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-stone-800 self-start md:self-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                filter === "all" ? "bg-white text-stone-900" : "text-stone-400 hover:text-white"
              }`}
            >
              Tất Cả (All)
            </button>
            <button
              onClick={() => setFilter("female")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                filter === "female" ? "bg-[#FF5A36] text-white" : "text-stone-400 hover:text-white"
              }`}
            >
              Nữ (Pilates)
            </button>
            <button
              onClick={() => setFilter("male")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                filter === "male" ? "bg-[#10B981] text-white" : "text-stone-400 hover:text-white"
              }`}
            >
              Nam (Strength)
            </button>
          </div>
        </div>

        {/* Masonry Asymmetrical Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 auto-rows-[280px]">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`group relative rounded-3xl overflow-hidden border border-stone-800/80 bg-stone-950 transition-all duration-500 hover:border-stone-600 ${item.spanClass}`}
            >
              {/* Background Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover object-center filter brightness-[0.85] contrast-[1.05] transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              {/* Dark Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0908] via-[#0A0908]/30 to-transparent opacity-90 transition-opacity group-hover:opacity-75" />

              {/* Top Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-700 text-stone-300">
                  {item.category}
                </span>
                <span className="text-[10px] font-mono text-stone-400 px-2 py-0.5 rounded bg-black/40">
                  {item.targetMuscle}
                </span>
              </div>

              {/* Bottom Content Card */}
              <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#FF5A36] transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </h3>
                <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                  {item.correctionTip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
