import { BruteForceStep } from './types';

/**
 * 计算暴力法的可视化步骤
 * @param heights 高度数组
 * @returns 暴力法计算的所有步骤
 */
export function calculateBruteForceSteps(heights: number[]): BruteForceStep[] {
  const calculatedSteps: BruteForceStep[] = [{
    phase: 'init',
    position: -1,
    leftMax: 0,
    rightMax: 0,
    totalWater: 0,
    description: '暴力法初始化',
    subStepDescription: '对每个位置，我们需要找出左右两侧的最大高度，然后计算积水量 = min(左最大高度,右最大高度) - 当前高度'
  }];
  
  let totalWater = 0;
  const waterHeights: Record<number, number> = {};
  
  for (let i = 0; i < heights.length; i++) {
    // 开始处理当前位置
    calculatedSteps.push({
      phase: 'scanLeftStart',
      position: i,
      leftMax: 0,
      rightMax: 0,
      totalWater,
      description: `开始处理位置 ${i}`,
      subStepDescription: `高度为 ${heights[i]}，首先从左侧扫描查找最大高度`
    });
    
    // 左侧扫描过程
    let leftMax = 0;
    for (let j = 0; j < i; j++) {
      const prevLeftMax = leftMax;
      leftMax = Math.max(leftMax, heights[j]);
      
      if (leftMax > prevLeftMax || j === 0) {
        calculatedSteps.push({
          phase: 'scanLeftUpdate',
          position: i,
          scanIndex: j,
          leftMax,
          rightMax: 0,
          totalWater,
          description: `左侧扫描位置 ${j}`,
          subStepDescription: `高度是 ${heights[j]}${leftMax > prevLeftMax ? `，更新左侧最大高度为 ${leftMax}` : ''}`
        });
      }
    }
    
    // 左侧扫描完成
    calculatedSteps.push({
      phase: 'scanLeftComplete',
      position: i,
      leftMax,
      rightMax: 0,
      totalWater,
      description: `左侧扫描完成`,
      subStepDescription: `位置 ${i} 左侧的最大高度是 ${leftMax}`
    });

    // 开始右侧扫描
    calculatedSteps.push({
      phase: 'scanRightStart',
      position: i,
      leftMax,
      rightMax: 0,
      totalWater,
      description: `开始右侧扫描`,
      subStepDescription: `查找位置 ${i} 右侧的最大高度`
    });
    
    // 右侧扫描过程
    let rightMax = 0;
    for (let j = heights.length - 1; j > i; j--) {
      const prevRightMax = rightMax;
      rightMax = Math.max(rightMax, heights[j]);
      
      if (rightMax > prevRightMax || j === heights.length - 1) {
        calculatedSteps.push({
          phase: 'scanRightUpdate',
          position: i,
          scanIndex: j,
          leftMax,
          rightMax,
          totalWater,
          description: `右侧扫描位置 ${j}`,
          subStepDescription: `高度是 ${heights[j]}${rightMax > prevRightMax ? `，更新右侧最大高度为 ${rightMax}` : ''}`
        });
      }
    }
    
    // 右侧扫描完成
    calculatedSteps.push({
      phase: 'scanRightComplete',
      position: i,
      leftMax,
      rightMax,
      totalWater,
      description: `右侧扫描完成`,
      subStepDescription: `位置 ${i} 右侧的最大高度是 ${rightMax}`
    });
    
    // 比较左右两侧的最大高度
    const minHeight = Math.min(leftMax, rightMax);
    calculatedSteps.push({
      phase: 'compare',
      position: i,
      leftIndex: 0,
      rightIndex: heights.length - 1,
      leftMax,
      rightMax,
      totalWater,
      description: `比较左右最大高度`,
      subStepDescription: `左侧 ${leftMax}，右侧 ${rightMax}，取较小值 ${minHeight}`
    });
    
    // 计算当前位置的积水
    calculatedSteps.push({
      phase: 'waterCalculation',
      position: i,
      currentIndex: i,
      leftMax,
      rightMax,
      totalWater,
      description: `计算位置 ${i} 的积水量`,
      subStepDescription: `min(${leftMax}, ${rightMax}) - ${heights[i]} = ${Math.max(0, minHeight - heights[i])}`
    });
    
    // 当前位置能接的水
    const waterLevel = Math.max(0, minHeight - heights[i]);
    waterHeights[i] = waterLevel;
    
    if (waterLevel > 0) {
      totalWater += waterLevel;
      calculatedSteps.push({
        phase: 'waterFound',
        position: i,
        currentIndex: i,
        leftMax,
        rightMax,
        waterLevel: { ...waterHeights },
        totalWater,
        description: `位置 ${i} 可以存储水`,
        subStepDescription: `存储 ${waterLevel} 单位的水，总积水量更新为 ${totalWater}`
      });
    } else {
      calculatedSteps.push({
        phase: 'waterFound',
        position: i,
        currentIndex: i,
        leftMax,
        rightMax,
        waterLevel: { ...waterHeights },
        totalWater,
        description: `位置 ${i} 不能存储水`,
        subStepDescription: `因为 min(${leftMax}, ${rightMax}) <= ${heights[i]}`
      });
    }
  }
  
  // 完成所有计算
  calculatedSteps.push({
    phase: 'complete',
    position: -1,
    leftMax: 0,
    rightMax: 0,
    waterLevel: { ...waterHeights },
    totalWater,
    description: '算法完成',
    subStepDescription: `总共捕获了 ${totalWater} 单位的雨水`
  });
  
  return calculatedSteps;
} 