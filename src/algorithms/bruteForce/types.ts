// 暴力法算法相关类型定义

// 暴力法算法步骤类型
export interface BruteForceStep {
  phase: 'init' | 'scanLeftStart' | 'scanLeftUpdate' | 'scanLeftComplete' | 
         'scanRightStart' | 'scanRightUpdate' | 'scanRightComplete' | 
         'compare' | 'waterCalculation' | 'waterFound' | 'complete';
  position: number;
  leftIndex?: number;
  rightIndex?: number;
  scanIndex?: number;
  currentIndex?: number;
  leftMax: number;
  rightMax: number;
  waterLevel?: Record<number, number>;
  totalWater: number;
  description: string; // 步骤说明文字
  subStepDescription?: string; // 子步骤额外说明
}

// 暴力法可视化组件Props
export interface BruteForceVisualizerProps {
  heights: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

// 暴力法动画组件Props
export interface BruteForceAnimationProps {
  heights: number[];
}

// 暴力法步骤计算钩子的参数
export interface UseBruteForceStepsProps {
  heights: number[];
  speed: number;
}

// 暴力法步骤钩子的返回类型
export interface Step {
  water: number[];
  totalWater: number;
  currentIndex: number;
  leftMax: number;
  rightMax: number;
  leftScanIndex: number;
  rightScanIndex: number;
  phase: 'init' | 'scanLeft' | 'scanRight' | 'calculate' | 'complete';
} 