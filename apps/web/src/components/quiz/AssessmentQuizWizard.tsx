"use client";

import React, { useState } from "react";
import { QuizResponses, PersonalizedPlanResult } from "@/types/quiz";
import { calculatePersonalizedPlan } from "@/lib/quiz-calculations";
import { StepHeader } from "./StepHeader";
import { GenderAndGoalStep } from "./GenderAndGoalStep";
import { FocusAreaStep } from "./FocusAreaStep";
import { BodyStatsStep } from "./BodyStatsStep";
import { LifestyleAndDietStep } from "./LifestyleAndDietStep";
import { ObstaclesStep } from "./ObstaclesStep";
import { AnalyzingLoader } from "./AnalyzingLoader";
import { PlanResultView } from "./PlanResultView";
import { useRouter } from "next/navigation";

export const AssessmentQuizWizard: React.FC = () => {
  const router = useRouter();

  // Wizard Steps: 1: Goal & Gender, 2: Focus Area, 3: Body Stats, 4: Lifestyle & Diet, 5: Obstacles, 6: Analyzing, 7: Result
  const [step, setStep] = useState<number>(1);

  // Form State
  const [responses, setResponses] = useState<QuizResponses>({
    gender: "female",
    goal: "lose_weight",
    focusAreas: ["belly", "glutes"],
    age: 26,
    heightCm: 162,
    currentWeightKg: 58,
    targetWeightKg: 50,
    activityLevel: "lightly_active",
    dietPreference: "balanced",
    obstacles: ["sweet_cravings", "sore_back"],
  });

  const [planResult, setPlanResult] = useState<PersonalizedPlanResult | null>(null);

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, 7));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    // Move to Analyzing loader (step 6)
    setStep(6);
  };

  const handleAnalysisComplete = () => {
    // Calculate final personalized plan
    const result = calculatePersonalizedPlan(responses);
    setPlanResult(result);

    // Save to localStorage for Today Dashboard integration
    try {
      localStorage.setItem("g_ai_user_quiz", JSON.stringify(responses));
      localStorage.setItem("g_ai_user_plan", JSON.stringify(result));
    } catch (e) {
      console.error("Local storage error", e);
    }

    // Move to final result view (step 7)
    setStep(7);
  };

  const handleGoToDashboard = () => {
    router.push("/today");
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-between">
      {/* Header with progress - only show in steps 1 through 5 */}
      {step <= 5 && (
        <StepHeader
          currentStep={step}
          totalSteps={5}
          onBack={handleBack}
          canGoBack={step > 1}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-4 sm:py-8">
        {step === 1 && (
          <GenderAndGoalStep
            gender={responses.gender}
            goal={responses.goal}
            onUpdate={(gender, goal) => setResponses((prev) => ({ ...prev, gender, goal }))}
            onNext={handleNext}
          />
        )}

        {step === 2 && (
          <FocusAreaStep
            selectedAreas={responses.focusAreas}
            onToggleArea={(area) =>
              setResponses((prev) => {
                const exists = prev.focusAreas.includes(area);
                return {
                  ...prev,
                  focusAreas: exists
                    ? prev.focusAreas.filter((a) => a !== area)
                    : [...prev.focusAreas, area],
                };
              })
            }
            onNext={handleNext}
          />
        )}

        {step === 3 && (
          <BodyStatsStep
            age={responses.age}
            heightCm={responses.heightCm}
            currentWeightKg={responses.currentWeightKg}
            targetWeightKg={responses.targetWeightKg}
            onUpdate={(field, val) => setResponses((prev) => ({ ...prev, [field]: val }))}
            onNext={handleNext}
          />
        )}

        {step === 4 && (
          <LifestyleAndDietStep
            activityLevel={responses.activityLevel}
            dietPreference={responses.dietPreference}
            onUpdate={(activityLevel, dietPreference) =>
              setResponses((prev) => ({ ...prev, activityLevel, dietPreference }))
            }
            onNext={handleNext}
          />
        )}

        {step === 5 && (
          <ObstaclesStep
            selectedObstacles={responses.obstacles}
            onToggleObstacle={(obstacle) =>
              setResponses((prev) => {
                const exists = prev.obstacles.includes(obstacle);
                return {
                  ...prev,
                  obstacles: exists
                    ? prev.obstacles.filter((o) => o !== obstacle)
                    : [...prev.obstacles, obstacle],
                };
              })
            }
            onSubmit={handleSubmit}
          />
        )}

        {step === 6 && <AnalyzingLoader onComplete={handleAnalysisComplete} />}

        {step === 7 && planResult && (
          <PlanResultView
            responses={responses}
            result={planResult}
            onGoToDashboard={handleGoToDashboard}
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-4 text-xs text-stone-400">
        BetterMe Next-Gen • Hệ Sinh Thái Sức Khỏe Toàn Diện & AI Workout Companion
      </footer>
    </div>
  );
};
