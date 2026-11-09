"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Sparkles, X, Check, Activity, Heart, ArrowRight, Camera, Upload, ShieldCheck, User, Trash2 } from "lucide-react";

interface BodyCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: "female_pilates" | "male_strength";
  initialHeight?: number;
  initialWeight?: number;
  initialTargetWeight?: number;
  currentPhoto?: string | null;
  onPhotoChange?: (newPhotoBase64: string | null) => void;
  onSave: (updated: {
    archetype: "female_pilates" | "male_strength";
    height: number;
    weight: number;
    targetWeight: number;
    postureIssue: string;
    consentAccepted: boolean;
  }) => void;
}

// Utility to clean numeric inputs and completely strip unwanted leading zeros (e.g., "0080" -> "80", "0170" -> "170")
export const cleanNumberInput = (raw: string): string => {
  if (!raw) return "";
  // Strip any character that is not a digit or decimal point
  let cleaned = raw.replace(/[^0-9.]/g, "");
  // Keep only the first dot
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, "");
  }
  // Strip leading zeros before any digit (e.g. "0080" -> "80", "08" -> "8"), but allow "0."
  if (/^0+[0-9]/.test(cleaned) && !cleaned.startsWith("0.")) {
    cleaned = cleaned.replace(/^0+/, "");
  }
  // If user entered only zeros (e.g. "000"), normalize to single "0"
  if (/^0+$/.test(raw)) {
    cleaned = "0";
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
  const defaultHeight = initialHeight && initialHeight > 0 ? cleanNumberInput(String(Math.round(initialHeight))) : (isMale ? "175" : "162");
  const defaultWeight = initialWeight && initialWeight > 0 ? cleanNumberInput(String(initialWeight)) : (isMale ? "76" : "56");
  const defaultTargetWeight = initialTargetWeight && initialTargetWeight > 0 ? cleanNumberInput(String(initialTargetWeight)) : (isMale ? "73.5" : "52");

  const [currentArchetype, setCurrentArchetype] = useState<"female_pilates" | "male_strength">(archetype);
  const [height, setHeight] = useState<string>(defaultHeight);
  const [weight, setWeight] = useState<string>(defaultWeight);
  const [targetWeight, setTargetWeight] = useState<string>(defaultTargetWeight);
  const [selectedIssue, setSelectedIssue] = useState<string>("Võng lưng & Gù vai cổ nhẹ");
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhoto || null);
  const [consentAccepted, setConsentAccepted] = useState<boolean>(true);
  const [isDeletingCache, setIsDeletingCache] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync when initial values or photo change
  useEffect(() => {
    if (isOpen) {
      if (initialHeight && initialHeight > 0) setHeight(cleanNumberInput(String(Math.round(initialHeight))));
      if (initialWeight && initialWeight > 0) setWeight(cleanNumberInput(String(initialWeight)));
      if (initialTargetWeight && initialTargetWeight > 0) setTargetWeight(cleanNumberInput(String(initialTargetWeight)));
      if (currentPhoto) setPhotoPreview(currentPhoto);
    }
  }, [isOpen, initialHeight, initialWeight, initialTargetWeight, currentPhoto]);

  if (!isOpen) return null;

  const handleArchetypeToggle = (next: "female_pilates" | "male_strength") => {
    setCurrentArchetype(next);
    if (!initialHeight || initialHeight <= 0) {
      setHeight(next === "male_strength" ? "175" : "162");
    }
    if (!initialWeight || initialWeight <= 0) {
      setWeight(next === "male_strength" ? "76" : "56");
    }
    if (!initialTargetWeight || initialTargetWeight <= 0) {
      setTargetWeight(next === "male_strength" ? "73.5" : "52");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (!rawResult) return;

      // Client-side canvas downscaling (max 1536px dimension)
      const img = document.createElement("img");
      img.onload = () => {
        const maxDim = 1536;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.88);
          setPhotoPreview(compressed);
          onPhotoChange?.(compressed);
        } else {
          setPhotoPreview(rawResult);
          onPhotoChange?.(rawResult);
        }
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa ảnh thể trạng và toàn bộ ảnh dự đoán đã tạo sinh?")) {
      return;
    }
    setIsDeletingCache(true);
    try {
      await fetch("/api/prediction/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setPhotoPreview(null);
      onPhotoChange?.(null);
      localStorage.removeItem("g_ai_user_twin_photo");
      localStorage.removeItem("g_ai_prediction_job");
    } catch (e) {
      console.warn("Failed to delete cache on server:", e);
    } finally {
      setIsDeletingCache(false);
    }
  };

  const handleBlur = (field: "height" | "weight" | "targetWeight") => {
    if (field === "height") {
      const num = parseFloat(height);
      if (!isNaN(num) && num > 0) setHeight(cleanNumberInput(String(Math.min(240, Math.max(100, Math.round(num))))));
      else setHeight(currentArchetype === "male_strength" ? "175" : "162");
    } else if (field === "weight") {
      const num = parseFloat(weight);
      if (!isNaN(num) && num > 0) setWeight(cleanNumberInput(String(Math.min(250, Math.max(30, num)))));
      else setWeight(currentArchetype === "male_strength" ? "76" : "56");
    } else if (field === "targetWeight") {
      const num = parseFloat(targetWeight);
      if (!isNaN(num) && num > 0) setTargetWeight(cleanNumberInput(String(Math.min(250, Math.max(30, num)))));
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
      consentAccepted,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-3xl bg-[#141210] border border-stone-800 p-6 sm:p-8 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Đóng cửa sổ hiệu chỉnh"
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
            <div className="text-xs font-mono text-stone-400 uppercase flex items-center justify-between">
              <span>Ảnh Thể Trạng Cá Nhân</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Bảo mật cục bộ
              </span>
            </div>

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
                  Cập nhật ảnh để AI tạo mốc biến đổi chân thực theo thể trạng của bạn.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Tải ảnh lên hoặc đổi ảnh khác"
                    className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-[11px] font-mono flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Upload className="w-3 h-3 text-[#FF5A36]" />
                    <span>{photoPreview ? "Thay đổi ảnh khác" : "Tải ảnh lên"}</span>
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      disabled={isDeletingCache}
                      aria-label="Xóa ảnh thể trạng"
                      className="px-3 py-1.5 rounded-full bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-[11px] font-mono flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>{isDeletingCache ? "Đang xóa..." : "Xóa ảnh"}</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
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
                aria-label="Chọn lộ trình Nữ Pilates"
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
                aria-label="Chọn lộ trình Nam Calisthenics"
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

          {/* Biometric Stats Inputs (Sanitized without leading zeros, no native steppers) */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label htmlFor="input-height" className="font-mono text-stone-400 uppercase block mb-1">Chiều cao (cm)</label>
              <input
                id="input-height"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={height}
                onChange={(e) => setHeight(cleanNumberInput(e.target.value))}
                onBlur={() => handleBlur("height")}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="165"
                aria-label="Chiều cao tính bằng cm"
              />
            </div>
            <div>
              <label htmlFor="input-weight" className="font-mono text-stone-400 uppercase block mb-1">Hiện tại (kg)</label>
              <input
                id="input-weight"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={weight}
                onChange={(e) => setWeight(cleanNumberInput(e.target.value))}
                onBlur={() => handleBlur("weight")}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="60"
                aria-label="Cân nặng hiện tại tính bằng kg"
              />
            </div>
            <div>
              <label htmlFor="input-target-weight" className="font-mono text-stone-400 uppercase block mb-1">Mục tiêu (kg)</label>
              <input
                id="input-target-weight"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={targetWeight}
                onChange={(e) => setTargetWeight(cleanNumberInput(e.target.value))}
                onBlur={() => handleBlur("targetWeight")}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="52"
                aria-label="Cân nặng mục tiêu tính bằng kg"
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
                  aria-label={`Chọn tư thế ưu tiên: ${issue}`}
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

          {/* Step 6 Privacy: User Consent Checkbox */}
          <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/50 flex items-start gap-3 text-xs">
            <input
              type="checkbox"
              id="privacy-consent"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-stone-700 bg-stone-900 text-[#FF5A36] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="privacy-consent" className="text-stone-400 leading-relaxed cursor-pointer select-none">
              Tôi đồng ý để hệ thống AI xử lý ảnh thể trạng nhằm tạo mô phỏng thay đổi vóc dáng 28 ngày. Dữ liệu được bảo mật và không dùng để huấn luyện mô hình.
            </label>
          </div>

          {/* Action CTA */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Hủy bỏ thay đổi"
              className="px-5 py-2.5 rounded-full border border-stone-800 text-xs font-mono text-stone-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!consentAccepted}
              aria-label="Lưu và cập nhật chỉ số thể trạng"
              className={`px-6 py-2.5 rounded-full text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                consentAccepted
                  ? "bg-[#FF5A36] hover:bg-[#e04825] shadow-lg shadow-[#FF5A36]/25 cursor-pointer"
                  : "bg-stone-800 text-stone-500 cursor-not-allowed"
              }`}
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
