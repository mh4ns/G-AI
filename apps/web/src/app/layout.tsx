import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="vi">
      <body className="antialiased bg-cream-50 text-stone-800 selection:bg-peach-100 selection:text-peach-700">
        {children}
      </body>
    </html>
  );
}
