import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

// Display face for headings: drawn for Vietnamese, so stacked diacritics sit
// cleanly at large sizes. Body text stays in Inter.
const display = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "G-AI | Huấn luyện tại nhà với AI",
  description: "Khảo sát 2 phút để nhận lộ trình calo và bài tập 28 ngày theo cơ thể bạn, hoặc xem chương trình Pilates, sức mạnh và dụng cụ tập của G-AI.",
  openGraph: {
    title: "G-AI | Huấn luyện tại nhà với AI",
    description: "Khảo sát 2 phút để nhận lộ trình calo và bài tập 28 ngày theo cơ thể bạn, hoặc xem chương trình Pilates, sức mạnh và dụng cụ tập của G-AI.",
    siteName: "G-AI",
    locale: "vi_VN",
    type: "website",
  },
};

// Browser chrome matches the shared canvas.
export const viewport: Viewport = {
  themeColor: "#FAF8F5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${display.variable}`}>
      <body className={`${inter.className} font-sans antialiased bg-canvas text-stone-900 selection:bg-brand-action selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
