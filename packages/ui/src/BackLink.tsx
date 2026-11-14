"use client";

import React from "react";
import { hasPreviousPage } from "./history";

export interface BackLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /** Where to go when no page is behind this one (bookmark, new tab). */
  fallbackHref: string;
}

/**
 * Back button that returns to the page the visitor came from, on any of the three sites.
 * It is a real link to `fallbackHref`, so it still works without a previous page, before
 * hydration, and when opened in a new tab.
 */
export const BackLink: React.FC<BackLinkProps> = ({ fallbackHref, onClick, children, ...rest }) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // Leave modified clicks (new tab, new window) to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!hasPreviousPage(window)) return;
    event.preventDefault();
    window.history.back();
  };

  return (
    <a href={fallbackHref} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
