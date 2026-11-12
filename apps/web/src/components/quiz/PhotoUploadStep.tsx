"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  Camera, 
  Upload, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  ArrowRight, 
  User, 
  AlertCircle,
} from "lucide-react";

interface PhotoUploadStepProps {
  onPhotoSubmit: (photoBase64: string | null) => void;
  onSkip: () => void;
}

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
  onPhotoSubmit,
  onSkip,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
      streamRef.current = stream;
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
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Quét hình thể & dáng đứng cá nhân
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
          Tải ảnh toàn thân hoặc chụp qua camera để G-AI tạo ảnh minh họa vóc dáng 28 ngày từ chính ảnh của bạn. Ảnh lưu trên trình duyệt này và chỉ được gửi đi khi bạn đồng ý tạo dự đoán.
        </p>
      </div>

      {/* Main Interactive Stage */}
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Visual Box / Camera Preview */}
        <div className="w-full relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden border border-stone-800 bg-canvas-dark shadow-2xl flex flex-col items-center justify-center text-white">
          {/* Subtle Grid Calibration Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Centre line to help line up head and feet, only while framing a shot. */}
          {isCameraActive && (
            <div aria-hidden className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-white/40 pointer-events-none z-10" />
          )}

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
                  className="px-6 py-3 rounded-full bg-white text-stone-950 font-bold text-xs shadow-xl flex items-center gap-2 hover:bg-stone-200 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4 text-brand-action" />
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
                  className="px-4 py-3 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-xs border border-white/20 hover:bg-stone-800"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Photo Preview Mode */}
          {photoPreview && !isCameraActive && (
            <div className="relative w-full h-full flex items-center justify-center bg-canvas-dark overflow-hidden">
              <Image
                src={photoPreview}
                alt="User Body Photo Preview"
                fill
                className="object-contain transition-all duration-300 contrast-105"
              />

              {/* Studio Clean Cutout Badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Đã chuẩn hóa phông Studio #0A0908
                </span>
              </div>

              {/* Retake / Change Button */}
              <div className="absolute bottom-5 inset-x-4 flex justify-between items-center z-20">
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs text-stone-300 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Chọn ảnh khác</span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 border border-white/10 text-xs text-stone-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chỉ gửi đi khi bạn đồng ý</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty Upload State */}
          {!photoPreview && !isCameraActive && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 max-w-sm">
              <div className="w-16 h-16 rounded-3xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500">
                <User className="w-8 h-8 stroke-[1.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base">Chưa có ảnh cá nhân</h3>
                <p className="text-sm text-stone-300">
                  Chọn ảnh chụp toàn thân dáng đứng, hoặc bật camera để chụp ngay.
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
                  className="flex-1 min-h-12 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md bg-brand-action hover:bg-brand-action-hover text-white"
                >
                  <Camera className="w-4 h-4" />
                  <span>Bật camera chụp</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 min-h-12 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Tải ảnh lên</span>
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
          <div className="flex items-center gap-2 font-semibold text-stone-700 dark:text-stone-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Tiêu chuẩn chụp để AI phân tích chuẩn xác nhất:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-500 dark:text-stone-500 ">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-action" />
              <span>Đứng thẳng, hai chân bằng vai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-action" />
              <span>Trang phục ôm sát cơ thể</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-action" />
              <span>Phòng đủ sáng, chụp rõ toàn thân</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions: Proceed with Photo OR Skip to Calibrated Default */}
        <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="w-full sm:w-auto min-h-12 px-6 rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-800 hover:border-stone-500 transition-colors"
          >
            Bỏ qua, dùng hình mẫu
          </button>

          <button
            type="button"
            onClick={handleConfirmPhoto}
            disabled={!photoPreview || isProcessing}
            className="w-full sm:w-auto min-h-12 px-8 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed bg-brand-action hover:bg-brand-action-hover text-white"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang chuẩn hóa ảnh...
              </span>
            ) : (
              <>
                <span>Xác nhận & tạo dự đoán</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
