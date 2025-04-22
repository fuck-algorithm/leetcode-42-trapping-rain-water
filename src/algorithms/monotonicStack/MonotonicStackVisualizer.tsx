import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useMonotonicStackSteps from './useMonotonicStackSteps';
import AnimationControls from '../../components/common/AnimationControls';

interface MonotonicStackVisualizerProps {
  heights: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

const MonotonicStackVisualizer: React.FC<MonotonicStackVisualizerProps> = ({
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
  } = useMonotonicStackSteps({ heights, speed });

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
      // 清除任何现有SVG内容
      d3.select(d3Container.current).selectAll('*').remove();

      // 设置尺寸
      const margin = { top: 20, right: 30, bottom: 50, left: 40 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom - 60; // 为控制区域预留空间

      const { stack, water, totalWater, currentIndex, popIndex, phase } = currentStep;

      // 找到最大高度来设置缩放
      const maxHeight = Math.max(
        ...heights,
        ...heights.map((h, i) => h + (water[i] || 0))
      );

      // 创建SVG容器
      const svg = d3.select(d3Container.current)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // 设置缩放
      const xScale = d3.scaleBand()
        .domain(heights.map((_, i) => i.toString()))
        .range([0, width])
        .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, maxHeight])
        .nice()
        .range([height, 0]);

      // 添加X轴
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', margin.bottom - 10)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .text('位置');

      // 添加Y轴
      svg.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 10)
        .attr('x', -height / 2)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .text('高度');

      // 绘制所有柱子
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
          if (i === currentIndex) return '#ff9800'; // 当前处理的柱子
          return stack.includes(i) ? '#4caf50' : '#4285f4'; // 栈中的柱子用绿色
        });

      // 绘制水
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
          return i === popIndex ? 'rgba(33, 150, 243, 0.8)' : 'rgba(66, 133, 244, 0.3)';
        });

      // 简化图例
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 100}, 10)`);

      // 柱子图例
      legend.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', '#4285f4');

      legend.append('text')
        .attr('x', 16)
        .attr('y', 10)
        .attr('fill', 'white')
        .style('font-size', '0.7em')
        .text('柱子');

      // 栈中柱子图例
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
        .text('栈中');

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

      // 添加标题和水量
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.8em')
        .text(`总雨水量: ${totalWater} 单位`);

      // 添加栈信息
      const stackText = `栈: [${stack.map(i => i).join(', ')}]`;
      svg.append('text')
        .attr('x', 10)
        .attr('y', -5)
        .attr('fill', 'white')
        .style('font-size', '0.8em')
        .text(stackText);

      // 添加操作信息
      let operationText = '';
      if (phase === 'push') {
        operationText = `推入柱子 ${currentIndex} 到栈`;
      } else if (phase === 'pop' && popIndex !== undefined) {
        operationText = `弹出栈顶元素 (位置 ${popIndex})`;
      } else if (phase === 'calculate' && popIndex !== undefined) {
        operationText = `计算位置 ${popIndex} 处的积水`;
      } else if (phase === 'complete') {
        operationText = `计算完成: 总雨水量 = ${totalWater}`;
      }

      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.8em')
        .text(operationText);
    }
  }, [heights, currentStep, dimensions]);

  // 处理速度变化
  const handleSpeedChange = (newSpeed: number) => {
    onSpeedChange(newSpeed);
  };

  return (
    <div className="algorithm-visualizer" ref={containerRef}>
      <div className="algorithm-description">
        <h2>单调栈法</h2>
        <p>
          使用单调递减栈来找到左右两边比当前位置高的柱子，从而计算积水量。
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

export default MonotonicStackVisualizer; 