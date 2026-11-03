"use client";

import React from "react";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  canGoBack: boolean;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  currentStep,
  totalSteps,
  onBack,
  canGoBack,
}) => {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <header className="w-full max-w-xl mx-auto px-4 pt-6 pb-2 select-none">
      {/* Top Bar with Brand & Back */}
      <div className="flex items-center justify-between mb-4">
        {canGoBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-stone-600 hover:text-black hover:border-black transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        <Link href="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center font-black text-sm">
            G
          </span>
          <span className="font-extrabold text-sm tracking-tight text-stone-900">
            G—AI <span className="font-normal text-stone-400">PILATES</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400 w-9 justify-end">
          <Lock className="w-3 h-3 text-stone-400" />
        </div>
      </div>

      {/* Radiant Minimal Progress Line */}
      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FF5A36] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
