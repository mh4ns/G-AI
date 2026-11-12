import type { Config } from "tailwindcss";
import sharedPreset from "@g-ai/ui/tailwind-preset";

const config: Config = {
  presets: [sharedPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // Shared components ship class names too.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  plugins: [],
};
export default config;
