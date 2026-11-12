"use client";

import React, { useCallback, useLayoutEffect, useRef } from "react";

export interface SlidingTabOption<T extends string> {
  value: T;
  label: string;
}

interface SlidingTabsProps<T extends string> {
  options: readonly SlidingTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Tabs sliding (transitions.dev 16): one pill travels to the selected option.
 * Colours come from the --tabs-* tokens, which follow [data-theme] on an
 * ancestor. Arrow keys move the selection, as in a native tablist.
 */
export function SlidingTabs<T extends string>({ options, value, onChange, ariaLabel, className = "" }: SlidingTabsProps<T>) {
  const pillRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const placed = useRef(false);

  const moveTo = useCallback(
    (animate: boolean) => {
      const pill = pillRef.current;
      const tab = tabRefs.current[options.findIndex((o) => o.value === value)];
      if (!pill || !tab) return;
      if (!animate) {
        // Snap without a transition so the pill never animates in from 0.
        const prev = pill.style.transition;
        pill.style.transition = "none";
        pill.style.transform = `translateX(${tab.offsetLeft}px)`;
        pill.style.width = `${tab.offsetWidth}px`;
        void pill.offsetWidth;
        pill.style.transition = prev;
      } else {
        pill.style.transform = `translateX(${tab.offsetLeft}px)`;
        pill.style.width = `${tab.offsetWidth}px`;
      }
    },
    [options, value]
  );

  useLayoutEffect(() => {
    moveTo(placed.current);
    placed.current = true;
  }, [moveTo]);

  // Snap (no transition) on resize and once web fonts settle; registered once
  // so a selection change never re-runs the snap and skips the slide.
  const moveRef = useRef(moveTo);
  moveRef.current = moveTo;
  useLayoutEffect(() => {
    const onResize = () => moveRef.current(false);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize).catch(() => undefined);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    tabRefs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={ariaLabel} className={`t-tabs t-tabs--lg ${className}`}>
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className="t-tab text-sm whitespace-nowrap"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
