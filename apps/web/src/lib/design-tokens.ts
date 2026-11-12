/**
 * Design Tokens for G-AI Prediction & Biomechanical Studio
 * Implements semantic color system and anatomical region tokens.
 */

export const SEMANTIC_COLORS = {
  // Primary brand & active actions
  primary: "#FF5A36", // Cam: hành động chính + mốc đang chọn
  primaryHover: "#E64E2B",
  primaryBg: "rgba(255, 90, 54, 0.15)",
  primaryBorder: "rgba(255, 90, 54, 0.4)",
  primaryGlow: "rgba(255, 90, 54, 0.35)",

  // Outcome indicators
  success: "#10B981", // Xanh lá: cải thiện / số giảm tốt
  successBg: "rgba(16, 185, 129, 0.15)",
  successBorder: "rgba(16, 185, 129, 0.3)",

  warning: "#F59E0B", // Vàng: cần chú ý / đang thích nghi
  warningBg: "rgba(245, 158, 11, 0.15)",
  warningBorder: "rgba(245, 158, 11, 0.3)",

  info: "#38BDF8", // Xanh dương: thông tin trung tính
  infoBg: "rgba(56, 189, 248, 0.15)",
  infoBorder: "rgba(56, 189, 248, 0.3)",

  // Neutral tones with high contrast (>= 4.5:1 on dark)
  textPrimary: "#F5F5F4", // stone-100
  textSecondary: "#D6D3D1", // stone-300
  textMuted: "#A8A29E", // stone-400 (sufficient contrast >= 4.5:1 on black)

  // Anatomical Hotspots Mapping (Must strictly match between overlay, legend, and details)
  hotspots: {
    cervical: {
      id: "cervical",
      name: "Cổ & vai gáy",
      shortName: "Cổ & Vai",
      color: "#FF5A36", // Cam
      bg: "rgba(255, 90, 54, 0.15)",
      border: "rgba(255, 90, 54, 0.4)",
      badgeClass: "text-brand border-brand/40 bg-brand/10",
    },
    thoracic: {
      id: "thoracic",
      name: "Lưng trên (gù)",
      shortName: "Lưng Trên",
      color: "#38BDF8", // Xanh dương
      bg: "rgba(56, 189, 248, 0.15)",
      border: "rgba(56, 189, 248, 0.4)",
      badgeClass: "text-[#38BDF8] border-[#38BDF8]/40 bg-[#38BDF8]/10",
    },
    core: {
      id: "core",
      name: "Cơ bụng sâu & eo",
      shortName: "Bụng & Eo",
      color: "#10B981", // Xanh lá
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.4)",
      badgeClass: "text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10",
    },
    pelvis: {
      id: "pelvis",
      name: "Khung chậu & mông",
      shortName: "Khung Chậu",
      color: "#F59E0B", // Vàng
      bg: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.4)",
      badgeClass: "text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10",
    },
  },
} as const;
