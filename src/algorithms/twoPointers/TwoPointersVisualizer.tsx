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

    // 添加resize监听和ResizeObserver监听
    window.addEventListener('resize', updateDimensions);
    
    // 使用ResizeObserver监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // 清理
    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (heights && d3Container.current && currentStep && dimensions.width > 0 && dimensions.height > 0) {
      // Clear any existing SVG content
      d3.select(d3Container.current).selectAll('*').remove();
      
      // 设置尺寸，减小边距
      const controlsHeight = 30;
      const margin = { top: 8, right: 15, bottom: 20, left: 25 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom - controlsHeight;
      
      const { left, right, leftMax, rightMax, water, totalWater, currentFill, phase } = currentStep;
      
      // Find the maximum height to set the scale
      const maxHeight = Math.max(...heights, ...water.map((w, i) => w + heights[i]));
      
      // Create the SVG container
      const svg = d3.select(d3Container.current)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // 根据数组长度调整柱子间隔
      const barPadding = heights.length > 20 ? 0.05 : 0.1;
      
      // Set up scales
      const xScale = d3.scaleBand()
        .domain(heights.map((_, i) => i.toString()))
        .range([0, width])
        .padding(barPadding);
      
      const yScale = d3.scaleLinear()
        .domain([0, maxHeight])
        .nice()
        .range([height, 0]);
      
      // 简化X轴，当数据过多时只显示部分刻度
      const xAxis = d3.axisBottom(xScale);
      if (heights.length > 15) {
        xAxis.tickValues(
          xScale.domain().filter((_, i) => i % Math.ceil(heights.length / 10) === 0)
        );
      }
      
      // Add X axis
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .append('text')
        .attr('x', width / 2)
        .attr('y', margin.bottom - 5)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .style('font-size', '0.7em')
        .text('位置');
      
      // Add Y axis with fewer ticks
      svg.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 8)
        .attr('x', -height / 2)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .style('font-size', '0.7em')
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
      
      // 当数组不太长时才绘制辅助线
      if (heights.length <= 30) {
      // 绘制左侧最大值线
      svg.append('line')
        .attr('x1', 0)
        .attr('x2', xScale(left.toString())! + xScale.bandwidth())
        .attr('y1', yScale(leftMax))
        .attr('y2', yScale(leftMax))
        .attr('stroke', '#ff7043')
          .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5');
      
      // 绘制右侧最大值线
      svg.append('line')
        .attr('x1', xScale(right.toString())!)
        .attr('x2', width)
        .attr('y1', yScale(rightMax))
        .attr('y2', yScale(rightMax))
        .attr('stroke', '#4caf50')
          .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5');
      }
      
      // 标记左指针
      svg.append('text')
        .attr('x', xScale(left.toString())! + xScale.bandwidth() / 2)
        .attr('y', height + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ff7043')
        .attr('font-weight', 'bold')
        .style('font-size', '0.7em')
        .text('L');
      
      // 标记右指针
      svg.append('text')
        .attr('x', xScale(right.toString())! + xScale.bandwidth() / 2)
        .attr('y', height + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#4caf50')
        .attr('font-weight', 'bold')
        .style('font-size', '0.7em')
        .text('R');
      
      // 简化图例
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 80}, 5)`);
      
      // 左指针图例
      legend.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#ff7043');
      
      legend.append('text')
        .attr('x', 14)
        .attr('y', 8)
        .attr('fill', 'white')
        .style('font-size', '0.65em')
        .text('左指针');
      
      // 右指针图例
      legend.append('rect')
        .attr('y', 14)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#4caf50');
      
      legend.append('text')
        .attr('x', 14)
        .attr('y', 22)
        .attr('fill', 'white')
        .style('font-size', '0.65em')
        .text('右指针');
      
      // 水图例
      legend.append('rect')
        .attr('y', 28)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', 'rgba(66, 133, 244, 0.3)');
      
      legend.append('text')
        .attr('x', 14)
        .attr('y', 36)
        .attr('fill', 'white')
        .style('font-size', '0.65em')
        .text('雨水');
      
      // Add title and water amount
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.75em')
        .text(`总雨水量: ${totalWater} 单位`);
      
      // 简化阶段信息
      let phaseText = '';
      switch (phase) {
        case 'init': phaseText = '初始化'; break;
        case 'moveLeft': phaseText = currentFill ? `左指针填充水 ${currentFill}` : `左指针前进`; break;
        case 'moveRight': phaseText = currentFill ? `右指针填充水 ${currentFill}` : `右指针前进`; break;
        case 'complete': phaseText = '计算完成'; break;
      }
      
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.7em')
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
          使用两个指针从数组两端向中间移动，比较左右两侧的最大高度来计算可以接的雨水量。
        </p>
      </div>
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
    </div>
  );
};

export default TwoPointersVisualizer; 