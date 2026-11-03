# Dual-Athlete Kinetic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-architect and redesign the G-AI home experience (`/`) using world-class scrollytelling and kinetic micro-interactions reverse-engineered from `landonorris.com` and `mecha-xyz.webflow.io`, showcasing both female and male athletic fitness aesthetics inspired by Pinterest fitness moodboards.

**Architecture:** Next.js 15 App Router architecture with modular client-side micro-interaction components (`KineticText`, `VelocityMarquee`, `DualAthleteHero`, `DualAthleteGallery`, `AiVisionTeaser`). State-driven athlete toggle (Female Pilates Sculpt $\leftrightarrow$ Male Strength & Biomechanics) cross-dissolving editorial photography, telemetry metrics, and color sweeps.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide React, CSS Transitions & GPU Matrix Transforms (`clip-path`, `transformOrigin`, `scaleX`, `translateY`).

**Spec:** [docs/USECASE_BREAKDOWN.md](file:///C:/Users/minhh/OneDrive/Pictures/Documents/GitHub/G-ai/docs/USECASE_BREAKDOWN.md) and Design Document approved in conversation.

---

## Global Constraints
- Strictly zero external heavyweight JS bundles; all micro-interactions must run at 60 FPS using GPU-accelerated CSS properties (`transform`, `opacity`, `clip-path`).
- 100% responsive: Mobile (< 640px), Tablet (640-1024px), Desktop (> 1024px).
- Both female and male athletic disciplines represented equally (Pilates Core Sculpt & Athletic Calisthenics/Strength).
- Clear CTA routes to existing functional sub-pages: `/quiz` (28-day assessment), `/prediction` (Digital Twin), `/today` (Dashboard), and `/store` (Apparel & Apparatus).

## Review Focus
- High-contrast typography rendering without layout shifts during hover or text-wipe sweeps.
- Instantaneous and glitch-free gender toggle transitions in the Hero.
- Performance: 60 FPS scrolling with infinite marquee loop.
- Offline and remote image resilience with proper fallback dimensions.

---

## File Structure

```
apps/web/src/
├── components/
│   └── home/
│       ├── KineticText.tsx           # SweepHighlight & FlipTextHover micro-interactions
│       ├── VelocityMarquee.tsx       # Infinite running ticker with scroll velocity response
│       ├── DualAthleteHero.tsx       # Gender-toggleable Hero stage with telemetry & photography
│       ├── DualAthleteGallery.tsx    # Pinterest-style editorial asymmetrical masonry grid
│       ├── AiVisionTeaser.tsx        # Computer vision real-time posture correction spotlight
│       └── HomeNavbar.tsx            # Tactical glassmorphic navbar with kinetic hover links
└── app/
    └── page.tsx                      # Master Home Page integration
```

---

## Implementation Tasks

### Task 1: Create Kinetic Micro-Interactions (`KineticText.tsx` & `VelocityMarquee.tsx`)
- [x] Create `apps/web/src/components/home/KineticText.tsx` with:
  - `SweepHighlight`: Rectangular color wipe using `clipPath: "inset(0 100% 0 0)"` and animated curtain div scaling down.
  - `FlipTextHover`: Word splitter wrapping each `.char` in an overflow-hidden slot rolling characters upward 100% with stagger delay on mouse enter.
- [x] Create `apps/web/src/components/home/VelocityMarquee.tsx` with infinite CSS animation and scroll speed velocity multiplier.
- [x] Verify both components compile cleanly with Next.js TypeScript engine.
- [x] Commit: `feat(home): implement kinetic text sweep, hover roll, and velocity marquee components`

### Task 2: Build the Dual-Athlete Interactive Hero Stage (`DualAthleteHero.tsx`)
- [x] Create `apps/web/src/components/home/DualAthleteHero.tsx` with:
  - State `athleteGender: "female" | "male"`.
  - Toggle switch `[ ♀ Nữ: Pilates & Core ]` $\leftrightarrow$ `[ ♂ Nam: Strength & Sức Bền ]`.
  - Pinterest-grade curated high-resolution photography for female and male athletes.
  - Dynamic telemetry HUD widget displaying specific biometrics (BMR, Kyphosis angle, Core engagement, Calorie burn).
  - High-impact headlines using `SweepHighlight` in Coral `#FF5A36` and Emerald `#10B981`.
- [x] Verify toggle transition is smooth, without layout jump.
- [x] Commit: `feat(home): build dual-athlete hero stage with live telemetry HUD and Pinterest-style photography`

### Task 3: Build the Editorial Athlete Gallery (`DualAthleteGallery.tsx`)
- [x] Create `apps/web/src/components/home/DualAthleteGallery.tsx` with:
  - Asymmetric 6-card masonry grid showcasing female Pilates movements and male athletic strength disciplines.
  - Interactive hover state: Image zoom (1.05x), subtle dark vignette, anatomical target muscle tags.
  - Studio aesthetic matching Pinterest moodboards (monochrome athletic wear, rim lighting).
- [x] Verify responsive behavior on mobile and desktop.
- [x] Commit: `feat(home): build editorial athlete gallery with Pinterest-inspired male and female fitness imagery`

### Task 4: Build the AI Live PT Vision Teaser & Tactical Navbar (`AiVisionTeaser.tsx` & `HomeNavbar.tsx`)
- [x] Create `apps/web/src/components/home/AiVisionTeaser.tsx` illustrating real-time webcam pose detection (skeletal landmarks, rep counter, form warnings).
- [x] Create `apps/web/src/components/home/HomeNavbar.tsx` with tactical glassmorphism, brand logo, and `FlipTextHover` navigation links.
- [x] Verify components render correctly.
- [x] Commit: `feat(home): build AI vision posture teaser and tactical navbar`

### Task 5: Assemble Master Home Page (`apps/web/src/app/page.tsx`) & Full Verification
- [x] Replace `apps/web/src/app/page.tsx` with full assembly of `HomeNavbar`, `DualAthleteHero`, `VelocityMarquee`, `DualAthleteGallery`, `AiVisionTeaser`, and call-to-actions to `/quiz`, `/prediction`, `/today`, and `/store`.
- [x] Run production build `npm run build` in `apps/web` to ensure 0 TypeScript or React errors.
- [x] Verify routes respond with HTTP 200 OK.
- [x] Push changes to GitHub `origin/main`.
- [x] Commit: `feat(home): assemble complete dual-athlete kinetic redesign for G-AI homepage`
