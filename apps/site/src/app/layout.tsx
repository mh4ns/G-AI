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
  title: "G-AI Movement | Pilates & sức mạnh tại nhà",
  description: "Hai chương trình tập tại nhà, Pilates và sức mạnh, với AI theo dõi form qua webcam và lộ trình calo 28 ngày theo cơ thể bạn.",
  openGraph: {
    title: "G-AI Movement | Pilates & sức mạnh tại nhà",
    description: "Hai chương trình tập tại nhà, Pilates và sức mạnh, với AI theo dõi form qua webcam và lộ trình calo 28 ngày theo cơ thể bạn.",
    siteName: "G-AI Movement",
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
        {/* Without JavaScript the hero's reveal never runs; show its text. */}
        <noscript>
          <style>{`.t-stagger-line{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
