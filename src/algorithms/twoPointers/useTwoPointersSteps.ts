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
  init: createCodeLineBinding([2, 3, 4, 5], [2, 3, 4, 5, 6], [2, 3, 4, 5], [2, 3, 4, 5]),
  emptyInput: createCodeLineBinding(2, 2, 2, 2),
  compare: createCodeLineBinding(7, 8, 8, 8),
  leftIncrement: createCodeLineBinding(9, 10, 9, 9),
  updateLeftMax: createCodeLineBinding([10, 11], [11, 12], [10, 11], [10, 11]),
  calcLeftWater: createCodeLineBinding([12, 13], [13, 14], [12, 13], [12, 13]),
  rightDecrement: createCodeLineBinding(16, 16, 16, 16),
  updateRightMax: createCodeLineBinding([17, 18], [17, 18], [17, 18], [17, 18]),
  calcRightWater: createCodeLineBinding([19, 20], [19, 20], [19, 20], [19, 20]),
  returnResult: createCodeLineBinding(24, 22, 24, 24),
};

function buildNarration(step: TwoPointersStep, previous: string): string {
  let sentence: string;
  switch (step.phase) {
    case 'init':
      sentence = `初始化：指针从两端夹住数组，因为每个位置的水位由左右边界中较矮的一侧限制。`;
      break;
    case 'compare':
      sentence = `比较左端 ${step.left}（高 ${step.decision?.leftHeight}）与右端 ${step.right}（高 ${step.decision?.rightHeight}）；${step.decision?.reason ?? '处理较矮的一端后，另一侧边界已足以确定该列水量。'}`;
      break;
    case 'moveLeft':
      sentence = step.currentFill
        ? `左侧第 ${step.left} 列低于已确认的左边界 ${step.leftMax}，填入 ${step.currentFill} 格水；累计为 ${step.totalWater} 格。`
        : `左侧第 ${step.left} 列达到新的边界高度 ${step.leftMax}，这一列不存水但刷新了左侧最大值。`;
      break;
    case 'moveRight':
      sentence = step.currentFill
        ? `右侧第 ${step.right} 列低于已确认的右边界 ${step.rightMax}，填入 ${step.currentFill} 格水；累计为 ${step.totalWater} 格。`
        : `右侧第 ${step.right} 列达到新的边界高度 ${step.rightMax}，这一列不存水但刷新了右侧最大值。`;
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
      setSteps([{
        heights: [], left: 0, right: -1, leftMax: 0, rightMax: 0,
        water: [], totalWater: 0, phase: 'complete',
        description: '输入为空，没有柱子需要扫描，因此直接返回 0 格雨水。',
        operation: 'done', narration: '数组长度为 0，不读取端点、不进入循环，答案为 0。',
        anchorIds: ['empty-input'], codeLineBindings: CODE_LINE_MAPPINGS.emptyInput
      }]);
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
      description: `初始化左右指针与边界高度，当前还没有处理任何柱子。`,
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
        anchorIds: step.phase === 'init' ? ['pointer-left', 'pointer-right'] : step.phase === 'compare' ? [`column-${step.left}`, `column-${step.right}`] : [`column-${step.phase === 'moveRight' ? step.right : step.left}`]
      };
    });

    setSteps(annotatedSteps);
  }, [heights]);

  return { ...playback, steps };
};

export default useTwoPointersSteps; 