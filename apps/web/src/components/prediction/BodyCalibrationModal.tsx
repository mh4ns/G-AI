"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Sparkles, X, Check, Activity, Heart, ArrowRight, Camera, Upload, ShieldCheck, User } from "lucide-react";

interface BodyCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: "female_pilates" | "male_strength";
  initialHeight?: number;
  initialWeight?: number;
  initialTargetWeight?: number;
  currentPhoto?: string | null;
  onPhotoChange?: (newPhotoBase64: string) => void;
  onSave: (updated: {
    archetype: "female_pilates" | "male_strength";
    height: number;
    weight: number;
    targetWeight: number;
    postureIssue: string;
  }) => void;
}

// Utility to clean numeric inputs and completely strip unwanted leading zeros (e.g., "0080" -> "80", "0170" -> "170")
const cleanNumberInput = (raw: string): string => {
  if (!raw) return "";
  // Strip any character that is not a digit or decimal point
  let cleaned = raw.replace(/[^0-9.]/g, "");
  // Keep only the first dot
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, "");
  }
  // Remove leading zeros before any digit (e.g. "0080" -> "80", "08" -> "8"), but allow "0." and single "0"
  if (/^0+[0-9]/.test(cleaned) && !cleaned.startsWith("0.")) {
    cleaned = cleaned.replace(/^0+/, "");
    if (cleaned === "") cleaned = "0";
  }
  return cleaned;
};

export const BodyCalibrationModal: React.FC<BodyCalibrationModalProps> = ({
  isOpen,
  onClose,
  archetype,
  initialHeight,
  initialWeight,
  initialTargetWeight,
  currentPhoto,
  onPhotoChange,
  onSave,
}) => {
  const isMale = archetype === "male_strength";
  const defaultHeight = initialHeight ? String(initialHeight) : (isMale ? "175" : "162");
  const defaultWeight = initialWeight ? String(initialWeight) : (isMale ? "76" : "56");
  const defaultTargetWeight = initialTargetWeight ? String(initialTargetWeight) : (isMale ? "73.5" : "52");

  const [currentArchetype, setCurrentArchetype] = useState<"female_pilates" | "male_strength">(archetype);
  const [height, setHeight] = useState<string>(defaultHeight);
  const [weight, setWeight] = useState<string>(defaultWeight);
  const [targetWeight, setTargetWeight] = useState<string>(defaultTargetWeight);
  const [selectedIssue, setSelectedIssue] = useState<string>("Võng lưng & Gù vai cổ nhẹ");
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhoto || null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync when initial values or photo change
  useEffect(() => {
    if (isOpen) {
      if (initialHeight) setHeight(cleanNumberInput(String(initialHeight)));
      if (initialWeight) setWeight(cleanNumberInput(String(initialWeight)));
      if (initialTargetWeight) setTargetWeight(cleanNumberInput(String(initialTargetWeight)));
      if (currentPhoto) setPhotoPreview(currentPhoto);
    }
  }, [isOpen, initialHeight, initialWeight, initialTargetWeight, currentPhoto]);

  if (!isOpen) return null;

  const handleArchetypeToggle = (next: "female_pilates" | "male_strength") => {
    setCurrentArchetype(next);
    if (!initialHeight) {
      setHeight(next === "male_strength" ? "175" : "162");
    }
    if (!initialWeight) {
      setWeight(next === "male_strength" ? "76" : "56");
    }
    if (!initialTargetWeight) {
      setTargetWeight(next === "male_strength" ? "73.5" : "52");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreview(result);
      onPhotoChange?.(result);
    };
    reader.readAsDataURL(file);
  };

  const handleBlur = (field: "height" | "weight" | "targetWeight") => {
    if (field === "height") {
      const num = parseFloat(height);
      if (!isNaN(num) && num > 0) setHeight(String(Math.min(240, Math.max(100, num))));
      else setHeight(currentArchetype === "male_strength" ? "175" : "162");
    } else if (field === "weight") {
      const num = parseFloat(weight);
      if (!isNaN(num) && num > 0) setWeight(String(Math.min(250, Math.max(30, num))));
      else setWeight(currentArchetype === "male_strength" ? "76" : "56");
    } else if (field === "targetWeight") {
      const num = parseFloat(targetWeight);
      if (!isNaN(num) && num > 0) setTargetWeight(String(Math.min(250, Math.max(30, num))));
      else setTargetWeight(currentArchetype === "male_strength" ? "73.5" : "52");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalHeight = parseFloat(height) || (currentArchetype === "male_strength" ? 175 : 162);
    const finalWeight = parseFloat(weight) || (currentArchetype === "male_strength" ? 76 : 56);
    const finalTargetWeight = parseFloat(targetWeight) || (currentArchetype === "male_strength" ? 73.5 : 52);

    onSave({
      archetype: currentArchetype,
      height: finalHeight,
      weight: finalWeight,
      targetWeight: finalTargetWeight,
      postureIssue: selectedIssue,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-3xl bg-[#141210] border border-stone-800 p-6 sm:p-8 shadow-2xl text-white">
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
            Cập nhật số đo, ảnh thể trạng và tình trạng tư thế để mô hình tính toán lại lộ trình thích nghi sinh học chuẩn xác.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo Section */}
          <div className="p-4 rounded-2xl border border-stone-800 bg-stone-950/70 space-y-3">
            <label className="text-xs font-mono text-stone-400 uppercase flex items-center justify-between">
              <span>Ảnh Thể Trạng Cá Nhân</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Bảo mật cục bộ
              </span>
            </label>

            <div className="flex items-center gap-4">
              <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Current photo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-stone-600" />
                )}
              </div>

              <div className="space-y-1.5 flex-1 text-xs">
                <p className="text-stone-300 font-medium">
                  {photoPreview ? "Đã có ảnh cá nhân" : "Đang dùng hình thể mẫu"}
                </p>
                <p className="text-[11px] text-stone-500">
                  Cập nhật ảnh để AI tạo mốc biến đổi theo gương mặt của bạn.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-[11px] font-mono flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Upload className="w-3 h-3 text-[#FF5A36]" />
                  <span>{photoPreview ? "Thay đổi ảnh khác" : "Tải ảnh lên"}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Gender / Archetype Toggle */}
          <div>
            <label className="text-xs font-mono text-stone-400 uppercase block mb-2">
              Giới tính & Giáo án tập luyện
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleArchetypeToggle("female_pilates")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  currentArchetype === "female_pilates"
                    ? "bg-[#FF6B4A]/10 border-[#FF6B4A] text-white font-bold"
                    : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                }`}
              >
                <span>Nữ (Pilates & Siết Eo)</span>
                {currentArchetype === "female_pilates" && <Check className="w-3.5 h-3.5 text-[#FF6B4A]" />}
              </button>

              <button
                type="button"
                onClick={() => handleArchetypeToggle("male_strength")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  currentArchetype === "male_strength"
                    ? "bg-[#FF5A36]/10 border-[#FF5A36] text-white font-bold"
                    : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                }`}
              >
                <span>Nam (Calisthenics & Cơ Xô)</span>
                {currentArchetype === "male_strength" && <Check className="w-3.5 h-3.5 text-[#FF5A36]" />}
              </button>
            </div>
          </div>

          {/* Biometric Stats Inputs (Sanitized without leading zeros) */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-mono text-stone-400 uppercase block mb-1">Chiều cao (cm)</label>
              <input
                type="text"
                inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(cleanNumberInput(e.target.value))}
                onBlur={() => handleBlur("height")}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36]"
                placeholder="165"
              />
            </div>
            <div>
              <label className="font-mono text-stone-400 uppercase block mb-1">Hiện tại (kg)</label>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(cleanNumberInput(e.target.value))}
                onBlur={() => handleBlur("weight")}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36]"
                placeholder="60"
              />
            </div>
            <div>
              <label className="font-mono text-stone-400 uppercase block mb-1">Mục tiêu (kg)</label>
              <input
                type="text"
                inputMode="decimal"
                value={targetWeight}
                onChange={(e) => setTargetWeight(cleanNumberInput(e.target.value))}
                onBlur={() => handleBlur("targetWeight")}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36]"
                placeholder="52"
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
