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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    isPlaying,
    progress,
    togglePlay,
    nextStep,
    prevStep,
    setProgress,
    reset
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

    // 添加resize监听和MutationObserver监听DOM变化
    window.addEventListener('resize', updateDimensions);
    
    // 创建和使用MutationObserver监听容器尺寸变化
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
      const controlsHeight = 50; // AnimationControls的高度
      const margin = { top: 8, right: 15, bottom: 20, left: 25 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom - controlsHeight;
      
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
      
      // 自适应单元宽度，根据数组长度动态计算
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
      
      // Simplified X axis with fewer ticks when too many bars
      const xAxis = d3.axisBottom(xScale);
      if (heights.length > 15) {
        // 只显示部分刻度
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
      
      // Add Y axis
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
      
      // Draw left max line (只在数组长度适中时绘制)
      if (heights.length <= 30) {
      const leftMaxLine = d3.line<number>()
        .x((_, i) => (xScale(i.toString())! + xScale.bandwidth() / 2))
        .y(d => yScale(d));
      
      svg.append('path')
        .datum(leftMax)
        .attr('fill', 'none')
        .attr('stroke', '#ff7043')
          .attr('stroke-width', 1.5)
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
          .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', phase === 'rightScan' ? '5,5' : '3,3')
        .attr('d', rightMaxLine);
      }
      
      // 简化图例，保持必要信息
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 80}, 5)`);
      
      // Height bar legend
      legend.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#4285f4');
      
      legend.append('text')
        .attr('x', 14)
        .attr('y', 8)
        .attr('fill', 'white')
        .style('font-size', '0.65em')
        .text('高度');
      
      // Water bar legend
      legend.append('rect')
        .attr('y', 14)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', 'rgba(66, 133, 244, 0.3)');
      
      legend.append('text')
        .attr('x', 14)
        .attr('y', 22)
        .attr('fill', 'white')
        .style('font-size', '0.65em')
        .text('雨水');
      
      // Add water amount
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
        case 'leftScan': phaseText = '左侧扫描'; break;
        case 'rightScan': phaseText = '右侧扫描'; break;
        case 'waterCalculation': phaseText = '计算雨水'; break;
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
      <div className="algorithm-description-compact">
        <div className="description-header" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
          <h2>
            双数组法（动态规划）
            <span className="toggle-icon">{isDescriptionExpanded ? '▼' : '▶'}</span>
          </h2>
          <p className="brief-description">
            预计算左右最大高度数组 | 时间O(n) 空间O(n)
          </p>
        </div>
        {isDescriptionExpanded && (
          <div className="detailed-description">
            <p><strong>💡 核心思想：</strong></p>
            <div style={{ fontSize: '0.75em', marginTop: '5px', marginBottom: '10px', lineHeight: '1.6' }}>
              暴力法对每个位置都重新扫描左右，效率低。
              <br />
              我们可以预先计算好每个位置的左侧最大值和右侧最大值，存入两个数组。
              <br />
              这样计算水量时直接查表即可，避免重复扫描。
            </div>
            
            <p><strong>算法步骤：</strong></p>
            <ol style={{ fontSize: '0.75em', marginTop: '3px', paddingLeft: '20px', lineHeight: '1.5' }}>
              <li><strong>左侧扫描：</strong>从左到右，leftMax[i] = max(leftMax[i-1], height[i])</li>
              <li><strong>右侧扫描：</strong>从右到左，rightMax[i] = max(rightMax[i+1], height[i])</li>
              <li><strong>计算水量：</strong>water[i] = min(leftMax[i], rightMax[i]) - height[i]</li>
            </ol>
            
            <p style={{ fontSize: '0.7em', marginTop: '8px', color: '#FFC107' }}>
              <strong>⏱ 时间复杂度：</strong>O(n) - 三次线性扫描
              <br />
              <strong>💾 空间复杂度：</strong>O(n) - 两个辅助数组
              <br />
              <strong>💡 优化：</strong>可用双指针进一步优化空间到O(1)
            </p>
          </div>
        )}
      </div>
      <div className="visualization-wrapper">
        <svg
          ref={d3Container}
          className="d3-component"
        />
        <AnimationControls
          isPlaying={isPlaying}
          onPlay={togglePlay}
          onNext={nextStep}
          onPrev={prevStep}
          onReset={reset}
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

export default PrecomputationVisualizer; 