import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ThreeHero } from "./ThreeHero";

export const BRAND_INTRO_FPS = 30;
export const BRAND_INTRO_SCENE_1_SECONDS = 3;
export const BRAND_INTRO_SCENE_2_SECONDS = 3;
export const BRAND_INTRO_TRANSITION_SECONDS = 0.5;
export const BRAND_INTRO_DURATION_IN_FRAMES =
  (BRAND_INTRO_SCENE_1_SECONDS + BRAND_INTRO_SCENE_2_SECONDS - BRAND_INTRO_TRANSITION_SECONDS) *
  BRAND_INTRO_FPS;

export interface BrandIntroProps {
  title?: string;
  subtitle?: string;
}

export const BrandIntro: React.FC<BrandIntroProps> = ({
  title = "G-AI",
  subtitle = "Movement & Real-time AI Coaching",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const scene1Duration = BRAND_INTRO_SCENE_1_SECONDS * fps;
  const transitionDuration = Math.round(BRAND_INTRO_TRANSITION_SECONDS * fps);
  const scene2Duration = BRAND_INTRO_SCENE_2_SECONDS * fps;

  const titleProgress = spring({
    frame: frame - (scene1Duration - transitionDuration),
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(titleProgress, [0, 1], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0908", color: "#F5F2EC" }}>
      <TransitionSeries>
        {/* Scene 1: 3D Spatial Wireframe */}
        <TransitionSeries.Sequence durationInFrames={scene1Duration}>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <ThreeHero width={width} height={height} />
            <div
              style={{
                position: "absolute",
                bottom: 80,
                fontSize: 24,
                letterSpacing: 4,
                textTransform: "uppercase",
                opacity: 0.7,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Hardware-Free Intelligence
            </div>
          </AbsoluteFill>
        </TransitionSeries.Sequence>

        {/* Transition: Smooth Crossfade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 2: Brand Tagline */}
        <TransitionSeries.Sequence durationInFrames={scene2Duration}>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <h1
              style={{
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: -2,
                margin: 0,
                color: "#FF5A36",
                opacity: titleOpacity,
                transform: `scale(${titleScale})`,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 32,
                marginTop: 24,
                color: "#B5AEA5",
                fontWeight: 500,
                opacity: titleOpacity,
              }}
            >
              {subtitle}
            </p>
          </AbsoluteFill>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
