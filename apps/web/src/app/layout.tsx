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
      <body className="antialiased bg-white text-stone-900 selection:bg-[#FF5A36]/15 selection:text-[#FF5A36]">
        {children}
      </body>
    </html>
  );
}
