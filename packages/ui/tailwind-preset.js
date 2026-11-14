/**
 * Shared Tailwind preset for every G-AI site.
 *
 * `canvas` is the one page background used across sites:
 *   bg-canvas       light pages (warm off-white)
 *   bg-canvas-dark  dark pages (espresso black)
 * Change it here to restyle both sites at once.
 *
 * Semantic tokens (page, surface, sunken, ink, line, brand-text, positive,
 * danger) follow the theme: they read CSS variables from styles.css, which
 * switch under `data-theme="dark"`. New UI should use these plus `brand`,
 * and nothing else, so light and dark stay in step:
 *   bg-page / bg-surface / bg-sunken    backgrounds, back to front
 *   text-ink / -ink-muted / -ink-faint  text, strongest to weakest
 *   border-line                         hairlines and control borders
 *   bg-brand + text-brand-contrast      the one primary action on a screen
 *   text-brand-text                     brand-coloured text that passes AA
 *
 * The named palettes below `brand` (cream, peach, sage, ...) are legacy:
 * existing pages still use them, new work should not.
 *
 * @type {import('tailwindcss').Config}
 */
const themed = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#FAF8F5",
          dark: "#0A0908",
        },
        page: themed("page"),
        surface: themed("surface"),
        sunken: themed("sunken"),
        ink: {
          DEFAULT: themed("ink"),
          muted: themed("ink-muted"),
          faint: themed("ink-faint"),
        },
        line: themed("line"),
        positive: themed("positive"),
        danger: themed("danger"),
        brand: {
          DEFAULT: "#FF5A36",
          soft: "#FF6B4A",
          deep: "#E04825",
          // Text on a brand fill. White on #FF5A36 is only 3.1:1; this is 5.5:1.
          contrast: "#1F0F0A",
          text: themed("brand-text"),
          // Legacy, kept for the 404 page and the /store page: a darker orange
          // fill that carries white text (5.0:1). New UI uses bg-brand +
          // text-brand-contrast instead.
          action: { DEFAULT: "#C93E1A", hover: "#AE3A1C" },
        },
        cream: { 50: "#FDFCF7", 100: "#FAF7F0", 200: "#F4ECE1", 300: "#EADCCB" },
        peach: { 50: "#FFF5F2", 100: "#FFE8E2", 200: "#FFC8BA", 400: "#FF8A6E", 500: "#FF6542", 600: "#E64E2B" },
        sage: { 50: "#F2F9F5", 100: "#E1F2E9", 200: "#C3E5D4", 400: "#60B88B", 500: "#369B67", 600: "#277B50" },
        sunshine: { 50: "#FFFBEB", 100: "#FEF3C7", 400: "#FBBF24", 500: "#F59E0B" },
        pitch: "#121314",
        ecru: { 50: "#FAF9F5", 100: "#F5F3EF", 200: "#EFECE6", 300: "#E3DFD7" },
        espresso: { 700: "#4D3B36", 800: "#3D2D29", 900: "#2B1F1C" },
        terracotta: { 500: "#E85A37", 600: "#D34B29" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        // Headlines only: one per screen in the app, freely on marketing pages.
        // Each app loads the face as --font-display (Archivo, width axis);
        // without it this falls back to Inter.
        display: /** @type {[string[], { fontVariationSettings: string }]} */ ([
          ["var(--font-display)", "var(--font-inter)", "Inter", "system-ui", "sans-serif"],
          { fontVariationSettings: '"wdth" 78' },
        ]),
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
