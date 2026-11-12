"use client";

import React from "react";
import Image from "next/image";

// Stand-in photographs (Unsplash) until G-AI has its own shoot; every one is
// listed in docs/brand/stand-in-photos.md so it can be replaced.
const PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    alt: "Người tập Pilates trên thảm, giữ lưng thẳng",
    span: "sm:col-span-2 sm:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
    alt: "Người tập sức mạnh với tạ trong phòng tập",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=900&q=80",
    alt: "Bài tập nâng hông trên thảm",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80",
    alt: "Người tập với tạ ấm, chuẩn bị đẩy lên",
    span: "sm:col-span-3 lg:col-span-2",
  },
] as const;

export const DualAthleteGallery: React.FC = () => {
  return (
    <section data-theme="dark" className="py-16 sm:py-24 bg-canvas-dark text-white border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Hai chương trình, tập ngay tại nhà</h2>
          <p className="mt-3 text-base text-stone-300 leading-relaxed">
            Pilates cho cơ lõi và tư thế, sức mạnh cho chuỗi cơ sau. Mỗi bài có hướng dẫn và AI theo dõi form qua camera.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[220px] sm:auto-rows-[240px] gap-4">
          {PHOTOS.map((photo) => (
            <div key={photo.src} className={`group relative rounded-3xl overflow-hidden bg-stone-900 ${photo.span}`}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
