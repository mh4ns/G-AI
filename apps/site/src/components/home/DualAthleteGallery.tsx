"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SECTION_HEADING, SegmentedControl } from "@/components/home/SegmentedControl";

type GalleryFilter = "all" | "female" | "male";

interface GalleryItem {
  id: string;
  title: string;
  category: "Nữ · Pilates & Sculpt" | "Nam · Strength & Calisthenics";
  gender: "female" | "male";
  targetMuscle: string;
  image: string;
  spanClass: string;
  correctionTip: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "f1",
    title: "Reformer Carriage Long Stretch",
    category: "Nữ · Pilates & Sculpt",
    gender: "female",
    targetMuscle: "Vùng bụng sâu & vai",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    spanClass: "md:col-span-2 md:row-span-2",
    correctionTip: "Giữ xương chậu trung tính, không để võng thắt lưng khi đẩy cáp.",
  },
  {
    id: "m1",
    title: "Tactical Weighted Pull-Up",
    category: "Nam · Strength & Calisthenics",
    gender: "male",
    targetMuscle: "Lưng xô & khớp bả vai",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    spanClass: "md:col-span-1 md:row-span-1",
    correctionTip: "Hạ bả vai trước khi kéo để kích hoạt tối đa nhóm cơ xô (Lats).",
  },
  {
    id: "f2",
    title: "Pelvic Bridge & Glute Alignment",
    category: "Nữ · Pilates & Sculpt",
    gender: "female",
    targetMuscle: "Cơ mông & đùi sau",
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
    spanClass: "md:col-span-1 md:row-span-1",
    correctionTip: "Cuộn từng đốt sống rời sàn, thở ra ở điểm siết cao nhất.",
  },
  {
    id: "m2",
    title: "Biomechanical Barbell Back Squat",
    category: "Nam · Strength & Calisthenics",
    gender: "male",
    targetMuscle: "Tứ đầu đùi & khung chậu",
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
    spanClass: "md:col-span-1 md:row-span-2",
    correctionTip: "AI Live PT kiểm soát góc gối 90° song song sàn, ấn lực qua gót chân.",
  },
  {
    id: "f3",
    title: "Isometric Wall Alignment & Spine Lengthening",
    category: "Nữ · Pilates & Sculpt",
    gender: "female",
    targetMuscle: "Cột sống cổ & thắt lưng",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    spanClass: "md:col-span-1 md:row-span-1",
    correctionTip: "Kéo dài đỉnh đầu lên trần nhà, giải tỏa áp lực đĩa đệm lưng.",
  },
  {
    id: "m3",
    title: "Explosive Kettlebell Clean & Press",
    category: "Nam · Strength & Calisthenics",
    gender: "male",
    targetMuscle: "Toàn thân & chuỗi cơ sau",
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
    spanClass: "md:col-span-1 md:row-span-1",
    correctionTip: "Phát lực dứt khoát từ hông, gồng chặt cơ bụng khi tạ lên đỉnh.",
  },
];

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "female", label: "Nữ · Pilates" },
  { id: "male", label: "Nam · Strength" },
] as const;

export const DualAthleteGallery: React.FC = () => {
  const [filter, setFilter] = useState<GalleryFilter>("all");

  const filtered = filter === "all" ? GALLERY_ITEMS : GALLERY_ITEMS.filter((i) => i.gender === filter);

  return (
    <section className="border-t border-line bg-page py-16 text-ink transition-colors duration-500 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className={SECTION_HEADING}>Vẻ đẹp vận động &amp; tư thế chuẩn</h2>
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-ink-muted">
              Nguồn cảm hứng thị giác thể thao kết hợp khoa học cơ sinh học cho cả nam và nữ. Mỗi động tác đều có
              sự đồng hành hướng dẫn của trợ lý AI.
            </p>
          </div>

          <SegmentedControl
            label="Lọc động tác theo chương trình"
            options={FILTERS}
            value={filter}
            onChange={setFilter}
            className="self-start md:self-auto"
          />
        </div>

        <div className="grid auto-rows-[280px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className={`group relative overflow-hidden rounded-3xl bg-sunken ${item.spanClass}`}
            >
              <Image
                src={item.image}
                alt=""
                fill
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              />

              {/* Scrim: the caption is always white on the photograph, in both themes */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                {item.category}
              </span>

              <div className="absolute inset-x-5 bottom-5 text-white">
                <h3 className="text-lg font-semibold leading-snug">{item.title}</h3>
                <p className="mt-0.5 text-sm text-white/80">{item.targetMuscle}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/90">{item.correctionTip}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
