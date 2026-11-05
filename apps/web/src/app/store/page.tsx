"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function StoreRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/#movement-goods");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0908] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 text-xs font-mono mb-4">
        <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
        <span>Movement Goods Đã Được Tích Hợp Vào Trang Chủ</span>
      </div>
      <h1 className="text-2xl font-black mb-2">Đang chuyển hướng về Trang Chủ...</h1>
      <p className="text-sm text-stone-400 mb-6 max-w-md">
        Bộ sưu tập dụng cụ & trang phục cơ sinh học đã được rút gọn thành Section tinh tế ngay trên Trang chủ.
      </p>
      <Link
        href="/#movement-goods"
        className="px-6 py-3 rounded-full bg-[#FF5A36] text-white font-mono text-xs font-bold hover:bg-[#e04825] transition-colors flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Xem Tại Trang Chủ</span>
      </Link>
    </div>
  );
}
