"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { appUrl } from "@g-ai/ui";
import { FOCUS_RING, SECTION_HEADING } from "@/components/home/SegmentedControl";

const CAPABILITIES = [
  {
    title: "Sửa lỗi võng lưng & gù vai tức thì",
    detail: "Giọng nói AI nhắc nhở hạ vai và siết cơ bụng ngay khi bạn sai biên độ.",
  },
  {
    title: "Tự động đếm rep khi đạt góc khớp chuẩn",
    detail: "Chỉ tính điểm khi Squat đủ sâu 90° hoặc Plank giữ thẳng trục cột sống.",
  },
];

/**
 * AI Live PT section. Always dark, whatever the page theme: it stages a camera
 * view, so `data-theme="dark"` is pinned on the section itself.
 */
export const AiVisionTeaser: React.FC = () => {
  return (
    <section data-theme="dark" className="border-t border-line bg-page py-16 text-ink sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className={SECTION_HEADING}>Tập chuẩn form ngay tại nhà với AI Live PT</h2>

            <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-ink-muted">
              Không cần mua Apple Watch hay vòng đeo đắt tiền. Bạn chỉ cần đặt điện thoại hoặc mở webcam máy tính.
              Trợ lý AI phân tích 33 điểm xương khớp theo thời gian thực (MediaPipe Pose), cảnh báo sai tư thế và tự
              động đếm rep.
            </p>

            <ul className="mt-8 space-y-5">
              {CAPABILITIES.map((capability) => (
                <li key={capability.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-positive text-page">
                    <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-ink">{capability.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">{capability.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Link
                href={appUrl("/quiz")}
                className={`group inline-flex h-12 items-center gap-2.5 rounded-full bg-ink px-6 text-[15px] font-semibold text-page transition-[opacity,transform] duration-200 hover:opacity-85 active:scale-[0.98] ${FOCUS_RING}`}
              >
                <span>Làm khảo sát để kích hoạt AI Live PT</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </Link>
              <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-faint">
                Hoàn thành đánh giá thể trạng 2 phút để thuật toán cá nhân hóa góc khớp và giáo án riêng cho bạn.
              </p>
            </div>
          </div>

          {/* Illustrated camera view: a drawing of the feature, not live data */}
          <figure className="lg:col-span-7">
            <div className="rounded-3xl border border-line bg-surface p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                  <span className="text-sm font-semibold text-ink">Webcam trực tiếp</span>
                </div>
                <span className="rounded-full bg-sunken px-3 py-1 text-xs font-medium text-ink-muted">Hình minh họa</span>
              </div>

              <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-page">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage:
                      "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />

                <svg
                  viewBox="0 0 400 300"
                  role="img"
                  aria-label="Khung xương AI nhận diện tư thế squat, góc gối 92 độ đạt chuẩn"
                  className="h-full max-h-[320px] w-full"
                >
                  <g className="stroke-positive" strokeLinecap="round">
                    {/* Spine and torso */}
                    <line x1="200" y1="75" x2="195" y2="155" strokeWidth="4" />
                    {/* Shoulder girdle */}
                    <line x1="165" y1="95" x2="235" y2="95" strokeWidth="3" />
                    {/* Arms */}
                    <line x1="165" y1="95" x2="135" y2="135" strokeWidth="3" />
                    <line x1="135" y1="135" x2="115" y2="175" strokeWidth="3" />
                    <line x1="235" y1="95" x2="265" y2="135" strokeWidth="3" />
                    <line x1="265" y1="135" x2="285" y2="175" strokeWidth="3" />
                    {/* Pelvis */}
                    <line x1="175" y1="155" x2="215" y2="155" strokeWidth="4" />
                    {/* Legs */}
                    <line x1="175" y1="155" x2="140" y2="205" strokeWidth="4" />
                    <line x1="140" y1="205" x2="150" y2="265" strokeWidth="4" />
                    <line x1="215" y1="155" x2="250" y2="205" strokeWidth="4" />
                    <line x1="250" y1="205" x2="240" y2="265" strokeWidth="4" />
                    {/* Head */}
                    <circle cx="200" cy="55" r="16" strokeWidth="2.5" className="fill-surface" />
                  </g>

                  {/* Tracked joints */}
                  <circle cx="140" cy="205" r="5" className="fill-brand" />
                  <circle cx="250" cy="205" r="5" className="fill-brand" />
                  <circle cx="195" cy="155" r="5" className="fill-positive" />

                  {/* Angle callout */}
                  <g transform="translate(262, 194)">
                    <rect width="92" height="24" rx="12" strokeWidth="1" className="fill-surface stroke-positive" />
                    <text x="46" y="16" textAnchor="middle" fontSize="11" fontWeight="600" className="fill-positive">
                      Gối 92° · đạt
                    </text>
                  </g>
                </svg>

                <div className="absolute right-3 top-3 min-w-[84px] rounded-2xl border border-line bg-surface px-3 py-2 text-center sm:right-4 sm:top-4 sm:px-4 sm:py-3">
                  <span className="block text-xs text-ink-muted">Đếm rep</span>
                  <div className="mt-0.5 flex items-baseline justify-center gap-1 tabular-nums">
                    <span className="text-xl font-bold text-ink sm:text-2xl">12</span>
                    <span className="text-sm text-ink-faint">/15</span>
                  </div>
                  <span className="block text-xs font-medium text-positive">Đạt biên độ</span>
                </div>

                <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink sm:bottom-4 sm:left-4 sm:px-3.5 sm:py-2 sm:text-sm">
                  <ShieldCheck className="h-4 w-4 text-positive" aria-hidden />
                  <span>Cột sống thẳng chuẩn</span>
                </div>
              </div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
};
