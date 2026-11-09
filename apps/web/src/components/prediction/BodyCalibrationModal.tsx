"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Sparkles, X, Check, Activity, Heart, ArrowRight, Camera, Upload, ShieldCheck, User } from "lucide-react";

interface BodyCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: "female_pilates" | "male_strength";
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

export const BodyCalibrationModal: React.FC<BodyCalibrationModalProps> = ({
  isOpen,
  onClose,
  archetype,
  currentPhoto,
  onPhotoChange,
  onSave,
}) => {
  const [currentArchetype, setCurrentArchetype] = useState<"female_pilates" | "male_strength">(archetype);
  const [height, setHeight] = useState<number>(archetype === "male_strength" ? 175 : 162);
  const [weight, setWeight] = useState<number>(archetype === "male_strength" ? 76 : 56);
  const [targetWeight, setTargetWeight] = useState<number>(archetype === "male_strength" ? 73.5 : 53.8);
  const [selectedIssue, setSelectedIssue] = useState<string>("Võng lưng & Gù vai cổ nhẹ");
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhoto || null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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
                onClick={() => setCurrentArchetype("female_pilates")}
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
                onClick={() => setCurrentArchetype("male_strength")}
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

          {/* Biometric Stats Inputs */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-mono text-stone-400 uppercase block mb-1">Chiều cao (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36]"
              />
            </div>
            <div>
              <label className="font-mono text-stone-400 uppercase block mb-1">Hiện tại (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36]"
              />
            </div>
            <div>
              <label className="font-mono text-stone-400 uppercase block mb-1">Mục tiêu (kg)</label>
              <input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white font-mono focus:outline-none focus:border-[#FF5A36]"
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
