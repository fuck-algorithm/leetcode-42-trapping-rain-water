import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import AnimationControls from '../../components/common/AnimationControls';
import { BruteForceVisualizerProps } from './types';
import useBruteForceSteps from './useBruteForceSteps';
import VisualizationTeachingLayer from '../shared/VisualizationTeachingLayer';
import { clearTransientPlotLayer, createTransientPlotLayer, getPersistentTerrainLayer, getPersistentWaterLayer, HeightColumn, renderHeightColumns, renderWaterCells } from '../shared/rainwater';
import { motionDuration } from '../twoPointers/motion';
import { resolveHeightDomain } from '../shared/visualDomain';
import { getBoundCodeLine } from '../shared/codeBinding';
import BruteForceCodePanel from './BruteForceCodePanel';
import '../shared/rainwater.css';
import './BruteForceVisualizer.css';

/**
 * 暴力法可视化组件
 * 用于可视化展示暴力法（按列求）解决接雨水问题的过程
 */
const BruteForceVisualizer: React.FC<BruteForceVisualizerProps> = ({ 
  heights, 
  speed = 500,
  onSpeedChange = () => {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const d3Container = useRef<SVGSVGElement>(null);
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
  } = useBruteForceSteps({ heights, speed });

  // 监听容器尺寸变化
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);


  // D3可视化渲染
  useEffect(() => {
    if (!d3Container.current || !currentStep || dimensions.width <= 0 || dimensions.height <= 0) {
      return;
    }

    const controlsHeight = 154; // 说明栏 34px 与播放控制 120px
    const margin = { top: 80, right: 20, bottom: 30, left: 40 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom - controlsHeight;

    const { position, leftMax, rightMax, waterLevel, totalWater, phase, scanIndex } = currentStep;
    const [, maxHeight] = resolveHeightDomain(heights);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? true;

    const svgElement = d3.select(d3Container.current);
    svgElement
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    const plotTransform = `translate(${margin.left},${margin.top})`;
    clearTransientPlotLayer(svgElement, 'brute-force');
    const plot = createTransientPlotLayer(svgElement, 'brute-force', plotTransform);

    const barPadding = heights.length > 20 ? 0.05 : 0.1;

    const xScale = d3.scaleBand()
      .domain(heights.map((_, i) => i.toString()))
      .range([0, width])
      .padding(barPadding);

    const yScale = d3.scaleLinear()
      .domain([0, maxHeight])
      .nice()
      .range([height, 0]);

    // Y轴
    plot.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 8)
      .attr('x', -height / 2)
      .attr('fill', '#687b76')
      .attr('text-anchor', 'middle')
      .style('font-size', '0.7em')
      .text('高度');

    // 绘制柱子 - 黑色柱子
    const terrainLayer = getPersistentTerrainLayer(svgElement, 'brute-force', plotTransform);
    const columns: HeightColumn[] = heights.map((value, index) => ({
      id: `column-${index}`, index, value, x: xScale(index.toString())!, y: yScale(value),
      width: xScale.bandwidth(), height: height - yScale(value),
      stroke: index === position ? '#ff7043' : scanIndex === index ? '#FFC107' : '#333',
      strokeWidth: index === position || scanIndex === index ? 3 : 1
    }));
    renderHeightColumns(terrainLayer, columns, motionDuration(speed, reducedMotion), reducedMotion);

    // Render calculated water with the same translucent surface treatment.
    const waterLayer = getPersistentWaterLayer(svgElement, 'brute-force', plotTransform);
    renderWaterCells(waterLayer, waterLevel ? Object.entries(waterLevel).map(([idx, level]) => {
      const index = Number(idx);
      return {
        id: `water-${index}`, x: xScale(index.toString())! - xScale.step() * xScale.paddingInner() / 2, y: yScale(heights[index] + level),
        width: xScale.step(), height: Math.max(0, yScale(heights[index]) - yScale(heights[index] + level)),
        highlighted: index === position, surface: true
      };
    }) : [], motionDuration(speed, reducedMotion), `bruteForce:${heights.join(',')}`, reducedMotion);


    // 绘制左侧最大高度线
    if (leftMax > 0 && position >= 0 && (phase === 'scanLeftComplete' || 
        phase === 'scanRightComplete' || phase === 'compare' || phase === 'waterFound')) {
      const leftLineX = xScale(position.toString())!;
      plot.append('line')
        .attr('x1', 0)
        .attr('x2', leftLineX)
        .attr('y1', yScale(leftMax))
        .attr('y2', yScale(leftMax))
        .attr('stroke', '#ff7043')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      plot.append('text')
        .attr('x', 5)
        .attr('y', yScale(leftMax) - 5)
        .attr('fill', '#ff7043')
        .attr('font-weight', 'bold')
        .style('font-size', '0.75em')
        .text(`leftMax: ${leftMax}`);
    }

    // 绘制右侧最大高度线
    if (rightMax > 0 && position >= 0 && (phase === 'scanRightComplete' || phase === 'compare' || 
        phase === 'waterFound')) {
      const rightLineX = xScale(position.toString())! + xScale.bandwidth();
      plot.append('line')
        .attr('x1', rightLineX)
        .attr('x2', width)
        .attr('y1', yScale(rightMax))
        .attr('y2', yScale(rightMax))
        .attr('stroke', '#4caf50')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      plot.append('text')
        .attr('x', width - 5)
        .attr('y', yScale(rightMax) - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#4caf50')
        .attr('font-weight', 'bold')
        .style('font-size', '0.75em')
        .text(`rightMax: ${rightMax}`);
    }

    // 绘制水位线（比较阶段）
    if (phase === 'compare' || phase === 'waterFound') {
      const minHeight = Math.min(leftMax, rightMax);
      if (minHeight > 0 && position >= 0) {
        const barX = xScale(position.toString())!;
        plot.append('line')
          .attr('x1', barX)
          .attr('x2', barX + xScale.bandwidth())
          .attr('y1', yScale(minHeight))
          .attr('y2', yScale(minHeight))
          .attr('stroke', '#FFC107')
          .attr('stroke-width', 3);
      }
    }

    // 索引标签
    if (heights.length <= 30) {
      heights.forEach((_, i) => {
        const barX = xScale(i.toString())!;
        const barWidth = xScale.bandwidth();
        const isActive = i === position;
        const isScan = scanIndex !== undefined && i === scanIndex;

        plot.append('circle')
          .attr('cx', barX + barWidth / 2)
          .attr('cy', height + 20)
          .attr('r', 10)
          .attr('fill', isActive ? '#ff7043' : isScan ? '#FFC107' : 'rgba(80, 80, 80, 0.8)')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);

        plot.append('text')
          .attr('x', barX + barWidth / 2)
          .attr('y', height + 24)
          .attr('text-anchor', 'middle')
          .attr('fill', isActive || isScan ? 'white' : '#000')
          .attr('font-weight', 'bold')
          .style('font-size', '0.7em')
          .text(i);
      });
    }


    // 图例
    const legend = plot.append('g')
      .attr('transform', `translate(${width - 100}, 10)`);

    // 图例背景
    legend.append('rect')
      .attr('x', -5)
      .attr('y', -5)
      .attr('width', 95)
      .attr('height', 65)
      .attr('fill', 'rgba(255, 255, 255, 0.95)')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    const legendItems = [
      { color: '#1a1a1a', label: '柱子', y: 0, stroke: '#333' },
      { color: '#ff7043', label: '当前位置', y: 14 },
      { color: '#FFC107', label: '扫描位置', y: 28 },
      { color: '#268fc2', label: '雨水', y: 42 }
    ];

    legendItems.forEach((item: { color: string; label: string; y: number; stroke?: string }) => {
      legend.append('rect')
        .attr('y', item.y)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', item.color)
        .attr('stroke', item.stroke || 'none')
        .attr('stroke-width', item.stroke ? 1 : 0);

      legend.append('text')
        .attr('x', 16)
        .attr('y', item.y + 9)
        .attr('fill', '#333')
        .style('font-size', '0.65em')
        .style('font-weight', '500')
        .text(item.label);
    });

    // 顶部状态面板
    const statePanel = plot.append('g')
      .attr('class', 'state-panel')
      .attr('transform', `translate(0, -65)`);

    statePanel.raise();
    statePanel.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', 55)
      .attr('fill', 'rgba(255, 255, 255, 0.95)')
      .attr('stroke', '#ff7043')
      .attr('stroke-width', 2)
      .attr('rx', 5);

    statePanel.append('text')
      .attr('x', width / 2)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E65100')
      .attr('font-weight', 'bold')
      .style('font-size', '1em')
      .text(`当前状态 | 步骤 ${currentStepIndex + 1}/${totalSteps}`);

    const varSpacing = Math.min(120, width / 5);
    const variables = [
      { label: '当前位置', value: position >= 0 ? position : '-', color: '#ff7043', x: varSpacing * 0.5 },
      { label: '左侧最大', value: leftMax, color: '#ff7043', x: varSpacing * 1.5 },
      { label: '右侧最大', value: rightMax, color: '#4caf50', x: varSpacing * 2.5 },
      { label: '总水量', value: totalWater, color: '#1976D2', x: width - varSpacing * 0.8 }
    ];

    variables.forEach(v => {
      const varGroup = statePanel.append('g')
        .attr('transform', `translate(${v.x}, 35)`);

      varGroup.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', '#666')
        .style('font-size', '0.7em')
        .text(`${v.label}:`);

      varGroup.append('text')
        .attr('x', 0)
        .attr('y', 12)
        .attr('fill', v.color)
        .attr('font-weight', 'bold')
        .style('font-size', '1em')
        .text(v.value);
    });

  }, [heights, currentStep, dimensions, currentStepIndex, totalSteps, speed]);

  const handleSpeedChange = (newSpeed: number) => {
    onSpeedChange(newSpeed);
  };


  return (
    <div className="algorithm-visualizer brute-force-visualizer" ref={containerRef}>
      <div className="algorithm-description-compact">
        <div className="description-header" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
          <h2>
            暴力法（按列求）
            <span className="toggle-icon">{isDescriptionExpanded ? '▼' : '▶'}</span>
          </h2>
          <p className="brief-description">
            对每个位置分别计算左右最大高度 | 时间O(n²) 空间O(1)
          </p>
        </div>
        {isDescriptionExpanded && (
          <div className="detailed-description">
            <p><strong>💡 核心思想：</strong></p>
            <div style={{ fontSize: '0.75em', marginTop: '5px', marginBottom: '10px', lineHeight: '1.6' }}>
              对于每个位置，能接的雨水量 = min(左侧最大高度, 右侧最大高度) - 当前高度
              <br />
              这是最直观的解法，但需要对每个位置都重新扫描左右两侧。
            </div>
            
            <p><strong>算法步骤：</strong></p>
            <ol style={{ fontSize: '0.75em', marginTop: '3px', paddingLeft: '20px', lineHeight: '1.5' }}>
              <li><strong>遍历每个位置：</strong>从左到右处理每个柱子</li>
              <li><strong>左侧扫描：</strong>找出当前位置左侧的最大高度</li>
              <li><strong>右侧扫描：</strong>找出当前位置右侧的最大高度</li>
              <li><strong>计算水量：</strong>min(leftMax, rightMax) - height[i]</li>
            </ol>
            
            <p style={{ fontSize: '0.7em', marginTop: '8px', color: '#FFC107' }}>
              <strong>⏱ 时间复杂度：</strong>O(n²) - 每个位置都要扫描左右
              <br />
              <strong>💾 空间复杂度：</strong>O(1) - 只用了几个变量
              <br />
              <strong>⚠️ 注意：</strong>效率较低，可用动态规划优化
            </p>
          </div>
        )}
      </div>
      <div className="visualization-wrapper shared-algorithm-workspace">
        {currentStep && <VisualizationTeachingLayer codeLines={getBoundCodeLine(currentStep.codeLineBindings, 'javascript').highlighted} operation={bruteForceOperation(currentStep.phase)} currentStep={currentStepIndex + 1} totalSteps={totalSteps} narration={currentStep.subStepDescription || currentStep.description} metrics={[{ label: '总水量', value: currentStep.totalWater }, { label: '左界', value: currentStep.leftMax }, { label: '右界', value: currentStep.rightMax }]} />}
        <svg
          ref={d3Container}
          className="d3-component"
        />
        {currentStep && <BruteForceCodePanel step={currentStep} />}
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

function bruteForceOperation(phase: string): string {
  if (phase.startsWith('scanLeft')) return '扫描左边界';
  if (phase.startsWith('scanRight')) return '扫描右边界';
  if (phase === 'compare') return '计算当前位置水量';
  if (phase === 'complete') return '完成';
  return '选择当前位置';
}

export default BruteForceVisualizer;
