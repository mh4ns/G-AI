"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { appUrl } from "@g-ai/ui";

export const AiVisionTeaser: React.FC = () => {

  return (
    <section className="py-16 sm:py-24 bg-[#0D0C0B] text-white border-t border-stone-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Text Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Xử lý ngay trên máy bạn</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Tập Chuẩn Form Ngay Tại Nhà Với AI Live PT
            </h2>

            <p className="text-sm sm:text-base text-stone-400 leading-relaxed">
              Không cần đồng hồ thông minh hay vòng đeo. Bạn chỉ cần đặt điện thoại hoặc mở webcam máy tính. AI theo dõi 33 điểm trên cơ thể bằng MediaPipe Pose, nhắc khi bạn sai tư thế và tự đếm rep. Video được xử lý trên máy bạn, không gửi đi đâu.
            </p>

            {/* Checklist of Core Vision Capabilities */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Sửa Lỗi Võng Lưng & Gù Vai Tức Thì</h4>
                  <p className="text-xs text-stone-400 mt-0.5">Giọng nói AI nhắc nhở hạ vai và siết cơ bụng ngay khi bạn sai biên độ.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-900/60 border border-stone-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Tự Động Đếm Rep Khi Đạt Góc Khớp Chuẩn</h4>
                  <p className="text-xs text-stone-400 mt-0.5">Squat chỉ được tính khi góc gối đạt 80–100° ở điểm thấp nhất; Plank được tính khi vai, hông và gót thẳng hàng.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                href={appUrl("/quiz")}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-stone-900 font-bold text-xs font-mono hover:bg-stone-200 transition-all shadow-lg active:scale-95"
              >
                <span>Làm Khảo Sát Để Kích Hoạt AI Live PT</span>
                <ArrowRight className="w-4 h-4 text-[#FF5A36]" />
              </Link>
              <p className="text-[11px] text-stone-500 font-mono">
                * Hoàn thành đánh giá thể trạng 2 phút để thuật toán cá nhân hóa góc khớp và giáo án riêng cho bạn.
              </p>
            </div>
          </div>

          {/* Right Simulated Webcam HUD Stage */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden border border-stone-800 bg-stone-950 shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
              {/* Webcam Status Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-800/80 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-stone-300 font-bold uppercase tracking-wider">
                    Minh họa màn hình tập
                  </span>
                </div>
              </div>

              {/* Skeletal Pose Simulation Canvas Frame */}
              <div className="relative w-full aspect-[16/10] rounded-2xl bg-[#070706] border border-stone-800 flex items-center justify-center overflow-hidden">
                {/* Background Grid Lines */}
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />

                {/* SVG Biomechanical Skeletal Stick Figure Overlay */}
                <svg viewBox="0 0 400 300" className="w-full h-full max-h-[320px] select-none">
                  {/* Spine & Torso Line */}
                  <line x1="200" y1="75" x2="195" y2="155" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                  
                  {/* Shoulder Girdle */}
                  <line x1="165" y1="95" x2="235" y2="95" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Left Arm (Deep Squat Reach) */}
                  <line x1="165" y1="95" x2="135" y2="135" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                  <line x1="135" y1="135" x2="115" y2="175" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />

                  {/* Right Arm */}
                  <line x1="235" y1="95" x2="265" y2="135" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                  <line x1="265" y1="135" x2="285" y2="175" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />

                  {/* Pelvic Line */}
                  <line x1="175" y1="155" x2="215" y2="155" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />

                  {/* Left Leg (Squat 92° Angle) */}
                  <line x1="175" y1="155" x2="140" y2="205" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                  <line x1="140" y1="205" x2="150" y2="265" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />

                  {/* Right Leg */}
                  <line x1="215" y1="155" x2="250" y2="205" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                  <line x1="250" y1="205" x2="240" y2="265" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />

                  {/* Head Marker */}
                  <circle cx="200" cy="55" r="16" fill="#1C1A19" stroke="#10B981" strokeWidth="2.5" />

                  {/* Key Tracking Joints (Landmarks) */}
                  <circle cx="140" cy="205" r="5" fill="#FF5A36" />
                  <circle cx="250" cy="205" r="5" fill="#FF5A36" />
                  <circle cx="195" cy="155" r="5" fill="#10B981" />

                  {/* Angle Callout Overlay Tag */}
                  <g transform="translate(255, 195)">
                    <rect width="68" height="22" rx="6" fill="#111112" stroke="#10B981" strokeWidth="1" />
                    <text x="7" y="15" fill="#10B981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      KNEE 92° OK
                    </text>
                  </g>
                </svg>

                {/* Floating Rep Counter HUD Widget */}
                <div className="absolute top-4 right-4 p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-stone-800 text-center min-w-[90px]">
                  <span className="text-[9px] font-mono uppercase text-stone-400 block">Đếm Rep</span>
                  <div className="flex items-baseline justify-center gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-emerald-400">12</span>
                    <span className="text-xs font-mono text-stone-500">/15</span>
                  </div>
                  <span className="text-[9px] text-emerald-300 font-mono">Đạt biên độ</span>
                </div>

                {/* Real-time Feedback Pill */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono backdrop-blur-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cột sống thẳng hàng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
