import { useEffect, useState } from 'react';
import { useAnimationPlayback } from '../shared/useAnimationPlayback';
import { CodeLineBinding, createCodeLineBinding } from '../../components/canvas/animation/types';
import { BruteForceStep } from './types';
import { bruteForceCode } from '../algorithmCodes';

const codeLines = (language: keyof typeof bruteForceCode, lines: number[]): number[] => {
  const source = bruteForceCode[language].split('\n');
  return lines.filter(line => line > 0 && line <= source.length);
};

const bindLines = (java: number[], python: number[], golang: number[], javascript: number[]): CodeLineBinding =>
  createCodeLineBinding(codeLines('java', java), codeLines('python', python), codeLines('golang', golang), codeLines('javascript', javascript));

const SCAN_LEFT = bindLines([9, 10, 11], [9, 10, 11], [9, 10, 11], [9, 10, 11]);
const SCAN_LEFT_DONE = bindLines([11, 15, 16], [9, 10, 11], [10, 11, 12], [9, 10]);
const SCAN_RIGHT = bindLines([15, 16, 17], [13, 14, 15], [13, 14, 15], [12, 13, 14]);
const CALCULATE = bindLines([18], [17], [22], [18]);
const WATER_COMMIT = bindLines([3, 18, 19], [3, 17], [3, 22], [3, 18]);
const FINISH = bindLines([20, 21], [19], [24, 25], [20, 21]);

interface UseBruteForceStepsProps {
  heights: number[];
  speed?: number;
}

/**
 * 暴力法算法步骤控制钩子
 * 用于控制步骤的播放、进度和状态
 */
export const useBruteForceSteps = ({ heights, speed = 500 }: UseBruteForceStepsProps) => {
  const [steps, setSteps] = useState<BruteForceStep[]>([]);
  const playback = useAnimationPlayback(steps, speed);

  // 生成所有动画步骤
  useEffect(() => {
    const n = heights.length;
    if (n === 0) {
      setSteps([]);
      return;
    }

    const generatedSteps: BruteForceStep[] = [];
    let totalWater = 0;
    const waterLevel: Record<number, number> = {};

    // 初始状态
    generatedSteps.push({
      phase: 'init',
      position: -1,
      leftMax: 0,
      rightMax: 0,
      totalWater: 0,
      description: '暴力法初始化',
      subStepDescription: '对每个位置，分别扫描左右边界，再取较矮边界与柱高的差。',
      codeLineBindings: bindLines([2, 3, 4], [2, 3], [2, 3, 4], [2, 3])
    });

    // 遍历每个位置
    for (let i = 0; i < n; i++) {
      // 开始处理当前位置
      generatedSteps.push({
        phase: 'scanLeftStart',
        position: i,
        leftMax: 0,
        rightMax: 0,
        waterLevel: { ...waterLevel },
        totalWater,
        description: `从位置 ${i} 开始，先检查包含当前柱的左侧范围。`,
        subStepDescription: `当前柱高 ${heights[i]}；左扫描从 0 到 ${i}，寻找最高左边界。`,
        codeLineBindings: SCAN_LEFT
      });

      // 左侧扫描
      let leftMax = 0;
      for (let j = 0; j <= i; j++) {
        leftMax = Math.max(leftMax, heights[j]);
      }

      generatedSteps.push({
        phase: 'scanLeftComplete',
        position: i,
        leftMax,
        rightMax: 0,
        waterLevel: { ...waterLevel },
        totalWater,
        description: `位置 ${i} 的左界已确定为 ${leftMax}；接着重新扫描右侧范围。`,
        subStepDescription: `从当前列向右（含当前列）扫描，寻找最高右边界。`,
        codeLineBindings: SCAN_LEFT_DONE
      });

      // 右侧扫描
      let rightMax = 0;
      for (let j = i; j < n; j++) {
        rightMax = Math.max(rightMax, heights[j]);
      }

      generatedSteps.push({
        phase: 'scanRightComplete',
        position: i,
        leftMax,
        rightMax,
        waterLevel: { ...waterLevel },
        totalWater,
        description: `位置 ${i} 的右界已确定为 ${rightMax}；可用较矮的一侧作为水位上限。`,
        subStepDescription: `左右边界分别为 ${leftMax} 和 ${rightMax}。`,
        codeLineBindings: SCAN_RIGHT
      });


      // 计算水量
      const minHeight = Math.min(leftMax, rightMax);
      const water = Math.max(0, minHeight - heights[i]);

      generatedSteps.push({
        phase: 'compare',
        position: i,
        leftMax,
        rightMax,
        waterLevel: { ...waterLevel },
        totalWater,
        description: `两侧最高边界的较小值为 ${minHeight}，它决定位置 ${i} 的水面高度。`,
        subStepDescription: `min(${leftMax}, ${rightMax}) = ${minHeight}；本步把较低边界与柱高相减。`,
        codeLineBindings: CALCULATE
      });

      if (water > 0) {
        waterLevel[i] = water;
        totalWater += water;
      }

      generatedSteps.push({
        phase: 'waterFound',
        position: i,
        leftMax,
        rightMax,
        waterLevel: { ...waterLevel },
        totalWater,
        description: water > 0 ? `位置 ${i} 的水位差为 ${water}，已加入总量。` : `位置 ${i} 的柱高不低于可达水位，因此不存水。`,
        subStepDescription: water > 0
          ? `${minHeight} - ${heights[i]} = ${water}；累计 ${totalWater} 格。`
          : `${minHeight} - ${heights[i]} <= 0，累计仍为 ${totalWater} 格。`,
        codeLineBindings: WATER_COMMIT
      });
    }

    // 完成
    generatedSteps.push({
      phase: 'complete',
      position: -1,
      leftMax: 0,
      rightMax: 0,
      waterLevel: { ...waterLevel },
      totalWater,
      description: '算法完成',
      subStepDescription: `所有位置处理完成，共捕获 ${totalWater} 格雨水。`,
      codeLineBindings: FINISH
    });

    setSteps(generatedSteps);
  }, [heights]);

  return { ...playback, steps };
};

export default useBruteForceSteps;
