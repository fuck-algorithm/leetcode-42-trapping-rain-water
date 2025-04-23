import { useState, useEffect, useCallback } from 'react';
import { BruteForceStep, UseBruteForceStepsProps } from './types';
import { calculateBruteForceSteps } from './bruteForceSteps';

/**
 * 暴力法算法步骤控制钩子
 * 用于控制步骤的播放、进度和状态
 */
const useBruteForceSteps = ({ heights, speed }: UseBruteForceStepsProps) => {
  const [steps, setSteps] = useState<BruteForceStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // 计算所有步骤
  useEffect(() => {
    const calculatedSteps = calculateBruteForceSteps(heights);
    setSteps(calculatedSteps);
    setCurrentStepIndex(0);
  }, [heights]);

  // 下一步
  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  // 上一步
  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // 自动播放的逻辑
  useEffect(() => {
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }

    if (isPlaying && currentStepIndex < steps.length - 1) {
      const id = setTimeout(nextStep, speed);
      setTimerId(id);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isPlaying, currentStepIndex, steps.length, nextStep, speed]);

  // 设置进度
  const setProgress = useCallback((value: number) => {
    const newIndex = Math.round((value / 100) * (steps.length - 1));
    setCurrentStepIndex(newIndex);
  }, [steps.length]);

  // 计算当前进度百分比
  const progress = steps.length > 1 
    ? (currentStepIndex / (steps.length - 1)) * 100 
    : 0;

  // 返回控制接口
  return {
    currentStep: steps[currentStepIndex],
    currentStepIndex,
    totalSteps: steps.length,
    isPlaying,
    progress,
    togglePlay,
    nextStep,
    prevStep,
    setProgress
  };
};

export default useBruteForceSteps; 