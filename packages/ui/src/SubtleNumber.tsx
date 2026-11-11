"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

interface SubtleNumberProps {
  value: number;
  /** Formats the value for display; digits are compared on the formatted string. */
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number) => n.toLocaleString("vi-VN");

/**
 * Number subtle change (transitions.dev 36): only the digits that changed
 * cross-fade in place, rising when the value goes up and falling when it goes
 * down. For values that update often and should stay quiet.
 */
export function SubtleNumber({ value, format = defaultFormat, className = "" }: SubtleNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const latest = useRef(value);
  const [from, setFrom] = useState(value);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (value === latest.current) return;
    setFrom(latest.current);
    latest.current = value;
    setRun((r) => r + 1);
  }, [value]);

  // Replay: remove the class, force a reflow, add it back.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || run === 0) return;
    el.classList.remove("is-animating");
    void el.offsetHeight;
    el.classList.add("is-animating");
  }, [run]);

  const prev = format(from);
  const next = format(value);
  const sameLength = run > 0 && prev.length === next.length;

  return (
    <>
      <span className="sr-only">{next}</span>
      <span
        ref={ref}
        aria-hidden
        className={`t-subtle-number ${className}`}
        style={{ "--subtle-dir": value >= from ? 1 : -1 } as React.CSSProperties}
      >
        {[...next].map((ch, i) =>
          sameLength && prev[i] === ch ? (
            <React.Fragment key={i}>{ch}</React.Fragment>
          ) : (
            <span key={`${run}-${i}`} className="t-subtle-slot">
              {sameLength && <span className="t-subtle-old">{prev[i]}</span>}
              <span className="t-subtle-new">{ch}</span>
            </span>
          )
        )}
      </span>
    </>
  );
}
