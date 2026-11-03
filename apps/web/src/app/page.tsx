import Link from "react";
import { Sparkles, Video, Flame, Heart, ArrowRight, ShieldCheck, Smile, Award } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-peach-50/30 to-cream-50 text-stone-800 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-peach-500 to-peach-400 text-white flex items-center justify-center font-bold text-xl shadow-soft">
            G
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl text-stone-900 tracking-tight">
              G-<span className="text-peach-500">AI</span>
            </span>
            <span className="block text-[10px] text-stone-400 font-medium tracking-wide uppercase">
              AI Well-Being & Live PT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/store"
            className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#FF6542] transition-colors px-3 py-1.5 rounded-full hover:bg-white/80 border border-stone-200"
          >
            🛍️ Cửa Hàng (Store)
          </a>
          <a
            href="/today"
            className="text-xs sm:text-sm font-semibold text-stone-600 hover:text-peach-600 transition-colors px-3 py-1.5 rounded-full hover:bg-white/80 border border-transparent hover:border-peach-100"
          >
            Đến Bảng Điều Khiển →
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-16 text-center">
        {/* Friendly AI Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-peach-50 border border-peach-200 text-peach-600 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-peach-500 animate-pulse" />
          <span>Hệ Sinh Thái Sức Khỏe Toàn Diện • Đột Phá AI Live PT</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-stone-900 tracking-tight leading-tight sm:leading-tight mb-5">
          Không Còn Tập Luyện Đơn Độc.
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-peach-500 via-peach-600 to-amber-500">
            Có AI Companion Đồng Hành Sửa Dáng.
          </span>
        </h1>

        <p className="text-stone-500 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Kế hoạch tập luyện và thực đơn cá nhân hóa 28 ngày dựa trên khoa học chuyển hóa. Bật webcam máy tính hoặc camera điện thoại, trợ lý AI sẽ tự động đếm rep và sửa dáng võng lưng theo thời gian thực!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <a
            href="/quiz"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-peach-500 via-peach-600 to-amber-500 hover:from-peach-600 hover:to-amber-600 text-white font-bold text-base shadow-soft hover:shadow-glow transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2.5"
          >
            <span>Làm Khảo Sát & Nhận Lộ Trình</span>
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="/today"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 font-semibold text-base border border-stone-200 shadow-card transition-all duration-200"
          >
            Khám Phá Today Dashboard
          </a>
        </div>

        {/* 3 Pillar Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-peach-50 border border-peach-100 text-peach-500 flex items-center justify-center mb-3">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-800 text-base mb-1">AI Live PT qua Camera</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Nhận diện 33 điểm khớp xương trực tiếp trên trình duyệt, hạ nhạc bài tập để lên tiếng sửa gù lưng.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-800 text-base mb-1">Cân Bằng Calo & Fasting</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Theo dõi nhịn ăn gián đoạn 16:8 và cân bằng năng lượng nạp vào - đốt cháy trực quan theo thời gian thực.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-sage-50 border border-sage-100 text-sage-600 flex items-center justify-center mb-3">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-800 text-base mb-1">Trị Liệu CBT & Thở Giảm Stress</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Bài tập thở thư giãn 4-7-8 và AI Journal lắng nghe, xoa dịu cơn thèm ngọt do căng thẳng công việc.
            </p>
          </div>
        </div>

        {/* Friendly Trust Signals */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Thuần Phần Mềm • Không Cần Cân Đắt Tiền
          </span>
          <span className="flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-peach-500" /> Thân Thiện & Động Viên Tích Cực
          </span>
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" /> BMR & TDEE Chuẩn Y Khoa
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-stone-400 border-t border-stone-200/60 bg-white/40">
        G-AI Platform • Bản quyền 2026
      </footer>
    </div>
  );
}
