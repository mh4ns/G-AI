import { ArrowUpRight } from "lucide-react";
import { BrandLogo, appUrl, siteUrl } from "@g-ai/ui";

/**
 * G-AI main website. Each product is its own deployment; this page is the shared
 * entry point. Clicking a product's logo card opens that product's site.
 */

interface Product {
  key: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  href: string;
  cta: string;
  tone: "light" | "dark";
}

const PRODUCTS: Product[] = [
  {
    key: "coach",
    name: "Coach",
    tagline: "Lộ trình 28 ngày cá nhân hóa",
    description:
      "Khảo sát thể trạng 2 phút, nhận kế hoạch calo và bài tập theo cơ thể bạn, xem dự đoán vóc dáng và theo dõi từng ngày.",
    highlights: ["Khảo sát thể trạng", "Dự đoán vóc dáng (Digital Twin)", "Theo dõi hôm nay"],
    href: appUrl("/quiz"),
    cta: "Bắt đầu khảo sát",
    tone: "dark",
  },
  {
    key: "movement",
    name: "Movement",
    tagline: "Thương hiệu & Movement Goods",
    description:
      "Câu chuyện thương hiệu, hai chương trình Pilates và Strength, cùng bộ sưu tập trang phục và dụng cụ tập luyện.",
    highlights: ["Chương trình Pilates & Strength", "Trang phục tập luyện", "Dụng cụ tập tại nhà"],
    href: siteUrl("/"),
    cta: "Khám phá",
    tone: "light",
  },
];

function ProductCard({ product }: { product: Product }) {
  const dark = product.tone === "dark";
  return (
    <a
      href={product.href}
      className={`group relative flex flex-col justify-between rounded-2xl border p-6 sm:p-8 min-h-[340px] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${
        dark
          ? "bg-canvas-dark text-white border-stone-800 hover:border-brand/60 hover:shadow-[0_24px_60px_-24px_rgba(255,90,54,0.45)]"
          : "bg-white text-stone-900 border-stone-200 hover:border-brand/50 hover:shadow-[0_24px_60px_-28px_rgba(43,31,28,0.35)]"
      }`}
    >
      <div>
        {/* Product logo: the shared G mark plus the product name */}
        <div className="flex items-center gap-3">
          <BrandLogo isLight={!dark} size="lg" />
          <span className="text-2xl font-black tracking-tight">
            G-AI <span className="text-brand">{product.name}</span>
          </span>
        </div>

        <p className={`mt-6 text-[11px] font-mono uppercase tracking-[0.2em] ${dark ? "text-stone-400" : "text-stone-500"}`}>
          {product.tagline}
        </p>
        <p className={`mt-3 max-w-md text-sm leading-relaxed ${dark ? "text-stone-300" : "text-stone-600"}`}>
          {product.description}
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {product.highlights.map((h) => (
            <li
              key={h}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                dark ? "bg-stone-800/80 text-stone-200" : "bg-canvas text-stone-700"
              }`}
            >
              {h}
            </li>
          ))}
        </ul>
      </div>

      <div className={`mt-8 flex items-center justify-between border-t pt-5 ${dark ? "border-stone-800" : "border-stone-200"}`}>
        <span className="text-sm font-bold">{product.cta}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
          <ArrowUpRight className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </a>
  );
}

export default function HubPage() {
  return (
    <div className="min-h-screen bg-canvas text-stone-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <BrandLogo isLight size="md" showSubtitle subtitle="Biometric Kinetic Lab" />
        <a
          href={appUrl("/login")}
          className="text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900"
        >
          Đăng nhập
        </a>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-14">
        <section className="max-w-3xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand">Hệ sinh thái G-AI</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Luyện tập đúng cách, theo đúng cơ thể bạn.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600">
            Chọn nơi bạn muốn bắt đầu. Mỗi sản phẩm là một trang riêng, dùng chung một ngôn ngữ thiết kế.
          </p>
        </section>

        <section aria-label="Sản phẩm G-AI" className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.key} product={p} />
          ))}
        </section>
      </main>

      <footer className="border-t border-stone-200">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} G-AI</span>
          <nav className="flex gap-5">
            <a href={appUrl("/quiz")} className="hover:text-stone-900">Coach</a>
            <a href={siteUrl("/")} className="hover:text-stone-900">Movement</a>
            <a href={siteUrl("/#movement-goods")} className="hover:text-stone-900">Cửa hàng</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
