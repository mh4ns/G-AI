"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AthleticArchetype } from "@/types/quiz";

interface ArchetypeSelectionStepProps {
  selectedArchetype: AthleticArchetype;
  onSelect: (archetype: AthleticArchetype) => void;
}

// Both programmes share one card style: the choice is about training, so
// neither gets its own colour or theme.
const PROGRAMMES: {
  id: AthleticArchetype;
  title: string;
  description: string;
  tags: string[];
  image: string;
  imageAlt: string;
}[] = [
  {
    id: "female_pilates",
    title: "Pilates & cơ lõi",
    description:
      "Tập cơ lõi sâu, cải thiện tư thế cột sống và độ dẻo dai. Tập được tại nhà, không cần tạ nặng.",
    tags: ["Wall Pilates", "Cơ lõi & sàn chậu", "Chăm sóc cột sống"],
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Người tập Pilates trên thảm",
  },
  {
    id: "male_strength",
    title: "Sức mạnh & tăng cơ",
    description:
      "Xây cơ ngực, vai, lưng xô và cơ lõi với tạ đơn hoặc trọng lượng cơ thể. Tăng tải dần theo từng tuần.",
    tags: ["Tăng cơ", "Trọng lượng cơ thể & tạ đơn", "Lưng xô & cơ lõi"],
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Người tập sức mạnh với tạ",
  },
];

export const ArchetypeSelectionStep: React.FC<ArchetypeSelectionStepProps> = ({ selectedArchetype, onSelect }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 sm:py-14 flex flex-col items-center">
      <h1 className="text-3xl sm:text-5xl font-extrabold text-center tracking-tight leading-[1.1] mb-3 text-stone-950">
        Chọn chương trình tập
      </h1>

      <p className="text-base text-stone-600 text-center max-w-xl mb-10 leading-relaxed">
        G-AI dựng giáo án và lượng calo 28 ngày theo chương trình bạn chọn. Bạn có thể đổi lại sau.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
        {PROGRAMMES.map((p) => {
          const selected = selectedArchetype === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={selected}
              className={`group text-left rounded-3xl overflow-hidden border-2 bg-white flex flex-col transition-[border-color,box-shadow,transform] duration-200 outline-none focus-visible:ring-4 focus-visible:ring-brand/40 hover:-translate-y-0.5 ${
                selected ? "border-brand-action shadow-card" : "border-stone-200 hover:border-stone-400"
              }`}
            >
              <div className="relative w-full aspect-[16/9] bg-stone-200 overflow-hidden">
                <Image
                  src={p.image}
                  alt={p.imageAlt}
                  fill
                  sizes="(min-width: 768px) 450px, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>

              <div className="p-6 sm:p-7 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-extrabold text-stone-950 tracking-tight">{p.title}</h2>
                  {selected && <CheckCircle2 className="w-6 h-6 shrink-0 text-brand-action" aria-hidden />}
                </div>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">{p.description}</p>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <li key={t} className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium">
                      {t}
                    </li>
                  ))}
                </ul>

                <span className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-sm font-semibold text-stone-900">
                  Chọn chương trình này
                  <span className="w-10 h-10 rounded-full bg-brand-action text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-5 h-5" aria-hidden />
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
