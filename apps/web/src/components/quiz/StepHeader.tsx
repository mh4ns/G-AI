import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";

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
    <header className="w-full max-w-xl mx-auto px-4 pt-6 pb-2">
      {/* Brand & Badge */}
      <div className="flex items-center justify-between mb-4">
        {canGoBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-peach-50 border border-peach-100">
          <Sparkles className="w-4 h-4 text-peach-500 animate-pulse" />
          <span className="text-xs font-semibold text-peach-600 tracking-wide uppercase">
            G-AI • Thiết lập Lộ trình
          </span>
        </div>

        <span className="text-xs font-medium text-stone-400 w-10 text-right">
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Warm Gradient Progress Bar */}
      <div className="w-full h-2 bg-stone-200/60 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-gradient-to-r from-peach-400 via-peach-500 to-sage-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
