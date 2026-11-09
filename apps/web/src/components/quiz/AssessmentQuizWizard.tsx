"use client";

import React, { useState } from "react";
import { 
  QuizResponses, 
  PersonalizedPlanResult, 
  PrimaryGoal, 
  BodyFocusArea, 
  FitnessObstacle, 
  AthleticArchetype 
} from "@/types/quiz";
import { calculatePersonalizedPlan } from "@/lib/quiz-calculations";
import { StepHeader } from "./StepHeader";
import { ArchetypeSelectionStep } from "./ArchetypeSelectionStep";
import { AgeGoalStep } from "./AgeGoalStep";
import { FocusAreaStep } from "./FocusAreaStep";
import { BodyStatsStep } from "./BodyStatsStep";
import { ObstaclesStep } from "./ObstaclesStep";
import { PhotoUploadStep } from "./PhotoUploadStep";
import { AnalyzingLoader } from "./AnalyzingLoader";
import { PlanResultView } from "./PlanResultView";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export const AssessmentQuizWizard: React.FC = () => {
  const router = useRouter();

  // Step 1: Archetype, 2: Age & Goal, 3: Focus & Equipment, 4: Body Stats, 5: Lifestyle & Injuries, 6: Photo Scan, 7: Analyzing, 8: Result
  const [step, setStep] = useState<number>(1);

  // Form State
  const [responses, setResponses] = useState<QuizResponses>({
    archetype: "female_pilates",
    gender: "female",
    goal: "tone_muscle",
    focusAreas: ["belly", "glutes"],
    age: 26,
    heightCm: 165,
    currentWeightKg: 58,
    targetWeightKg: 50,
    activityLevel: "lightly_active",
    dietPreference: "balanced",
    obstacles: ["sweet_cravings", "sore_back"],
    equipmentAccess: "home",
    injuries: [],
  });

  const [planResult, setPlanResult] = useState<PersonalizedPlanResult | null>(null);

  const handleSelectArchetype = (archetype: AthleticArchetype) => {
    const isMale = archetype === "male_strength";
    setResponses((prev) => ({
      ...prev,
      archetype,
      gender: isMale ? "male" : "female",
      goal: isMale ? "hypertrophy" : "tone_muscle",
      focusAreas: isMale ? ["chest", "arms"] : ["belly", "glutes"],
    }));
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
    setStep((prev) => Math.min(prev + 1, 8));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    setStep(6);
  };

  const handlePhotoSubmit = (photoBase64: string | null) => {
    setResponses((prev) => ({
      ...prev,
      userPhotoBase64: photoBase64 || undefined,
    }));
    setStep(7);
  };

  const handlePhotoSkip = () => {
    setResponses((prev) => ({
      ...prev,
      userPhotoBase64: undefined,
    }));
    setStep(7);
  };

  const handleAnalysisComplete = async () => {
    const result = calculatePersonalizedPlan(responses);
    if (responses.userPhotoBase64) {
      result.userPhotoBase64 = responses.userPhotoBase64;
    }
    setPlanResult(result);

    try {
      localStorage.setItem("g_ai_user_quiz", JSON.stringify(responses));
      localStorage.setItem("g_ai_user_plan", JSON.stringify(result));
      if (responses.userPhotoBase64) {
        localStorage.setItem("g_ai_user_twin_photo", responses.userPhotoBase64);
      }
    } catch (e) {
      console.error("Local storage error", e);
    }

    // Trigger /api/generate-twin in background
    try {
      const twinRes = await fetch("/api/generate-twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype: responses.archetype,
          age: responses.age,
          height: responses.heightCm,
          weight: responses.currentWeightKg,
          targetWeight: responses.targetWeightKg,
          postureIssue: responses.injuries.length > 0 ? "Bảo vệ khớp và cân chỉnh tư thế" : "Gù lưng & siết eo",
          userPhotoBase64: responses.userPhotoBase64,
        }),
      });
      if (twinRes.ok) {
        const twinData = await twinRes.json();
        if (twinData.milestoneImages) {
          localStorage.setItem("g_ai_twin_milestones", JSON.stringify(twinData.milestoneImages));
        }
      }
    } catch (e) {
      // fallback silently
    }

    setStep(8);
  };

  const isMaleTheme = responses.archetype === "male_strength";

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-500 ${
        isMaleTheme
          ? "bg-[#0A0908] text-white selection:bg-[#FF5A36]/30 selection:text-white"
          : "bg-[#FFFDF9] text-stone-900 selection:bg-[#FF6B4A]/20 selection:text-[#FF6B4A]"
      }`}
    >
      {/* Header with progress line (shown for steps 2 to 6) */}
      {step >= 2 && step <= 6 && (
        <StepHeader
          currentStep={step}
          totalSteps={6}
          onBack={handleBack}
          canGoBack={true}
          archetype={responses.archetype}
        />
      )}

      {/* Main Wizard Step Content */}
      <main className="flex-1 flex flex-col justify-center">
        {step === 1 && (
          <ArchetypeSelectionStep
            selectedArchetype={responses.archetype}
            onSelect={handleSelectArchetype}
          />
        )}

        {step === 2 && (
          <div className="flex flex-col items-center">
            <AgeGoalStep
              archetype={responses.archetype}
              selectedAge={responses.age}
              selectedGoal={responses.goal}
              onSelectAge={(age) => setResponses((prev) => ({ ...prev, age }))}
              onSelectGoal={handleSelectGoal}
            />
            <div className="w-full max-w-4xl px-4 pb-8 flex justify-end">
              <button
                onClick={handleNext}
                className={`px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-95 ${
                  isMaleTheme
                    ? "bg-[#FF5A36] hover:bg-[#ff461e] text-white shadow-[#FF5A36]/25"
                    : "bg-[#FF6B4A] hover:bg-[#ff5530] text-white shadow-[#FF6B4A]/25"
                }`}
              >
                <span>Tiếp Tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <FocusAreaStep
            archetype={responses.archetype}
            selectedAreas={responses.focusAreas}
            equipmentAccess={responses.equipmentAccess}
            onToggleArea={handleToggleFocusArea}
            onSelectEquipment={(equipmentAccess) => setResponses((prev) => ({ ...prev, equipmentAccess }))}
            onNext={handleNext}
          />
        )}

        {step === 4 && (
          <BodyStatsStep
            archetype={responses.archetype}
            heightCm={responses.heightCm}
            currentWeightKg={responses.currentWeightKg}
            targetWeightKg={responses.targetWeightKg}
            onChangeStats={handleChangeStats}
            onNext={handleNext}
          />
        )}

        {step === 5 && (
          <ObstaclesStep
            archetype={responses.archetype}
            selectedObstacles={responses.obstacles}
            selectedInjuries={responses.injuries}
            onToggleObstacle={handleToggleObstacle}
            onToggleInjury={(injury) =>
              setResponses((prev) => {
                const exists = prev.injuries.includes(injury);
                return {
                  ...prev,
                  injuries: exists
                    ? prev.injuries.filter((i) => i !== injury)
                    : [...prev.injuries, injury],
                };
              })
            }
            onSubmit={handleSubmit}
          />
        )}

        {step === 6 && (
          <PhotoUploadStep
            archetype={responses.archetype}
            onPhotoSubmit={handlePhotoSubmit}
            onSkip={handlePhotoSkip}
          />
        )}

        {step === 7 && (
          <AnalyzingLoader
            archetype={responses.archetype}
            onComplete={handleAnalysisComplete}
          />
        )}

        {step === 8 && planResult && (
          <PlanResultView
            responses={responses}
            result={planResult}
            onGoToDashboard={() => router.push("/today")}
          />
        )}
      </main>
    </div>
  );
};
