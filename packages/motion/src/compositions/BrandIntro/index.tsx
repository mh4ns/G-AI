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

  // Scene 1: 3D Spatial Wireframe (3s)
  const scene1Duration = 3 * fps;
  // Transition: 15 frames
  const transitionDuration = 15;
  // Scene 2: Typography & Brand message (3s)
  const scene2Duration = 3 * fps;

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
    <AbsoluteFill style={{ backgroundColor: "#0b0f17", color: "#f8fafc" }}>
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
                color: "#10b981",
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
                color: "#94a3b8",
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
