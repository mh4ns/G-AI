import { QuizResponses, PersonalizedPlanResult } from "@/types/quiz";

export function calculatePersonalizedPlan(data: QuizResponses): PersonalizedPlanResult {
  // 1. Calculate BMI
  const heightM = data.heightCm / 100;
  const bmi = parseFloat((data.currentWeightKg / (heightM * heightM)).toFixed(1));

  let bmiCategory = "Cân đối";
  if (bmi < 18.5) bmiCategory = "Thiếu cân";
  else if (bmi < 24.9) bmiCategory = "Cân đối lý tưởng";
  else if (bmi < 29.9) bmiCategory = "Hơi thừa cân";
  else bmiCategory = "Cần quản lý cân nặng";

  // 2. Calculate BMR (Mifflin-St Jeor Equation)
  // Men: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
  // Women: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
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
    // 1kg of body fat is roughly 7700 kcal
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
