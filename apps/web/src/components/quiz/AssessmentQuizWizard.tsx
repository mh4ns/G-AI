"use client";

import React, { useState } from "react";
import { QuizResponses, PersonalizedPlanResult, PrimaryGoal, BodyFocusArea, FitnessObstacle } from "@/types/quiz";
import { calculatePersonalizedPlan } from "@/lib/quiz-calculations";
import { StepHeader } from "./StepHeader";
import { AgeSelectionFirstPage } from "./AgeSelectionFirstPage";
import { GoalSelectionStep } from "./GoalSelectionStep";
import { FocusAreaStep } from "./FocusAreaStep";
import { BodyStatsStep } from "./BodyStatsStep";
import { ObstaclesStep } from "./ObstaclesStep";
import { AnalyzingLoader } from "./AnalyzingLoader";
import { PlanResultView } from "./PlanResultView";
import { useRouter } from "next/navigation";

export const AssessmentQuizWizard: React.FC = () => {
  const router = useRouter();

  // Step 1: Age Selection (First Page), 2: Goal, 3: Focus Area, 4: Body Stats, 5: Obstacles, 6: Analyzing, 7: Result
  const [step, setStep] = useState<number>(1);

  // Form State
  const [responses, setResponses] = useState<QuizResponses>({
    gender: "female",
    goal: "lose_weight",
    focusAreas: ["belly", "glutes"],
    age: 26,
    heightCm: 163,
    currentWeightKg: 58,
    targetWeightKg: 50,
    activityLevel: "lightly_active",
    dietPreference: "balanced",
    obstacles: ["sweet_cravings", "sore_back"],
  });

  const [planResult, setPlanResult] = useState<PersonalizedPlanResult | null>(null);

  const handleSelectAge = (age: number, range: string) => {
    setResponses((prev) => ({ ...prev, age }));
    setStep(2);
  };

  const handleSelectGoal = (goal: PrimaryGoal) => {
    setResponses((prev) => ({ ...prev, goal }));
  };

  const handleToggleFocusArea = (areaId: BodyFocusArea) => {
    setResponses((prev) => {
      const exists = prev.focusAreas.includes(areaId);
      return {
        ...prev,
        focusAreas: exists
          ? prev.focusAreas.filter((a) => a !== areaId)
          : [...prev.focusAreas, areaId],
      };
    });
  };

  const handleChangeStats = (
    field: "heightCm" | "currentWeightKg" | "targetWeightKg",
    val: number
  ) => {
    setResponses((prev) => ({ ...prev, [field]: val }));
  };

  const handleToggleObstacle = (obstacleId: FitnessObstacle) => {
    setResponses((prev) => {
      const exists = prev.obstacles.includes(obstacleId);
      return {
        ...prev,
        obstacles: exists
          ? prev.obstacles.filter((o) => o !== obstacleId)
          : [...prev.obstacles, obstacleId],
      };
    });
  };

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, 7));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    setStep(6);
  };

  const handleAnalysisComplete = () => {
    const result = calculatePersonalizedPlan(responses);
    setPlanResult(result);

    try {
      localStorage.setItem("g_ai_user_quiz", JSON.stringify(responses));
      localStorage.setItem("g_ai_user_plan", JSON.stringify(result));
    } catch (e) {
      console.error("Local storage error", e);
    }

    setStep(7);
  };

  const handleGoToDashboard = () => {
    router.push("/today");
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col justify-between selection:bg-[#FF5A36]/20 selection:text-[#FF5A36]">
      {/* Header with progress line (shown for steps 2 to 5) */}
      {step >= 2 && step <= 5 && (
        <StepHeader
          currentStep={step}
          totalSteps={5}
          onBack={handleBack}
          canGoBack={true}
        />
      )}

      {/* Main Wizard Step Content */}
      <main className="flex-1 flex flex-col justify-center">
        {step === 1 && (
          <AgeSelectionFirstPage onSelectAge={handleSelectAge} />
        )}

        {step === 2 && (
          <GoalSelectionStep
            selectedGoal={responses.goal}
            onSelectGoal={handleSelectGoal}
            onNext={handleNext}
          />
        )}

        {step === 3 && (
          <FocusAreaStep
            selectedAreas={responses.focusAreas}
            onToggleArea={handleToggleFocusArea}
            onNext={handleNext}
          />
        )}

        {step === 4 && (
          <BodyStatsStep
            heightCm={responses.heightCm}
            currentWeightKg={responses.currentWeightKg}
            targetWeightKg={responses.targetWeightKg}
            onChangeStats={handleChangeStats}
            onNext={handleNext}
          />
        )}

        {step === 5 && (
          <ObstaclesStep
            selectedObstacles={responses.obstacles}
            onToggleObstacle={handleToggleObstacle}
            onSubmit={handleSubmit}
          />
        )}

        {step === 6 && (
          <AnalyzingLoader onComplete={handleAnalysisComplete} />
        )}

        {step === 7 && planResult && (
          <PlanResultView
            responses={responses}
            result={planResult}
            onGoToDashboard={handleGoToDashboard}
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-4 text-xs text-stone-400 font-mono border-t border-stone-100">
        G—AI • Kinetic Home Pilates & Assessment Studio
      </footer>
    </div>
  );
};
