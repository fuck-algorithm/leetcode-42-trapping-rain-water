import { useEffect, useState } from 'react';
import { CodeLineBinding, createCodeLineBinding } from '../../components/canvas/animation/types';
import { useAnimationPlayback } from '../shared/useAnimationPlayback';

export interface MonotonicStackStep {
  heights: number[];
  stack: number[];
  water: number[];
  totalWater: number;
  currentIndex: number;
  popIndex?: number;
  width?: number;
  height?: number;
  area?: number;
  note?: string;
  additionalWater?: number;
  phase: 'push' | 'pop' | 'calculate' | 'complete';
  description?: string;
  codeLineBindings?: CodeLineBinding;
}

const CODE_LINE_MAPPINGS = {
  init: createCodeLineBinding([2, 3], [2, 3], [2, 3], [2, 3]),
  forLoop: createCodeLineBinding(5, 5, 5, 5),
  whileCondition: createCodeLineBinding([5, 6], [5, 6], [5, 6], [5, 6]),
  pop: createCodeLineBinding(8, 7, [7, 8], 8),
  stackEmpty: createCodeLineBinding(9, [8, 9], [9, 10], 9),
  calcWidthHeight: createCodeLineBinding([11, 12, 13, 14], [10, 11, 12, 13], [14, 15, 16, 17], [11, 12, 13, 14]),
  addWater: createCodeLineBinding(14, 13, 17, 14),
  push: createCodeLineBinding(16, 15, 19, 16),
  returnResult: createCodeLineBinding(18, 17, 21, 18),
};

export function buildMonotonicStackSteps(heights: number[]): MonotonicStackStep[] {
  const n = heights.length;
  if (n === 0) return [];

  const generatedSteps: MonotonicStackStep[] = [];
  const stack: number[] = [];
  const water = new Array(n).fill(0);
  let totalWater = 0;

  generatedSteps.push({ heights, stack: [], water: [...water], totalWater: 0, currentIndex: 0, phase: 'push', description: '初始化：创建空栈，准备遍历数组', codeLineBindings: CODE_LINE_MAPPINGS.init });

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && heights[i] > heights[stack[stack.length - 1]]) {
      const popIndex = stack.pop()!;
      generatedSteps.push({ heights, stack: [...stack], water: [...water], totalWater, currentIndex: i, popIndex, phase: 'pop', description: `出栈：弹出索引${popIndex}（高度${heights[popIndex]}），因为当前高度${heights[i]} > 栈顶高度${heights[popIndex]}`, codeLineBindings: CODE_LINE_MAPPINGS.pop });
      if (stack.length === 0) {
        generatedSteps.push({ heights, stack: [], water: [...water], totalWater, currentIndex: i, popIndex, note: '弹出的柱子左侧已无边界，这次只是清除无效底部，不构成可计算的凹槽。', phase: 'pop', description: `索引 ${popIndex} 出栈后栈为空；右侧虽有高墙，但缺少左墙，因此不能计算积水面积。`, codeLineBindings: CODE_LINE_MAPPINGS.stackEmpty });
        continue;
      }

      const leftIndex = stack[stack.length - 1];
      const width = i - leftIndex - 1;
      const height = Math.min(heights[leftIndex], heights[i]) - heights[popIndex];
      if (height > 0) {
        const area = width * height;
        const previousWater = [...water];
        for (let j = leftIndex + 1; j < i; j++) {
          const waterHeight = Math.max(0, Math.min(heights[leftIndex], heights[i]) - heights[j]);
          water[j] = Math.max(water[j], waterHeight);
        }
        // A closed basin's rectangle can overlap water represented by an earlier basin.
        // Keep snapshots canonical; only report the net cells newly added to the answer.
        totalWater = water.reduce((sum, amount) => sum + amount, 0);
        const additionalWater = totalWater - previousWater.reduce((sum, amount) => sum + amount, 0);
        generatedSteps.push({ heights, stack: [...stack], water: [...water], totalWater, currentIndex: i, popIndex, width, height, area, additionalWater, phase: 'calculate', description: `闭合凹槽：宽 ${width}、深 ${height}，矩形面积 ${area} 格；扣除已显示的重叠格后，本次新增 ${additionalWater} 格，累计 ${totalWater} 格。`, codeLineBindings: CODE_LINE_MAPPINGS.calcWidthHeight });
      }
    }
    stack.push(i);
    generatedSteps.push({ heights, stack: [...stack], water: [...water], totalWater, currentIndex: i, phase: 'push', description: `入栈：将索引${i}（高度${heights[i]}）压入栈中`, codeLineBindings: CODE_LINE_MAPPINGS.push });
  }

  generatedSteps.push({ heights, stack: [...stack], water: [...water], totalWater, currentIndex: -1, phase: 'complete', description: `计算完成：总雨水量=${totalWater}单位`, codeLineBindings: CODE_LINE_MAPPINGS.returnResult });
  return generatedSteps;
}

interface UseMonotonicStackStepsProps {
  heights: number[];
  speed?: number;
}

export const useMonotonicStackSteps = ({ heights, speed = 500 }: UseMonotonicStackStepsProps) => {
  const [steps, setSteps] = useState<MonotonicStackStep[]>([]);
  const playback = useAnimationPlayback(steps, speed);

  useEffect(() => {
    setSteps(buildMonotonicStackSteps(heights));
  }, [heights]);

  return { ...playback, steps };
};

export default useMonotonicStackSteps;
