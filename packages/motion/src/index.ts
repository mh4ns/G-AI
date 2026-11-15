import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// Register entrypoint for Remotion CLI and Player
registerRoot(RemotionRoot);

export { RemotionRoot };
export { BrandIntro, type BrandIntroProps } from "./compositions/BrandIntro";
