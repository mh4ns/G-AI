"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SlidingTabs, type SlidingTabOption } from "@g-ai/ui";
import { SECTION_HEADING } from "@/components/home/styles";

type GalleryFilter = "all" | "female" | "male";

interface GalleryItem {
  id: string;
  title: string;
  category: "Pilates & cơ lõi" | "Sức mạnh";
  gender: "female" | "male";
  targetMuscle: string;
  image: string;
  alt: string;
  spanClass: string;
  correctionTip: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "f1",
    title: "Long Stretch trên máy Reformer",
    category: "Pilates & cơ lõi",
    gender: "female",
    targetMuscle: "Vùng bụng sâu & vai",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    alt: "Người tập Pilates trên thảm, giữ lưng thẳng",
    spanClass: "md:col-span-2 md:row-span-2",
    correctionTip: "Giữ xương chậu trung tính, không để võng thắt lưng khi đẩy.",
  },
  {
    id: "m1",
    title: "Pull-Up có tạ",
    category: "Sức mạnh",
    gender: "male",
    targetMuscle: "Lưng xô & khớp bả vai",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    alt: "Người tập sức mạnh với tạ trong phòng tập",
    spanClass: "md:col-span-1 md:row-span-1",
    correctionTip: "Hạ bả vai trước khi kéo để dùng đúng nhóm cơ xô.",
  },
  {
    id: "f2",
    title: "Glute Bridge",
    category: "Pilates & cơ lõi",
    gender: "female",
    targetMuscle: "Cơ mông & đùi sau",
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
    alt: "Bài tập nâng hông trên thảm",
    spanClass: "md:col-span-1 md:row-span-1",
    correctionTip: "Cuộn từng đốt sống rời sàn, thở ra ở điểm siết cao nhất.",
  },
  {
    id: "m2",
    title: "Back Squat với thanh đòn",
    category: "Sức mạnh",
    gender: "male",
    targetMuscle: "Tứ đầu đùi & khung chậu",
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
    alt: "Người tập squat với thanh đòn",
    spanClass: "md:col-span-1 md:row-span-2",
    correctionTip: "Hạ đến khi đùi song song sàn, ấn lực qua gót chân.",
  },
  {
    id: "f3",
    title: "Đứng áp tường, kéo dài cột sống",
    category: "Pilates & cơ lõi",
    gender: "female",
    targetMuscle: "Cột sống cổ & thắt lưng",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    alt: "Người tập đứng thẳng, kéo dài cột sống",
    spanClass: "md:col-span-1 md:row-span-1",
    correctionTip: "Kéo dài đỉnh đầu lên trần nhà, giữ lưng áp sát tường.",
  },
  {
    id: "m3",
    title: "Kettlebell Clean & Press",
    category: "Sức mạnh",
    gender: "male",
    targetMuscle: "Toàn thân & chuỗi cơ sau",
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
    alt: "Người tập với tạ ấm, chuẩn bị đẩy lên",
    spanClass: "md:col-span-1 md:row-span-1",
    correctionTip: "Phát lực dứt khoát từ hông, gồng chặt cơ bụng khi tạ lên đỉnh.",
  },
];

const FILTERS: readonly SlidingTabOption<GalleryFilter>[] = [
  { value: "all", label: "Tất cả" },
  { value: "female", label: "Pilates & cơ lõi" },
  { value: "male", label: "Sức mạnh" },
];

export const DualAthleteGallery: React.FC = () => {
  const [filter, setFilter] = useState<GalleryFilter>("all");

  const filtered = filter === "all" ? GALLERY_ITEMS : GALLERY_ITEMS.filter((i) => i.gender === filter);

  return (
    <section className="border-t border-line bg-page py-16 text-ink transition-colors duration-500 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className={SECTION_HEADING}>Hai chương trình, tập ngay tại nhà</h2>
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-ink-muted">
              Pilates cho cơ lõi và tư thế, sức mạnh cho chuỗi cơ sau. Mỗi bài có hướng dẫn và AI theo dõi form qua
              camera.
            </p>
          </div>

          <SlidingTabs
            ariaLabel="Lọc động tác theo chương trình"
            options={FILTERS}
            value={filter}
            onChange={setFilter}
            size="lg"
            className="self-start overflow-x-auto md:self-auto"
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
                alt={item.alt}
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
