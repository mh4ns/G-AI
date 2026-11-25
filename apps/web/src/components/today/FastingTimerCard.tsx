"use client";

import React, { useEffect, useState } from "react";
import { Clock, Play, RotateCcw, Square } from "lucide-react";
import type { FastingProtocol } from "@/lib/api-client";

interface FastingTimerCardProps {
  fastingState: "idle" | "fasting" | "eating_window";
  fastingProtocol: FastingProtocol;
  fastingStartedAt: string | null;
  busy?: boolean;
  onUpdateFasting: (next: {
    fasting_state: "idle" | "fasting" | "eating_window";
    fasting_protocol: FastingProtocol;
    fasting_started_at?: string | null;
    fasting_minutes?: number;
  }) => Promise<void> | void;
}

const PROTOCOLS: FastingProtocol[] = ["14:10", "16:8", "18:6", "20:4"];

const PHASES = [
  { id: "digest", minH: 0, maxH: 4, label: "0–4h", title: "Tiêu hóa & ổn định đường huyết" },
  { id: "burn", minH: 4, maxH: 12, label: "4–12h", title: "Đốt mỡ dự trữ (Ketosis nhẹ)" },
  { id: "autophagy", minH: 12, maxH: Infinity, label: "12h+", title: "Tái tạo tế bào (Autophagy)" },
] as const;

function targetHoursFor(protocol: FastingProtocol): number {
  const [fastHours] = protocol.split(":").map(Number);
  return Number.isFinite(fastHours) && fastHours > 0 ? fastHours : 16;
}

function formatDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function FastingTimerCard({
  fastingState,
  fastingProtocol,
  fastingStartedAt,
  busy = false,
  onUpdateFasting,
}: FastingTimerCardProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const intervalMs = fastingState === "fasting" ? 1000 : 30_000;
    const id = setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [fastingState]);

  const startedMs = fastingStartedAt ? Date.parse(fastingStartedAt) : NaN;
  const elapsedSec =
    fastingState === "fasting" && nowMs !== null && Number.isFinite(startedMs)
      ? Math.max(0, Math.floor((nowMs - startedMs) / 1000))
      : 0;

  const targetHours = targetHoursFor(fastingProtocol);
  const targetSec = targetHours * 3600;
  const remainingSec = Math.max(0, targetSec - elapsedSec);
  const progressPct = Math.min(100, Math.round((elapsedSec / targetSec) * 100));
  const elapsedHours = elapsedSec / 3600;
  const goalReached = fastingState === "fasting" && elapsedSec >= targetSec;

  const activePhase =
    fastingState === "fasting"
      ? PHASES.find((p) => elapsedHours >= p.minH && elapsedHours < p.maxH) ?? PHASES[0]
      : null;

  const handleStart = () => {
    void onUpdateFasting({
      fasting_state: "fasting",
      fasting_protocol: fastingProtocol,
      fasting_started_at: new Date().toISOString(),
      fasting_minutes: 0,
    });
  };

  const handleEnd = () => {
    void onUpdateFasting({
      fasting_state: "eating_window",
      fasting_protocol: fastingProtocol,
      fasting_minutes: Math.min(24 * 60, Math.round(elapsedSec / 60)),
      fasting_started_at: null,
    });
  };

  const handleReset = () => {
    void onUpdateFasting({
      fasting_state: "idle",
      fasting_protocol: fastingProtocol,
      fasting_minutes: 0,
      fasting_started_at: null,
    });
  };

  const handleProtocolChange = (protocol: FastingProtocol) => {
    if (protocol === fastingProtocol) return;
    void onUpdateFasting({
      fasting_state: fastingState,
      fasting_protocol: protocol,
      ...(fastingState === "fasting" && fastingStartedAt ? { fasting_started_at: fastingStartedAt } : {}),
    });
  };

  return (
    <section aria-labelledby="fasting-title" className="border-t border-line pb-12 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="fasting-title" className="text-lg font-semibold text-ink">
            Nhịn ăn gián đoạn ({fastingProtocol})
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {fastingState === "fasting"
              ? goalReached
                ? `Đã hoàn thành mục tiêu ${targetHours} giờ nhịn ăn.`
                : `Còn ${formatDuration(remainingSec)} để đủ mốc ${targetHours} giờ.`
              : fastingState === "eating_window"
                ? "Đang trong khung giờ ăn. Ghi nhận bữa đủ đạm và rau xanh."
                : `Chọn khung giờ phù hợp (mặc định ${targetHours}h nhịn / ${24 - targetHours}h ăn).`}
          </p>
        </div>

        <div role="group" aria-label="Chọn phác đồ nhịn ăn" className="flex flex-wrap gap-1.5">
          {PROTOCOLS.map((proto) => {
            const selected = proto === fastingProtocol;
            return (
              <button
                key={proto}
                type="button"
                disabled={busy}
                aria-pressed={selected}
                onClick={() => handleProtocolChange(proto)}
                className={`h-9 rounded-full px-3 text-xs font-semibold tabular-nums transition-colors ${
                  selected
                    ? "bg-ink text-page"
                    : "border border-line bg-surface text-ink-muted hover:bg-sunken hover:text-ink"
                }`}
              >
                {proto}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                fastingState === "fasting" ? "bg-brand/15 text-brand-text" : "bg-sunken text-ink-muted"
              }`}
              aria-hidden
            >
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-ink-muted">
                {fastingState === "fasting"
                  ? "Đã nhịn"
                  : fastingState === "eating_window"
                    ? "Trạng thái hiện tại"
                    : "Chưa bắt đầu phiên"}
              </p>
              <p className="text-3xl font-bold leading-tight tabular-nums text-ink">
                {fastingState === "fasting"
                  ? nowMs === null
                    ? "--:--:--"
                    : formatDuration(elapsedSec)
                  : fastingState === "eating_window"
                    ? "Khung giờ ăn"
                    : `${targetHours}:00:00`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {fastingState === "fasting" ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleEnd}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-faint px-5 text-sm font-semibold text-ink transition-colors hover:bg-sunken disabled:opacity-60"
              >
                <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
                Kết thúc phiên nhịn
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleStart}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-soft disabled:opacity-60"
              >
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
                Bắt đầu nhịn ăn
              </button>
            )}
            {fastingState === "eating_window" && (
              <button
                type="button"
                disabled={busy}
                onClick={handleReset}
                aria-label="Đặt lại đồng hồ nhịn ăn"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        <div
          role="progressbar"
          aria-label="Tiến độ phiên nhịn ăn"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sunken"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              goalReached ? "bg-positive" : "bg-brand"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {PHASES.map((phase) => {
            const isCurrent = activePhase?.id === phase.id;
            const isPassed = fastingState === "fasting" && elapsedHours >= phase.maxH;
            return (
              <div
                key={phase.id}
                className={`rounded-xl border px-3 py-2.5 text-xs transition-colors ${
                  isCurrent
                    ? "border-brand-text bg-brand/10 text-ink"
                    : isPassed
                      ? "border-positive/40 bg-positive/10 text-ink"
                      : "border-line bg-sunken/60 text-ink-muted"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{phase.label}</span>
                  {isCurrent && <span className="text-brand-text">Đang ở đây</span>}
                  {isPassed && <span className="text-positive">Đã qua</span>}
                </div>
                <p className="mt-0.5 leading-snug">{phase.title}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
