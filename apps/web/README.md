# G-AI — Web Application

## 1. Overview
Modern Next.js 15 Web Application supporting:
- Onboarding Assessment Quiz & Plan Generator (`UC-1.1`, `UC-1.2`)
- Interactive Video Workout Player & Responsive Big-Screen Mode (`UC-2.1`)
- **Webcam Real-Time AI Workout Companion** powered by MediaPipe Pose (`UC-2.4`)
- Food Nutrition Search & Calorie Balance Hub (`UC-3.1`, `UC-3.2`)
- Intermittent Fasting Visual Timer (`UC-3.3`)
- US Navy Body Fat Calculator & Photo Progress Slider (`UC-4.1`, `UC-4.2`)
- Visual Breathwork (Box Breathing 4-4-4-4) & AI CBT Journal (`UC-5.1`, `UC-5.2`)
- Unified Today Dashboard Hub (`UC-6.1`)

## 2. Directory Structure
```text
src/
├── app/          # Next.js App Router (pages: /today, /workout, /nutrition, etc.)
├── components/   # Reusable UI widgets (TodayHub, PoseCanvas, VideoPlayer)
├── hooks/        # Custom React hooks (usePoseDetection, useAudioDucking)
├── lib/          # API client, utility functions
└── types/        # TypeScript interfaces & domain models
```

## 3. Running Locally
```bash
cd apps/web
npm install
npm run dev
```
Open web app at: `http://localhost:3000`
