import React from "react";
import { BrandLogo } from "./BrandLogo";

interface NotFoundPageProps {
  /** Where "back" goes: the app's own home. */
  homeHref: string;
  homeLabel: string;
}

/** Shared 404 for every G-AI app, in Vietnamese and on the shared canvas. */
export function NotFoundPage({ homeHref, homeLabel }: NotFoundPageProps) {
  return (
    <main className="min-h-screen bg-canvas text-stone-900 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="flex justify-center">
          <BrandLogo isLight size="lg" />
        </div>
        <p className="mt-8 text-sm font-semibold text-stone-600">Lỗi 404</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">Không tìm thấy trang này</h1>
        <p className="mt-4 text-base text-stone-600 leading-relaxed">
          Đường dẫn có thể đã đổi hoặc bị gõ nhầm. Quay lại trang chính để tiếp tục.
        </p>
        <a
          href={homeHref}
          className="mt-8 min-h-12 px-7 rounded-full bg-brand-action hover:bg-brand-action-hover text-white font-semibold text-base inline-flex items-center justify-center transition-colors"
        >
          {homeLabel}
        </a>
      </div>
    </main>
  );
}
