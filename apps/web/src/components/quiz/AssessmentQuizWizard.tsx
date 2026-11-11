"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  QuizResponses, 
  PersonalizedPlanResult, 
  PrimaryGoal, 
  BodyFocusArea, 
  FitnessObstacle, 
  AthleticArchetype 
} from "@/types/quiz";
import { calculatePersonalizedPlan, minSafeTargetWeightKg } from "@/lib/quiz-calculations";
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

  // Page slide (transitions.dev 08): keep the step being left on screen while
  // it slides out. Forward moves exit left, back moves exit right.
  const [pages, setPages] = useState<{ current: number; previous: number | null; forward: boolean }>({
    current: 1,
    previous: null,
    forward: true,
  });
  const [settled, setSettled] = useState(true);
  const currentRef = useRef(1);

  useEffect(() => {
    if (step === currentRef.current) return;
    const forward = step > currentRef.current;
    setPages({ current: step, previous: currentRef.current, forward });
    currentRef.current = step;
    setSettled(false);
    window.scrollTo({ top: 0 });
  }, [step]);

  // One frame on the old data-page, then flip it so the CSS transitions run.
  useEffect(() => {
    if (settled) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setSettled(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [settled]);

  // Drop the outgoing page once its slide is over.
  useEffect(() => {
    if (!settled || pages.previous === null) return;
    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--page-slide-dur")) || 250;
    const id = setTimeout(() => setPages((p) => ({ ...p, previous: null })), ms);
    return () => clearTimeout(id);
  }, [settled, pages.previous]);

  // Form State
  const [responses, setResponses] = useState<QuizResponses>({
    archetype: "female_pilates",
    gender: "female",
    goal: "tone_muscle",
    focusAreas: ["belly", "glutes"],
    age: 26,
    heightCm: 165,
    currentWeightKg: 58,
    // Start the target at the current weight: the quiz suggests no weight change
    // until the person chooses one.
    targetWeightKg: 58,
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
    setResponses((prev) => {
      const next = { ...prev, [field]: val };
      // A taller height raises the healthy floor; lift the target to it if needed.
      next.targetWeightKg = Math.max(next.targetWeightKg, minSafeTargetWeightKg(next.heightCm));
      return next;
    });
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

  const handleAnalysisComplete = () => {
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

    // Photo-based predictions are generated on /prediction, after explicit consent.
    localStorage.removeItem("g_ai_twin_milestones");

    setStep(8);
  };



  const renderStep = (n: number) => (
    <>
        {n === 1 && (
          <ArchetypeSelectionStep
            selectedArchetype={responses.archetype}
            onSelect={handleSelectArchetype}
          />
        )}

        {n === 2 && (
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
                className="min-h-12 px-8 rounded-full font-semibold text-base flex items-center gap-2 transition-colors active:translate-y-px bg-brand-action hover:bg-brand-action-hover text-white"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {n === 3 && (
          <FocusAreaStep
            archetype={responses.archetype}
            selectedAreas={responses.focusAreas}
            equipmentAccess={responses.equipmentAccess}
            onToggleArea={handleToggleFocusArea}
            onSelectEquipment={(equipmentAccess) => setResponses((prev) => ({ ...prev, equipmentAccess }))}
            onNext={handleNext}
          />
        )}

        {n === 4 && (
          <BodyStatsStep
            heightCm={responses.heightCm}
            currentWeightKg={responses.currentWeightKg}
            targetWeightKg={responses.targetWeightKg}
            onChangeStats={handleChangeStats}
            onNext={handleNext}
          />
        )}

        {n === 5 && (
          <ObstaclesStep
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

        {n === 6 && (
          <PhotoUploadStep
            onPhotoSubmit={handlePhotoSubmit}
            onSkip={handlePhotoSkip}
          />
        )}

        {n === 7 && (
          <AnalyzingLoader
            archetype={responses.archetype}
            onComplete={handleAnalysisComplete}
          />
        )}

        {n === 8 && planResult && (
          <PlanResultView
            responses={responses}
            result={planResult}
            onGoToDashboard={() => router.push("/today")}
          />
        )}
    </>
  );

  const inId = pages.forward ? "2" : "1";
  const outId = pages.forward ? "1" : "2";

  return (
    <div
      className="min-h-screen flex flex-col justify-between transition-colors duration-500 bg-canvas text-stone-900 selection:bg-brand/20 selection:text-brand-action"
    >
      {/* Header with progress line (shown for steps 2 to 6) */}
      {step >= 2 && step <= 6 && (
        <StepHeader
          // Steps 1-5 are the five questions (step 1 has no header); step 6 is the optional photo.
          questionNumber={step <= 5 ? step : undefined}
          totalQuestions={5}
          progress={step / 6}
          onBack={handleBack}
          canGoBack={true}
        />
      )}

      {/* Main Wizard Step Content */}
      <main className="flex-1 flex flex-col justify-center">
        <div className="t-page-slide w-full" data-page={settled ? inId : outId}>
          {[pages.previous, pages.current]
            .filter((n): n is number => n !== null)
            .map((n) => {
              const isCurrent = n === pages.current;
              return (
                <section
                  key={n}
                  className={`t-page${isCurrent ? " t-page--in-flow" : ""}`}
                  data-page-id={isCurrent ? inId : outId}
                  aria-hidden={!isCurrent || undefined}
                  inert={!isCurrent || undefined}
                >
                  {renderStep(n)}
                </section>
              );
            })}
        </div>
      </main>
    </div>
  );
};
