import React from "react";
import { useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";

interface ThreeHeroProps {
  width: number;
  height: number;
}

const SpinningDodecahedron: React.FC = () => {
  const frame = useCurrentFrame();

  // Deterministic rotation derived purely from current frame (no useFrame/requestAnimationFrame)
  const rotationY = (frame * 0.02) % (Math.PI * 2);
  const rotationX = (frame * 0.01) % (Math.PI * 2);

  return (
    <mesh rotation={[rotationX, rotationY, 0]}>
      <dodecahedronGeometry args={[1.8, 0]} />
      <meshStandardMaterial
        color="#FF5A36"
        metalness={0.2}
        roughness={0.4}
        wireframe={true}
      />
    </mesh>
  );
};

export const ThreeHero: React.FC<ThreeHeroProps> = ({ width, height }) => {
  return (
    <ThreeCanvas width={width} height={height}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <SpinningDodecahedron />
    </ThreeCanvas>
  );
};
