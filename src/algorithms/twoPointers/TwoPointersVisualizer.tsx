import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useTwoPointersSteps from './useTwoPointersSteps';
import AnimationControls from '../../components/common/AnimationControls';

interface TwoPointersVisualizerProps {
  heights: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

const TwoPointersVisualizer: React.FC<TwoPointersVisualizerProps> = ({ 
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
  } = useTwoPointersSteps({ heights, speed });

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
      
      const { left, right, leftMax, rightMax, water, totalWater, currentFill, phase } = currentStep;
      
      // Find the maximum height to set the scale
      const maxHeight = Math.max(...heights, ...water.map((w, i) => w + heights[i]));
      
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
          if (i === left) return '#ff7043'; // 左指针位置
          if (i === right) return '#4caf50'; // 右指针位置
          if (i > left && i < right) return '#4285f4'; // 中间未处理的位置
          return '#9e9e9e'; // 已处理的位置
        });
      
      // Draw water bars
      svg.selectAll('.bar-water')
        .data(water)
        .enter()
        .append('rect')
        .attr('class', 'bar-water')
        .attr('x', (_, i) => xScale(i.toString())!)
        .attr('y', (d, i) => yScale(heights[i] + d))
        .attr('width', xScale.bandwidth())
        .attr('height', d => d > 0 ? height - yScale(d) : 0)
        .attr('fill', (d, i) => {
          // 高亮显示当前填充的水
          if (currentFill && (
            (phase === 'moveLeft' && i === left) || 
            (phase === 'moveRight' && i === right)
          )) {
            return 'rgba(33, 150, 243, 0.6)';
          }
          return 'rgba(66, 133, 244, 0.3)';
        });
      
      // 绘制左侧最大值线
      svg.append('line')
        .attr('x1', 0)
        .attr('x2', xScale(left.toString())! + xScale.bandwidth())
        .attr('y1', yScale(leftMax))
        .attr('y2', yScale(leftMax))
        .attr('stroke', '#ff7043')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      // 绘制右侧最大值线
      svg.append('line')
        .attr('x1', xScale(right.toString())!)
        .attr('x2', width)
        .attr('y1', yScale(rightMax))
        .attr('y2', yScale(rightMax))
        .attr('stroke', '#4caf50')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      // 标记左指针
      svg.append('text')
        .attr('x', xScale(left.toString())! + xScale.bandwidth() / 2)
        .attr('y', height + 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ff7043')
        .attr('font-weight', 'bold')
        .style('font-size', '0.8em')
        .text('L');
      
      // 标记右指针
      svg.append('text')
        .attr('x', xScale(right.toString())! + xScale.bandwidth() / 2)
        .attr('y', height + 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#4caf50')
        .attr('font-weight', 'bold')
        .style('font-size', '0.8em')
        .text('R');
      
      // 简化图例
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 100}, 10)`);
      
      // 左指针图例
      legend.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', '#ff7043');
      
      legend.append('text')
        .attr('x', 16)
        .attr('y', 10)
        .attr('fill', 'white')
        .style('font-size', '0.7em')
        .text('左指针');
      
      // 右指针图例
      legend.append('rect')
        .attr('y', 18)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', '#4caf50');
      
      legend.append('text')
        .attr('x', 16)
        .attr('y', 28)
        .attr('fill', 'white')
        .style('font-size', '0.7em')
        .text('右指针');
      
      // 水图例
      legend.append('rect')
        .attr('y', 36)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', 'rgba(66, 133, 244, 0.3)');
      
      legend.append('text')
        .attr('x', 16)
        .attr('y', 46)
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
        case 'init':
          phaseText = '初始化: 左指针=0, 右指针=' + (heights.length - 1);
          break;
        case 'moveLeft':
          if (currentFill) {
            phaseText = `左指针前进: 位置${left}填充雨水${currentFill}单位`;
          } else {
            phaseText = `左指针前进: 更新左侧最大值=${leftMax}`;
          }
          break;
        case 'moveRight':
          if (currentFill) {
            phaseText = `右指针后退: 位置${right}填充雨水${currentFill}单位`;
          } else {
            phaseText = `右指针后退: 更新右侧最大值=${rightMax}`;
          }
          break;
        case 'complete':
          phaseText = `计算完成: 总雨水量 = ${totalWater}`;
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
        <h2>双指针法</h2>
        <p>
          使用两个指针从两端向中间移动。比较两个指针指向的高度，移动较小的那个指针。
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

export default TwoPointersVisualizer; 