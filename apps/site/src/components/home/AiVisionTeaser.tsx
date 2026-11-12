"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { appUrl } from "@g-ai/ui";

const POINTS = [
  {
    title: "Đếm rep khi bạn đạt đúng góc",
    body: "Squat chỉ được tính khi góc gối đạt 80–100° ở điểm thấp nhất; Plank được tính khi vai, hông và gót thẳng hàng.",
  },
  {
    title: "Nhắc bằng giọng nói khi sai form",
    body: "Giữ sai tư thế quá vài giây, AI đọc lời nhắc của bài tập, ví dụ “Đẩy hông ra sau như ngồi vào ghế”.",
  },
];

export const AiVisionTeaser: React.FC = () => {
  return (
    <section data-theme="dark" className="py-16 sm:py-24 bg-[#0D0C0B] text-white border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-5">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Tập đúng form tại nhà, chỉ cần webcam
          </h2>

          <p className="mt-5 text-base text-stone-300 leading-relaxed">
            Không cần đồng hồ thông minh hay vòng đeo. AI theo dõi 33 điểm trên cơ thể bằng MediaPipe Pose. Video được xử
            lý ngay trên máy bạn, không gửi đi đâu.
          </p>

          <ul className="mt-8 space-y-5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <Check className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" aria-hidden />
                <div>
                  <h3 className="text-base font-bold">{p.title}</h3>
                  <p className="mt-1 text-sm text-stone-300 leading-relaxed">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href={appUrl("/quiz")}
            className="mt-8 min-h-12 px-7 rounded-full bg-white hover:bg-stone-200 text-stone-950 font-semibold text-base inline-flex items-center gap-2 transition-colors active:translate-y-px"
          >
            Làm khảo sát để bắt đầu tập
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        {/* The real workout screen (camera off), captured from apps/web. */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-700 bg-black shadow-2xl">
            <Image
              src="/images/live-studio.webp"
              alt="Màn hình tập của G-AI: bài Squat với khung xương, bộ đếm rep 0 trên 10 và lời nhắc của AI"
              width={2560}
              height={1600}
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
