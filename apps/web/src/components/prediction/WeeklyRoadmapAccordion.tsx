"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export interface RoadmapWeek {
  day: number;
  label: string;
  focus: string;
  title: string;
  body: string;
}

export const ROADMAP_WEEKS: RoadmapWeek[] = [
  {
    day: 7,
    label: "Tuần 1 · Ngày 01 — 07",
    focus: "Trọng tâm: thở & cổ vai",
    title: "Đánh thức cơ hoành & giảm căng cứng cổ gáy",
    body: "Tập trung vào nhịp thở Pilates sâu và các động tác kéo giãn cột sống cạnh tường. Cơ hoành được kích hoạt giúp lồng ngực mở nhẹ, giải tỏa áp lực đè nặng vùng vai gáy.",
  },
  {
    day: 14,
    label: "Tuần 2 · Ngày 08 — 14",
    focus: "Trọng tâm: cơ bụng sâu",
    title: "Căn chỉnh cột sống & làm phẳng bụng dưới",
    body: "Kích hoạt cơ ngang bụng sâu (Transverse Abdominis). Nhóm cơ này giữ thân người vững khi bạn vận động, mà không cần nín thở hóp bụng.",
  },
  {
    day: 21,
    label: "Tuần 3 · Ngày 15 — 21",
    focus: "Trọng tâm: chuỗi cơ sau",
    title: "Cân bằng khung chậu & khắc phục võng lưng",
    body: "Các bài Glute Bridge và Bird Dog giúp giảm tư thế võng lưng do ngồi làm việc nhiều. Cơ mông được nâng đỡ, đưa trọng tâm cơ thể về vị trí cân bằng tự nhiên.",
  },
  {
    day: 28,
    label: "Tuần 4 · Ngày 22 — 28",
    focus: "Trọng tâm: đánh giá lại",
    title: "Đánh giá lại & giữ nhịp",
    body: "So sánh với Ngày 0: cân nặng, số đo vòng eo và cảm giác khi ngồi làm việc. Thói quen giữ thẳng lưng cần thời gian; tiếp tục chu kỳ sau để giữ nhịp.",
  },
];

interface WeeklyRoadmapAccordionProps {
  currentDay: number;
  onSelectDay: (day: number) => void;
  weeks?: RoadmapWeek[];
}

export function WeeklyRoadmapAccordion({
  currentDay,
  onSelectDay,
  weeks = ROADMAP_WEEKS,
}: WeeklyRoadmapAccordionProps) {
  return (
    <section aria-labelledby="weekly-plan-heading" className="pt-2">
      <h2 id="weekly-plan-heading" className="text-sm font-bold text-stone-200 px-1 mb-3">
        Lộ trình từng tuần
      </h2>
      <div className="space-y-2">
        {weeks.map((w) => {
          const inView = currentDay === w.day;
          return (
            <details
              key={w.day}
              open={inView}
              className={`group rounded-2xl border transition-colors ${
                inView
                  ? "bg-stone-900 border-brand/60"
                  : "bg-stone-950/70 border-stone-800/80 hover:border-stone-700"
              }`}
            >
              <summary
                onClick={(e) => {
                  // Opening a week also moves the timeline to it.
                  e.preventDefault();
                  onSelectDay(w.day);
                }}
                className="min-h-12 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
              >
                <span>
                  <span className="block text-xs font-semibold text-brand">{w.label}</span>
                  <span className="block text-sm font-bold text-white">{w.title}</span>
                </span>
                <ChevronDown
                  className="w-4 h-4 shrink-0 text-stone-400 transition-transform duration-[var(--duration-fast)] group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="px-4 pb-4 text-sm text-stone-300 leading-relaxed">
                <p className="text-xs text-stone-400 mb-1.5">{w.focus}</p>
                <p>{w.body}</p>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
