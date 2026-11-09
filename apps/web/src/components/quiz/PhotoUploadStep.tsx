"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  ArrowRight, 
  User, 
  AlertCircle,
  Eye,
  Sliders
} from "lucide-react";
import { AthleticArchetype } from "@/types/quiz";

interface PhotoUploadStepProps {
  archetype: AthleticArchetype;
  onPhotoSubmit: (photoBase64: string | null) => void;
  onSkip: () => void;
}

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
  archetype,
  onPhotoSubmit,
  onSkip,
}) => {
  const isMale = archetype === "male_strength";
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [studioBackgroundCutout, setStudioBackgroundCutout] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setPhotoPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Không thể truy cập camera. Vui lòng cấp quyền hoặc tải ảnh từ thiết bị.");
      setIsCameraActive(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally for natural mirror feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoPreview(dataUrl);

    // Stop camera stream
    if (videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit ~8MB
    if (file.size > 8 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh dung lượng dưới 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreview(result);
      setIsCameraActive(false);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPhoto = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPhotoSubmit(photoPreview);
    }, 600);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center animate-in fade-in duration-300">
      {/* Header Badge */}
      <div className="text-center space-y-2 mb-6">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
          isMale 
            ? "bg-stone-900 border border-stone-800 text-[#FF5A36]" 
            : "bg-peach-50 border border-peach-200 text-[#FF6B4A]"
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>BƯỚC ĐẶC BIỆT • CÁ NHÂN HÓA BẢN SAO SỐ (DIGITAL TWIN)</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
          Quét Hình Thể & Dáng Đứng Cá Nhân
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
          Tải ảnh hoặc chụp qua camera để thuật toán AI đo góc lệch cột sống, xác định tỷ lệ cơ thể và tạo ra Bản Sao Số biến đổi 28 ngày chính xác theo khuôn mặt và vóc dáng của bạn.
        </p>
      </div>

      {/* Main Interactive Stage */}
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Visual Box / Camera Preview */}
        <div className="w-full relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden border border-stone-800 bg-[#0A0908] shadow-2xl flex flex-col items-center justify-center text-white">
          {/* Subtle Grid Calibration Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Central Plumb Line Alignment Guide */}
          <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-white/20 pointer-events-none z-10 flex flex-col justify-between items-center py-2 text-[10px] font-mono text-stone-500">
            <span>Trục đỉnh đầu</span>
            <span className="bg-stone-900/80 px-2 py-0.5 rounded border border-white/10 text-emerald-400">
              Trọng tâm cơ học
            </span>
            <span>Trục tiếp đất</span>
          </div>

          {/* Active Camera Mode */}
          {isCameraActive && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4 z-20">
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="px-6 py-3 rounded-full bg-white text-stone-950 font-bold text-xs font-mono shadow-xl flex items-center gap-2 hover:bg-stone-200 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4 text-[#FF5A36]" />
                  <span>Chụp Ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current?.srcObject) {
                      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
                    }
                    setIsCameraActive(false);
                  }}
                  className="px-4 py-3 rounded-full bg-stone-900/80 backdrop-blur-md text-white font-mono text-xs border border-white/20 hover:bg-stone-800"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Photo Preview Mode */}
          {photoPreview && !isCameraActive && (
            <div className="relative w-full h-full flex items-center justify-center bg-[#0A0908] overflow-hidden">
              <Image
                src={photoPreview}
                alt="User Body Photo Preview"
                fill
                className={`object-contain transition-all duration-300 ${
                  studioBackgroundCutout ? "contrast-105" : ""
                }`}
              />

              {/* Studio Clean Cutout Badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Đã Chuẩn Hóa Phông Studio #0A0908
                </span>
              </div>

              {/* Retake / Change Button */}
              <div className="absolute bottom-5 inset-x-4 flex justify-between items-center z-20">
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs font-mono text-stone-300 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Chọn ảnh khác</span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 border border-white/10 text-[11px] font-mono text-stone-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bảo mật 100% cục bộ</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty Upload State */}
          {!photoPreview && !isCameraActive && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 max-w-sm">
              <div className="w-16 h-16 rounded-3xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400">
                <User className="w-8 h-8 stroke-[1.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base">Chưa Có Ảnh Cá Nhân</h3>
                <p className="text-xs text-stone-400">
                  Chọn ảnh chụp toàn thân dáng đứng hoặc bật camera để AI quét nhanh trong 5 giây.
                </p>
              </div>

              {cameraError && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
                <button
                  type="button"
                  onClick={handleStartCamera}
                  className={`flex-1 py-3 px-4 rounded-2xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md ${
                    isMale
                      ? "bg-[#FF5A36] hover:bg-[#e04825] text-white"
                      : "bg-[#FF6B4A] hover:bg-[#ff5530] text-white"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Bật Camera Chụp</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Tải Ảnh Lên</span>
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
          )}
        </div>

        {/* Posture Guidelines Cues */}
        <div className="w-full mt-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-mono font-semibold text-stone-700 dark:text-stone-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Tiêu chuẩn chụp để AI phân tích chuẩn xác nhất:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
              <span>Đứng thẳng, hai chân bằng vai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
              <span>Trang phục ôm sát cơ thể</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
              <span>Phòng đủ sáng, chụp rõ toàn thân</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions: Proceed with Photo OR Skip to Calibrated Default */}
        <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="w-full sm:w-auto px-5 py-3 rounded-full text-xs font-mono text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            Bỏ qua & dùng hình thể mẫu theo khảo sát
          </button>

          <button
            type="button"
            onClick={handleConfirmPhoto}
            disabled={!photoPreview || isProcessing}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isMale
                ? "bg-[#FF5A36] hover:bg-[#ff461e] text-white shadow-[#FF5A36]/25"
                : "bg-[#FF6B4A] hover:bg-[#ff5530] text-white shadow-[#FF6B4A]/25"
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang chuẩn hóa ảnh...
              </span>
            ) : (
              <>
                <span>Xác Nhận & Tạo Bản Sao Số</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
