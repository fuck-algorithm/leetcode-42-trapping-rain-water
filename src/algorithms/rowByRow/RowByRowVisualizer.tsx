import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useRowByRowSteps, { RowByRowStep } from './useRowByRowSteps';
import AnimationControls from '../../components/common/AnimationControls';
import VisualizationTeachingLayer from '../shared/VisualizationTeachingLayer';
import { getPersistentTerrainLayer, getPersistentWaterLayer, HeightColumn, removeTransientSvgContent, renderHeightColumns, renderWaterCells } from '../shared/rainwater';
import { motionDuration } from '../twoPointers/motion';
import '../shared/rainwater.css';
import './RowByRowVisualizer.css';

interface RowByRowVisualizerProps {
  heights: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

const RowByRowVisualizer: React.FC<RowByRowVisualizerProps> = ({ 
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
  } = useRowByRowSteps({ heights, speed });

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

  useEffect(() => {
    if (heights && d3Container.current && currentStep && dimensions.width > 0 && dimensions.height > 0) {
      const controlsHeight = 120;
      const margin = { top: 80, right: 20, bottom: 30, left: 40 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom - controlsHeight;
      
      const { currentRow, currentCol, waterMatrix, totalWater, phase, tempSum, rowWater } = currentStep;
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? true;
      const maxHeight = Math.max(...heights);
      
      const svgElement = d3.select(d3Container.current);
      removeTransientSvgContent(svgElement);
      
      const svg = svgElement
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
      const plotTransform = `translate(${margin.left},${margin.top})`;
      const plot = svg.append('g').attr('transform', plotTransform);
      
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
        .call(d3.axisLeft(yScale).ticks(maxHeight))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 8)
        .attr('x', -height / 2)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .style('font-size', '0.7em')
        .text('高度');
      
      // 绘制当前行的水平线（高亮当前处理的层级）
      if (currentRow > 0 && phase !== 'complete') {
        plot.append('line')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', yScale(currentRow))
          .attr('y2', yScale(currentRow))
          .attr('stroke', '#FF9800')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .style('opacity', 0.8);
        
        plot.append('text')
          .attr('x', width + 5)
          .attr('y', yScale(currentRow) + 4)
          .attr('fill', '#FF9800')
          .attr('font-weight', 'bold')
          .style('font-size', '0.8em')
          .text(`第${currentRow}层`);
      }
      
      const waterCells: { id: string; x: number; y: number; width: number; height: number; highlighted: boolean; surface: boolean; pending: boolean }[] = [];
      // 绘制柱子（按单元格绘制，便于显示水）
      for (let col = 0; col < heights.length; col++) {
        const barX = xScale(col.toString())!;
        const barWidth = xScale.bandwidth();
        
        // 绘制每个高度单元
        for (let row = 1; row <= maxHeight; row++) {
          const cellY = yScale(row);
          const cellHeight = yScale(row - 1) - yScale(row);
          
          if (row > heights[col] && waterMatrix[row - 1] && waterMatrix[row - 1][col] === 1) {
            waterCells.push({
              id: `water-${col}-${row}`, x: barX, y: cellY, width: barWidth, height: cellHeight,
              highlighted: row === currentRow && col === currentCol,
              surface: !waterMatrix[row] || waterMatrix[row][col] !== 1,
              pending: phase !== 'complete' && (!waterMatrix[row] || waterMatrix[row][col] !== 1)
            });
          }
        }
        
        // 当前列指示器
        if (col === currentCol && phase === 'scanRow') {
          plot.append('polygon')
            .attr('points', `${barX + barWidth / 2 - 6},${height + 15} ${barX + barWidth / 2 + 6},${height + 15} ${barX + barWidth / 2},${height + 5}`)
            .attr('fill', '#ff7043');
        }
      }
      const reducedMotionForColumns = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? true;
      const terrainLayer = getPersistentTerrainLayer(svgElement, 'row-by-row', plotTransform);
      const columns: HeightColumn[] = heights.map((value, index) => ({
        id: `column-${index}`, index, value, x: xScale(index.toString())!, y: height,
        width: xScale.bandwidth(), height: height - yScale(value), stroke: '#333', strokeWidth: 0.5
      }));
      renderHeightColumns(terrainLayer, columns, motionDuration(speed, reducedMotionForColumns), reducedMotionForColumns);
      terrainLayer.raise();
      const waterLayer = getPersistentWaterLayer(svgElement, 'row-by-row', plotTransform);
      const pendingDuration = reducedMotion ? 0 : Math.max(80, motionDuration(speed, false) * 0.7);
      const visibleWater = phase === 'complete' ? waterCells.map(cell => ({ ...cell, pending: false })) : waterCells;
      renderWaterCells(waterLayer, visibleWater, pendingDuration, `rowByRow:${heights.join(',')}`, reducedMotion);

      // 索引标签
      if (heights.length <= 30) {
        heights.forEach((_, i) => {
          const barX = xScale(i.toString())!;
          const barWidth = xScale.bandwidth();
          
          plot.append('circle')
            .attr('cx', barX + barWidth / 2)
            .attr('cy', height + 25)
            .attr('r', 10)
            .attr('fill', i === currentCol ? '#ff7043' : 'rgba(80, 80, 80, 0.8)')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
          
          plot.append('text')
            .attr('x', barX + barWidth / 2)
            .attr('y', height + 29)
            .attr('text-anchor', 'middle')
            .attr('fill', i === currentCol ? 'white' : '#000')
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
        { color: '#5B9BD5', label: '已确认水', y: 14 },
        { color: '#7EC8E3', label: '当前层水', y: 28 },
        { color: '#ff7043', label: '当前位置', y: 42 }
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
      
      statePanel.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', 55)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', '#FF9800')
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
      
      // 根据宽度动态计算变量位置
      const varSpacing = Math.min(100, width / 6);
      const variables = [
        { label: '当前层', value: currentRow, color: '#FF9800', x: varSpacing * 0.5 },
        { label: '当前列', value: currentCol >= 0 ? currentCol : '-', color: '#ff7043', x: varSpacing * 1.5 },
        { label: '临时水量', value: tempSum, color: '#F57C00', x: varSpacing * 2.7 },
        { label: '本层水量', value: rowWater, color: '#4CAF50', x: varSpacing * 4 },
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
    }
  }, [heights, currentStep, dimensions, currentStepIndex, totalSteps, speed]);

  const handleSpeedChange = (newSpeed: number) => {
    onSpeedChange(newSpeed);
  };

  return (
    <div className="algorithm-visualizer row-by-row-visualizer" ref={containerRef}>
      <div className="algorithm-description-compact">
        <div className="description-header" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
          <h2>
            按行求法
            <span className="toggle-icon">{isDescriptionExpanded ? '▼' : '▶'}</span>
          </h2>
          <p className="brief-description">
            逐层计算每个高度层级的水量 | 时间O(m*n) 空间O(1)
          </p>
        </div>
        {isDescriptionExpanded && (
          <div className="detailed-description">
            <p><strong>💡 核心思想：</strong></p>
            <div style={{ fontSize: '0.75em', marginTop: '5px', marginBottom: '10px', lineHeight: '1.6' }}>
              把问题分解为：先求高度为1的水，再求高度为2的水，依次类推。
              <br />
              对于每一层，从左到右扫描，遇到高度≥当前层的柱子时开始计数，
              <br />
              遇到下一个高度≥当前层的柱子时确认水量。
            </div>
            
            <p><strong>算法步骤：</strong></p>
            <ol style={{ fontSize: '0.75em', marginTop: '3px', paddingLeft: '20px', lineHeight: '1.5' }}>
              <li><strong>找最大高度：</strong>确定需要遍历的层数</li>
              <li><strong>逐层遍历：</strong>从第1层到最大高度层</li>
              <li><strong>扫描每层：</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '2px' }}>
                  <li>遇到高度≥当前层 → 开始/确认计数</li>
                  <li>遇到高度&lt;当前层 → 临时水量+1</li>
                </ul>
              </li>
              <li><strong>累加水量：</strong>每层确认的水量累加到总水量</li>
            </ol>
            
            <p style={{ fontSize: '0.7em', marginTop: '8px', color: '#FFC107' }}>
              <strong>⏱ 时间复杂度：</strong>O(m*n) - m为最大高度，n为数组长度
              <br />
              <strong>💾 空间复杂度：</strong>O(1) - 只用了几个变量
              <br />
              <strong>⚠️ 注意：</strong>当最大高度很大时效率较低
            </p>
          </div>
        )}
      </div>
      <div className="visualization-wrapper shared-algorithm-workspace">
        {currentStep && <VisualizationTeachingLayer operation={rowOperation(currentStep.phase)} currentStep={currentStepIndex + 1} totalSteps={totalSteps} narration={currentStep.description} metrics={[{ label: '总水量', value: currentStep.totalWater }, { label: '当前层', value: currentStep.currentRow }, { label: '临时水量', value: currentStep.tempSum }]} />}
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

function rowOperation(phase: RowByRowStep['phase']): string {
  return ({ init: '准备分层扫描', scanRow: '扫描当前层', rowComplete: '确认本层积水', complete: '完成' } as Record<RowByRowStep['phase'], string>)[phase];
}

export default RowByRowVisualizer;
