import React, { useState, useEffect } from 'react';
import './App.css';
import TabControl, { TabItem } from './components/common/TabControl';
import PrecomputationVisualizer from './algorithms/precomputation/PrecomputationVisualizer';
import MonotonicStackVisualizer from './algorithms/monotonicStack/MonotonicStackVisualizer';
import TwoPointersVisualizer from './algorithms/twoPointers/TwoPointersVisualizer';
import HeightsInputControl from './components/HeightsInputControl';

function App() {
  // Default data for the trapping rain water problem
  const defaultHeights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
  
  // State to keep track of the current heights
  const [heights, setHeights] = useState<number[]>(defaultHeights);
  // State to control animation speed
  const [speed, setSpeed] = useState<number>(500);
  // State to track the active algorithm tab
  const [activeTab, setActiveTab] = useState<string>("precomputation");
  // State to track viewport dimensions
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Update viewport size on resize
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

  // 处理速度变化，传递给所有可视化组件
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  // Define tabs for different algorithms
  const algorithmTabs: TabItem[] = [
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
    }
  ];

  return (
    <div className="App">
      <div className="App-content">
        <div className="App-header">
          <h1>接雨水问题可视化</h1>
          <p className="description">
            给定 n 个非负整数表示每个宽度为 1 的柱子的高度，计算按此排列的柱子，下雨之后能接多少雨水。
          </p>
        </div>
        
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
