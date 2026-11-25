import React from "react";
import { BrandLogo } from "./BrandLogo";
import { homeUrl } from "./links";

interface NotFoundPageProps {
  /** The app's own main page, offered as the way out of the 404. */
  homeHref: string;
  homeLabel: string;
  /** Where the logo goes: the brand site's home. Inside apps/site pass "/". */
  logoHref?: string;
}

/** Shared 404 for every G-AI app, in Vietnamese and on the shared canvas. */
export function NotFoundPage({ homeHref, homeLabel, logoHref = homeUrl() }: NotFoundPageProps) {
  return (
    <main className="min-h-screen bg-page text-ink flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="flex justify-center">
          <a href={logoHref} aria-label="G-AI – trang chủ" className="inline-flex rounded-lg">
            <BrandLogo tone="light" size="lg" />
          </a>
        </div>
        <p className="mt-8 text-sm font-semibold text-ink-muted">Lỗi 404</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">Không tìm thấy trang này</h1>
        <p className="mt-4 text-base text-ink-muted leading-relaxed">
          Đường dẫn có thể đã đổi hoặc bị gõ nhầm. Quay lại trang chính để tiếp tục.
        </p>
        <a
          href={homeHref}
          className="mt-8 min-h-12 px-7 rounded-full bg-brand hover:bg-brand-soft text-brand-contrast font-semibold text-base inline-flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {homeLabel}
        </a>
      </div>
    </main>
  );
}
