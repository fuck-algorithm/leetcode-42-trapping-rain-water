import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import AnimationControls from '../../components/common/AnimationControls';
import { useElementSize } from '../../hooks/useElementSize';
import './BruteForceVisualizer.css';

interface BruteForceVisualizerProps {
  heights: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

// 暴力法算法步骤类型
export interface BruteForceStep {
  phase: 'compare' | 'waterFound' | 'complete' | 'init';
  position: number;
  leftIndex?: number;
  rightIndex?: number;
  currentIndex?: number;
  leftMax: number;
  rightMax: number;
  waterLevel?: Record<number, number>;
  totalWater: number;
}

const BruteForceVisualizer: React.FC<BruteForceVisualizerProps> = ({ 
  heights, 
  speed: initialSpeed = 1000,
  onSpeedChange = () => {}
}) => {
  const [steps, setSteps] = useState<BruteForceStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const containerRef = useRef<HTMLDivElement>(null);
  const d3Container = useRef<SVGSVGElement>(null);
  const dimensions = useElementSize(containerRef);
  
  // 当外部speed变化时同步本地state
  useEffect(() => {
    setSpeed(initialSpeed);
  }, [initialSpeed]);

  const currentStep = steps[currentStepIndex] || { phase: 'complete', position: 0, leftMax: 0, rightMax: 0, totalWater: 0 };
  const totalSteps = steps.length;
  const progress = totalSteps > 1 ? currentStepIndex / (totalSteps - 1) : 0;

  // 计算暴力法的步骤
  useEffect(() => {
    const calculatedSteps: BruteForceStep[] = [{
      phase: 'init',
      position: -1,
      leftMax: 0,
      rightMax: 0,
      totalWater: 0
    }];
    let totalWater = 0;
    
    for (let i = 0; i < heights.length; i++) {
      // 找左边最高的柱子
      let leftMax = 0;
      for (let j = 0; j < i; j++) {
        leftMax = Math.max(leftMax, heights[j]);
      }
      
      // 找右边最高的柱子
      let rightMax = 0;
      for (let j = i + 1; j < heights.length; j++) {
        rightMax = Math.max(rightMax, heights[j]);
      }
      
      // 添加比较步骤
      calculatedSteps.push({
        phase: 'compare',
        position: i,
        leftIndex: i - 1,
        rightIndex: i + 1,
        leftMax,
        rightMax,
        totalWater
      });
      
      // 当前位置能接的水
      const waterLevel = Math.min(leftMax, rightMax) - heights[i];
      if (waterLevel > 0) {
        totalWater += waterLevel;
        calculatedSteps.push({
          phase: 'waterFound',
          position: i,
          currentIndex: i,
          leftMax,
          rightMax,
          waterLevel: { [i]: waterLevel },
          totalWater
        });
      }
    }
    
    calculatedSteps.push({
      phase: 'complete',
      position: -1,
      leftMax: 0,
      rightMax: 0,
      totalWater
    });
    
    setSteps(calculatedSteps);
  }, [heights]);
  
  // 播放控制逻辑
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        if (prevIndex >= steps.length - 1) {
          setIsPlaying(false);
          return prevIndex;
        }
        return prevIndex + 1;
      });
    }, speed);
    
    return () => clearInterval(interval);
  }, [isPlaying, steps.length, speed]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextStep = () => setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  const setProgress = (progress: number) => setCurrentStepIndex(Math.round(progress * (steps.length - 1)));
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    onSpeedChange(newSpeed);
  };

  // D3可视化渲染
  useEffect(() => {
    if (heights && d3Container.current && currentStep && dimensions.width > 0 && dimensions.height > 0) {
      // Clear any existing SVG content
      d3.select(d3Container.current).selectAll('*').remove();
      
      // 设置图表尺寸和边距
      const controlsHeight = 30; // 控制区域高度
      const margin = { top: 8, right: 15, bottom: 20, left: 25 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom - controlsHeight;
      
      // 创建SVG
      const svg = d3.select(d3Container.current)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // 创建比例尺
      const x = d3.scaleBand()
        .domain(d3.range(heights.length) as unknown as string[])
        .range([0, width])
        .padding(0.1);
      
      const y = d3.scaleLinear()
        .domain([0, d3.max(heights) || 0])
        .range([height, 0]);
      
      // 渲染柱状图
      svg.selectAll('.bar')
        .data(heights)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d, i) => x(i.toString()) || 0)
        .attr('y', d => y(d))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d))
        .attr('fill', (d, i) => {
          if (currentStep.phase === 'compare' && (i === currentStep.leftIndex || i === currentStep.rightIndex)) {
            return '#FFD700'; // 黄色表示比较中
          } else if (currentStep.phase === 'waterFound' && (i === currentStep.currentIndex)) {
            return '#4CAF50'; // 绿色表示找到积水
          } else {
            return '#3498db'; // 默认蓝色
          }
        });
      
      // 添加X轴
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));
      
      // 添加Y轴
      svg.append('g')
        .call(d3.axisLeft(y));
      
      // 添加积水面积
      if (currentStep.waterLevel && currentStep.currentIndex !== undefined) {
        const i = currentStep.currentIndex;
        const barHeight = heights[i];
        const waterHeight = currentStep.waterLevel[i] || 0;
        
        if (waterHeight > 0) {
          svg.append('rect')
            .attr('x', x(i.toString()) || 0)
            .attr('y', y(barHeight + waterHeight))
            .attr('width', x.bandwidth())
            .attr('height', height - y(waterHeight))
            .attr('fill', 'rgba(0, 191, 255, 0.5)'); // 水的颜色
        }
      }
      
      // 添加说明文字
      const phaseText: Record<string, string> = {
        'init': '初始化',
        'compare': '对比左右最大值',
        'waterFound': '计算积水',
        'complete': '完成'
      };
      
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('font-size', '1em')
        .attr('font-weight', 'bold')
        .text(phaseText[currentStep.phase]);
    }
  }, [currentStep, heights, dimensions.width, dimensions.height]);
  
  return (
    <div className="algorithm-visualizer" ref={containerRef}>
      <div className="visualization-wrapper">
        <svg
          ref={d3Container}
          width={dimensions.width}
          height={dimensions.height - 30} // 留出控制面板的空间
          className="d3-component"
        />
        <AnimationControls
          isPlaying={isPlaying}
          onPlay={togglePlay}
          onNext={nextStep}
          onPrev={prevStep}
          onSeek={setProgress}
          onSpeedChange={handleSpeedChange}
          speed={speed}
          progress={progress}
          currentStep={currentStepIndex}
          totalSteps={totalSteps}
        />
      </div>
      <div className="info-panel">
        <div>总雨水量: {currentStep.totalWater} 单位</div>
      </div>
    </div>
  );
};

export default BruteForceVisualizer; 