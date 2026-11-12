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
  title: "G-AI Coach | Lộ trình cá nhân hóa",
  description: "Khảo sát thể trạng 2 phút, nhận lộ trình calo và bài tập 28 ngày, tập với AI theo dõi form qua camera và theo dõi từng ngày.",
  openGraph: {
    title: "G-AI Coach | Lộ trình cá nhân hóa",
    description: "Khảo sát thể trạng 2 phút, nhận lộ trình calo và bài tập 28 ngày, tập với AI theo dõi form qua camera và theo dõi từng ngày.",
    siteName: "G-AI Coach",
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
