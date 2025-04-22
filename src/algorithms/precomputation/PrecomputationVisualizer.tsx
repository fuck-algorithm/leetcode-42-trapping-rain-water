import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import usePrecomputationSteps from './usePrecomputationSteps';
import AnimationControls from '../../components/common/AnimationControls';

interface PrecomputationVisualizerProps {
  heights: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

const PrecomputationVisualizer: React.FC<PrecomputationVisualizerProps> = ({ 
  heights, 
  speed = 500,
  onSpeedChange = () => {}
}) => {
  const d3Container = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    isPlaying,
    progress,
    togglePlay,
    nextStep,
    prevStep,
    setProgress
  } = usePrecomputationSteps({ heights, speed });

  // 监听容器尺寸变化
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    // 初始更新
    updateDimensions();

    // 添加resize监听
    window.addEventListener('resize', updateDimensions);
    
    // 清理
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (heights && d3Container.current && currentStep && dimensions.width > 0 && dimensions.height > 0) {
      // Clear any existing SVG content
      d3.select(d3Container.current).selectAll('*').remove();
      
      // Set up dimensions
      const margin = { top: 20, right: 30, bottom: 50, left: 40 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom - 60; // 为控制区域预留空间
      
      const { leftMax, rightMax, water, totalWater, currentIndex, phase } = currentStep;
      
      // Find the maximum height to set the scale
      const maxHeight = Math.max(
        ...heights, 
        ...leftMax, 
        ...rightMax, 
        ...heights.map((h, i) => h + (water[i] || 0))
      );
      
      // Create the SVG container
      const svg = d3.select(d3Container.current)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // Set up scales
      const xScale = d3.scaleBand()
        .domain(heights.map((_, i) => i.toString()))
        .range([0, width])
        .padding(0.1);
      
      const yScale = d3.scaleLinear()
        .domain([0, maxHeight])
        .nice()
        .range([height, 0]);
      
      // Add X axis
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', margin.bottom - 10)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .text('位置');
      
      // Add Y axis
      svg.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 10)
        .attr('x', -height / 2)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .text('高度');
      
      // Draw height bars
      svg.selectAll('.bar-height')
        .data(heights)
        .enter()
        .append('rect')
        .attr('class', 'bar-height')
        .attr('x', (_, i) => xScale(i.toString())!)
        .attr('y', d => yScale(d))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d))
        .attr('fill', (_, i) => {
          // 根据当前阶段和索引高亮显示当前处理的位置
          if (i === currentIndex) {
            if (phase === 'leftScan') return '#ff7043';
            if (phase === 'rightScan') return '#4caf50';
            if (phase === 'waterCalculation') return '#fdd835';
          }
          return '#4285f4';
        });
      
      // Draw water bars
      svg.selectAll('.bar-water')
        .data(water)
        .enter()
        .append('rect')
        .attr('class', 'bar-water')
        .attr('x', (_, i) => xScale(i.toString())!)
        .attr('y', (d, i) => yScale(heights[i] + (d || 0)))
        .attr('width', xScale.bandwidth())
        .attr('height', d => d > 0 ? height - yScale(d) : 0)
        .attr('fill', (_, i) => {
          return i === currentIndex && phase === 'waterCalculation' 
            ? 'rgba(33, 150, 243, 0.6)' 
            : 'rgba(66, 133, 244, 0.3)';
        });
      
      // Draw left max line
      const leftMaxLine = d3.line<number>()
        .x((_, i) => (xScale(i.toString())! + xScale.bandwidth() / 2))
        .y(d => yScale(d));
      
      svg.append('path')
        .datum(leftMax)
        .attr('fill', 'none')
        .attr('stroke', '#ff7043')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', phase === 'leftScan' ? '5,5' : '3,3')
        .attr('d', leftMaxLine);
      
      // Draw right max line
      const rightMaxLine = d3.line<number>()
        .x((_, i) => (xScale(i.toString())! + xScale.bandwidth() / 2))
        .y(d => yScale(d));
      
      svg.append('path')
        .datum(rightMax)
        .attr('fill', 'none')
        .attr('stroke', '#4caf50')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', phase === 'rightScan' ? '5,5' : '3,3')
        .attr('d', rightMaxLine);
      
      // 简化图例，保持必要信息
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 100}, 10)`);
      
      // Height bar legend
      legend.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', '#4285f4');
      
      legend.append('text')
        .attr('x', 16)
        .attr('y', 10)
        .attr('fill', 'white')
        .style('font-size', '0.7em')
        .text('高度');
      
      // Water bar legend
      legend.append('rect')
        .attr('y', 18)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', 'rgba(66, 133, 244, 0.3)');
      
      legend.append('text')
        .attr('x', 16)
        .attr('y', 28)
        .attr('fill', 'white')
        .style('font-size', '0.7em')
        .text('雨水');
      
      // Add title and water amount
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.8em')
        .text(`总雨水量: ${totalWater} 单位`);
      
      // Add phase information
      let phaseText = '';
      switch (phase) {
        case 'leftScan':
          phaseText = '左侧扫描: 计算每个位置左侧的最大高度';
          break;
        case 'rightScan':
          phaseText = '右侧扫描: 计算每个位置右侧的最大高度';
          break;
        case 'waterCalculation':
          phaseText = '计算雨水: min(leftMax, rightMax) - height';
          break;
        case 'complete':
          phaseText = '计算完成: 总雨水量 = ' + totalWater;
          break;
      }
      
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.8em')
        .text(phaseText);
    }
  }, [heights, currentStep, dimensions]);

  // 处理速度变化
  const handleSpeedChange = (newSpeed: number) => {
    onSpeedChange(newSpeed);
  };

  return (
    <div className="algorithm-visualizer" ref={containerRef}>
      <div className="algorithm-description">
        <h2>双数组法（预计算法）</h2>
        <p>
          该方法使用两个数组分别记录每个位置从左和从右看到的最大高度，然后计算每个位置的储水量。
        </p>
      </div>
      <div className="visualization-container">
        <svg ref={d3Container} className="d3-component" />
        <AnimationControls
          currentStep={currentStepIndex}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          progress={progress}
          speed={speed}
          onPlay={togglePlay}
          onNext={nextStep}
          onPrev={prevStep}
          onSeek={setProgress}
          onSpeedChange={handleSpeedChange}
        />
      </div>
    </div>
  );
};

export default PrecomputationVisualizer; 