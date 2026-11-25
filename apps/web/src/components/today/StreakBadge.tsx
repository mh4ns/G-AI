"use client";

import React from "react";
import { Flame } from "lucide-react";
import type { ApiTodaySummaryDay } from "@/lib/api-client";

interface StreakBadgeProps {
  streakDays: number;
  bestStreakDays: number;
  history7d: ApiTodaySummaryDay[];
  isSignedIn: boolean;
  /** Mounted local wall-clock from parent; keeps SSR and first client pass deterministic. */
  now?: Date | null;
}

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function dayLabel(isoDate: string): string {
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return "";
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return WEEKDAY_SHORT[dt.getDay()] ?? "";
}

export function buildPlaceholderHistory7d(now: Date): ApiTodaySummaryDay[] {
  return Array.from({ length: 7 }, (_, idx) => {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - idx));
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return {
      date: `${yyyy}-${mm}-${dd}`,
      calories_consumed: 0,
      calories_burned: 0,
      water_intake_ml: 0,
      habits_count: 0,
      fasting_state: "idle",
      active: false,
    };
  });
}

export function StreakBadge({ streakDays, bestStreakDays, history7d, isSignedIn, now }: StreakBadgeProps) {
  const hasServerHistory = history7d.length === 7;
  const days = hasServerHistory
    ? history7d
    : now
      ? buildPlaceholderHistory7d(now)
      : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            streakDays > 0 ? "bg-brand/15 text-brand-text" : "bg-sunken text-ink-muted"
          }`}
          aria-hidden
        >
          <Flame className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold tabular-nums text-ink">
            Chuỗi {streakDays} ngày liên tục
          </p>
          <p className="text-xs text-ink-muted tabular-nums">
            {isSignedIn
              ? bestStreakDays > 0
                ? `Kỷ lục cá nhân: ${bestStreakDays} ngày`
                : "Ghi nhận nước, bữa ăn hoặc bài tập để bắt đầu chuỗi"
              : "Đăng nhập để lưu và đồng bộ chuỗi 7 ngày"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5" aria-label="Hoạt động 7 ngày gần nhất">
        {days
          ? days.map((day, idx) => {
              const isToday = idx === days.length - 1;
              const label = dayLabel(day.date);
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span
                    title={`${day.date}: ${day.active ? "Đã hoạt động" : "Chưa ghi nhận"}`}
                    aria-label={`${day.date}: ${day.active ? "Đã hoạt động" : "Chưa ghi nhận"}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                      day.active
                        ? "bg-positive text-surface"
                        : isToday
                          ? "border border-brand-text bg-sunken text-brand-text"
                          : "bg-sunken text-ink-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })
          : Array.from({ length: 7 }, (_, idx) => {
              const isToday = idx === 6;
              return (
                <div key={`placeholder-${idx}`} className="flex flex-col items-center gap-1">
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isToday
                        ? "border border-brand-text bg-sunken text-brand-text"
                        : "bg-sunken text-ink-muted"
                    }`}
                  />
                </div>
              );
            })}
      </div>
    </div>
  );
}
