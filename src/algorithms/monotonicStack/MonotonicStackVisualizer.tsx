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
    
    // 使用ResizeObserver监听容器尺寸变化
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
      
      // 根据数组长度调整柱子间隔
      const barPadding = heights.length > 20 ? 0.05 : 0.1;
      
      // 设置缩放
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
      
      // 添加X轴
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
      
      // 添加Y轴，减少刻度数量
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
        .attr('transform', `translate(${width - 80}, 5)`);

      // 柱子图例
      legend.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#4285f4');
        
      legend.append('text')
        .attr('x', 14)
        .attr('y', 8)
        .attr('fill', 'white')
        .style('font-size', '0.65em')
        .text('柱子');
        
      // 栈中柱子图例
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
        .text('栈中');

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
      
      // 添加水量
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.75em')
        .text(`总雨水量: ${totalWater} 单位`);
      
      // 添加栈信息，但简化显示
      if (stack.length > 0 && stack.length <= 10) {
        // 当栈不太长时完整显示
        const stackText = `栈: [${stack.join(', ')}]`;
        svg.append('text')
          .attr('x', 10)
          .attr('y', 0)
          .attr('fill', 'white')
          .style('font-size', '0.7em')
          .text(stackText);
      } else if (stack.length > 10) {
        // 栈太长时只显示部分
        const stackText = `栈: [${stack.slice(0, 5).join(', ')}...(${stack.length})]`;
        svg.append('text')
          .attr('x', 10)
          .attr('y', 0)
          .attr('fill', 'white')
          .style('font-size', '0.7em')
          .text(stackText);
      }

      // 简化操作信息
      let operationText = '';
      if (phase === 'push') {
        operationText = `推入柱子 ${currentIndex}`;
      } else if (phase === 'pop' && popIndex !== undefined) {
        operationText = `弹出栈顶元素 ${popIndex}`;
      } else if (phase === 'calculate' && popIndex !== undefined) {
        operationText = `计算位置 ${popIndex} 积水`;
      } else if (phase === 'complete') {
        operationText = `计算完成`;
      }
      
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.7em')
        .text(operationText);
    }
  }, [heights, currentStep, dimensions]);

  // 处理速度变化
  const handleSpeedChange = (newSpeed: number) => {
    onSpeedChange(newSpeed);
  };

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
    </div>
  );
};

export default MonotonicStackVisualizer; 