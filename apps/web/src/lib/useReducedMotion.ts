"use client";

import { useEffect, useState } from "react";

/**
 * Hydration-safe prefers-reduced-motion hook.
 * Always returns `false` on SSR and the initial client render pass, then
 * synchronizes with `window.matchMedia` and listens for changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return reduced;
}
