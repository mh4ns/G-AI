import React from "react";
import { Composition } from "remotion";
import { BrandIntro } from "./compositions/BrandIntro";

export const RemotionRoot: React.FC = () => {
  // Total = 90 + 90 - 15 = 165 frames (5.5 seconds at 30 fps)
  return (
    <>
      <Composition
        id="BrandIntro"
        component={BrandIntro}
        durationInFrames={165}
        fps={30}
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
