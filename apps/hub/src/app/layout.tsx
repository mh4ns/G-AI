import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "G-AI | Hệ sinh thái sức khỏe với AI",
  description: "Trang chính của G-AI: chọn sản phẩm để bắt đầu, từ lộ trình luyện tập cá nhân hóa đến dụng cụ tập luyện.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className={`${inter.className} font-sans antialiased bg-canvas text-stone-900 selection:bg-brand/15 selection:text-brand`}>
        {children}
      </body>
    </html>
  );
}
