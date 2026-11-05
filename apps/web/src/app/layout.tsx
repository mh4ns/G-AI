import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "G-AI | AI Health & Workout Companion",
  description: "Hệ sinh thái chăm sóc sức khỏe toàn diện với trợ lý AI đồng hành sửa tư thế và khích lệ thời gian thực.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className={`${inter.className} font-sans antialiased bg-white text-stone-900 selection:bg-[#FF5A36]/15 selection:text-[#FF5A36]`}>
        {children}
      </body>
    </html>
  );
}
