"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BrandLogo, hubUrl } from "@g-ai/ui";

interface StepHeaderProps {
  /** 1-based question number; the optional photo step passes no number. */
  questionNumber?: number;
  totalQuestions: number;
  /** 0 to 1 across the whole quiz, photo step included. */
  progress: number;
  onBack: () => void;
  canGoBack: boolean;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  questionNumber,
  totalQuestions,
  progress,
  onBack,
  canGoBack,
}) => {
  const progressPercent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const status = questionNumber ? `Câu ${questionNumber} / ${totalQuestions}` : "Bước tùy chọn";

  return (
    <header className="w-full max-w-xl mx-auto px-4 pt-6 pb-2">
      <div className="flex items-center justify-between mb-4">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 rounded-full border bg-white border-stone-200 text-stone-700 hover:text-stone-950 hover:border-stone-400 flex items-center justify-center transition-colors"
            aria-label="Quay lại câu trước"
          >
            <ArrowLeft className="w-[18px] h-[18px]" aria-hidden />
          </button>
        ) : (
          <div className="w-11" />
        )}

        <Link href={hubUrl("/")} className="min-h-11 min-w-11 flex items-center justify-center" aria-label="G-AI – trang chính">
          <BrandLogo isLight size="sm" />
        </Link>

        <span className="w-11 text-right text-xs font-medium text-stone-600 whitespace-nowrap" aria-hidden>
          {questionNumber ? `${questionNumber}/${totalQuestions}` : ""}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={status}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        className="w-full h-1.5 rounded-full overflow-hidden bg-stone-200"
      >
        <div
          className="h-full rounded-full bg-brand-action transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
