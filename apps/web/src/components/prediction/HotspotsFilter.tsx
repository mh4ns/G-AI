"use client";

import React from "react";
import { SEMANTIC_COLORS } from "@/lib/design-tokens";

export type HotspotKey = "cervical" | "thoracic" | "core" | "pelvis";

interface HotspotsFilterProps {
  activeHotspot: string | null;
  onSelectHotspot: (hotspot: HotspotKey) => void;
}

interface HotspotDefinition {
  key: HotspotKey;
  label: string;
  activeBgBorder: string;
  color: string;
}

const HOTSPOTS: HotspotDefinition[] = [
  {
    key: "cervical",
    label: "Cổ & vai gáy",
    activeBgBorder: "bg-brand/15 border-brand text-white font-bold",
    color: SEMANTIC_COLORS.hotspots.cervical.color,
  },
  {
    key: "thoracic",
    label: "Lưng trên",
    activeBgBorder: "bg-sky-500/15 border-sky-400 text-white font-bold",
    color: SEMANTIC_COLORS.hotspots.thoracic.color,
  },
  {
    key: "core",
    label: "Cơ bụng & eo",
    activeBgBorder: "bg-emerald-500/15 border-emerald-400 text-white font-bold",
    color: SEMANTIC_COLORS.hotspots.core.color,
  },
  {
    key: "pelvis",
    label: "Khung chậu & mông",
    activeBgBorder: "bg-amber-500/15 border-amber-400 text-white font-bold",
    color: SEMANTIC_COLORS.hotspots.pelvis.color,
  },
];

export function HotspotsFilter({ activeHotspot, onSelectHotspot }: HotspotsFilterProps) {
  return (
    <div className="w-full flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 text-xs select-none">
      {HOTSPOTS.map((h) => {
        const isActive = activeHotspot === h.key;
        return (
          <button
            key={h.key}
            type="button"
            onClick={() => onSelectHotspot(h.key)}
            className={`min-h-11 flex items-center gap-1.5 transition-colors px-3 rounded-xl border ${
              isActive
                ? h.activeBgBorder
                : "bg-stone-950 border-stone-800/80 text-stone-300 hover:text-white"
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: h.color }}
            />
            <span>{h.label}</span>
          </button>
        );
      })}
    </div>
  );
}
