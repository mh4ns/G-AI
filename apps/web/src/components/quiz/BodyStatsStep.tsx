import React from "react";
import { Scale, Ruler, Calendar, Target, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface BodyStatsStepProps {
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  onUpdate: (field: "age" | "heightCm" | "currentWeightKg" | "targetWeightKg", val: number) => void;
  onNext: () => void;
}

export const BodyStatsStep: React.FC<BodyStatsStepProps> = ({
  age,
  heightCm,
  currentWeightKg,
  targetWeightKg,
  onUpdate,
  onNext,
}) => {
  // Live BMI calculation
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? parseFloat((currentWeightKg / (heightM * heightM)).toFixed(1)) : 22;

  let bmiBadge = { text: "Cân đối lý tưởng", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (bmi < 18.5) {
    bmiBadge = { text: "Thon gọn / Cần bổ sung dinh dưỡng", color: "text-sky-700 bg-sky-50 border-sky-200" };
  } else if (bmi >= 25 && bmi < 30) {
    bmiBadge = { text: "Hơi thừa cân một chút", color: "text-amber-700 bg-amber-50 border-amber-200" };
  } else if (bmi >= 30) {
    bmiBadge = { text: "Cần cải thiện trao đổi chất", color: "text-peach-700 bg-peach-50 border-peach-200" };
  }

  const weightChange = targetWeightKg - currentWeightKg;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
          Thông số thể trạng hiện tại
        </h1>
        <p className="text-stone-500 text-sm sm:text-base">
          Mọi thông tin đều được bảo mật tuyệt đối và chỉ dùng để tính toán năng lượng BMR chuẩn xác.
        </p>
      </div>

      {/* Live BMI Callout */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-peach-50 border border-peach-100 flex items-center justify-center text-peach-500">
            <Heart className="w-5 h-5 fill-peach-400/30" />
          </div>
          <div>
            <div className="text-xs text-stone-400 font-medium">Chỉ số BMI hiện tại</div>
            <div className="text-xl font-bold text-stone-800">{bmi}</div>
          </div>
        </div>
        <span className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border", bmiBadge.color)}>
          {bmiBadge.text}
        </span>
      </div>

      <div className="space-y-5 mb-8">
        {/* Age */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-peach-500" />
              Độ tuổi
            </label>
            <span className="text-lg font-bold text-peach-600">{age} tuổi</span>
          </div>
          <input
            type="range"
            min={15}
            max={80}
            value={age}
            onChange={(e) => onUpdate("age", parseInt(e.target.value))}
            className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-peach-500"
          />
          <div className="flex justify-between text-[11px] text-stone-400 mt-1">
            <span>15 tuổi</span>
            <span>80 tuổi</span>
          </div>
        </div>

        {/* Height */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-peach-500" />
              Chiều cao
            </label>
            <span className="text-lg font-bold text-peach-600">{heightCm} cm</span>
          </div>
          <input
            type="range"
            min={140}
            max={210}
            value={heightCm}
            onChange={(e) => onUpdate("heightCm", parseInt(e.target.value))}
            className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-peach-500"
          />
          <div className="flex justify-between text-[11px] text-stone-400 mt-1">
            <span>140 cm</span>
            <span>210 cm</span>
          </div>
        </div>

        {/* Current Weight */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
              <Scale className="w-4 h-4 text-peach-500" />
              Cân nặng hiện tại
            </label>
            <span className="text-lg font-bold text-peach-600">{currentWeightKg} kg</span>
          </div>
          <input
            type="range"
            min={35}
            max={140}
            value={currentWeightKg}
            onChange={(e) => onUpdate("currentWeightKg", parseInt(e.target.value))}
            className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-peach-500"
          />
          <div className="flex justify-between text-[11px] text-stone-400 mt-1">
            <span>35 kg</span>
            <span>140 kg</span>
          </div>
        </div>

        {/* Target Weight */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 ring-2 ring-peach-100">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-peach-500" />
              Cân nặng mục tiêu
            </label>
            <div className="text-right">
              <span className="text-lg font-bold text-peach-600">{targetWeightKg} kg</span>
              <span className="text-xs text-stone-400 ml-1.5 font-medium">
                ({weightChange < 0 ? `Giảm ${Math.abs(weightChange)}kg` : weightChange > 0 ? `Tăng ${weightChange}kg` : "Giữ cân"})
              </span>
            </div>
          </div>
          <input
            type="range"
            min={35}
            max={120}
            value={targetWeightKg}
            onChange={(e) => onUpdate("targetWeightKg", parseInt(e.target.value))}
            className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-peach-500"
          />
          <div className="flex justify-between text-[11px] text-stone-400 mt-1">
            <span>35 kg</span>
            <span>120 kg</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white font-semibold text-base shadow-soft hover:shadow-glow transition-all duration-200 active:scale-[0.99]"
      >
        Tiếp tục
      </button>
    </div>
  );
};
