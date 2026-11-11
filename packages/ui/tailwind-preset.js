/**
 * Shared Tailwind preset for every G-AI site.
 *
 * `canvas` is the one page background used across sites:
 *   bg-canvas       light pages (warm off-white)
 *   bg-canvas-dark  dark pages (espresso black)
 * Change it here to restyle both sites at once.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#FAF8F5",
          dark: "#0A0908",
        },
        // brand: the accent for fills, borders and orange text on dark grounds.
        // brand-action: buttons and orange text on light grounds. White on it
        // is 5.0:1 and it is 4.7:1 on the canvas; brand itself is only 3.1:1
        // with white, so it never carries text.
        brand: {
          DEFAULT: "#FF5A36",
          soft: "#FF6B4A",
          deep: "#E04825",
          action: { DEFAULT: "#C93E1A", hover: "#AE3A1C" },
        },
        cream: { 50: "#FDFCF7", 100: "#FAF7F0", 200: "#F4ECE1", 300: "#EADCCB" },
        peach: { 50: "#FFF5F2", 100: "#FFE8E2", 200: "#FFC8BA", 400: "#FF8A6E", 500: "#FF6542", 600: "#E64E2B" },
        sage: { 50: "#F2F9F5", 100: "#E1F2E9", 200: "#C3E5D4", 400: "#60B88B", 500: "#369B67", 600: "#277B50" },
        lavender: { 50: "#F8F7FF", 100: "#EFEAFD", 200: "#DCD4FA", 400: "#A78BFA", 500: "#8B5CF6" },
        sunshine: { 50: "#FFFBEB", 100: "#FEF3C7", 400: "#FBBF24", 500: "#F59E0B" },
        pitch: "#121314",
        ecru: { 50: "#FAF9F5", 100: "#F5F3EF", 200: "#EFECE6", 300: "#E3DFD7" },
        espresso: { 700: "#4D3B36", 800: "#3D2D29", 900: "#2B1F1C" },
        terracotta: { 500: "#E85A37", 600: "#D34B29" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        // Headings. Loaded per app with next/font (Be Vietnam Pro).
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(230, 78, 43, 0.08)",
        card: "0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
        glow: "0 0 25px rgba(255, 101, 66, 0.25)",
      },
      borderRadius: {
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
    },
  },
};
