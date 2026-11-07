import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useMonotonicStackSteps, { MonotonicStackStep } from './useMonotonicStackSteps';
import AnimationControls from '../../components/common/AnimationControls';
import VisualizationTeachingLayer from '../shared/VisualizationTeachingLayer';
import { getPersistentTerrainLayer, getPersistentWaterLayer, HeightColumn, removeTransientSvgContent, renderHeightColumns, renderWaterCells } from '../shared/rainwater';
import { motionDuration } from '../twoPointers/motion';
import '../shared/rainwater.css';

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
      const svgNode = d3Container.current;
      const svgElement = d3.select(svgNode);
      removeTransientSvgContent(svgElement);
      
      // 设置尺寸，减小边距
      const controlsHeight = 50; // AnimationControls的高度
      const margin = { top: 8, right: 15, bottom: 20, left: 25 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom - controlsHeight;
      
      const { stack, water, totalWater, currentIndex, popIndex, phase } = currentStep;
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? true;
      
      // 找到最大高度来设置缩放
      const maxHeight = Math.max(
        ...heights,
        ...heights.map((h, i) => h + (water[i] || 0))
      );
      
      // 创建SVG容器
      const svg = svgElement
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
      const plotTransform = `translate(${margin.left},${margin.top})`;
      const plot = svg.append('g').attr('transform', plotTransform);
      
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
      
      // 添加Y轴，减少刻度数量
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
      
      const reducedMotionForColumns = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? true;
      const terrainLayer = getPersistentTerrainLayer(svgElement, 'monotonic-stack', plotTransform);
      const columns: HeightColumn[] = heights.map((value, index) => ({
        id: `column-${index}`, index, value, x: xScale(index.toString())!, y: yScale(value),
        width: xScale.bandwidth(), height: height - yScale(value),
        stroke: index === currentIndex ? '#ff9800' : stack.includes(index) ? '#4caf50' : '#333',
        strokeWidth: index === currentIndex || stack.includes(index) ? 3 : 1
      }));
      renderHeightColumns(terrainLayer, columns, motionDuration(speed, reducedMotionForColumns), reducedMotionForColumns);
      
      // Keep the water surface consistent with the other algorithm views.
      const waterLayer = getPersistentWaterLayer(svgElement, 'monotonic-stack', plotTransform);
      renderWaterCells(waterLayer, water.map((amount, index) => ({
        id: `water-${index}`, x: xScale(index.toString())! - xScale.step() * xScale.paddingInner() / 2,
        y: yScale(heights[index] + (amount || 0)), width: xScale.step(),
        height: Math.max(0, yScale(heights[index]) - yScale(heights[index] + (amount || 0))),
        highlighted: index === popIndex,
        surface: true
      })), motionDuration(speed, reducedMotion), `monotonicStack:${heights.join(',')}`, reducedMotion);
      
      // 简化图例
      const legend = plot.append('g')
        .attr('transform', `translate(${width - 80}, 5)`);

      // 图例背景
      legend.append('rect')
        .attr('x', -5)
        .attr('y', -5)
        .attr('width', 70)
        .attr('height', 55)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1)
        .attr('rx', 4);

      // 柱子图例
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
        .text('柱子');
        
      // 栈中柱子图例
      legend.append('rect')
        .attr('y', 14)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#1a1a1a')
        .attr('stroke', '#4caf50')
        .attr('stroke-width', 2);

      legend.append('text')
        .attr('x', 14)
        .attr('y', 22)
        .attr('fill', '#333')
        .style('font-size', '0.65em')
        .style('font-weight', '500')
        .text('栈中');

      // 水图例
      legend.append('rect')
        .attr('y', 28)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#5B9BD5');

      legend.append('text')
        .attr('x', 14)
        .attr('y', 36)
        .attr('fill', '#333')
        .style('font-size', '0.65em')
        .style('font-weight', '500')
        .text('雨水');
      
      // 添加水量
      plot.append('text')
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
        plot.append('text')
          .attr('x', 10)
          .attr('y', 0)
          .attr('fill', 'white')
          .style('font-size', '0.7em')
          .text(stackText);
      } else if (stack.length > 10) {
        // 栈太长时只显示部分
        const stackText = `栈: [${stack.slice(0, 5).join(', ')}...(${stack.length})]`;
        plot.append('text')
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
      
      plot.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '0.7em')
        .text(operationText);
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
            单调栈法
            <span className="toggle-icon">{isDescriptionExpanded ? '▼' : '▶'}</span>
          </h2>
          <p className="brief-description">
            维护递减栈，遇到更高柱子时计算凹槽水量 | 时间O(n) 空间O(n)
          </p>
        </div>
        {isDescriptionExpanded && (
          <div className="detailed-description">
            <p><strong>💡 核心思想：</strong></p>
            <div style={{ fontSize: '0.75em', marginTop: '5px', marginBottom: '10px', lineHeight: '1.6' }}>
              维护一个单调递减栈（栈底到栈顶高度递减）。
              <br />
              当遇到比栈顶更高的柱子时，说明形成了凹槽，可以计算积水。
              <br />
              类似括号匹配，每次找到一对"墙"就计算中间的水量。
            </div>
            
            <p><strong>算法步骤：</strong></p>
            <ol style={{ fontSize: '0.75em', marginTop: '3px', paddingLeft: '20px', lineHeight: '1.5' }}>
              <li><strong>遍历数组：</strong>从左到右处理每个柱子</li>
              <li><strong>栈顶比较：</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '2px' }}>
                  <li>当前高度 ≤ 栈顶 → 入栈</li>
                  <li>当前高度 &gt; 栈顶 → 出栈并计算水量</li>
                </ul>
              </li>
              <li><strong>计算水量：</strong>宽度 × min(左墙, 右墙) - 底部高度</li>
            </ol>
            
            <p style={{ fontSize: '0.7em', marginTop: '8px', color: '#FFC107' }}>
              <strong>⏱ 时间复杂度：</strong>O(n) - 每个元素最多入栈出栈各一次
              <br />
              <strong>💾 空间复杂度：</strong>O(n) - 栈的空间
              <br />
              <strong>💡 特点：</strong>按"层"计算水量，横向累加
            </p>
          </div>
        )}
      </div>
      <div className="visualization-wrapper shared-algorithm-workspace">
        {currentStep && <VisualizationTeachingLayer operation={stackOperation(currentStep.phase)} currentStep={currentStepIndex + 1} totalSteps={totalSteps} narration={currentStep.description || '比较当前柱和栈顶，判断是否形成新的接水容器。'} metrics={[{ label: '总水量', value: currentStep.totalWater }, { label: '栈长度', value: currentStep.stack.length }, { label: '扫描索引', value: currentStep.currentIndex }]} />}
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

function stackOperation(phase: MonotonicStackStep['phase']): string {
  return ({ push: '入栈当前柱', pop: '弹出低柱', calculate: '计算凹槽面积', complete: '完成' } as Record<MonotonicStackStep['phase'], string>)[phase];
}

export default MonotonicStackVisualizer; 