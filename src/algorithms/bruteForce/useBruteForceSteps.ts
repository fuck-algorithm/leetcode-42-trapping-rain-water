import { useEffect, useState } from 'react';
import { useAnimationPlayback } from '../shared/useAnimationPlayback';
import { BruteForceStep } from './types';

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
      subStepDescription: '对每个位置，找出左右两侧的最大高度，计算积水量'
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
        description: `开始处理位置 ${i}`,
        subStepDescription: `高度为 ${heights[i]}，开始左侧扫描`
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
        description: `左侧扫描完成`,
        subStepDescription: `位置 ${i} 左侧最大高度为 ${leftMax}`
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
        description: `右侧扫描完成`,
        subStepDescription: `位置 ${i} 右侧最大高度为 ${rightMax}`
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
        description: `比较左右最大高度`,
        subStepDescription: `min(${leftMax}, ${rightMax}) = ${minHeight}`
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
        description: water > 0 ? `位置 ${i} 可存水 ${water} 单位` : `位置 ${i} 不能存水`,
        subStepDescription: water > 0 
          ? `${minHeight} - ${heights[i]} = ${water}，总水量: ${totalWater}`
          : `min(${leftMax}, ${rightMax}) <= ${heights[i]}`
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
      subStepDescription: `总共捕获了 ${totalWater} 单位的雨水`
    });

    setSteps(generatedSteps);
  }, [heights]);

  return playback;
};

export default useBruteForceSteps;
