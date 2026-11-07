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
  phase: 'push' | 'pop' | 'calculate' | 'complete';
  description?: string;
  // 代码行绑定
  codeLineBindings?: CodeLineBinding;
}

/**
 * 单调栈法代码行映射
 * 基于 algorithmCodes.ts 中的代码结构
 */
const CODE_LINE_MAPPINGS = {
  // 初始化
  init: createCodeLineBinding([2, 3], [2, 3], [2, 3], [2, 3]),
  // for 循环
  forLoop: createCodeLineBinding(5, 5, 5, 5),
  // while 条件检查
  whileCondition: createCodeLineBinding([6, 7], [6], [6, 7], [6, 7]),
  // 出栈
  pop: createCodeLineBinding(8, 7, 8, 8),
  // 栈空检查
  stackEmpty: createCodeLineBinding(9, [8, 9], 9, 9),
  // 计算宽度和高度
  calcWidthHeight: createCodeLineBinding([11, 12, 13], [11, 12], [11, 12, 13], [11, 12, 13]),
  // 累加水量
  addWater: createCodeLineBinding(14, 13, 14, 14),
  // 入栈
  push: createCodeLineBinding(16, 15, 16, 16),
  // 返回结果
  returnResult: createCodeLineBinding(18, 17, 18, 18),
};

interface UseMonotonicStackStepsProps {
  heights: number[];
  speed?: number; // 播放速度，毫秒
}

export const useMonotonicStackSteps = ({ heights, speed = 500 }: UseMonotonicStackStepsProps) => {
  const [steps, setSteps] = useState<MonotonicStackStep[]>([]);
  const playback = useAnimationPlayback(steps, speed);

  // 生成所有动画步骤
  useEffect(() => {
    const n = heights.length;
    if (n === 0) {
      setSteps([]);
      return;
    }

    const generatedSteps: MonotonicStackStep[] = [];
    const stack: number[] = [];
    const water = new Array(n).fill(0);
    let totalWater = 0;

    // 初始状态
    generatedSteps.push({
      heights,
      stack: [],
      water: [...water],
      totalWater: 0,
      currentIndex: 0,
      phase: 'push',
      description: '初始化：创建空栈，准备遍历数组',
      codeLineBindings: CODE_LINE_MAPPINGS.init
    });

    for (let i = 0; i < n; i++) {
      // 当栈不为空且当前高度大于栈顶高度时，形成凹槽
      while (stack.length > 0 && heights[i] > heights[stack[stack.length - 1]]) {
        const popIndex = stack.pop()!;
        
        // 记录出栈的步骤
        generatedSteps.push({
          heights,
          stack: [...stack],
          water: [...water],
          totalWater,
          currentIndex: i,
          popIndex,
          phase: 'pop',
          description: `出栈：弹出索引${popIndex}（高度${heights[popIndex]}），因为当前高度${heights[i]} > 栈顶高度${heights[popIndex]}`,
          codeLineBindings: CODE_LINE_MAPPINGS.pop
        });
        
        if (stack.length === 0) {
          continue;
        }
        
        // 计算水量
        const leftIndex = stack[stack.length - 1];
        const width = i - leftIndex - 1;
        const height = Math.min(heights[leftIndex], heights[i]) - heights[popIndex];
        
        if (height > 0) {
          const area = width * height;
          
          for (let j = leftIndex + 1; j < i; j++) {
            const waterHeight = Math.min(heights[leftIndex], heights[i]) - heights[j];
            if (waterHeight > 0) {
              water[j] = waterHeight;
            }
          }
          
          totalWater += area;
          
          // 记录计算水量的步骤
          generatedSteps.push({
            heights,
            stack: [...stack],
            water: [...water],
            totalWater,
            currentIndex: i,
            popIndex,
            width,
            height,
            area,
            phase: 'calculate',
            description: `计算水量：宽度=${width}（${i}-${leftIndex}-1），高度=${height}（min(${heights[leftIndex]},${heights[i]})-${heights[popIndex]}），面积=${area}`,
            codeLineBindings: CODE_LINE_MAPPINGS.calcWidthHeight
          });
        }
      }
      
      // 入栈
      stack.push(i);
      
      // 记录入栈的步骤
      generatedSteps.push({
        heights,
        stack: [...stack],
        water: [...water],
        totalWater,
        currentIndex: i,
        phase: 'push',
        description: `入栈：将索引${i}（高度${heights[i]}）压入栈中`,
        codeLineBindings: CODE_LINE_MAPPINGS.push
      });
    }

    // 最终结果
    generatedSteps.push({
      heights,
      stack: [...stack],
      water: [...water],
      totalWater,
      currentIndex: -1,
      phase: 'complete',
      description: `计算完成：总雨水量=${totalWater}单位`,
      codeLineBindings: CODE_LINE_MAPPINGS.returnResult
    });

    setSteps(generatedSteps);
  }, [heights]);

  return playback;
};

export default useMonotonicStackSteps; 