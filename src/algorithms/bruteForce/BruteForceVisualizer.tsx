import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import useBruteForceSteps from './useBruteForceSteps';
import VisualizerControls from '../../components/common/VisualizerControls';
import './BruteForceVisualizer.css';

interface BruteForceVisualizerProps {
  heights: number[];
  speed?: number;
}

const BruteForceVisualizer: React.FC<BruteForceVisualizerProps> = ({ 
  heights, 
  speed = 500 
}) => {
  const {
    currentStep,
    isPlaying,
    progress,
    togglePlay,
    nextStep,
    prevStep,
    setProgress
  } = useBruteForceSteps({ heights, speed });
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  // 设置图表尺寸和边距
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  useEffect(() => {
    if (!svgRef.current || !currentStep) return;

    // 清除之前的内容
    d3.select(svgRef.current).selectAll('*').remove();

    // 创建SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 计算比例尺
    const xScale = d3.scaleBand()
      .domain(heights.map((_, i) => i.toString()))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, Math.max(...heights, d3.max(currentStep.water) || 0) + 1])
      .range([height, 0]);

    // 绘制坐标轴
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', '#000')
      .attr('text-anchor', 'middle')
      .text('位置索引');

    svg.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', '#000')
      .attr('text-anchor', 'middle')
      .text('高度');

    // 绘制高度条形图
    svg.selectAll('.height-bar')
      .data(heights)
      .enter()
      .append('rect')
      .attr('class', 'height-bar')
      .attr('x', (_, i) => xScale(i.toString()) || 0)
      .attr('y', d => yScale(d))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScale(d))
      .attr('fill', (_, i) => {
        if (i === currentStep.currentIndex) return '#FF5722'; // 当前处理位置
        if (i === currentStep.leftScanIndex) return '#2196F3'; // 左侧扫描位置
        if (i === currentStep.rightScanIndex) return '#4CAF50'; // 右侧扫描位置
        return '#9E9E9E'; // 普通位置
      });

    // 绘制水位条形图
    if (currentStep.phase !== 'init') {
      svg.selectAll('.water-bar')
        .data(currentStep.water)
        .enter()
        .filter(d => d > 0)
        .append('rect')
        .attr('class', 'water-bar')
        .attr('x', (_, i) => xScale(i.toString()) || 0)
        .attr('y', (d, i) => yScale(heights[i] + d))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d))
        .attr('fill', '#64B5F6')
        .attr('opacity', 0.7);
    }

    // 根据当前阶段绘制辅助线
    if (currentStep.phase === 'scanLeft' || currentStep.phase === 'scanRight' || currentStep.phase === 'calculate') {
      // 绘制左侧最大高度线
      if (currentStep.leftMax > 0) {
        svg.append('line')
          .attr('x1', 0)
          .attr('y1', yScale(currentStep.leftMax))
          .attr('x2', xScale(currentStep.currentIndex.toString()) || 0)
          .attr('y2', yScale(currentStep.leftMax))
          .attr('stroke', '#2196F3')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
      }

      // 绘制右侧最大高度线
      if (currentStep.rightMax > 0 && currentStep.phase !== 'scanLeft') {
        const bandWidth = xScale.bandwidth();
        const currentX = xScale(currentStep.currentIndex.toString()) || 0;
        
        svg.append('line')
          .attr('x1', currentX + bandWidth)
          .attr('y1', yScale(currentStep.rightMax))
          .attr('x2', width)
          .attr('y2', yScale(currentStep.rightMax))
          .attr('stroke', '#4CAF50')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
      }

      // 绘制计算水位线
      if (currentStep.phase === 'calculate') {
        const minHeight = Math.min(currentStep.leftMax, currentStep.rightMax);
        if (minHeight > heights[currentStep.currentIndex]) {
          const bandWidth = xScale.bandwidth();
          const currentX = xScale(currentStep.currentIndex.toString()) || 0;
          
          svg.append('line')
            .attr('x1', currentX)
            .attr('y1', yScale(minHeight))
            .attr('x2', currentX + bandWidth)
            .attr('y2', yScale(minHeight))
            .attr('stroke', '#FF9800')
            .attr('stroke-width', 2);
        }
      }
    }

    // 添加图例
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data([
        { label: '当前处理位置', color: '#FF5722' },
        { label: '左侧扫描位置', color: '#2196F3' },
        { label: '右侧扫描位置', color: '#4CAF50' },
        { label: '水量', color: '#64B5F6' }
      ])
      .enter()
      .append('g')
      .attr('transform', (_, i) => `translate(0,${i * 20})`);

    legend.append('rect')
      .attr('x', width - 19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', d => d.color);

    legend.append('text')
      .attr('x', width - 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d.label);

    // 添加阶段描述文本
    const phaseText = {
      'init': '初始化',
      'scanLeft': `扫描左侧，查找位置 ${currentStep.currentIndex} 左边的最大高度：${currentStep.leftMax}`,
      'scanRight': `扫描右侧，查找位置 ${currentStep.currentIndex} 右边的最大高度：${currentStep.rightMax}`,
      'calculate': `计算位置 ${currentStep.currentIndex} 的储水量：min(${currentStep.leftMax}, ${currentStep.rightMax}) - ${heights[currentStep.currentIndex]}`,
      'complete': `计算完成，总储水量：${currentStep.totalWater}`
    };

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(phaseText[currentStep.phase]);

  }, [currentStep, heights, width, height, margin]);

  return (
    <div className="brute-force-visualizer">
      <svg ref={svgRef}></svg>
      <VisualizerControls
        isPlaying={isPlaying}
        progress={progress}
        onTogglePlay={togglePlay}
        onNext={nextStep}
        onPrev={prevStep}
        onProgressChange={setProgress}
      />
      <div className="stats">
        <p>总储水量: {currentStep?.totalWater || 0}</p>
      </div>
    </div>
  );
};

export default BruteForceVisualizer; 