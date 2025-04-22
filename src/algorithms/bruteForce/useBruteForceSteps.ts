import { useState, useEffect, useCallback } from 'react';

interface UseBruteForceStepsProps {
  heights: number[];
  speed: number;
}

type Phase = 'init' | 'scanLeft' | 'scanRight' | 'calculate' | 'complete';

interface Step {
  water: number[];
  totalWater: number;
  currentIndex: number;
  leftMax: number;
  rightMax: number;
  leftScanIndex: number;
  rightScanIndex: number;
  phase: Phase;
}

const useBruteForceSteps = ({ heights, speed }: UseBruteForceStepsProps) => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // 计算所有步骤
  useEffect(() => {
    const computeSteps = () => {
      const newSteps: Step[] = [];
      const n = heights.length;
      const water = new Array(n).fill(0);
      let totalWater = 0;

      // 初始步骤
      newSteps.push({
        water: [...water],
        totalWater: 0,
        currentIndex: -1,
        leftMax: 0,
        rightMax: 0,
        leftScanIndex: -1,
        rightScanIndex: -1,
        phase: 'init'
      });

      // 遍历每个位置
      for (let i = 0; i < n; i++) {
        // 添加当前处理的位置步骤
        newSteps.push({
          water: [...water],
          totalWater,
          currentIndex: i,
          leftMax: 0,
          rightMax: 0,
          leftScanIndex: -1,
          rightScanIndex: -1,
          phase: 'scanLeft'
        });

        let leftMax = 0;
        // 扫描左侧找最大值
        for (let j = 0; j <= i - 1; j++) {
          const step: Step = {
            water: [...water],
            totalWater,
            currentIndex: i,
            leftMax,
            rightMax: 0,
            leftScanIndex: j,
            rightScanIndex: -1,
            phase: 'scanLeft'
          };
          
          if (heights[j] > leftMax) {
            leftMax = heights[j];
            // 只在左侧最大值更新时添加步骤
            newSteps.push(step);
          }
        }

        // 左侧扫描完成
        newSteps.push({
          water: [...water],
          totalWater,
          currentIndex: i,
          leftMax,
          rightMax: 0,
          leftScanIndex: -1,
          rightScanIndex: -1,
          phase: 'scanRight'
        });

        let rightMax = 0;
        // 扫描右侧找最大值
        for (let j = n - 1; j >= i + 1; j--) {
          const step: Step = {
            water: [...water],
            totalWater,
            currentIndex: i,
            leftMax,
            rightMax,
            leftScanIndex: -1, 
            rightScanIndex: j,
            phase: 'scanRight'
          };
          
          if (heights[j] > rightMax) {
            rightMax = heights[j];
            // 只在右侧最大值更新时添加步骤
            newSteps.push(step);
          }
        }

        // 右侧扫描完成，准备计算水量
        newSteps.push({
          water: [...water],
          totalWater,
          currentIndex: i,
          leftMax,
          rightMax,
          leftScanIndex: -1,
          rightScanIndex: -1,
          phase: 'calculate'
        });

        // 计算当前位置的水量
        const minHeight = Math.min(leftMax, rightMax);
        if (minHeight > heights[i]) {
          const waterAmount = minHeight - heights[i];
          water[i] = waterAmount;
          totalWater += waterAmount;

          // 添加计算水量的步骤
          newSteps.push({
            water: [...water],
            totalWater,
            currentIndex: i,
            leftMax,
            rightMax,
            leftScanIndex: -1,
            rightScanIndex: -1,
            phase: 'calculate'
          });
        }
      }

      // 完成步骤
      newSteps.push({
        water: [...water],
        totalWater,
        currentIndex: -1,
        leftMax: 0,
        rightMax: 0,
        leftScanIndex: -1,
        rightScanIndex: -1,
        phase: 'complete'
      });

      setSteps(newSteps);
      setCurrentStepIndex(0);
    };

    computeSteps();
  }, [heights]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

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

  const setProgress = useCallback((value: number) => {
    const newIndex = Math.round((value / 100) * (steps.length - 1));
    setCurrentStepIndex(newIndex);
  }, [steps.length]);

  const progress = steps.length > 1 
    ? (currentStepIndex / (steps.length - 1)) * 100 
    : 0;

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