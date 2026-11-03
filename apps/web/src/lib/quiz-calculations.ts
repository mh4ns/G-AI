import { QuizResponses, PersonalizedPlanResult } from "@/types/quiz";

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): { label: string; color: string; advice: string } {
  if (bmi < 18.5) {
    return {
      label: "Thiếu cân",
      color: "border-blue-200 text-blue-700 bg-blue-50",
      advice: "Cần tăng cường dinh dưỡng lành mạnh và tập các bài kháng lực tăng khối cơ.",
    };
  }
  if (bmi < 24.9) {
    return {
      label: "Cân đối lý tưởng",
      color: "border-emerald-200 text-emerald-700 bg-emerald-50",
      advice: "Tuyệt vời! Bạn đang ở dải cân nặng khỏe mạnh. Giáo án sẽ tập trung siết cơ và định hình đường cong.",
    };
  }
  if (bmi < 29.9) {
    return {
      label: "Thừa cân nhẹ",
      color: "border-amber-200 text-amber-700 bg-amber-50",
      advice: "Thâm hụt nhẹ 300-450 kcal/ngày kết hợp Pilates sẽ giúp giảm mỡ an toàn mà không mệt mỏi.",
    };
  }
  return {
    label: "Cần kiểm soát cân nặng",
    color: "border-rose-200 text-rose-700 bg-rose-50",
    advice: "Ưu tiên các bài tập Low-Impact trên thảm để bảo vệ khớp gối và đốt mỡ từ từ.",
  };
}

export function calculatePersonalizedPlan(data: QuizResponses): PersonalizedPlanResult {
  // 1. Calculate BMI
  const bmi = calculateBMI(data.currentWeightKg, data.heightCm);
  const bmiCategoryObj = getBMICategory(bmi);
  const bmiCategory = bmiCategoryObj.label;

  // 2. Calculate BMR (Mifflin-St Jeor Equation)
  let bmr = 10 * data.currentWeightKg + 6.25 * data.heightCm - 5 * data.age;
  if (data.gender === "male") {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  bmr = Math.round(bmr);

  // 3. Activity Level Multiplier -> TDEE
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const multiplier = multipliers[data.activityLevel] || 1.35;
  const tdee = Math.round(bmr * multiplier);

  // 4. Calorie Target & Timeline
  const weightDiff = data.currentWeightKg - data.targetWeightKg;
  let dailyCalorieTarget = tdee;
  let calorieDeficitDaily = 0;
  let estimatedWeeks = 4;

  if (weightDiff > 0) {
    // Goal: Lose weight (healthy safe deficit of 350-500 kcal/day)
    calorieDeficitDaily = 450;
    dailyCalorieTarget = Math.max(1200, tdee - calorieDeficitDaily);
    const totalDeficitNeeded = weightDiff * 7700;
    const weeklyDeficit = calorieDeficitDaily * 7;
    estimatedWeeks = Math.max(2, Math.round(totalDeficitNeeded / weeklyDeficit));
  } else if (weightDiff < 0) {
    // Goal: Gain muscle
    calorieDeficitDaily = -300;
    dailyCalorieTarget = tdee + 300;
    estimatedWeeks = Math.max(4, Math.round((Math.abs(weightDiff) * 5000) / (300 * 7)));
  } else {
    // Goal: Maintain / tone
    dailyCalorieTarget = tdee;
    estimatedWeeks = 4;
  }

  // 5. Target Completion Date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + estimatedWeeks * 7);
  const estimatedTargetDate = targetDate.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // 6. Recommended Water Intake (ml): ~35ml per kg of weight
  const recommendedWaterMl = Math.round((data.currentWeightKg * 35) / 100) * 100;

  // 7. Focus highlights
  const areaLabels: Record<string, string> = {
    belly: "Đốt mỡ phẳng bụng",
    thighs: "Thon gọn đùi & bắp chân",
    glutes: "Nâng và săn chắc vòng 3",
    back: "Cải thiện tư thế & thẳng lưng",
    arms: "Săn chắc bắp tay",
    full_body: "Đốt mỡ toàn thân & tăng sức bền",
  };
  const focusHighlights = data.focusAreas.map((area) => areaLabels[area] || area);

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    dailyCalorieTarget,
    calorieDeficitDaily,
    estimatedWeeks,
    estimatedTargetDate,
    recommendedWaterMl,
    weeklyWorkoutsCount: 4,
    focusHighlights,
  };
}
