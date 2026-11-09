import { useEffect, useState } from 'react';
import { CodeLineBinding, createCodeLineBinding } from '../../components/canvas/animation/types';
import { useAnimationPlayback } from '../shared/useAnimationPlayback';

export interface RowByRowStep {
  heights: number[];
  currentRow: number;
  currentCol: number;
  isStart: boolean;
  tempSum: number;
  rowWater: number;
  totalWater: number;
  waterMatrix: number[][];
  confirmedWaterMatrix?: number[][];
  waterByColumn?: number[];
  phase: 'init' | 'scanRow' | 'rowComplete' | 'complete';
  description: string;
  codeLineBindings?: CodeLineBinding;
}

const CODE_LINE_MAPPINGS = {
  init: createCodeLineBinding([2, 3, 4, 5], [2, 3, 5, 6], [2, 3, 4, 5], [2, 4, 5]),
  maxScan: createCodeLineBinding([3, 4], [5], [3, 4, 5], [4]),
  scanStart: createCodeLineBinding(8, 8, 10, 7),
  scanCell: createCodeLineBinding([10, 11, 12, 13, 15], [10, 11, 12, 13], [12, 13, 14, 15], [9, 10, 11, 12]),
  rowComplete: createCodeLineBinding([12, 13, 15, 18], [12, 13, 14, 15], [14, 15, 17, 20], [11, 12, 14, 17]),
  done: createCodeLineBinding(19, 16, 21, 18),
};

interface UseRowByRowStepsProps {
  heights: number[];
  speed?: number;
}

export const useRowByRowSteps = ({ heights, speed = 500 }: UseRowByRowStepsProps) => {
  const [steps, setSteps] = useState<RowByRowStep[]>([]);
  const playback = useAnimationPlayback(steps, speed);

  useEffect(() => {
    const n = heights.length;
    if (!n) {
      setSteps([]);
      return;
    }

    const maxHeight = Math.max(0, ...heights);
    if (n * maxHeight * maxHeight > 1000000) {
      setSteps([{
        heights, currentRow: 0, currentCol: -1, isStart: false, tempSum: 0, rowWater: 0,
        totalWater: 0, waterMatrix: [], phase: 'complete',
        description: `当前输入为 ${n} 根柱、高度最高 ${maxHeight}；逐格动画最多需要逐格扫描约 ${n * maxHeight} 格，并保存多帧快照，超过按行演示的安全帧预算。为避免页面卡顿，请换用双数组法或双指针法；算法结果不受影响。`,
        codeLineBindings: CODE_LINE_MAPPINGS.done,
      }]);
      return;
    }

    const generatedSteps: RowByRowStep[] = [];
    const waterMatrix: number[][] = Array.from({ length: maxHeight }, () => Array(n).fill(0));
    const confirmedWaterMatrix: number[][] = Array.from({ length: maxHeight }, () => Array(n).fill(0));
    const snapshotMatrix = (): number[][] => [...waterMatrix];
    const snapshotConfirmedMatrix = (): number[][] => [...confirmedWaterMatrix];
    const setWaterCell = (row: number, col: number, value: number): void => {
      if (waterMatrix[row][col] === value) return;
      waterMatrix[row] = [...waterMatrix[row]];
      waterMatrix[row][col] = value;
    };
    let totalWater = 0;

    generatedSteps.push({ heights, currentRow: 0, currentCol: -1, isStart: false, tempSum: 0, rowWater: 0, totalWater: 0, waterMatrix: snapshotMatrix(), confirmedWaterMatrix: snapshotConfirmedMatrix(), phase: 'init', description: `初始化：最高柱高为 ${maxHeight}，需要扫描 ${maxHeight} 层；水格先标为候选，只有左右边界闭合后才计入答案。`, codeLineBindings: CODE_LINE_MAPPINGS.init });
    generatedSteps.push({ heights, currentRow: maxHeight, currentCol: -1, isStart: false, tempSum: 0, rowWater: 0, totalWater: 0, waterMatrix: snapshotMatrix(), confirmedWaterMatrix: snapshotConfirmedMatrix(), phase: 'init', description: `先扫描数组找最高柱，确定最多需要处理 ${maxHeight} 层。`, codeLineBindings: CODE_LINE_MAPPINGS.maxScan });

    for (let row = 1; row <= maxHeight; row++) {
      let isStart = false;
      let tempSum = 0;
      let rowWater = 0;
      generatedSteps.push({ heights, currentRow: row, currentCol: -1, isStart, tempSum, rowWater, totalWater, waterMatrix: snapshotMatrix(), confirmedWaterMatrix: snapshotConfirmedMatrix(), phase: 'scanRow', description: `开始扫描高度 ${row}：寻找两堵达到该高度的墙之间的空格。`, codeLineBindings: CODE_LINE_MAPPINGS.scanStart });

      for (let col = 0; col < n; col++) {
        const prevIsStart = isStart;
        const prevTempSum = tempSum;
        if (isStart && heights[col] < row) {
          tempSum++;
          setWaterCell(row - 1, col, 1);
        }
        let confirmedHere = 0;
        if (heights[col] >= row) {
          if (isStart && prevTempSum > 0) {
            confirmedHere = prevTempSum;
            rowWater += prevTempSum;
            for (let candidate = col - 1; candidate >= 0 && heights[candidate] < row; candidate--) {
              confirmedWaterMatrix[row - 1] = [...confirmedWaterMatrix[row - 1]];
              confirmedWaterMatrix[row - 1][candidate] = 1;
            }
          }
          tempSum = 0;
          isStart = true;
        }
        const explanation = heights[col] >= row
          ? prevIsStart
            ? prevTempSum > 0
              ? `右墙封住左墙后的 ${prevTempSum} 格候选水，本层水量增加。`
              : `这根达到层高 ${row} 的柱子成为当前新的右边界。`
            : `位置 ${col} 是本层第一堵墙，先建立左边界。`
          : isStart
            ? `位置 ${col} 低于层高 ${row}，先记为 1 格候选水；右墙未出现前不计入答案。`
            : `左墙尚未出现，位置 ${col} 的低地不能存水，暂不计数。`;
        generatedSteps.push({ heights, currentRow: row, currentCol: col, isStart, tempSum, rowWater, totalWater: totalWater + rowWater, waterMatrix: snapshotMatrix(), confirmedWaterMatrix: snapshotConfirmedMatrix(), phase: 'scanRow', description: confirmedHere ? `右墙闭合左墙与 ${prevTempSum} 个低格；这些水格现在确认计入答案。` : explanation, codeLineBindings: CODE_LINE_MAPPINGS.scanCell });
      }

      for (let col = n - 1; col >= 0; col--) {
        if (heights[col] >= row) break;
        setWaterCell(row - 1, col, 0);
      }
      totalWater += rowWater;
      generatedSteps.push({ heights, currentRow: row, currentCol: n, isStart, tempSum: 0, rowWater, totalWater, waterMatrix: snapshotMatrix(), confirmedWaterMatrix: snapshotConfirmedMatrix(), phase: 'rowComplete', description: rowWater
        ? `第 ${row} 层闭合，确认 ${rowWater} 格；未闭合的右侧候选已清除，累计 ${totalWater} 格。`
        : `第 ${row} 层没有被两堵墙闭合的低地，候选水不计入答案，累计仍为 ${totalWater} 格。`, codeLineBindings: CODE_LINE_MAPPINGS.rowComplete });
    }

    generatedSteps.push({ heights, currentRow: maxHeight, currentCol: -1, isStart: false, tempSum: 0, rowWater: 0, totalWater, waterMatrix: snapshotMatrix(), confirmedWaterMatrix: snapshotConfirmedMatrix(), phase: 'complete', description: `分层扫描结束：共接住 ${totalWater} 格雨水。`, codeLineBindings: CODE_LINE_MAPPINGS.done });
    setSteps(generatedSteps);
  }, [heights]);

  return { ...playback, steps };
};

export default useRowByRowSteps;
