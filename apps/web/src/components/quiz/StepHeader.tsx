"use client";

import React from "react";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { AthleticArchetype } from "@/types/quiz";
import { BrandLogo, hubUrl } from "@g-ai/ui";

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  canGoBack: boolean;
  archetype?: AthleticArchetype;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  currentStep,
  totalSteps,
  onBack,
  canGoBack,
  archetype = "female_pilates",
}) => {
  const isMale = archetype === "male_strength";
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <header className="w-full max-w-xl mx-auto px-4 pt-6 pb-2 select-none">
      {/* Top Bar with Brand & Back */}
      <div className="flex items-center justify-between mb-4">
        {canGoBack ? (
          <button
            onClick={onBack}
            className={`w-9 h-9 rounded-full border shadow-sm flex items-center justify-center transition-colors ${
              isMale
                ? "bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:border-[#FF5A36]"
                : "bg-white border-stone-200 text-stone-600 hover:text-black hover:border-black"
            }`}
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        <Link href={hubUrl("/")} className="flex items-center gap-2 group">
          <BrandLogo isLight={!isMale} size="sm" />
          <span className="font-mono text-[10px] tracking-widest text-stone-400 uppercase hidden sm:inline">
            / {isMale ? "STRENGTH" : "PILATES"}
          </span>
        </Link>

        <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400 w-9 justify-end">
          <Lock className="w-3 h-3 text-stone-400" />
        </div>
      </div>

      {/* Radiant Minimal Progress Line */}
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${
        isMale ? "bg-stone-800" : "bg-stone-100"
      }`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isMale ? "bg-[#FF5A36]" : "bg-[#FF6B4A]"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
