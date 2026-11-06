"use client";

import React, { useState } from "react";
import { Sparkles, X, Check, Activity, Heart, ArrowRight } from "lucide-react";

interface BodyCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: "female_pilates" | "male_strength";
  onSave: (updated: {
    archetype: "female_pilates" | "male_strength";
    height: number;
    weight: number;
    targetWeight: number;
    postureIssue: string;
  }) => void;
}

export const BodyCalibrationModal: React.FC<BodyCalibrationModalProps> = ({
  isOpen,
  onClose,
  archetype,
  onSave,
}) => {
  const [currentArchetype, setCurrentArchetype] = useState<"female_pilates" | "male_strength">(archetype);
  const [height, setHeight] = useState<number>(archetype === "male_strength" ? 175 : 162);
  const [weight, setWeight] = useState<number>(archetype === "male_strength" ? 76 : 56);
  const [targetWeight, setTargetWeight] = useState<number>(archetype === "male_strength" ? 73.5 : 53.8);
  const [selectedIssue, setSelectedIssue] = useState<string>("Võng lưng & Gù vai cổ nhẹ");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      archetype: currentArchetype,
      height,
      weight,
      targetWeight,
      postureIssue: selectedIssue,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#141210] border border-stone-800 p-6 sm:p-8 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-mono text-[#FF5A36]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HIỆU CHỈNH THỂ TRẠNG</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Hiệu Chỉnh Chỉ Số Cá Nhân
          </h3>
          <p className="text-xs text-stone-400">
            Cập nhật số đo và tình trạng tư thế để mô hình tính toán lại lộ trình thích nghi sinh học chuẩn xác.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Gender / Archetype Toggle */}
          <div>
            <label className="text-xs font-mono text-stone-400 uppercase block mb-2">
              Giới tính & Giáo án tập luyện
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setCurrentArchetype("female_pilates")}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                  currentArchetype === "female_pilates"
                    ? "bg-[#FF5A36]/15 border-[#FF5A36] text-white font-bold"
                    : "bg-stone-900 border-stone-800 text-stone-400"
                }`}
              >
                <span>♀ Nữ • Pilates Sculpt</span>
                {currentArchetype === "female_pilates" && <Check className="w-4 h-4 text-[#FF5A36]" />}
              </button>
              <button
                type="button"
                onClick={() => setCurrentArchetype("male_strength")}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                  currentArchetype === "male_strength"
                    ? "bg-[#10B981]/15 border-[#10B981] text-white font-bold"
                    : "bg-stone-900 border-stone-800 text-stone-400"
                }`}
              >
                <span>♂ Nam • Sức Mạnh Cơ Bắp</span>
                {currentArchetype === "male_strength" && <Check className="w-4 h-4 text-[#10B981]" />}
              </button>
            </div>
          </div>

          {/* Measurements: Height & Weight */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-mono text-stone-400 uppercase block mb-1.5">
                Chiều Cao (cm)
              </label>
              <input
                type="number"
                min="140"
                max="210"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36]"
              />
            </div>
            <div>
              <label className="font-mono text-stone-400 uppercase block mb-1.5">
                Cân Nặng Hiện Tại (kg)
              </label>
              <input
                type="number"
                min="35"
                max="160"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36]"
              />
            </div>
          </div>

          {/* Primary Posture Challenge */}
          <div>
            <label className="text-xs font-mono text-stone-400 uppercase block mb-2">
              Vùng tư thế ưu tiên cải thiện
            </label>
            <div className="space-y-2 text-xs">
              {[
                "Võng lưng & Gù vai cổ nhẹ",
                "Đau mỏi vai gáy do ngồi máy tính",
                "Bụng dưới tích mỡ & cơ hoành yếu",
                "Khung chậu lệch & không cân đối",
              ].map((issue) => (
                <button
                  type="button"
                  key={issue}
                  onClick={() => setSelectedIssue(issue)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    selectedIssue === issue
                      ? "bg-stone-900 border-stone-600 text-white font-medium"
                      : "bg-stone-950/60 border-stone-800/80 text-stone-400 hover:text-stone-300"
                  }`}
                >
                  <span>{issue}</span>
                  {selectedIssue === issue && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-stone-800 text-xs font-mono text-stone-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#FF5A36] hover:bg-[#e04825] text-white text-xs font-bold font-mono transition-all shadow-lg shadow-[#FF5A36]/25 flex items-center gap-1.5"
            >
              <span>Cập Nhật Dự Đoán</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
