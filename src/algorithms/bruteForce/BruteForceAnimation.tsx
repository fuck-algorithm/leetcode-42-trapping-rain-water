import React, { useState } from 'react';
import BruteForceVisualizer from './BruteForceVisualizer';

interface Props {
  heights: number[];
}

/**
 * 暴力法动画组件
 * 包装BruteForceVisualizer，提供速度控制
 */
const BruteForceAnimation: React.FC<Props> = ({ heights }) => {
  const [speed, setSpeed] = useState<number>(500);

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
  };

  return (
    <BruteForceVisualizer
      heights={heights}
      speed={speed}
      onSpeedChange={handleSpeedChange}
    />
  );
};

export default BruteForceAnimation;
