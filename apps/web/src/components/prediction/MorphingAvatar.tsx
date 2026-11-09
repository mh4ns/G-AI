"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Sparkles,
  Camera,
  RotateCcw,
  AlertCircle,
  Columns,
  Activity,
  Loader2,
  Lock,
} from "lucide-react";

/** User photos and generated predictions must not be copied into Next's shared image-optimizer cache. */
function isPrivateImage(src: string | undefined): boolean {
  return !!src && (src.startsWith("data:") || src.startsWith("/api/prediction/image/"));
}
import { SEMANTIC_COLORS } from "@/lib/design-tokens";

export interface MorphingAvatarProps {
  progress: number; // 0.0 to 1.0 (from currentDay / 28)
  viewMode: "profile" | "front" | "threeQuarter";
  onViewModeChange?: (mode: "profile" | "front" | "threeQuarter") => void;
  activeHotspot: string | null;
  onSelectHotspot: (hotspot: string) => void;
  archetype?: "female_pilates" | "male_strength";
  currentDay?: number;
  customMilestones?: string[];
  userPhoto?: string | null;
  onOpenUploadModal?: () => void;
  isGenerating?: boolean;
  generationProgress?: { current: number; total: number; stageMessage: string };
  generationError?: string | null;
  onRetryGeneration?: () => void;
  isMock?: boolean;
  hasSidePhoto?: boolean;
  completedMilestones?: Record<number, string>;
}

export const MorphingAvatar: React.FC<MorphingAvatarProps> = ({
  progress,
  viewMode,
  onViewModeChange,
  activeHotspot,
  onSelectHotspot,
  archetype = "female_pilates",
  currentDay = 0,
  customMilestones,
  userPhoto,
  onOpenUploadModal,
  isGenerating = false,
  generationProgress,
  generationError = null,
  onRetryGeneration,
  isMock = false,
  hasSidePhoto = false,
  completedMilestones,
}) => {
  // Mode States
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparePos, setComparePos] = useState<number>(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false); // Step 3 & 6: Default OFF
  const [hasError, setHasError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMale = archetype === "male_strength";

  // Check prefers-reduced-motion
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 4 Calibrated Milestone Images for 28-day protocol: Day 0, Day 7, Day 14, Day 28
  const defaultCutouts = isMale
    ? {
        0: userPhoto || "/twins/male-day-0.png",
        7: "/twins/male-day-7.png",
        14: "/twins/male-day-14.png",
        28: "/twins/male-day-28.png",
      }
    : {
        0: userPhoto || "/twins/female-day-0.png",
        7: "/twins/female-day-7.png",
        14: "/twins/female-day-14.png",
        28: "/twins/female-day-28.png",
      };

  const milestoneImages = {
    0: userPhoto || defaultCutouts[0],
    7: completedMilestones?.[7] || (customMilestones && customMilestones[1]) || defaultCutouts[7],
    14: completedMilestones?.[14] || (customMilestones && customMilestones[2]) || defaultCutouts[14],
    28: completedMilestones?.[28] || (customMilestones && (customMilestones.length === 4 ? customMilestones[3] : (customMilestones[4] || customMilestones[3]))) || defaultCutouts[28],
  };

  // Determine closest milestone day (0, 7, 14, 28)
  const milestoneDays = [0, 7, 14, 28];
  const activeMilestoneDay = milestoneDays.reduce((closest, d) =>
    Math.abs(d - currentDay) < Math.abs(closest - currentDay) ? d : closest
  , 0);

  // Check if current milestone image has finished generating
  const isCurrentMilestonePending =
    isGenerating &&
    activeMilestoneDay > 0 &&
    !completedMilestones?.[activeMilestoneDay];

  // Comparison target image: if Day 0 is selected, compare with Day 28; else compare Day 0 with current milestone
  const compareTargetDay = activeMilestoneDay === 0 ? 28 : activeMilestoneDay;
  const compareTargetTitle =
    compareTargetDay === 7
      ? "Tuần 1"
      : compareTargetDay === 14
      ? "Tuần 2"
      : "Tuần 4 (Mục tiêu)";

  // Mouse & Touch Dragging for Before/After Slider
  const updateSplitPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = Math.round((x / rect.width) * 100);
    setComparePos(percent);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isComparing) return;
    setIsDragging(true);
    updateSplitPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isComparing) return;
    setIsDragging(true);
    if (e.touches[0]) updateSplitPosition(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isComparing || !isDragging) return;
    if (e.touches[0]) updateSplitPosition(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) updateSplitPosition(e.clientX);
    };
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateSplitPosition]);

  // Biomechanical coordinate calculations for Skeleton Overlay
  // Day 0 Ghost Line (Deviated baseline)
  const day0HeadX = 160 + 24 * 0.7; // ~176.8
  const day0ThoracicX = 160 - 22 * 0.7; // ~144.6
  const day0CoreX = 160 + 24 * 0.4; // ~169.6
  const day0PelvisX = 160 - 16 * 0.4; // ~153.6

  // Current Posture Calculations (adapts with progress 0.0 -> 1.0)
  const headOffset = 24 * (1 - progress) + 2 * progress;
  const kyphosisOffset = 22 * (1 - progress) + 3 * progress;
  const pelvicOffset = 16 * (1 - progress) + 1 * progress;
  const currentAngleDeg = Math.round(18 * (1 - progress));

  const currentHeadX = 160 + headOffset * 0.7;
  const currentThoracicX = 160 - kyphosisOffset * 0.7;
  const currentCoreX = 160 + headOffset * 0.4;
  const currentPelvisX = 160 - pelvicOffset * 0.4;

  const statusColor =
    progress > 0.75
      ? SEMANTIC_COLORS.success
      : progress > 0.35
      ? SEMANTIC_COLORS.warning
      : SEMANTIC_COLORS.primary;

  const statusLabel =
    progress > 0.75
      ? "Trục dóng tối ưu (0° lệch)"
      : progress > 0.35
      ? `Cơ dựng sống nâng thẳng (${currentAngleDeg}° lệch)`
      : `Độ đổ thân trước & gù (${currentAngleDeg}° lệch)`;

  return (
    <div className="w-full flex flex-col items-center select-none font-sans">
      {/* 1. Top Controls Bar: View Mode Tabs (Nghiêng / Chính diện) + Actions */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5 mb-3 px-1">
        {/* View Mode Tabs (Small Pill Tabs) */}
        {onViewModeChange && (
          <div
            role="tablist"
            aria-label="Chọn góc nhìn cơ thể"
            className="inline-flex items-center p-1 rounded-full bg-stone-900 border border-stone-800 backdrop-blur-md shadow-sm"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "profile"}
              disabled={!hasSidePhoto}
              onClick={() => hasSidePhoto && onViewModeChange("profile")}
              title={hasSidePhoto ? "Xem góc nghiêng" : "Chụp thêm ảnh nghiêng để xem góc này"}
              className={`px-3 py-1 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 ${
                !hasSidePhoto
                  ? "text-stone-500 cursor-not-allowed opacity-60"
                  : viewMode === "profile"
                  ? "bg-[#FF5A36] text-white font-bold shadow-md shadow-[#FF5A36]/30"
                  : "text-stone-300 hover:text-white font-medium"
              }`}
            >
              {!hasSidePhoto && <Lock className="w-3 h-3 text-stone-500" />}
              <span>Góc nghiêng</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "front"}
              onClick={() => onViewModeChange("front")}
              className={`px-3 py-1 rounded-full text-xs transition-all duration-200 ${
                viewMode === "front"
                  ? "bg-[#FF5A36] text-white font-bold shadow-md shadow-[#FF5A36]/30"
                  : "text-stone-300 hover:text-white font-medium"
              }`}
            >
              Chính diện
            </button>
          </div>
        )}

        {/* Feature Switches: So Sánh Trước/Sau & Khung Xương */}
        <div className="flex items-center gap-2">
          {/* Skeleton Overlay Switch (Mặc định tắt) */}
          <button
            type="button"
            onClick={() => setShowSkeleton((prev) => !prev)}
            aria-pressed={showSkeleton}
            aria-label="Bật hoặc tắt lớp phủ khung xương"
            className={`px-3 py-1.5 rounded-full border text-xs font-sans transition-all flex items-center gap-1.5 active:scale-95 ${
              showSkeleton
                ? "bg-[#FF5A36]/20 border-[#FF5A36] text-white font-bold shadow-sm shadow-[#FF5A36]/20"
                : "bg-stone-900/90 border-stone-800 text-stone-300 hover:text-white"
            }`}
            title="Bật/tắt lớp phủ khung xương và trục dóng giải phẫu"
          >
            <Activity className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>Khung xương</span>
            {showSkeleton && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />}
          </button>

          {/* Before / After Comparison Toggle */}
          <button
            type="button"
            onClick={() => setIsComparing((prev) => !prev)}
            aria-pressed={isComparing}
            aria-label="Bật thanh kéo so sánh trước sau"
            className={`px-3 py-1.5 rounded-full border text-xs font-sans transition-all flex items-center gap-1.5 active:scale-95 ${
              isComparing
                ? "bg-white text-stone-900 font-bold border-white shadow-md"
                : "bg-stone-900/90 border-stone-800 text-stone-300 hover:text-white"
            }`}
            title="Bật thanh kéo so sánh trước/sau trực quan"
          >
            <Columns className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>So sánh</span>
          </button>

          {/* Photo Upload / Change Trigger */}
          {onOpenUploadModal && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="px-2.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition-colors"
              title="Cập nhật ảnh thật thể trạng"
              aria-label="Cập nhật ảnh thật thể trạng"
            >
              <Camera className="w-3.5 h-3.5 text-[#FF5A36]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Central Fixed Aspect-Ratio Visualizer Card (Zero Layout Shift) */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full max-w-[420px] mx-auto aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-b from-[#141210] to-[#0A0908] border border-stone-800 shadow-2xl ${
          isComparing ? "cursor-ew-resize select-none" : ""
        }`}
      >
        {/* Mock Badge (Displayed ONLY when using placeholder silhouettes) */}
        {isMock && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 backdrop-blur-md text-[11px] font-bold text-amber-300 shadow-md pointer-events-none">
            ẢNH MẪU · CHƯA PHẢI ẢNH THẬT
          </div>
        )}

        {/* Subtle Radial Floor Glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-25"
          style={{
            background: `radial-gradient(circle at 50% 85%, ${statusColor} 0%, transparent 65%)`,
          }}
        />

        {/* Ambient Ground Pedestal */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-52 h-8 rounded-[100%] bg-stone-900/90 blur-md pointer-events-none border border-stone-800/40" />

        {/* --- STATE 1: GENERATING / CALCULATION OVERLAY --- */}
        {isGenerating && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stone-950/85 backdrop-blur-md p-6 text-center">
            <div className="relative w-14 h-14 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-center mb-3 shadow-xl">
              <Loader2 className="w-7 h-7 text-[#FF5A36] animate-spin" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-xs font-bold text-[#FF5A36] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Đang tạo sinh ({generationProgress?.current || 0}/{generationProgress?.total || 3} ảnh)
              </span>
            </div>
            <p className="text-xs font-sans text-stone-300 max-w-xs leading-relaxed">
              {generationProgress?.stageMessage || "AI đang giữ nguyên nhận diện và điều chỉnh tỉ lệ mỡ cơ..."}
            </p>
          </div>
        )}

        {/* --- STATE 2: ERROR STATE WITH RETRY (No silent mock replacement) --- */}
        {generationError && !isGenerating && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stone-950/92 backdrop-blur-md p-6 text-center">
            <AlertCircle className="w-10 h-10 text-[#FF5A36] mb-3" />
            <h5 className="text-sm font-bold text-white mb-1.5">Không thể tạo sinh ảnh dự đoán</h5>
            <p className="text-xs text-stone-300 mb-4 max-w-xs leading-relaxed">
              {generationError}
            </p>
            {onRetryGeneration && (
              <button
                onClick={onRetryGeneration}
                aria-label="Thử tạo lại ảnh"
                className="px-5 py-2.5 rounded-full bg-[#FF5A36] hover:bg-[#e04825] text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-[#FF5A36]/30 transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white" />
                <span>Thử lại</span>
              </button>
            )}
          </div>
        )}

        {/* --- STATE 3: PENDING MILESTONE SPECIFIC SKELETON --- */}
        {isCurrentMilestonePending && !generationError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/70 backdrop-blur-sm p-6 text-center animate-pulse">
            <div className="w-24 h-48 rounded-2xl bg-stone-900 border border-stone-800 mb-3" />
            <p className="text-xs font-medium text-stone-300">
              Đang hoàn thiện mốc {activeMilestoneDay === 7 ? "Tuần 1" : activeMilestoneDay === 14 ? "Tuần 2" : "Tuần 4"}...
            </p>
          </div>
        )}

        {/* --- MODE A: STANDARD CROSS-FADE 300MS BETWEEN 4 MILESTONES --- */}
        {!isComparing && (
          <div className="absolute inset-0 p-4 pb-10 flex items-center justify-center pointer-events-none">
            {milestoneDays.map((day) => {
              const isSelected = activeMilestoneDay === day;
              const imgSrc = milestoneImages[day as keyof typeof milestoneImages];

              return (
                <div
                  key={day}
                  className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                    isSelected ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
                  }`}
                  style={{
                    transitionDuration: isReducedMotion ? "0ms" : "300ms",
                  }}
                >
                  <Image
                    src={imgSrc}
                    unoptimized={isPrivateImage(imgSrc)}
                    alt={`Hình thể dự đoán mốc ngày ${day}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] filter contrast-[1.04] brightness-105"
                    priority={day === 0 || day === activeMilestoneDay}
                    onError={() => setHasError(true)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* --- MODE B: BEFORE / AFTER INTERACTIVE COMPARISON SLIDER --- */}
        {isComparing && (
          <div className="absolute inset-0 p-4 pb-10 overflow-hidden">
            {/* Layer 1: BEFORE Image (Day 0) - Base underlayer */}
            <div className="absolute inset-0 p-4 pb-10">
              <Image
                src={milestoneImages[0]}
                unoptimized={isPrivateImage(milestoneImages[0])}
                alt="Trước - Ngày 0"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] filter contrast-[1.04] grayscale-[0.2]"
              />
            </div>

            {/* Layer 2: AFTER Image (Target Milestone) - Overlaid and clipped */}
            <div
              className="absolute inset-0 p-4 pb-10 pointer-events-none transition-none"
              style={{
                clipPath: `inset(0 0 0 ${comparePos}%)`,
              }}
            >
              <Image
                src={milestoneImages[compareTargetDay as keyof typeof milestoneImages]}
                unoptimized={isPrivateImage(milestoneImages[compareTargetDay as keyof typeof milestoneImages])}
                alt={`Sau - ${compareTargetTitle}`}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] filter contrast-[1.04] brightness-105"
              />
            </div>

            {/* Draggable Vertical Split Divider Line */}
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none"
              style={{ left: `${comparePos}%` }}
            >
              {/* Vertical Glowing Line */}
              <div className="absolute inset-y-0 -left-[1px] w-[2px] bg-white shadow-[0_0_12px_rgba(255,90,54,0.8)]" />

              {/* Centered Draggable Thumb Button */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#FF5A36] text-white flex items-center justify-center border-2 border-white shadow-xl shadow-black/80 ring-4 ring-[#FF5A36]/40">
                <span className="text-xs font-mono font-bold">↔</span>
              </div>
            </div>

            {/* Dynamic Comparison Badges (Sentence case, clean typography) */}
            <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-xs font-medium text-stone-200">
              Trước · Ngày 0
            </div>
            <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-[#FF5A36]/90 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-md">
              Sau · {compareTargetTitle}
            </div>
          </div>
        )}

        {/* --- OPTIONAL SKELETON OVERLAY (CÔNG TẮC KHUNG XƯƠNG - MẶC ĐỊNH TẮT) --- */}
        {showSkeleton && (
          <svg
            viewBox="0 0 320 500"
            className="absolute inset-0 w-full h-full z-20 pointer-events-none overflow-visible animate-in fade-in duration-300"
          >
            <defs>
              <filter id="skeletonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Vertical Plumb Line (Trục trọng tâm y sinh học chuẩn) */}
            <line
              x1="160"
              y1="40"
              x2="160"
              y2="460"
              stroke="#A8A29E"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.5"
            />

            {/* A. Ghost Silhouette of Day 0 (Bóng mờ của Day 0 để thấy độ lệch giảm dần) */}
            {progress > 0 && (
              <g opacity="0.4" className="transition-opacity duration-300">
                {/* Day 0 Ghost Spine Path */}
                <path
                  d={`M ${day0HeadX} 76 
                      Q ${day0ThoracicX} 175, ${day0CoreX} 255 
                      T ${day0PelvisX} 340`}
                  fill="none"
                  stroke="#78716C"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                {/* Day 0 Head ghost */}
                <circle cx={day0HeadX} cy="76" r="5" fill="none" stroke="#78716C" strokeWidth="1.5" />
                {/* Day 0 Thoracic ghost */}
                <circle cx={day0ThoracicX} cy="175" r="4.5" fill="none" stroke="#78716C" strokeWidth="1.5" />
                {/* Day 0 Pelvis ghost */}
                <circle cx={day0PelvisX} cy="340" r="5" fill="none" stroke="#78716C" strokeWidth="1.5" />
                {/* Day 0 Deviation indicator */}
                <text
                  x={day0HeadX + 10}
                  y="80"
                  fill="#A8A29E"
                  fontSize="10"
                  fontFamily="system-ui, sans-serif"
                  opacity="0.85"
                >
                  Day 0 (lệch 18°)
                </text>
              </g>
            )}

            {/* B. Active Current Milestone Skeleton with Step 6 Matching Hotspot Colors */}
            <g className="transition-all duration-300">
              {/* Active Spine Dynamic Curve */}
              <path
                d={`M ${currentHeadX} 76 
                    Q ${currentThoracicX} 175, ${currentCoreX} 255 
                    T ${currentPelvisX} 340`}
                fill="none"
                stroke={statusColor}
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="url(#skeletonGlow)"
              />

              {/* Cervical Node (Cổ & Vai) -> Cam #FF5A36 */}
              <circle
                cx={currentHeadX}
                cy="76"
                r="7"
                fill={activeHotspot === "cervical" ? "#FFFFFF" : SEMANTIC_COLORS.hotspots.cervical.color}
                stroke={SEMANTIC_COLORS.hotspots.cervical.color}
                strokeWidth={activeHotspot === "cervical" ? "3" : "1.5"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("cervical")}
                aria-label="Khớp cổ và vai gáy"
              />

              {/* Thoracic Node (Lưng Trên) -> Xanh dương #38BDF8 */}
              <circle
                cx={currentThoracicX}
                cy="175"
                r="6.5"
                fill={activeHotspot === "thoracic" ? "#FFFFFF" : SEMANTIC_COLORS.hotspots.thoracic.color}
                stroke={SEMANTIC_COLORS.hotspots.thoracic.color}
                strokeWidth={activeHotspot === "thoracic" ? "3" : "1.5"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("thoracic")}
                aria-label="Khớp cột sống lưng trên"
              />

              {/* Core & Lumbar Node (Cơ Bụng Sâu) -> Xanh lá #10B981 */}
              <circle
                cx={currentCoreX}
                cy="255"
                r="6.5"
                fill={activeHotspot === "core" ? "#FFFFFF" : SEMANTIC_COLORS.hotspots.core.color}
                stroke={SEMANTIC_COLORS.hotspots.core.color}
                strokeWidth={activeHotspot === "core" ? "3" : "1.5"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("core")}
                aria-label="Vùng cơ bụng và eo"
              />

              {/* Pelvis Node (Khung Chậu) -> Vàng #F59E0B */}
              <circle
                cx={currentPelvisX}
                cy="340"
                r="7"
                fill={activeHotspot === "pelvis" ? "#FFFFFF" : SEMANTIC_COLORS.hotspots.pelvis.color}
                stroke={SEMANTIC_COLORS.hotspots.pelvis.color}
                strokeWidth={activeHotspot === "pelvis" ? "3" : "1.5"}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectHotspot("pelvis")}
                aria-label="Vùng khung chậu và hông"
              />

              {/* Legs / Foundation Alignment */}
              <line
                x1={currentPelvisX}
                y1="340"
                x2="158"
                y2="410"
                stroke={statusColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="158" cy="410" r="4" fill={statusColor} />
              <line
                x1="158"
                y1="410"
                x2="160"
                y2="455"
                stroke={statusColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="160" cy="455" r="4.5" fill="#FFFFFF" stroke={statusColor} strokeWidth="1.5" />
            </g>
          </svg>
        )}

        {/* Floating Bottom Status Pill */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 text-xs font-sans text-stone-200 bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: statusColor }}
            />
            <span className="font-medium truncate">{statusLabel}</span>
          </div>

          <span className="text-xs text-stone-300 font-bold shrink-0">
            {activeMilestoneDay === 0
              ? "Khởi điểm"
              : activeMilestoneDay === 7
              ? "Tuần 1"
              : activeMilestoneDay === 14
              ? "Tuần 2"
              : "Tuần 4"}
          </span>
        </div>
      </div>
    </div>
  );
};
