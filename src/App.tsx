import { useState } from 'react';
import './App.css';
import HeightsInputControl from './components/HeightsInputControl';
import PrecomputationVisualizer from './algorithms/precomputation/PrecomputationVisualizer';
import MonotonicStackVisualizer from './algorithms/monotonicStack/MonotonicStackVisualizer';
import TwoPointersVisualizer from './algorithms/twoPointers/TwoPointersVisualizer';
import TabControl from './components/common/TabControl';
import BruteForceAnimation from './algorithms/bruteForce/BruteForceAnimation';
import { RowByRowVisualizer } from './algorithms/rowByRow';
import WeChatFloat from './components/common/WeChatFloat';
import { GithubOutlined } from '@ant-design/icons';

// 默认高度数组
const defaultHeights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];

// GitHub 仓库地址
const GITHUB_REPO_URL = 'https://github.com/JSREI/leetcode-42-trapping-rain-water';
// LeetCode 题目地址
const LEETCODE_URL = 'https://leetcode.cn/problems/trapping-rain-water/';

function App() {
  // 状态
  const [heights, setHeights] = useState<number[]>(defaultHeights);
  const [activeTab, setActiveTab] = useState<string>("twoPointers");
  const [speed, setSpeed] = useState<number>(500);

  // 处理速度变化
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  // 算法标签页
  const algorithmTabs = [
    {
      id: "twoPointers",
      title: "双指针法",
      content: <TwoPointersVisualizer heights={heights} speed={speed} onSpeedChange={handleSpeedChange} />
    },
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
      id: "bruteForce",
      title: "暴力法(按列)",
      content: <BruteForceAnimation heights={heights} />
    },
    {
      id: "rowByRow",
      title: "按行求法",
      content: <RowByRowVisualizer heights={heights} speed={speed} onSpeedChange={handleSpeedChange} />
    }
  ];

  return (
    <div className="App">
      <div className="App-header">
        <div className="header-flex">
          <h1>
            <a 
              href={LEETCODE_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="title-link"
            >
              42. 接雨水
            </a>
          </h1>
          <p className="description">
            给定一个非负整数数组表示高度图，计算下雨后能够接住的雨水量。
          </p>
          <a 
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            title="查看 GitHub 仓库"
          >
            <GithubOutlined />
          </a>
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
      
      <WeChatFloat />
    </div>
  );
}

export default App;
