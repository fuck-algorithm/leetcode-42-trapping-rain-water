import { useEffect, useState } from 'react';
import { CodeLineBinding, createCodeLineBinding } from '../../components/canvas/animation/types';
import { useAnimationPlayback } from '../shared/useAnimationPlayback';

export type TwoPointersOperation = 'init' | 'compare' | 'move' | 'fill' | 'update' | 'done';

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
  operation?: TwoPointersOperation;
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

function buildNarration(step: TwoPointersStep, previous: string): string {
  let sentence: string;
  switch (step.phase) {
    case 'init':
      sentence = `初始化：指针从两端夹住数组，因为每个位置的水位由左右边界中较矮的一侧限制。`;
      break;
    case 'compare':
      sentence = `比较位置 ${step.left} 的高度 ${step.decision?.leftHeight} 与位置 ${step.right} 的高度 ${step.decision?.rightHeight}，因为较矮边界一侧的水量已可确定。`;
      break;
    case 'moveLeft':
      sentence = step.currentFill
        ? `左指针处理位置 ${step.left} 并加入 ${step.currentFill} 单位水，因为左侧最高墙高于当前柱。`
        : `左指针处理位置 ${step.left} 并更新左侧最高墙为 ${step.leftMax}，因为当前柱不低于旧边界。`;
      break;
    case 'moveRight':
      sentence = step.currentFill
        ? `右指针处理位置 ${step.right} 并加入 ${step.currentFill} 单位水，因为右侧最高墙高于当前柱。`
        : `右指针处理位置 ${step.right} 并更新右侧最高墙为 ${step.rightMax}，因为当前柱不低于旧边界。`;
      break;
    default:
      sentence = `两指针在位置 ${step.left} 相遇，最终累计 ${step.totalWater} 单位雨水，因为所有可处理位置均已确定。`;
  }
  if (sentence !== previous) return sentence;
  return `${sentence} 当前累计水量为 ${step.totalWater} 单位。`;
}

interface UseTwoPointersStepsProps {
  heights: number[];
  speed?: number; // 播放速度，毫秒
}

export const useTwoPointersSteps = ({ heights, speed = 500 }: UseTwoPointersStepsProps) => {
  const [steps, setSteps] = useState<TwoPointersStep[]>([]);
  const playback = useAnimationPlayback(steps, speed);

  // 生成所有动画步骤
  useEffect(() => {
    const n = heights.length;
    if (n === 0) {
      setSteps([]);
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

    let previousNarration = '';
    const annotatedSteps = generatedSteps.map((step, index) => {
      const operation: TwoPointersOperation = step.phase === 'init' ? 'init' : step.phase === 'compare' ? 'compare' : step.phase === 'complete' ? 'done' : step.currentFill ? 'fill' : step.phase === 'moveLeft' || step.phase === 'moveRight' ? 'move' : 'update';
      const narration = buildNarration(step, previousNarration);
      previousNarration = narration;
      return {
        ...step,
        operation,
        narration,
        anchorIds: step.phase === 'init' ? ['pointer-left', 'pointer-right'] : step.phase === 'compare' ? [`bar-${step.left}`, `bar-${step.right}`] : [`bar-${step.phase === 'moveRight' ? step.right : step.left}`]
      };
    });

    setSteps(annotatedSteps);
  }, [heights]);

  return { ...playback, steps };
};

export default useTwoPointersSteps; 