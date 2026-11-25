"use client";

import React, { useCallback, useLayoutEffect, useRef } from "react";

export interface SlidingTabOption<T extends string> {
  value: T;
  label: string;
}

export interface SlidingTabsProps<T extends string> {
  options: readonly SlidingTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Tabs sliding (transitions.dev 16): one pill travels to the selected option.
 * Colours come from the --tabs-* tokens, which follow [data-theme] on an
 * ancestor. Arrow, Home, and End keys move the selection, as in a native tablist.
 */
export function SlidingTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "lg",
  className = "",
}: SlidingTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
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

  // Snap (no transition) on resize, container/tab layout shifts, and once web
  // fonts settle; registered once so a selection change never skips the slide.
  const moveRef = useRef(moveTo);
  moveRef.current = moveTo;
  useLayoutEffect(() => {
    const onResize = () => moveRef.current(false);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize).catch(() => undefined);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && listRef.current) {
      observer = new ResizeObserver(onResize);
      observer.observe(listRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (options.length === 0) return;
    let next: number | null = null;
    if (e.key === "ArrowRight") {
      next = (index + 1) % options.length;
    } else if (e.key === "ArrowLeft") {
      next = (index - 1 + options.length) % options.length;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = options.length - 1;
    }
    if (next === null) return;
    e.preventDefault();
    onChange(options[next].value);
    tabRefs.current[next]?.focus();
  };

  const sizeClass = size === "sm" ? "t-tabs--sm" : "t-tabs--lg";

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`t-tabs ${sizeClass} max-w-full ${className}`}
    >
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
