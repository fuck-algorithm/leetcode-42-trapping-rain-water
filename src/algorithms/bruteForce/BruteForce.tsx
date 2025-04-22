import React, { useState } from 'react';
import BruteForceVisualizer from './BruteForceVisualizer';
import './BruteForce.css';

/**
 * 暴力解法：对于每个位置，分别向左右两边找最高的墙，
 * 然后用两边最高墙中较矮的那个减去当前位置的高度，得到当前位置能储存的水量。
 * 
 * 时间复杂度：O(n²)
 * 空间复杂度：O(1)
 */
const BruteForce: React.FC = () => {
  const [heights, setHeights] = useState<number[]>([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]);
  const [speed, setSpeed] = useState<number>(500);

  const handleHeightsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const inputHeights = e.target.value
        .split(',')
        .map(h => parseInt(h.trim()))
        .filter(h => !isNaN(h) && h >= 0);
      
      if (inputHeights.length > 0) {
        setHeights(inputHeights);
      }
    } catch (error) {
      console.error('无效的输入格式', error);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseInt(e.target.value));
  };

  const calculate = (heights: number[]): number => {
    let totalWater = 0;
    
    for (let i = 0; i < heights.length; i++) {
      // 找左边最高的墙
      let leftMax = 0;
      for (let j = 0; j <= i - 1; j++) {
        leftMax = Math.max(leftMax, heights[j]);
      }
      
      // 找右边最高的墙
      let rightMax = 0;
      for (let j = i + 1; j < heights.length; j++) {
        rightMax = Math.max(rightMax, heights[j]);
      }
      
      // 计算当前位置能储存的水量
      const minHeight = Math.min(leftMax, rightMax);
      if (minHeight > heights[i]) {
        totalWater += minHeight - heights[i];
      }
    }
    
    return totalWater;
  };

  return (
    <div className="algorithm-container">
      <div className="algorithm-header">
        <h2>暴力解法</h2>
        <p>
          对于每个位置，分别向左右两边找最高的墙，然后用两边最高墙中较矮的那个减去当前位置的高度，得到当前位置能储存的水量。
        </p>
        <p>
          <strong>时间复杂度：</strong> O(n²) - 对于每个位置，都需要遍历左右两边所有元素<br />
          <strong>空间复杂度：</strong> O(1) - 只需要常数级别的额外空间
        </p>
      </div>

      <div className="algorithm-settings">
        <div className="setting-item">
          <label>高度数组：</label>
          <input
            type="text"
            value={heights.join(', ')}
            onChange={handleHeightsChange}
            placeholder="输入高度数组，如: 0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1"
          />
        </div>
        
        <div className="setting-item">
          <label>动画速度：</label>
          <input
            type="range"
            min="100"
            max="2000"
            value={speed}
            onChange={handleSpeedChange}
          />
          <span>{speed}ms</span>
        </div>
      </div>

      <div className="algorithm-result">
        <p>总雨水量：{calculate(heights)} 单位</p>
      </div>

      <div className="algorithm-visualizer">
        <BruteForceVisualizer heights={heights} speed={speed} />
      </div>
      
      <div className="algorithm-code">
        <h3>代码实现</h3>
        <pre>
          <code>
{`function trap(height: number[]): number {
  let totalWater = 0;
  
  for (let i = 0; i < height.length; i++) {
    // 找左边最高的墙
    let leftMax = 0;
    for (let j = 0; j <= i - 1; j++) {
      leftMax = Math.max(leftMax, height[j]);
    }
    
    // 找右边最高的墙
    let rightMax = 0;
    for (let j = i + 1; j < height.length; j++) {
      rightMax = Math.max(rightMax, height[j]);
    }
    
    // 计算当前位置能储存的水量
    const minHeight = Math.min(leftMax, rightMax);
    if (minHeight > height[i]) {
      totalWater += minHeight - height[i];
    }
  }
  
  return totalWater;
}`}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default BruteForce; 