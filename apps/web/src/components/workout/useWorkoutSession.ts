/**
 * React adapter hook for WorkoutSessionEngine.
 *
 * Keeps the React component reactive to session state without running 60fps
 * render loops inside React's reconciler.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  WorkoutSessionConfig,
  WorkoutSessionEngine,
  WorkoutSessionSnapshot,
  WorkoutSummaryData,
} from "./workout-session-engine";
import { DEFAULT_EXERCISES } from "./pose-math";

export interface UseWorkoutSessionOptions extends WorkoutSessionConfig {
  isOpen: boolean;
}

export function useWorkoutSession(options: UseWorkoutSessionOptions) {
  const { isOpen, exercises = DEFAULT_EXERCISES, archetype, isMuted = false, onSummary } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const engineRef = useRef<WorkoutSessionEngine | null>(null);
  const onSummaryRef = useRef(onSummary);
  onSummaryRef.current = onSummary;

  const [snapshot, setSnapshot] = useState<WorkoutSessionSnapshot>(() => {
    const dummy = new WorkoutSessionEngine({ exercises, archetype, isMuted });
    const snap = dummy.getSnapshot();
    dummy.dispose();
    return snap;
  });

  // Handle workout completion and trigger decorative confetti.
  // Saving to the dashboard happens explicitly via LiveWorkoutStudio's CTA button.
  const handleSummary = useCallback((summary: WorkoutSummaryData) => {
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#FF5A36", "#10B981", "#FFFFFF", "#F59E0B"],
      });
    } catch {
      // Confetti is decorative
    }
    onSummaryRef.current?.(summary);
  }, []);

  // Initialize and tear down engine bound to modal open/close lifecycle
  useEffect(() => {
    if (!isOpen) {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      return;
    }

    const engine = new WorkoutSessionEngine({
      exercises,
      archetype,
      isMuted,
      onSummary: handleSummary,
    });
    engineRef.current = engine;

    engine.attachElements({
      container: containerRef.current,
      video: videoRef.current,
      canvas: canvasRef.current,
    });

    const unsubscribe = engine.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    engine.start();

    return () => {
      unsubscribe();
      engine.dispose();
      engineRef.current = null;
    };
  }, [isOpen, archetype]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-attach elements if refs update after mounting
  useEffect(() => {
    if (isOpen && engineRef.current) {
      engineRef.current.attachElements({
        container: containerRef.current,
        video: videoRef.current,
        canvas: canvasRef.current,
      });
    }
  });

  // Sync mute state if changed externally
  useEffect(() => {
    if (engineRef.current && engineRef.current.getSnapshot().isMuted !== isMuted) {
      engineRef.current.setMuted(isMuted);
    }
  }, [isMuted]);

  // Action dispatches
  const addCount = useCallback((amount: number) => {
    engineRef.current?.addCount(amount);
  }, []);

  const nextExercise = useCallback(() => {
    engineRef.current?.nextExercise();
  }, []);

  const toggleCamera = useCallback(() => {
    engineRef.current?.toggleCamera();
  }, []);

  const startCamera = useCallback(() => {
    void engineRef.current?.startCamera();
  }, []);

  const stopCamera = useCallback(() => {
    engineRef.current?.stopCamera();
  }, []);

  const togglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const toggleMute = useCallback(() => {
    engineRef.current?.toggleMute();
  }, []);

  const completeWorkout = useCallback(() => {
    engineRef.current?.completeWorkout();
  }, []);

  return {
    ...snapshot,
    containerRef,
    videoRef,
    canvasRef,
    addCount,
    nextExercise,
    toggleCamera,
    startCamera,
    stopCamera,
    togglePause,
    toggleMute,
    completeWorkout,
  };
}
