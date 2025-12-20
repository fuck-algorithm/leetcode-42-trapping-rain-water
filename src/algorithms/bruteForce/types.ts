// 暴力法算法相关类型定义

// 暴力法算法步骤类型
export interface BruteForceStep {
  phase: 'init' | 'scanLeftStart' | 'scanLeftComplete' | 
         'scanRightStart' | 'scanRightComplete' | 
         'compare' | 'waterFound' | 'complete';
  position: number;
  scanIndex?: number;
  leftMax: number;
  rightMax: number;
  waterLevel?: Record<number, number>;
  totalWater: number;
  description: string;
  subStepDescription?: string;
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
  speed?: number;
}
