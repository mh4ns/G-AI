import React from "react";
import { Composition } from "remotion";
import {
  BRAND_INTRO_DURATION_IN_FRAMES,
  BRAND_INTRO_FPS,
  BrandIntro,
} from "./compositions/BrandIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BrandIntro"
        component={BrandIntro}
        durationInFrames={BRAND_INTRO_DURATION_IN_FRAMES}
        fps={BRAND_INTRO_FPS}
        width={1920}
        height={1080}
        defaultProps={{
          title: "G-AI",
          subtitle: "Movement & Real-time AI Coaching",
        }}
      />
    </>
  );
};
