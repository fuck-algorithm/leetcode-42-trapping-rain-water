import React, { useState, useEffect } from 'react';
import './App.css';
import HeightsInputControl from './components/HeightsInputControl';
import PrecomputationVisualizer from './algorithms/precomputation/PrecomputationVisualizer';
import MonotonicStackVisualizer from './algorithms/monotonicStack/MonotonicStackVisualizer';
import TwoPointersVisualizer from './algorithms/twoPointers/TwoPointersVisualizer';
import TabControl from './components/common/TabControl';
import BruteForceAnimation from './algorithms/bruteForce/BruteForceAnimation';

// 默认高度数组
const defaultHeights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];

function App() {
  // 状态
  const [heights, setHeights] = useState<number[]>(defaultHeights);
  const [activeTab, setActiveTab] = useState<string>("precomputation");
  const [speed, setSpeed] = useState<number>(500);
  
  // 视口尺寸状态
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理速度变化
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  // 算法标签页
  const algorithmTabs = [
    {
      id: "precomputation",
      title: "双数组法",
      content: <PrecomputationVisualizer heights={heights} speed={speed} onSpeedChange={handleSpeedChange} />
    },
    {
      id: "monotonicStack",
      title: "单调栈法",
      content: <MonotonicStackVisualizer heights={heights} speed={speed} onSpeedChange={handleSpeedChange} />
    },
    {
      id: "twoPointers",
      title: "双指针法",
      content: <TwoPointersVisualizer heights={heights} speed={speed} onSpeedChange={handleSpeedChange} />
    },
    {
      id: "bruteForce",
      title: "暴力法",
      content: <BruteForceAnimation heights={heights} />
    }
  ];

  const loadExample = () => {
    // Implementation of loadExample function
  };

  const generateRandom = () => {
    // Implementation of generateRandom function
  };

  return (
    <div className="App">
      <div className="App-header">
        <div className="header-flex">
          <h1>接雨水问题可视化</h1>
          <p className="description">
            给定一个非负整数数组表示高度图，计算下雨后能够接住的雨水量。
          </p>
        </div>
      </div>
      
      <div className="App-content">
        <div className="control-panel">
          <HeightsInputControl 
            initialHeights={defaultHeights}
            onUpdateHeights={setHeights}
          />
        </div>

        <div className="visualization-panel">
          <TabControl 
            tabs={algorithmTabs} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        </div>
      </div>
    </div>
  );
}

export default App;
