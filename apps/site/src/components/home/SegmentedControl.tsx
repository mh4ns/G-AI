"use client";

import React from "react";

/** Shared class strings for the landing page sections. */
export const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export const SECTION_HEADING =
  "text-balance font-display text-4xl font-black uppercase leading-[1.08] tracking-[-0.01em] text-ink sm:text-5xl";

interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  /** Accessible name for the group, e.g. "Lọc sản phẩm". */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Pill switch used for the hero programme, gallery filter and store filter. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex max-w-full rounded-full border border-line bg-surface p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`h-9 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-200 ${FOCUS_RING} ${
              active ? "bg-ink text-page" : "text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
