import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import usePrecomputationSteps, { AnimationStep } from './usePrecomputationSteps';
import AnimationControls from '../../components/common/AnimationControls';
import VisualizationTeachingLayer from '../shared/VisualizationTeachingLayer';
import { getPersistentTerrainLayer, getPersistentWaterLayer, HeightColumn, removeTransientSvgContent, renderHeightColumns, renderWaterCells } from '../shared/rainwater';
import { motionDuration } from '../twoPointers/motion';
import '../shared/rainwater.css';

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
      const svgNode = d3Container.current;
      const svgElement = d3.select(svgNode);
      removeTransientSvgContent(svgElement);
      
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
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? true;
      const svg = svgElement
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
      const plotTransform = `translate(${margin.left},${margin.top})`;
      const plot = svg.append('g').attr('transform', plotTransform);
      
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
      plot.append('g')
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
      plot.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 8)
        .attr('x', -height / 2)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .style('font-size', '0.7em')
        .text('高度');
      
      const terrainLayer = getPersistentTerrainLayer(svgElement, 'precomputation', plotTransform);
      const columns: HeightColumn[] = heights.map((value, index) => ({
        id: `column-${index}`, index, value, x: xScale(index.toString())!, y: yScale(value),
        width: xScale.bandwidth(), height: height - yScale(value),
        stroke: index === currentIndex
          ? phase === 'leftScan' ? '#ff7043' : phase === 'rightScan' ? '#4caf50' : phase === 'waterCalculation' ? '#fdd835' : '#ff7043'
          : '#333',
        strokeWidth: index === currentIndex ? 3 : 1
      }));
      renderHeightColumns(terrainLayer, columns, motionDuration(speed, reducedMotion), reducedMotion);
      
      // Reuse the same reflective water surface across algorithm views.
      const waterLayer = getPersistentWaterLayer(svgElement, 'precomputation', plotTransform);
      renderWaterCells(waterLayer, water.map((amount, index) => ({
        id: `water-${index}`, x: xScale(index.toString())! - xScale.step() * xScale.paddingInner() / 2,
        y: yScale(heights[index] + (amount || 0)), width: xScale.step(),
        height: Math.max(0, yScale(heights[index]) - yScale(heights[index] + (amount || 0))),
        highlighted: index === currentIndex && phase === 'waterCalculation',
        surface: true
      })), motionDuration(speed, reducedMotion), `precomputation:${heights.join(',')}`, reducedMotion);
      
      // Draw left max line (只在数组长度适中时绘制)
      if (heights.length <= 30) {
      const leftMaxLine = d3.line<number>()
        .x((_, i) => (xScale(i.toString())! + xScale.bandwidth() / 2))
        .y(d => yScale(d));
      
      plot.append('path')
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
      
      plot.append('path')
        .datum(rightMax)
        .attr('fill', 'none')
        .attr('stroke', '#4caf50')
          .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', phase === 'rightScan' ? '5,5' : '3,3')
        .attr('d', rightMaxLine);
      }
      
      // 简化图例，保持必要信息
      const legend = plot.append('g')
        .attr('transform', `translate(${width - 80}, 5)`);
      
      // 图例背景
      legend.append('rect')
        .attr('x', -5)
        .attr('y', -5)
        .attr('width', 70)
        .attr('height', 40)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1)
        .attr('rx', 4);
      
      // Height bar legend
      legend.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#1a1a1a')
        .attr('stroke', '#333')
        .attr('stroke-width', 1);
      
      legend.append('text')
        .attr('x', 14)
        .attr('y', 8)
        .attr('fill', '#333')
        .style('font-size', '0.65em')
        .style('font-weight', '500')
        .text('高度');
      
      // Water bar legend
      legend.append('rect')
        .attr('y', 14)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#5B9BD5');
      
      legend.append('text')
        .attr('x', 14)
        .attr('y', 22)
        .attr('fill', '#333')
        .style('font-size', '0.65em')
        .style('font-weight', '500')
        .text('雨水');
      
      // Add water amount
      plot.append('text')
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
      
      plot.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.7em')
        .text(phaseText);
    }
  }, [heights, currentStep, dimensions, speed]);

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
      <div className="visualization-wrapper shared-algorithm-workspace">
        {currentStep && <VisualizationTeachingLayer operation={precomputationOperation(currentStep.phase)} currentStep={currentStepIndex + 1} totalSteps={totalSteps} narration={currentStep.description || '扫描数组并根据左右边界最大值确定蓄水量。'} metrics={[{ label: '总水量', value: currentStep.totalWater }, { label: '索引', value: currentStep.currentIndex }, { label: '阶段', value: currentStep.phase === 'leftScan' ? '左扫' : currentStep.phase === 'rightScan' ? '右扫' : '求水' }]} />}
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

function precomputationOperation(phase: AnimationStep['phase']): string {
  return ({ leftScan: '更新左侧最大值', rightScan: '更新右侧最大值', waterCalculation: '按边界计算水量', complete: '完成' } as Record<AnimationStep['phase'], string>)[phase];
}

export default PrecomputationVisualizer; 