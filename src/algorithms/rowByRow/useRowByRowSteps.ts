import { useState, useEffect, useRef, useCallback } from 'react';

export interface RowByRowStep {
  heights: number[];
  currentRow: number;        // 当前处理的行（高度层级）
  currentCol: number;        // 当前处理的列
  isStart: boolean;          // 是否已经开始计算（遇到第一个>=currentRow的柱子）
  tempSum: number;           // 当前行的临时水量
  rowWater: number;          // 当前行已确认的水量
  totalWater: number;        // 总水量
  waterMatrix: number[][];   // 水的矩阵，用于可视化每个位置每层的水
  phase: 'init' | 'scanRow' | 'rowComplete' | 'complete';
  description: string;
}

interface UseRowByRowStepsProps {
  heights: number[];
  speed?: number;
}

export const useRowByRowSteps = ({ heights, speed = 500 }: UseRowByRowStepsProps) => {
  const [steps, setSteps] = useState<RowByRowStep[]>([]);
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

    const generatedSteps: RowByRowStep[] = [];
    const maxHeight = Math.max(...heights);
    
    // 初始化水矩阵
    const waterMatrix: number[][] = Array(maxHeight).fill(null).map(() => Array(n).fill(0));
    let totalWater = 0;

    // 初始状态
    generatedSteps.push({
      heights,
      currentRow: 0,
      currentCol: -1,
      isStart: false,
      tempSum: 0,
      rowWater: 0,
      totalWater: 0,
      waterMatrix: waterMatrix.map(row => [...row]),
      phase: 'init',
      description: `初始化：最大高度为${maxHeight}，将逐行计算每层的水量`
    });

    // 逐行计算
    for (let row = 1; row <= maxHeight; row++) {
      let isStart = false;
      let tempSum = 0;
      let rowWater = 0;

      // 开始新行
      generatedSteps.push({
        heights,
        currentRow: row,
        currentCol: -1,
        isStart: false,
        tempSum: 0,
        rowWater: 0,
        totalWater,
        waterMatrix: waterMatrix.map(r => [...r]),
        phase: 'scanRow',
        description: `开始计算第${row}层的水量`
      });

      // 遍历每一列
      for (let col = 0; col < n; col++) {
        const prevIsStart = isStart;
        const prevTempSum = tempSum;

        if (isStart && heights[col] < row) {
          tempSum++;
          // 临时标记这个位置可能有水
          waterMatrix[row - 1][col] = 1;
        }
        
        if (heights[col] >= row) {
          if (isStart && prevTempSum > 0) {
            // 确认之前的水量
            rowWater += prevTempSum;
          }
          tempSum = 0;
          isStart = true;
        }

        // 记录每一步
        generatedSteps.push({
          heights,
          currentRow: row,
          currentCol: col,
          isStart,
          tempSum,
          rowWater,
          totalWater: totalWater + rowWater,
          waterMatrix: waterMatrix.map(r => [...r]),
          phase: 'scanRow',
          description: heights[col] >= row
            ? `位置${col}：高度${heights[col]} >= ${row}，${prevIsStart ? (prevTempSum > 0 ? `确认水量+${prevTempSum}` : '重置计数') : '开始计数'}`
            : (isStart 
                ? `位置${col}：高度${heights[col]} < ${row}，临时水量+1` 
                : `位置${col}：高度${heights[col]} < ${row}，等待遇到第一个高墙`)
        });
      }

      // 清除未确认的临时水（右边没有墙封住的水）
      for (let col = n - 1; col >= 0; col--) {
        if (heights[col] >= row) break;
        waterMatrix[row - 1][col] = 0;
      }

      totalWater += rowWater;

      // 行完成
      generatedSteps.push({
        heights,
        currentRow: row,
        currentCol: n,
        isStart,
        tempSum: 0,
        rowWater,
        totalWater,
        waterMatrix: waterMatrix.map(r => [...r]),
        phase: 'rowComplete',
        description: `第${row}层完成：本层水量=${rowWater}，累计总水量=${totalWater}`
      });
    }

    // 最终结果
    generatedSteps.push({
      heights,
      currentRow: maxHeight,
      currentCol: -1,
      isStart: false,
      tempSum: 0,
      rowWater: 0,
      totalWater,
      waterMatrix: waterMatrix.map(r => [...r]),
      phase: 'complete',
      description: `计算完成：总雨水量=${totalWater}单位`
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

export default useRowByRowSteps;
