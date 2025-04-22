import { useState, useEffect, useRef, useCallback } from 'react';

export interface TwoPointersStep {
  heights: number[];
  left: number;
  right: number;
  leftMax: number;
  rightMax: number;
  water: number[];
  totalWater: number;
  currentFill?: number;
  phase: 'init' | 'moveLeft' | 'moveRight' | 'complete';
}

interface UseTwoPointersStepsProps {
  heights: number[];
  speed?: number; // 播放速度，毫秒
}

export const useTwoPointersSteps = ({ heights, speed = 500 }: UseTwoPointersStepsProps) => {
  const [steps, setSteps] = useState<TwoPointersStep[]>([]);
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

    const generatedSteps: TwoPointersStep[] = [];
    let left = 0;
    let right = n - 1;
    let leftMax = heights[left];
    let rightMax = heights[right];
    const water = new Array(n).fill(0);
    let totalWater = 0;

    // 初始状态
    generatedSteps.push({
      heights,
      left,
      right,
      leftMax,
      rightMax,
      water: [...water],
      totalWater: 0,
      phase: 'init'
    });

    while (left < right) {
      // 从左边向中间移动
      if (heights[left] <= heights[right]) {
        left++;
        
        // 如果当前高度小于leftMax，可以装水
        if (heights[left] < leftMax) {
          const fill = leftMax - heights[left];
          water[left] = fill;
          totalWater += fill;
          
          // 记录填充水的步骤
          generatedSteps.push({
            heights,
            left,
            right,
            leftMax,
            rightMax,
            water: [...water],
            totalWater,
            currentFill: fill,
            phase: 'moveLeft'
          });
        } 
        // 如果当前高度大于等于leftMax，更新leftMax
        else {
          leftMax = heights[left];
          
          // 记录更新leftMax的步骤
          generatedSteps.push({
            heights,
            left,
            right,
            leftMax,
            rightMax,
            water: [...water],
            totalWater,
            phase: 'moveLeft'
          });
        }
      } 
      // 从右边向中间移动
      else {
        right--;
        
        // 如果当前高度小于rightMax，可以装水
        if (heights[right] < rightMax) {
          const fill = rightMax - heights[right];
          water[right] = fill;
          totalWater += fill;
          
          // 记录填充水的步骤
          generatedSteps.push({
            heights,
            left,
            right,
            leftMax,
            rightMax,
            water: [...water],
            totalWater,
            currentFill: fill,
            phase: 'moveRight'
          });
        } 
        // 如果当前高度大于等于rightMax，更新rightMax
        else {
          rightMax = heights[right];
          
          // 记录更新rightMax的步骤
          generatedSteps.push({
            heights,
            left,
            right,
            leftMax,
            rightMax,
            water: [...water],
            totalWater,
            phase: 'moveRight'
          });
        }
      }
    }

    // 最终结果
    generatedSteps.push({
      heights,
      left,
      right,
      leftMax,
      rightMax,
      water: [...water],
      totalWater,
      phase: 'complete'
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
    setProgress: setProgressValue
  };
};

export default useTwoPointersSteps; 