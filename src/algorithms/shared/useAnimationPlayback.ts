import { useCallback, useEffect, useRef, useState } from 'react';

export interface PlaybackSnapshot {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  progress: number;
}

export function useAnimationPlayback<T>(steps: T[], speed = 1000) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);
  const totalSteps = steps.length;
  const progress = totalSteps <= 1 ? 0 : currentStepIndex / (totalSteps - 1) * 100;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    stepRef.current = 0;
  }, [steps]);

  useEffect(() => {
    if (!isPlaying || totalSteps <= 1) return undefined;
    intervalRef.current = setInterval(() => {
      if (stepRef.current >= totalSteps - 1) {
        setIsPlaying(false);
        return;
      }
      const nextIndex = stepRef.current + 1;
      stepRef.current = nextIndex;
      setCurrentStepIndex(nextIndex);
      if (nextIndex >= totalSteps - 1) setIsPlaying(false);
    }, speed);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isPlaying, speed, totalSteps]);

  const goToStep = useCallback((index: number) => {
    setIsPlaying(false);
    const bounded = Math.max(0, Math.min(index, Math.max(0, totalSteps - 1)));
    stepRef.current = bounded;
    setCurrentStepIndex(bounded);
  }, [totalSteps]);
  const nextStep = useCallback(() => goToStep(currentStepIndex + 1), [currentStepIndex, goToStep]);
  const prevStep = useCallback(() => goToStep(currentStepIndex - 1), [currentStepIndex, goToStep]);
  const togglePlay = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      stepRef.current = 0;
      setCurrentStepIndex(0);
    }
    setIsPlaying(value => !value);
  }, [currentStepIndex, totalSteps]);
  const reset = useCallback(() => {
    setIsPlaying(false);
    stepRef.current = 0;
    setCurrentStepIndex(0);
  }, []);
  const setProgress = useCallback((value: number) => {
    const bounded = Math.max(0, Math.min(100, value));
    goToStep(Math.round(bounded / 100 * Math.max(0, totalSteps - 1)));
  }, [goToStep, totalSteps]);

  return {
    currentStep: steps[currentStepIndex],
    currentStepIndex,
    totalSteps,
    isPlaying,
    progress,
    togglePlay,
    nextStep,
    prevStep,
    goToStep,
    setProgress,
    reset,
  };
}
