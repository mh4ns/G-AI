# Glossary

Domain terms as used in code, issues and docs. Prefer these words over synonyms.

| Term | Meaning | In code |
|---|---|---|
| **Archetype** | The training persona a user picks first: `female_pilates` or `male_strength`. Drives theme, copy and default plan. Not the same as gender. | `AthleticArchetype`, `archetype` |
| **Quiz** / **Assessment** | The onboarding questionnaire and one saved submission of it. | `QuizResponses` (web), `QuizAssessment` (backend) |
| **Plan** | Numbers derived from an assessment: BMI, BMR, TDEE, daily calorie target, water target, estimated weeks. A user has at most one *active* plan. | `PersonalizedPlanResult` (web), `PersonalizedPlan` (backend), `plan_calculator.py` |
| **BMR** | Basal metabolic rate, Mifflin-St Jeor equation. | `bmr` |
| **TDEE** | BMR × activity multiplier. | `tdee` |
| **Daily metric** | One user's tracked numbers for one local calendar day: water, calories eaten/burned, fasting state, completed habits. | `DailyMetric`, `/today` |
| **Habit** | A checklist item completed for a day, stored by key (`water`, `workout`, `mindfulness`, `fasting`, …). | `habits_completed`, `habit_key` |
| **Workout log** | A finished session: duration, calories, reps, form accuracy. | `WorkoutLog` |
| **Form accuracy** | 0–100 score of how closely joint angles stayed within an exercise's target range. Measured in the browser with MediaPipe Pose (`apps/web/src/components/workout`, `pose-math.ts`); absent (`null`) when the session runs without the camera. | `form_accuracy_pct`, `averageFormScore` |
| **Day 0 photo** | The user's own photo used as the base for predictions. Biometric data: stays on-device unless the user gives **photo consent**. | `userPhotoBase64`, `g_ai_user_twin_photo` |
| **Photo consent** | Explicit, revocable opt-in to send the Day 0 photo to the AI provider. Never pre-checked. | `hasPhotoConsent`, `consentAccepted` |
| **Prediction** / **Milestone** | AI-edited versions of the Day 0 photo at days 7, 14 and 28. | `MILESTONE_DAYS`, `completedDays` |
| **Prediction job** | One asynchronous generation run, addressed by `jobId` and authorised by its **job token**. | `PredictionJob`, `x-job-token` |
| **Signed image link** | Short-lived HMAC URL that is the only way to fetch a stored milestone image. | `signedMilestoneUrl` |
| **Digital Twin** | Product name for the prediction screen (`/prediction`). | — |
| **AI Live PT** / **Studio** | The in-browser workout session with camera and coaching. | `LiveWorkoutStudio` |

## Avoid

- "user_id" in API requests: the acting user always comes from the session.
- "paid" for orders that no payment provider confirmed; use `pending` / `awaiting_payment`.
