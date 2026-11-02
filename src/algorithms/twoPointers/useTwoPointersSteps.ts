import { useState, useEffect, useRef, useCallback } from 'react';
import { CodeLineBinding, createCodeLineBinding } from '../../components/canvas/animation/types';

export interface TwoPointersStep {
  heights: number[];
  left: number;
  right: number;
  leftMax: number;
  rightMax: number;
  water: number[];
  totalWater: number;
  currentFill?: number;
  phase: 'init' | 'compare' | 'moveLeft' | 'moveRight' | 'complete';
  description?: string; // 当前步骤的详细描述
  operation?: 'init' | 'compare' | 'move' | 'insert' | 'done';
  narration?: string;
  anchorIds?: string[];
  // 决策逻辑
  decision?: {
    leftHeight: number;
    rightHeight: number;
    comparison: 'left_smaller' | 'right_smaller' | 'equal';
    action: 'move_left' | 'move_right' | 'none';
    reason: string;
  };
  // 水量计算
  calculation?: {
    formula: string;
    maxValue: number;
    currentHeight: number;
    waterAmount: number;
  };
  // 代码行绑定
  codeLineBindings?: CodeLineBinding;
}

/**
 * 双指针法代码行映射
 * 基于 algorithmCodes.ts 中的代码结构
 */
const CODE_LINE_MAPPINGS = {
  // 初始化变量
  init: createCodeLineBinding([2, 3, 4], [2, 3, 4], [2, 3, 4], [2, 3, 4]),
  // while 循环条件
  whileCondition: createCodeLineBinding(6, 6, 6, 6),
  // 比较 height[left] <= height[right]
  compare: createCodeLineBinding(7, 7, 7, 7),
  // 更新 leftMax
  updateLeftMax: createCodeLineBinding([8, 9], [8, 9], [8, 9], [8, 9]),
  // 计算左侧水量
  calcLeftWater: createCodeLineBinding([10, 11], [10, 11], [10, 11], [10, 11]),
  // left++
  leftIncrement: createCodeLineBinding(13, 12, 13, 13),
  // 更新 rightMax
  updateRightMax: createCodeLineBinding([15, 16], [14, 15], [15, 16], [15, 16]),
  // 计算右侧水量
  calcRightWater: createCodeLineBinding([17, 18], [16, 17], [17, 18], [17, 18]),
  // right--
  rightDecrement: createCodeLineBinding(20, 18, 20, 20),
  // 返回结果
  returnResult: createCodeLineBinding(23, 21, 23, 23),
};

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
    if (n === 0) {
      setSteps([]);
      setCurrentStepIndex(0);
      setProgress(0);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(false);

    const generatedSteps: TwoPointersStep[] = [];
    let left = 0;
    let right = n - 1;
    let leftMax = heights[left];
    let rightMax = heights[right];
    const water = new Array(n).fill(0);
    let totalWater = 0;

    // 初始状态
    generatedSteps.push({
      heights: [...heights],
      left,
      right,
      leftMax,
      rightMax,
      water: [...water],
      totalWater: 0,
      phase: 'init',
      description: `初始化：左指针在位置${left}，右指针在位置${right}，leftMax=${leftMax}，rightMax=${rightMax}`,
      codeLineBindings: CODE_LINE_MAPPINGS.init
    });

    while (left < right) {
      // 添加比较步骤
      const leftHeight = heights[left];
      const rightHeight = heights[right];
      const comparison = leftHeight < rightHeight ? 'left_smaller' : 
                        leftHeight > rightHeight ? 'right_smaller' : 'equal';
      const willMoveLeft = heights[left] <= heights[right];
      
      generatedSteps.push({
        heights,
        left,
        right,
        leftMax,
        rightMax,
        water: [...water],
        totalWater,
        phase: 'compare',
        description: `比较：height[${left}]=${leftHeight} ${willMoveLeft ? '≤' : '>'} height[${right}]=${rightHeight}，所以移动${willMoveLeft ? '左' : '右'}指针`,
        decision: {
          leftHeight,
          rightHeight,
          comparison,
          action: willMoveLeft ? 'move_left' : 'move_right',
          reason: willMoveLeft 
            ? `左侧更矮(${leftHeight} ≤ ${rightHeight})，移动左指针。因为右侧更高，左侧的水量已确定，不会被右侧影响。`
            : `右侧更矮(${rightHeight} < ${leftHeight})，移动右指针。因为左侧更高，右侧的水量已确定，不会被左侧影响。`
        },
        codeLineBindings: CODE_LINE_MAPPINGS.compare
      });
      
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
            phase: 'moveLeft',
            description: `左指针移到位置${left}：height[${left}]=${heights[left]} < leftMax=${leftMax}，填充雨水${fill}单位`,
            calculation: {
              formula: `leftMax - height[${left}]`,
              maxValue: leftMax,
              currentHeight: heights[left],
              waterAmount: fill
            },
            codeLineBindings: CODE_LINE_MAPPINGS.calcLeftWater
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
            phase: 'moveLeft',
            description: `左指针移到位置${left}：height[${left}]=${heights[left]} ≥ 旧leftMax，更新leftMax=${leftMax}。这里不能装水，但更新了左侧的最大高度。`,
            codeLineBindings: CODE_LINE_MAPPINGS.updateLeftMax
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
            phase: 'moveRight',
            description: `右指针移到位置${right}：height[${right}]=${heights[right]} < rightMax=${rightMax}，填充雨水${fill}单位`,
            calculation: {
              formula: `rightMax - height[${right}]`,
              maxValue: rightMax,
              currentHeight: heights[right],
              waterAmount: fill
            },
            codeLineBindings: CODE_LINE_MAPPINGS.calcRightWater
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
            phase: 'moveRight',
            description: `右指针移到位置${right}：height[${right}]=${heights[right]} ≥ 旧rightMax，更新rightMax=${rightMax}。这里不能装水，但更新了右侧的最大高度。`,
            codeLineBindings: CODE_LINE_MAPPINGS.updateRightMax
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
      phase: 'complete',
      description: `计算完成：左右指针相遇于位置${left}，总雨水量=${totalWater}单位`,
      codeLineBindings: CODE_LINE_MAPPINGS.returnResult
    });

    const annotatedSteps = generatedSteps.map((step, index) => {
      const operation: TwoPointersStep['operation'] = step.phase === 'init' ? 'init' : step.phase === 'compare' ? 'compare' : step.phase === 'complete' ? 'done' : 'move';
      const narration = step.description || `处理位置 ${Math.max(0, step.currentFill === undefined ? step.left : step.right)}，依据两端最高柱确定水位。`;
      return {
        ...step,
        operation,
        narration,
        anchorIds: [`array-${Math.max(0, step.phase === 'moveRight' ? step.right : step.left)}`, `step-${index}`]
      };
    });

    setSteps(annotatedSteps);
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
    steps,
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

export default useTwoPointersSteps; 