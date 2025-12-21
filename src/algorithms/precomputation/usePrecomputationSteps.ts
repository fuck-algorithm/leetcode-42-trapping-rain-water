import { useState, useEffect, useRef, useCallback } from 'react';
import { CodeLineBinding, createCodeLineBinding } from '../../components/canvas/animation/types';

export interface AnimationStep {
  leftMax: number[];
  rightMax: number[];
  water: number[];
  totalWater: number;
  currentIndex: number;
  phase: 'leftScan' | 'rightScan' | 'waterCalculation' | 'complete';
  description?: string;
  // 代码行绑定
  codeLineBindings?: CodeLineBinding;
}

/**
 * 预计算法代码行映射
 * 基于 algorithmCodes.ts 中的代码结构
 */
const CODE_LINE_MAPPINGS = {
  // 初始化数组
  initArrays: createCodeLineBinding([2, 3, 4, 5, 6], [2, 3, 4, 5, 6, 7], [2, 3, 4, 5, 6, 7], [2, 3, 4, 5, 6]),
  // 左侧扫描初始化
  leftScanInit: createCodeLineBinding(9, 10, 10, 9),
  // 左侧扫描循环
  leftScanLoop: createCodeLineBinding([10, 11], [11, 12], [11, 12], [10, 11]),
  // 右侧扫描初始化
  rightScanInit: createCodeLineBinding(15, 16, 16, 15),
  // 右侧扫描循环
  rightScanLoop: createCodeLineBinding([16, 17], [17, 18], [17, 18], [16, 17]),
  // 计算水量
  calcWater: createCodeLineBinding([21, 22], [22, 23], [22, 23], [21, 22]),
  // 返回结果
  returnResult: createCodeLineBinding(24, 25, 25, 24),
};

interface UsePrecomputationStepsProps {
  heights: number[];
  speed?: number; // 播放速度，毫秒
}

export const usePrecomputationSteps = ({ heights, speed = 500 }: UsePrecomputationStepsProps) => {
  const [steps, setSteps] = useState<AnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 生成所有动画步骤
  useEffect(() => {
    const n = heights.length;
    if (n <= 2) {
      return;
    }

    const generatedSteps: AnimationStep[] = [];
    const leftMax = new Array(n).fill(0);
    const rightMax = new Array(n).fill(0);
    const water = new Array(n).fill(0);

    // 初始状态
    generatedSteps.push({
      leftMax: [...leftMax],
      rightMax: [...rightMax],
      water: [...water],
      totalWater: 0,
      currentIndex: 0,
      phase: 'leftScan',
      description: '初始化：创建 leftMax 和 rightMax 数组',
      codeLineBindings: CODE_LINE_MAPPINGS.initArrays
    });

    // 左侧扫描阶段
    leftMax[0] = heights[0];
    generatedSteps.push({
      leftMax: [...leftMax],
      rightMax: [...rightMax],
      water: [...water],
      totalWater: 0,
      currentIndex: 0,
      phase: 'leftScan',
      description: `左侧扫描：leftMax[0] = height[0] = ${heights[0]}`,
      codeLineBindings: CODE_LINE_MAPPINGS.leftScanInit
    });

    for (let i = 1; i < n; i++) {
      leftMax[i] = Math.max(leftMax[i-1], heights[i]);
      generatedSteps.push({
        leftMax: [...leftMax],
        rightMax: [...rightMax],
        water: [...water],
        totalWater: 0,
        currentIndex: i,
        phase: 'leftScan',
        description: `左侧扫描：leftMax[${i}] = max(leftMax[${i-1}]=${leftMax[i-1]}, height[${i}]=${heights[i]}) = ${leftMax[i]}`,
        codeLineBindings: CODE_LINE_MAPPINGS.leftScanLoop
      });
    }

    // 右侧扫描阶段
    rightMax[n-1] = heights[n-1];
    generatedSteps.push({
      leftMax: [...leftMax],
      rightMax: [...rightMax],
      water: [...water],
      totalWater: 0,
      currentIndex: n-1,
      phase: 'rightScan',
      description: `右侧扫描：rightMax[${n-1}] = height[${n-1}] = ${heights[n-1]}`,
      codeLineBindings: CODE_LINE_MAPPINGS.rightScanInit
    });

    for (let i = n-2; i >= 0; i--) {
      rightMax[i] = Math.max(rightMax[i+1], heights[i]);
      generatedSteps.push({
        leftMax: [...leftMax],
        rightMax: [...rightMax],
        water: [...water],
        totalWater: 0,
        currentIndex: i,
        phase: 'rightScan',
        description: `右侧扫描：rightMax[${i}] = max(rightMax[${i+1}]=${rightMax[i+1]}, height[${i}]=${heights[i]}) = ${rightMax[i]}`,
        codeLineBindings: CODE_LINE_MAPPINGS.rightScanLoop
      });
    }

    // 计算每个位置的水量
    let totalWater = 0;
    for (let i = 0; i < n; i++) {
      const waterAtPosition = Math.min(leftMax[i], rightMax[i]) - heights[i];
      water[i] = waterAtPosition > 0 ? waterAtPosition : 0;
      totalWater += water[i];
      generatedSteps.push({
        leftMax: [...leftMax],
        rightMax: [...rightMax],
        water: [...water.slice(0, i+1), ...new Array(n-i-1).fill(0)],
        totalWater,
        currentIndex: i,
        phase: 'waterCalculation',
        description: `计算水量：water[${i}] = min(leftMax[${i}]=${leftMax[i]}, rightMax[${i}]=${rightMax[i]}) - height[${i}]=${heights[i]} = ${water[i]}`,
        codeLineBindings: CODE_LINE_MAPPINGS.calcWater
      });
    }

    // 最终结果
    generatedSteps.push({
      leftMax: [...leftMax],
      rightMax: [...rightMax],
      water: [...water],
      totalWater,
      currentIndex: -1,
      phase: 'complete',
      description: `计算完成：总雨水量=${totalWater}单位`,
      codeLineBindings: CODE_LINE_MAPPINGS.returnResult
    });

    setSteps(generatedSteps);
    setCurrentStepIndex(0);
    setProgress(0);
  }, [heights]);

  // 播放/暂停动画
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // 播放动画的效果
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= steps.length) {
            setIsPlaying(false);
            return prevIndex;
          }
          setProgress((nextIndex / (steps.length - 1)) * 100);
          return nextIndex;
        });
      }, speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, steps.length, speed]);

  // 前进到下一步
  const nextStep = useCallback(() => {
    setCurrentStepIndex(prevIndex => {
      const nextIndex = Math.min(prevIndex + 1, steps.length - 1);
      setProgress((nextIndex / (steps.length - 1)) * 100);
      return nextIndex;
    });
  }, [steps.length]);

  // 返回上一步
  const prevStep = useCallback(() => {
    setCurrentStepIndex(prevIndex => {
      const nextIndex = Math.max(prevIndex - 1, 0);
      setProgress((nextIndex / (steps.length - 1)) * 100);
      return nextIndex;
    });
  }, [steps.length]);

  // 跳转到指定步骤
  const goToStep = useCallback((stepIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
    setCurrentStepIndex(boundedIndex);
    setProgress((boundedIndex / (steps.length - 1)) * 100);
  }, [steps.length]);

  // 设置进度
  const setProgressValue = useCallback((newProgress: number) => {
    const normalizedProgress = Math.max(0, Math.min(newProgress, 100));
    const newIndex = Math.round((normalizedProgress / 100) * (steps.length - 1));
    setCurrentStepIndex(newIndex);
    setProgress(normalizedProgress);
  }, [steps.length]);

  // 重置到初始状态
  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setProgress(0);
    setIsPlaying(false);
  }, []);

  return {
    currentStep: steps[currentStepIndex],
    currentStepIndex,
    totalSteps: steps.length,
    isPlaying,
    progress,
    togglePlay,
    nextStep,
    prevStep,
    goToStep,
    setProgress: setProgressValue,
    reset
  };
};

export default usePrecomputationSteps; 