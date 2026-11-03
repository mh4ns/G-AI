"use client";

import React, { useState } from "react";
import { ArrowRight, Check, Heart, Mail, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export const StoreFooter: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-stone-900 text-white pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter & First Order Hook Banner */}
        <div className="pb-16 border-b border-stone-800 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-peach-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6542]" />
              <span>Ưu Đãi Đặc Quyền Thành Viên</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Đồng hành cùng G-AI Ecosystem
            </h3>
            <p className="text-stone-400 text-sm mt-2 max-w-md leading-relaxed">
              Nhận thông báo bộ sưu tập trang phục mới, bài tập Pilates độc quyền và nhận ngay <strong>mã giảm giá 15% cho đơn hàng đầu tiên</strong>.
            </p>
          </div>

          <div>
            {subscribed ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Cảm ơn bạn! Mã giảm giá <strong>WELCOME15</strong> đã được kích hoạt cho đơn hàng của bạn.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-full bg-stone-800 border border-stone-700 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-[#FF6542] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-7 py-3.5 rounded-full bg-[#FF6542] hover:bg-peach-600 text-white font-bold text-sm transition-all duration-200 shrink-0 shadow-soft"
                >
                  Nhận Ưu Đãi
                </button>
              </form>
            )}
            <p className="text-[11px] text-stone-500 mt-2">
              Bằng việc đăng ký, bạn đồng ý với Điều khoản Sử dụng và Chính sách Bảo mật của G-AI.
            </p>
          </div>
        </div>

        {/* Links Navigation Grid */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Khám Phá Cửa Hàng
            </h4>
            <ul className="space-y-2.5 text-stone-400 text-xs">
              <li><Link href="/store?category=new" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/store?category=bestsellers" className="hover:text-white transition-colors">Bestseller Gifts</Link></li>
              <li><Link href="/store?category=women" className="hover:text-white transition-colors">Women Activewear</Link></li>
              <li><Link href="/store?category=equipment" className="hover:text-white transition-colors">Pilates Reformers & Kits</Link></li>
              <li><Link href="/store?category=sale" className="text-[#FF6542] hover:underline">Sale - Giảm đến 35%</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Hỗ Trợ Khách Hàng
            </h4>
            <ul className="space-y-2.5 text-stone-400 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn chọn Size (Size Guide)</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách Đổi trả & Hoàn tiền</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tra cứu Đơn hàng (Track Order)</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Vận chuyển & Giao nhận</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp (FAQs)</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Hệ Sinh Thái G-AI
            </h4>
            <ul className="space-y-2.5 text-stone-400 text-xs">
              <li><Link href="/quiz" className="hover:text-white transition-colors">Khảo Sát Thể Trạng (Quiz 28 Ngày)</Link></li>
              <li><Link href="/today" className="hover:text-white transition-colors">Bảng Điều Khiển Today Hub</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Live PT (Sửa tư thế qua Webcam)</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Nhật Ký Dinh Dưỡng & Nhịn Ăn 16:8</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Cam Kết Thương Hiệu
            </h4>
            <div className="space-y-3 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Chất liệu vải thể thao nén 4 chiều cao cấp.</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6542] shrink-0" />
                <span>Tương thích hoàn hảo với các bài tập trong app G-AI.</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Không thử nghiệm trên động vật, hướng tới lối sống xanh.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© 2026 G-AI Store • Thuộc hệ sinh thái G-AI Ecosystem. Bản quyền đã được bảo hộ.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-stone-300">Điều khoản</a>
            <a href="#" className="hover:text-stone-300">Bảo mật</a>
            <a href="#" className="hover:text-stone-300">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
