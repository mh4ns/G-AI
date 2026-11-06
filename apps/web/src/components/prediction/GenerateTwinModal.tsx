"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Brain, CheckCircle2, Loader2, ArrowRight, X, Cpu, Layers } from "lucide-react";

interface GenerateTwinModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: "female_pilates" | "male_strength";
  onGenerated: (images: string[], prompts: any[]) => void;
}

export const GenerateTwinModal: React.FC<GenerateTwinModalProps> = ({
  isOpen,
  onClose,
  archetype,
  onGenerated,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedData, setGeneratedData] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsProcessing(true);

      // Trigger the 3-stage live simulation / API call
      const runGeneration = async () => {
        try {
          // Stage 1: Data aggregation (1.2s)
          await new Promise((r) => setTimeout(r, 1200));
          setCurrentStep(2);

          // Stage 2: ChatGPT prompt synthesis (1.4s)
          await new Promise((r) => setTimeout(r, 1400));
          setCurrentStep(3);

          // Stage 3: Call API route to finalize Gemini images (1.6s)
          const res = await fetch("/api/generate-twin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ archetype }),
          });
          const data = await res.json();
          setGeneratedData(data);

          await new Promise((r) => setTimeout(r, 1000));
          setCurrentStep(4);
          setIsProcessing(false);

          if (data.milestoneImages) {
            onGenerated(data.milestoneImages, data.prompts || []);
          }
        } catch (e) {
          setIsProcessing(false);
          setCurrentStep(4);
        }
      };

      runGeneration();
    }
  }, [isOpen, archetype]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 select-none">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#141210] border border-stone-800 p-6 sm:p-8 shadow-2xl text-white overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF5A36]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Close button */}
        {!isProcessing && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-mono text-[#FF5A36]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI BIOMETRIC PIPELINE</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Khởi Tạo Bản Sao Số Tạo Sinh (Generative Twin)
          </h3>
          <p className="text-xs text-stone-400">
            Hệ thống liên kết ChatGPT (Thiết kế Prompt Giải phẫu) và Gemini Imagen (Tạo ảnh siêu thực 5 mốc thời gian).
          </p>
        </div>

        {/* Live Radar Scan HUD Stage */}
        <div className="relative w-full h-36 rounded-2xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-center mb-6 overflow-hidden">
          {/* Animated concentric radar rings */}
          <div className="absolute w-24 h-24 rounded-full border border-[#FF5A36]/30 animate-ping opacity-30" />
          <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20" />
          <div className="absolute w-64 h-64 rounded-full border border-stone-800" />

          {/* Central AI Brain Node */}
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-amber-500 flex items-center justify-center shadow-lg shadow-[#FF5A36]/30">
            {isProcessing ? (
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            ) : (
              <CheckCircle2 className="w-7 h-7 text-white" />
            )}
          </div>

          {/* Status Label Overlay */}
          <div className="absolute bottom-2.5 left-4 text-[10px] font-mono text-stone-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {currentStep === 1 && "Đang thu thập 33 điểm khớp MediaPipe..."}
              {currentStep === 2 && "ChatGPT đang tối ưu hóa Visual Prompts..."}
              {currentStep === 3 && "Gemini Imagen đang kết xuất 5 khung hình..."}
              {currentStep === 4 && "Hoàn tất! Đã nạp Bản sao số vào Timeline."}
            </span>
          </div>
        </div>

        {/* Step Progression List */}
        <div className="space-y-3 mb-6">
          {/* Step 1 */}
          <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
            currentStep > 1
              ? "bg-stone-900/40 border-emerald-500/30 text-stone-300"
              : currentStep === 1
              ? "bg-[#FF5A36]/10 border-[#FF5A36]/40 text-white"
              : "bg-stone-900/20 border-stone-800/50 text-stone-600"
          }`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
              currentStep > 1 ? "bg-emerald-500 text-white" : "bg-stone-800 text-stone-300"
            }`}>
              {currentStep > 1 ? "✓" : "1"}
            </div>
            <div className="flex-1 text-xs">
              <span className="font-bold">Thu Thập Dữ Liệu Thể Trạng & Camera PT</span>
              <p className="text-[10px] text-stone-400">Trích xuất góc võng lưng, tỷ lệ mỡ và mục tiêu 28 ngày.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
            currentStep > 2
              ? "bg-stone-900/40 border-emerald-500/30 text-stone-300"
              : currentStep === 2
              ? "bg-[#FF5A36]/10 border-[#FF5A36]/40 text-white"
              : "bg-stone-900/20 border-stone-800/50 text-stone-600"
          }`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
              currentStep > 2 ? "bg-emerald-500 text-white" : "bg-stone-800 text-stone-300"
            }`}>
              {currentStep > 2 ? "✓" : "2"}
            </div>
            <div className="flex-1 text-xs">
              <span className="font-bold">ChatGPT: Thiết Kế Prompt Giải Phẫu 5 Mốc</span>
              <p className="text-[10px] text-stone-400">Đồng bộ danh tính nhân vật, ánh sáng studio và thay đổi thắt eo.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
            currentStep > 3
              ? "bg-stone-900/40 border-emerald-500/30 text-stone-300"
              : currentStep === 3
              ? "bg-[#FF5A36]/10 border-[#FF5A36]/40 text-white"
              : "bg-stone-900/20 border-stone-800/50 text-stone-600"
          }`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
              currentStep > 3 ? "bg-emerald-500 text-white" : "bg-stone-800 text-stone-300"
            }`}>
              {currentStep > 3 ? "✓" : "3"}
            </div>
            <div className="flex-1 text-xs">
              <span className="font-bold">Gemini Imagen: Kết Xuất Ảnh Biến Đổi Siêu Thực</span>
              <p className="text-[10px] text-stone-400">Tạo chuỗi 5 mốc hình ảnh (Day 0, 7, 14, 21, 28) chất lượng 4K.</p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isProcessing ? (
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF5A36]" />
              <span>Đang kết xuất đa tầng...</span>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#FF5A36] hover:bg-[#e04825] text-white font-mono text-xs font-bold transition-all shadow-lg shadow-[#FF5A36]/25 flex items-center justify-center gap-2"
            >
              <span>Xem Trải Nghiệm Trên Timeline 60 FPS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
