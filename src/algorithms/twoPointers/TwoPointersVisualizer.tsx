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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  
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
      // 使用适度的动画增强可视化效果
      const transitionDuration = 300;
      
      // 设置尺寸，增加顶部空间显示变量状态，增加底部空间显示索引和箭头
      const controlsHeight = 120; // AnimationControls的高度 + 索引区域高度（50 + 70）
      const margin = { top: 80, right: 20, bottom: 30, left: 40 }; // 减小bottom margin，因为已经在controlsHeight中预留了空间
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom - controlsHeight;
      
      const { left, right, leftMax, rightMax, water, totalWater, currentFill, phase, decision, calculation } = currentStep;
      
      // Find the maximum height to set the scale
      const maxHeight = Math.max(...heights, ...water.map((w, i) => w + heights[i]));
      
      // 选择或创建SVG容器
      const svgElement = d3.select(d3Container.current);
      
      // 清空并重新创建
      svgElement.selectAll('*').remove();
      
      const svg = svgElement
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // 定义水的渐变效果 - 类似图片中的蓝色填充
      const defs = svg.append('defs');
      
      // 水的纯色填充（类似图片效果）
      const waterGradient = defs.append('linearGradient')
        .attr('id', 'waterGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      
      waterGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#5B9BD5')
        .attr('stop-opacity', 1);
      
      waterGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#5B9BD5')
        .attr('stop-opacity', 1);
      
      // 高亮水的渐变（当前填充的水）- 更明亮
      const highlightWaterGradient = defs.append('linearGradient')
        .attr('id', 'highlightWaterGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      
      highlightWaterGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#7EC8E3')
        .attr('stop-opacity', 1);
      
      highlightWaterGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#7EC8E3')
        .attr('stop-opacity', 1);
      
      // 添加水波纹滤镜效果
      const turbulence = defs.append('filter')
        .attr('id', 'waterTurbulence')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
      
      turbulence.append('feTurbulence')
        .attr('type', 'fractalNoise')
        .attr('baseFrequency', '0.01 0.03')
        .attr('numOctaves', '2')
        .attr('result', 'turbulence')
        .append('animate')
          .attr('attributeName', 'baseFrequency')
          .attr('dur', '20s')
          .attr('values', '0.01 0.03;0.02 0.04;0.01 0.03')
          .attr('repeatCount', 'indefinite');
      
      turbulence.append('feDisplacementMap')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'turbulence')
        .attr('scale', '2')
        .attr('xChannelSelector', 'R')
        .attr('yChannelSelector', 'G');
      
      // 柱子的渐变效果 - 黑色柱子
      const barGradient = defs.append('linearGradient')
        .attr('id', 'barGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      
      barGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'rgba(255, 255, 255, 0.15)');
      
      barGradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', 'rgba(0, 0, 0, 0)');
      
      barGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgba(0, 0, 0, 0.3)');
      
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
      // const xAxis = d3.axisBottom(xScale);
      // if (heights.length > 15) {
      //   xAxis.tickValues(
      //     xScale.domain().filter((_, i) => i % Math.ceil(heights.length / 10) === 0)
      //   );
      // }
      
      // X轴 - 保留用于后续索引绘制
      // const xAxisGroup = svg.append('g')
      //   .attr('class', 'x-axis')
      //   .attr('transform', `translate(0,${height})`);
      
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
      
      // Draw height bars with animation - 黑色柱子
      svg.selectAll('.bar-height')
        .data(heights)
        .enter()
        .append('rect')
        .attr('class', 'bar-height')
        .attr('x', (_, i) => xScale(i.toString())!)
        .attr('y', height) // 从底部开始
        .attr('width', xScale.bandwidth())
        .attr('height', 0) // 初始高度为0
        .attr('fill', '#1a1a1a') // 统一黑色柱子
        .attr('stroke', (_, i) => {
          if (i === left) return '#ff7043';
          if (i === right) return '#4caf50';
          return '#333';
        })
        .attr('stroke-width', (_, i) => {
          if (i === left || i === right) return 3;
          return 1;
        })
        .transition() // 添加过渡动画
        .duration(transitionDuration)
        .ease(d3.easeCubicOut)
        .attr('y', d => yScale(d))
        .attr('height', d => height - yScale(d));
      
      // 为柱子添加立体光影效果
      svg.selectAll('.bar-overlay')
        .data(heights)
        .enter()
        .append('rect')
        .attr('class', 'bar-overlay')
        .attr('x', (_, i) => xScale(i.toString())!)
        .attr('y', height)
        .attr('width', xScale.bandwidth())
        .attr('height', 0)
        .attr('fill', 'url(#barGradient)')
        .attr('pointer-events', 'none')
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeCubicOut)
        .attr('y', d => yScale(d))
        .attr('height', d => height - yScale(d));
      
      // 显示柱子高度值（小字体，始终显示）
      if (heights.length <= 30) {
        svg.selectAll('.bar-height-label')
          .data(heights)
          .enter()
          .append('text')
          .attr('class', 'bar-height-label')
          .attr('x', (_, i) => xScale(i.toString())! + xScale.bandwidth() / 2)
          .attr('y', d => yScale(d) - 3)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .style('font-size', heights.length > 15 ? '0.5em' : '0.65em')
          .style('opacity', 0) // 初始透明
          .text(d => d > 0 ? d : '')
          .transition()
          .duration(transitionDuration)
          .delay(transitionDuration * 0.5) // 延迟一半时间后开始淡入
          .style('opacity', 1);
      }
      
      // 绘制锯齿状水面（每个柱子上方单独显示水量）
      svg.selectAll('.bar-water')
        .data(water)
        .enter()
        .append('rect')
        .attr('class', 'bar-water')
        .attr('x', (_, i) => xScale(i.toString())!)
        .attr('y', (d, i) => yScale(heights[i])) // 从柱子顶部开始
        .attr('width', xScale.bandwidth())
        .attr('height', 0) // 初始高度为0
        .attr('fill', (_, i) => {
          // 当前正在填充的水使用高亮色
          if (currentFill && (
            (phase === 'moveLeft' && i === left) || 
            (phase === 'moveRight' && i === right)
          )) {
            return 'url(#highlightWaterGradient)';
          }
          // 已经填充的水使用普通蓝色
          return 'url(#waterGradient)';
        })
        .attr('stroke', 'none')
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeQuadInOut)
        .attr('y', (d, i) => yScale(heights[i] + d))
        .attr('height', d => d > 0 ? height - yScale(d) : 0);
      
      // 绘制辅助线（始终显示）with animation
      if (true) {
      const leftLineEndX = xScale(left.toString())! + xScale.bandwidth();
      const rightLineStartX = xScale(right.toString())!;
      
      // 绘制左侧最大值线 - 从左到右延伸
      svg.append('line')
        .attr('class', 'left-max-line')
        .attr('x1', 0)
        .attr('x2', 0) // 起始长度为0
        .attr('y1', yScale(leftMax))
        .attr('y2', yScale(leftMax))
        .attr('stroke', '#ff7043')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5')
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeLinear)
        .attr('x2', leftLineEndX);
      
      // 显示leftMax数值标签 - 淡入并缩放
      svg.append('text')
        .attr('class', 'left-max-label')
        .attr('x', 5)
        .attr('y', yScale(leftMax) - 5)
        .attr('fill', '#ff7043')
        .attr('font-weight', 'bold')
        .style('font-size', '0.8em')
        .style('text-shadow', '0 0 3px rgba(0,0,0,0.8)')
        .style('opacity', 0)
        .attr('transform', `translate(0, 0) scale(0.5)`)
        .text(`leftMax: ${leftMax}`)
        .transition()
        .duration(transitionDuration)
        .style('opacity', 1)
        .attr('transform', `translate(0, 0) scale(1)`);
      
      // 绘制右侧最大值线 - 从右到左延伸
      svg.append('line')
        .attr('class', 'right-max-line')
        .attr('x1', width)
        .attr('x2', width) // 起始长度为0
        .attr('y1', yScale(rightMax))
        .attr('y2', yScale(rightMax))
        .attr('stroke', '#4caf50')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5')
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeLinear)
        .attr('x2', rightLineStartX);
      
      // 显示rightMax数值标签 - 淡入并缩放
      svg.append('text')
        .attr('class', 'right-max-label')
        .attr('x', width - 5)
        .attr('y', yScale(rightMax) - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#4caf50')
        .attr('font-weight', 'bold')
        .style('font-size', '0.8em')
        .style('text-shadow', '0 0 3px rgba(0,0,0,0.8)')
        .style('opacity', 0)
        .attr('transform', `translate(${width - 5}, ${yScale(rightMax) - 5}) scale(0.5)`)
        .attr('transform-origin', 'right center')
        .text(`rightMax: ${rightMax}`)
        .transition()
        .duration(transitionDuration)
        .style('opacity', 1)
        .attr('transform', `translate(0, 0) scale(1)`);
      }
      
      // 移除底部L/R指针箭头和标签，避免被控制面板遮挡
      // 左右指针已通过索引圆圈的颜色区分（橙色=L左指针，绿色=R右指针）
      
      // 优化图例 - 更清晰的颜色说明（右上角）
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 95}, 10)`);
      
      // 图例背景
      legend.append('rect')
        .attr('x', -5)
        .attr('y', -5)
        .attr('width', 100)
        .attr('height', 65)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1)
        .attr('rx', 4);
      
      const legendItems = [
        { color: '#1a1a1a', label: '柱子', y: 0, stroke: '#333' },
        { color: '#ff7043', label: '左指针(L)', y: 14, isPointer: true },
        { color: '#4caf50', label: '右指针(R)', y: 28, isPointer: true },
        { color: '#5B9BD5', label: '雨水', y: 42 }
      ];
      
      legendItems.forEach((item: { color: string; label: string; y: number; stroke?: string; isPointer?: boolean }, index: number) => {
        const legendItem = legend.append('g')
          .attr('class', `legend-item-${index}`)
          .style('opacity', 0);
        
        legendItem.append('rect')
          .attr('y', item.y)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', item.color)
          .attr('stroke', item.stroke || (item.isPointer ? item.color : 'none'))
          .attr('stroke-width', item.stroke || item.isPointer ? 1 : 0);
        
        legendItem.append('text')
          .attr('x', 16)
          .attr('y', item.y + 9)
          .attr('fill', '#333')
          .style('font-size', '0.65em')
          .style('font-weight', '500')
          .text(item.label);
        
        // 逐项淡入动画
        legendItem.transition()
          .duration(transitionDuration * 0.4)
          .delay(transitionDuration * 0.8 + index * 80) // 延迟后逐项出现
          .ease(d3.easeQuadOut)
          .style('opacity', 1);
      });
      
      // 为每个柱子绘制索引 - 显示在柱子底部内侧，带动画效果
      heights.forEach((_, i) => {
        const barX = xScale(i.toString())!;
        const barWidth = xScale.bandwidth();
        // const barHeight = height - yScale(heights[i]);
        const isActivePointer = i === left || i === right;
        
        // 索引背景圆圈 - 显示在柱子底部向上15px处，带动画
        const circle = svg.append('circle')
          .attr('cx', barX + barWidth / 2)
          .attr('cy', height - 15)
          .attr('r', isActivePointer ? 8 : 11) // 初始半径
          .attr('fill', i === left ? '#ff7043' : i === right ? '#4caf50' : 'rgba(80, 80, 80, 0.8)')
          .attr('stroke', '#fff')
          .attr('stroke-width', isActivePointer ? 2 : 1.5)
          .style('opacity', 0.6);
        
        // 为活跃指针添加脉冲动画
        if (isActivePointer) {
          circle
            .transition()
            .duration(transitionDuration * 0.5)
            .attr('r', 13) // 放大
            .style('opacity', 1)
            .transition()
            .duration(transitionDuration * 0.5)
            .attr('r', 11); // 恢复
        } else {
          circle
            .transition()
            .duration(transitionDuration * 0.3)
            .style('opacity', 1);
        }
        
        // 索引数字 - 显示在圆圈内，带淡入动画
        svg.append('text')
          .attr('x', barX + barWidth / 2)
          .attr('y', height - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', i === left || i === right ? 'white' : '#000')
          .attr('font-weight', 'bold')
          .style('font-size', '0.75em')
          .style('opacity', 0)
          .text(i)
          .transition()
          .duration(transitionDuration * 0.3)
          .style('opacity', 1);
      });
      
      // 顶部变量状态面板
      const statePanel = svg.append('g')
        .attr('class', 'state-panel')
        .attr('transform', `translate(0, -65)`);
      
      // 背景框
      statePanel.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', 55)
        .attr('fill', 'rgba(30, 33, 40, 0.9)')
        .attr('stroke', '#4285f4')
        .attr('stroke-width', 2)
        .attr('rx', 5);
      
      // 标题（包含步骤信息）
      statePanel.append('text')
        .attr('x', width / 2)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .attr('fill', '#FFC107')
        .attr('font-weight', 'bold')
        .style('font-size', '1em')
        .text(`当前状态 | 步骤 ${currentStepIndex + 1}/${totalSteps}`);
      
      // 变量显示
      const variables = [
        { label: 'left', value: left, color: '#ff7043', x: 50 },
        { label: 'right', value: right, color: '#4caf50', x: 150 },
        { label: 'leftMax', value: leftMax, color: '#ff7043', x: 260 },
        { label: 'rightMax', value: rightMax, color: '#4caf50', x: 390 },
        { label: 'totalWater', value: totalWater, color: '#64b5f6', x: width - 120 }
      ];
      
      variables.forEach(v => {
        const varGroup = statePanel.append('g')
          .attr('transform', `translate(${v.x}, 35)`)
          .style('opacity', 0);
        
        varGroup.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('fill', '#aaa')
          .style('font-size', '0.75em')
          .text(`${v.label}:`);
        
        varGroup.append('text')
          .attr('x', 0)
          .attr('y', 13)
          .attr('fill', v.color)
          .attr('font-weight', 'bold')
          .style('font-size', '1.1em')
          .text(v.value);
        
        varGroup.transition()
          .duration(transitionDuration * 0.4)
          .delay(transitionDuration * 0.3)
          .style('opacity', 1);
      });
      
      // 当前填充提示（如果有）
      if (currentFill && currentFill > 0) {
        statePanel.append('text')
          .attr('x', width / 2)
          .attr('y', 48)
          .attr('text-anchor', 'middle')
          .attr('fill', '#2196F3')
          .attr('font-weight', 'bold')
          .style('font-size', '0.85em')
          .style('opacity', 0)
          .text(`🌊 当前填充: ${currentFill} 单位`)
          .transition()
          .duration(transitionDuration * 0.5)
          .delay(transitionDuration * 0.4)
          .style('opacity', 1);
      }
      
      // 步骤说明已移到顶部状态面板标题中，避免与底部索引/指针冲突
      
      // 决策逻辑框 - 显示比较过程（在图表中央偏上）
      if (decision && phase === 'compare') {
        const decisionPanel = svg.append('g')
          .attr('class', 'decision-panel')
          .attr('transform', `translate(${width / 2}, ${height / 2 - 80})`);
        
        // 背景框
        const panelWidth = 420;
        const panelHeight = 120;
        decisionPanel.append('rect')
          .attr('x', -panelWidth / 2)
          .attr('y', 0)
          .attr('width', panelWidth)
          .attr('height', panelHeight)
          .attr('fill', 'rgba(255, 152, 0, 0.95)')
          .attr('stroke', '#FF6F00')
          .attr('stroke-width', 3)
          .attr('rx', 10)
          .style('opacity', 0)
          .transition()
          .duration(transitionDuration * 0.6)
          .style('opacity', 1);
        
        // 标题
        decisionPanel.append('text')
          .attr('x', 0)
          .attr('y', 25)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('font-weight', 'bold')
          .style('font-size', '1.1em')
          .style('opacity', 0)
          .text('🔍 决策：比较左右指针的高度')
          .transition()
          .duration(transitionDuration * 0.6)
          .delay(transitionDuration * 0.3)
          .style('opacity', 1);
        
        // 比较内容
        const comparisonText = `height[${left}] = ${decision.leftHeight}  ${decision.comparison === 'left_smaller' || decision.comparison === 'equal' ? '≤' : '>'} height[${right}] = ${decision.rightHeight}`;
        decisionPanel.append('text')
          .attr('x', 0)
          .attr('y', 50)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .style('font-size', '1em')
          .style('opacity', 0)
          .text(comparisonText)
          .transition()
          .duration(transitionDuration * 0.6)
          .delay(transitionDuration * 0.4)
          .style('opacity', 1);
        
        // 决策箭头
        const arrowY = 70;
        decisionPanel.append('text')
          .attr('x', 0)
          .attr('y', arrowY)
          .attr('text-anchor', 'middle')
          .attr('fill', '#FFF59D')
          .style('font-size', '1.5em')
          .style('opacity', 0)
          .text('⬇')
          .transition()
          .duration(transitionDuration * 0.6)
          .delay(transitionDuration * 0.5)
          .style('opacity', 1);
        
        // 决策结果
        const action = decision.action === 'move_left' ? '👉 移动左指针' : '👈 移动右指针';
        decisionPanel.append('text')
          .attr('x', 0)
          .attr('y', 95)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('font-weight', 'bold')
          .style('font-size', '1.05em')
          .style('opacity', 0)
          .text(action)
          .transition()
          .duration(transitionDuration * 0.6)
          .delay(transitionDuration * 0.6)
          .style('opacity', 1);
        
        // 原因说明（小字）
        decisionPanel.append('text')
          .attr('x', 0)
          .attr('y', 112)
          .attr('text-anchor', 'middle')
          .attr('fill', '#FFF59D')
          .style('font-size', '0.7em')
          .style('opacity', 0)
          .text('(矮的一侧水量已确定，移动它不会错过水量)')
          .transition()
          .duration(transitionDuration * 0.6)
          .delay(transitionDuration * 0.7)
          .style('opacity', 1);
      }
      
      // 水量计算框 - 显示计算公式
      if (calculation && (phase === 'moveLeft' || phase === 'moveRight')) {
        const calcPanel = svg.append('g')
          .attr('class', 'calculation-panel')
          .attr('transform', `translate(${width / 2}, ${height / 2 - 50})`);
        
        // 背景框
        const panelWidth = 380;
        const panelHeight = 100;
        calcPanel.append('rect')
          .attr('x', -panelWidth / 2)
          .attr('y', 0)
          .attr('width', panelWidth)
          .attr('height', panelHeight)
          .attr('fill', 'rgba(33, 150, 243, 0.95)')
          .attr('stroke', '#1976D2')
          .attr('stroke-width', 3)
          .attr('rx', 10)
          .style('opacity', 0)
          .transition()
          .duration(transitionDuration * 0.6)
          .style('opacity', 1);
        
        // 标题
        calcPanel.append('text')
          .attr('x', 0)
          .attr('y', 25)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('font-weight', 'bold')
          .style('font-size', '1.05em')
          .style('opacity', 0)
          .text('💧 水量计算')
          .transition()
          .duration(transitionDuration * 0.6)
          .delay(transitionDuration * 0.3)
          .style('opacity', 1);
        
        // 计算公式
        const formulaText = `水量 = ${calculation.formula}`;
        calcPanel.append('text')
          .attr('x', 0)
          .attr('y', 50)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .style('font-size', '0.95em')
          .style('opacity', 0)
          .text(formulaText)
          .transition()
          .duration(transitionDuration * 0.6)
          .delay(transitionDuration * 0.4)
          .style('opacity', 1);
        
        // 计算结果
        const resultText = `= ${calculation.maxValue} - ${calculation.currentHeight} = ${calculation.waterAmount}`;
        calcPanel.append('text')
          .attr('x', 0)
          .attr('y', 75)
          .attr('text-anchor', 'middle')
          .attr('fill', '#B3E5FC')
          .attr('font-weight', 'bold')
          .style('font-size', '1.1em')
          .style('opacity', 0)
          .text(resultText)
          .transition()
          .duration(transitionDuration * 0.6)
          .delay(transitionDuration * 0.5)
          .style('opacity', 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heights, currentStep, dimensions]);

  // 语音播放功能
  useEffect(() => {
    if (!currentStep || !isSpeechEnabled) return;
    
    // 检查浏览器是否支持Web Speech API
    if (!('speechSynthesis' in window)) {
      console.warn('浏览器不支持语音合成功能');
      return;
    }

    const { description } = currentStep;
    if (!description) return;

    // 停止之前的语音
    window.speechSynthesis.cancel();

    // 创建新的语音实例
    const utterance = new SpeechSynthesisUtterance(description);
    utterance.lang = 'zh-CN'; // 设置中文
    utterance.rate = 1.0; // 语速
    utterance.pitch = 1.0; // 音调
    utterance.volume = 0.8; // 音量
    
    speechSynthRef.current = utterance;

    // 延迟一小段时间再播放，避免与动画冲突
    const timer = setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isSpeechEnabled, currentStepIndex, totalSteps]);

  // 清理函数：组件卸载时停止语音
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // 处理速度变化
  const handleSpeedChange = (newSpeed: number) => {
    onSpeedChange(newSpeed);
  };

  // 切换语音开关
  const toggleSpeech = () => {
    setIsSpeechEnabled(!isSpeechEnabled);
    if (isSpeechEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="algorithm-visualizer" ref={containerRef}>
      <div className="algorithm-description-compact">
        <div className="description-header" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
          <h2>
            双指针法
            <span className="toggle-icon">{isDescriptionExpanded ? '▼' : '▶'}</span>
          </h2>
          <p className="brief-description">
            双指针从两端向中间移动，维护左右最大高度 | 时间O(n) 空间O(1)
            <button 
              className="speech-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleSpeech();
              }}
              title={isSpeechEnabled ? '关闭语音' : '开启语音'}
            >
              {isSpeechEnabled ? '🔊' : '🔇'}
            </button>
          </p>
        </div>
        {isDescriptionExpanded && (
          <div className="detailed-description">
            <p><strong>💡 核心思想：</strong></p>
            <div style={{ fontSize: '0.75em', marginTop: '5px', marginBottom: '10px', lineHeight: '1.6' }}>
              为什么总是移动<strong>矮的一侧</strong>？因为水的高度由<strong>两侧较矮的柱子</strong>决定。
              <br />
              当左侧≤右侧时，左侧的水量已经确定（被左侧最高柱子限制），不会再被右侧影响。
              <br />
              反之亦然。所以移动矮的一侧不会漏掉任何水量！
            </div>
            
            <p><strong>算法步骤：</strong></p>
            <ol style={{ fontSize: '0.75em', marginTop: '3px', paddingLeft: '20px', lineHeight: '1.5' }}>
              <li><strong>初始化：</strong>左指针left=0，右指针right=n-1，记录两侧最大高度</li>
              <li><strong>比较：</strong>比较height[left]和height[right]，选择较矮的一侧</li>
              <li><strong>决策：</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '2px' }}>
                  <li>如果当前高度 &lt; 该侧max → 可以装水！水量 = max - 当前高度</li>
                  <li>如果当前高度 ≥ 该侧max → 不能装水，但更新max值</li>
                </ul>
              </li>
              <li><strong>移动：</strong>移动处理过的指针，重复2-3步直到left和right相遇</li>
            </ol>
            
            <p style={{ fontSize: '0.7em', marginTop: '8px', color: '#FFC107' }}>
              <strong>⏱ 时间复杂度：</strong>O(n) - 每个位置只访问一次
              <br />
              <strong>💾 空间复杂度：</strong>O(1) - 只用了几个变量
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

export default TwoPointersVisualizer; 