import { 
  QuizResponses, 
  PersonalizedPlanResult, 
  PlannedWorkoutDay, 
  MacroSplit 
} from "@/types/quiz";

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

/** WHO adult BMI band treated as healthy: 18.5 to 24.9. */
export const HEALTHY_BMI_MIN = 18.5;
export const HEALTHY_BMI_MAX = 24.9;

/**
 * Whole-kilogram weights inside the healthy BMI band for a height. The quiz
 * never lets a target weight go below `min`: a coaching app must not hand
 * someone a plan that ends underweight.
 */
export function healthyWeightRangeKg(heightCm: number): { min: number; max: number } {
  const heightM2 = (heightCm / 100) ** 2;
  return {
    min: Math.ceil(HEALTHY_BMI_MIN * heightM2),
    max: Math.floor(HEALTHY_BMI_MAX * heightM2),
  };
}

/** Lowest target weight the quiz accepts for this height. */
export function minSafeTargetWeightKg(heightCm: number): number {
  return healthyWeightRangeKg(heightCm).min;
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
      advice: "Tuyệt vời! Bạn đang ở dải cân nặng khỏe mạnh. Giáo án sẽ tập trung siết cơ và định hình đường nét.",
    };
  }
  if (bmi < 29.9) {
    return {
      label: "Thừa cân nhẹ",
      color: "border-amber-200 text-amber-700 bg-amber-50",
      advice: "Thâm hụt nhẹ 300-450 kcal/ngày kết hợp tập luyện đều đặn sẽ giúp giảm mỡ an toàn.",
    };
  }
  return {
    label: "Cần kiểm soát cân nặng",
    color: "border-rose-200 text-rose-700 bg-rose-50",
    advice: "Ưu tiên các bài tập Low-Impact trên thảm để bảo vệ khớp gối và đốt mỡ bền vững.",
  };
}

export function calculatePersonalizedPlan(data: QuizResponses): PersonalizedPlanResult {
  // 1. Calculate BMI
  const bmi = calculateBMI(data.currentWeightKg, data.heightCm);
  const bmiCategoryObj = getBMICategory(bmi);
  const bmiCategory = bmiCategoryObj.label;

  const isMale = data.archetype === "male_strength" || data.gender === "male";

  // 2. Calculate BMR (Mifflin-St Jeor Equation)
  // Men: BMR = 10W + 6.25H - 5A + 5
  // Women: BMR = 10W + 6.25H - 5A - 161
  let bmr = 10 * data.currentWeightKg + 6.25 * data.heightCm - 5 * data.age;
  if (isMale) {
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

  // 4. Calorie Target & Timeline Calculation
  const weightDiff = data.currentWeightKg - data.targetWeightKg;
  let dailyCalorieTarget = tdee;
  let calorieDeficitDaily = 0;
  let estimatedWeeks = 4;

  const minCalorieFloor = isMale ? 1500 : 1200;

  if (weightDiff > 0) {
    // Goal: Fat loss
    calorieDeficitDaily = isMale ? 500 : 400;
    dailyCalorieTarget = Math.max(minCalorieFloor, tdee - calorieDeficitDaily);
    const totalDeficitNeeded = weightDiff * 7700; // ~7700 kcal per kg of fat
    const weeklyDeficit = calorieDeficitDaily * 7;
    estimatedWeeks = Math.max(3, Math.round(totalDeficitNeeded / weeklyDeficit));
  } else if (weightDiff < 0) {
    // Goal: Hypertrophy / Gain mass
    calorieDeficitDaily = -350;
    dailyCalorieTarget = tdee + 350;
    estimatedWeeks = Math.max(4, Math.round((Math.abs(weightDiff) * 5500) / (350 * 7)));
  } else {
    // Maintenance & Toning
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

  // 6. Macro Split Breakdown
  const proteinPerKg = isMale ? 2.0 : 1.6;
  const proteinG = Math.round(data.currentWeightKg * proteinPerKg);
  const proteinKcal = proteinG * 4;

  const fatKcal = Math.round(dailyCalorieTarget * 0.25);
  const fatG = Math.round(fatKcal / 9);

  const carbsKcal = Math.max(0, dailyCalorieTarget - proteinKcal - fatKcal);
  const carbsG = Math.round(carbsKcal / 4);

  const macroSplit: MacroSplit = {
    proteinG,
    carbsG,
    fatG,
  };

  // 7. Recommended Water Intake (ml): ~35ml per kg of weight
  const recommendedWaterMl = Math.round((data.currentWeightKg * 35) / 100) * 100;

  // 8. Focus Highlights
  const areaLabels: Record<string, string> = {
    belly: "Đốt mỡ phẳng bụng & săn chắc cơ lõi",
    thighs: "Thon gọn đùi & bắp chân",
    glutes: "Nâng và săn chắc vòng 3",
    back: "Cải thiện tư thế, thẳng lưng & giảm đau mỏi",
    arms: "Săn chắc bắp tay & cơ vai",
    chest: "Dày cơ ngực & mở rộng lồng ngực",
    full_body: "Đốt mỡ toàn thân & tăng sức bền tim mạch",
  };
  const focusHighlights = (data.focusAreas || []).map((area) => areaLabels[area] || area);

  // 9. Injury & Joint Safety Analysis
  const safetyNotes: string[] = [];
  const excludedExercises: string[] = [];

  const injuries = data.injuries || [];
  if (injuries.includes("lower_back")) {
    safetyNotes.push(
      "Đã bảo vệ cột sống: Loại trừ các bài nén trục nặng (Deadlift, Good Morning) và gập lưng biên độ sâu."
    );
    excludedExercises.push(
      "Barbell Deadlift",
      "Heavy Back Squat",
      "Good Morning",
      "Extreme Lumbar Hyper-extension"
    );
  }

  if (injuries.includes("knee")) {
    safetyNotes.push(
      "Đã bảo vệ khớp gối: Thay thế bài bật nhảy va đập cao bằng bài tập Low-Impact kiểm soát góc gập."
    );
    excludedExercises.push(
      "Jump Squat",
      "Plyometric Box Jump",
      "Walking Lunges quá mũi chân",
      "Heavy Sissy Squat"
    );
  }

  if (injuries.includes("neck_shoulder")) {
    safetyNotes.push(
      "Đã giải tỏa cổ vai gáy: Tránh bài kéo đẩy qua đầu góc hẹp và kéo xà sau gáy."
    );
    excludedExercises.push(
      "Behind-The-Neck Overhead Press",
      "Upright Barbell Row",
      "Aggressive Neck Crunches"
    );
  }

  if (safetyNotes.length === 0) {
    safetyNotes.push(
      "Bạn không báo chấn thương nào, nên giáo án dùng đủ các bài tập. Dừng lại khi thấy đau, và hỏi ý kiến bác sĩ nếu cơn đau kéo dài."
    );
  }

  // 10. Generate 4-day workout routine tailored to Archetype & Equipment
  const isGym = data.equipmentAccess === "gym";
  let weeklyRoutine: PlannedWorkoutDay[] = [];

  if (data.archetype === "female_pilates") {
    weeklyRoutine = [
      {
        dayNumber: 1,
        title: isGym ? "Reformer & cơ lõi trên thảm" : "Thảm: cơ lõi & bụng dưới",
        durationMin: 35,
        target: "Cơ lõi, Cơ ngang bụng & Sàn chậu",
        intensity: "moderate",
        exerciseCount: 6,
      },
      {
        dayNumber: 2,
        title: isGym ? "Dây kháng lực & Hip Thrust" : "Glute Bridge & tạo dáng hông",
        durationMin: 40,
        target: "Cơ mông lớn, Mông nhỡ & Cơ đùi sau",
        intensity: "high",
        exerciseCount: 7,
      },
      {
        dayNumber: 3,
        title: "Phục hồi chủ động: giãn cột sống & mở khớp",
        durationMin: 25,
        target: "Giải phóng đốt sống lưng & giãn cơ toàn thân",
        intensity: "low",
        exerciseCount: 5,
      },
      {
        dayNumber: 4,
        title: isGym ? "Cơ lõi với máy cáp & săn chắc toàn thân" : "Pilates toàn thân & cân bằng tư thế",
        durationMin: 35,
        target: "Toàn thân & tư thế",
        intensity: "moderate",
        exerciseCount: 6,
      },
    ];
  } else {
    // Male Strength Archetype
    weeklyRoutine = [
      {
        dayNumber: 1,
        title: isGym ? "Thân trên: ngực, vai & tay sau" : "Sức đẩy: chống đẩy nhiều góc & dây kháng lực",
        durationMin: 45,
        target: "Cơ ngực, Cơ delta & Cơ tay sau",
        intensity: "high",
        exerciseCount: 7,
      },
      {
        dayNumber: 2,
        title: isGym ? "Sức kéo: lưng xô & tay trước" : "Hít xà & kéo dây cho lưng xô",
        durationMin: 45,
        target: "Cơ lưng xô, Cơ trám & Cơ tay trước",
        intensity: "high",
        exerciseCount: 7,
      },
      {
        dayNumber: 3,
        title: "Vận động khớp & phục hồi",
        durationMin: 30,
        target: "Giãn khớp hông, vai & giải tỏa axit lactic",
        intensity: "low",
        exerciseCount: 5,
      },
      {
        dayNumber: 4,
        title: isGym ? "Thân dưới & cơ lõi: chân, đùi sau & bụng" : "Chân & sức mạnh cơ lõi",
        durationMin: 50,
        target: "Cơ tứ đầu, Đùi sau & Cơ bụng thẳng",
        intensity: "high",
        exerciseCount: 8,
      },
    ];
  }

  return {
    archetype: data.archetype || "female_pilates",
    bmi,
    bmiCategory,
    bmr,
    tdee,
    dailyCalorieTarget,
    calorieDeficitDaily,
    macroSplit,
    estimatedWeeks,
    estimatedTargetDate,
    recommendedWaterMl,
    weeklyWorkoutsCount: 4,
    focusHighlights,
    safetyNotes,
    excludedExercises,
    weeklyRoutine,
  };
}
