import * as d3 from 'd3';
import { BruteForceStep } from '../types';
import { renderCompareArrows, renderWaterCalculation } from './comparisonArrows';

/**
 * 渲染比较和水量计算指示器
 */
export function renderCompareAndWaterCalculation(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  heights: number[],
  width: number
) {
  // 清除之前的指示器
  svgContentGroup.selectAll('.compare-indicator').remove();
  
  // 在比较阶段显示最小值线
  if (currentStep.phase === 'compare' || currentStep.phase === 'waterCalculation' || 
      currentStep.phase === 'waterFound') {
    const minHeight = Math.min(currentStep.leftMax, currentStep.rightMax);
    
    renderMinHeightLine(svgContentGroup, currentStep, x, y, width, minHeight);
      
    // 添加比较箭头
    if (currentStep.phase === 'compare') {
      renderCompareArrows(svgContentGroup, currentStep, x, y, width, minHeight);
      
      // 添加比较说明文字
      svgContentGroup.append('text')
        .attr('class', 'compare-indicator compare-text')
        .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2)
        .attr('y', y(0) / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#4caf50')
        .attr('font-weight', 'bold')
        .text(`比较左右最大值: min(${currentStep.leftMax}, ${currentStep.rightMax}) = ${minHeight}`);
    }
  }
  
  // 如果在水计算阶段，显示计算的箭头和详细说明
  if (currentStep.phase === 'waterCalculation') {
    const barHeight = heights[currentStep.position];
    const minHeight = Math.min(currentStep.leftMax, currentStep.rightMax);
    const waterLevel = Math.max(0, minHeight - barHeight);
    
    renderWaterCalculation(svgContentGroup, currentStep, x, y, heights);
    
    // 添加水量计算公式背景
    svgContentGroup.append('rect')
      .attr('class', 'compare-indicator calc-bg')
      .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2 - 100)
      .attr('y', (y(minHeight) + y(barHeight)) / 2 - 15)
      .attr('width', 200)
      .attr('height', 30)
      .attr('fill', 'white')
      .attr('opacity', 0.8)
      .attr('rx', 5);
    
    // 添加计算步骤说明
    svgContentGroup.append('text')
      .attr('class', 'compare-indicator calc-step')
      .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2)
      .attr('y', (y(minHeight) + y(barHeight)) / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4caf50')
      .attr('font-size', '1em')
      .attr('font-weight', 'bold')
      .text(`计算: ${minHeight} - ${barHeight} = ${waterLevel}`);
      
    // 添加解释说明
    const calcText = waterLevel > 0 
      ? `位置${currentStep.position}可以存储${waterLevel}单位的水` 
      : `位置${currentStep.position}不能存储水`;
      
    svgContentGroup.append('text')
      .attr('class', 'compare-indicator calc-explain')
      .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2)
      .attr('y', (y(minHeight) + y(barHeight)) / 2 + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', waterLevel > 0 ? '#2196f3' : '#f44336')
      .attr('font-size', '0.9em')
      .attr('font-weight', 'bold')
      .text(calcText);
  }
  
  // 如果找到水，添加更多指示
  if (currentStep.phase === 'waterFound') {
    renderWaterFoundIndicator(svgContentGroup, currentStep, x, y, heights);
  }
}

/**
 * 渲染最小高度线
 */
function renderMinHeightLine(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  width: number,
  minHeight: number
) {
  // 最小值线背景
  svgContentGroup.append('rect')
    .attr('class', 'compare-indicator min-height-bg')
    .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2 - 60)
    .attr('y', y(minHeight) - 15)
    .attr('width', 120)
    .attr('height', 20)
    .attr('fill', 'rgba(76, 175, 80, 0.1)')
    .attr('rx', 4);
  
  // 最小值线
  svgContentGroup.append('line')
    .attr('class', 'compare-indicator min-height-line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', y(minHeight))
    .attr('y2', y(minHeight))
    .attr('stroke', '#4caf50')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '3,2');
    
  // 最小值标签
  svgContentGroup.append('text')
    .attr('class', 'compare-indicator min-height-value')
    .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2)
    .attr('y', y(minHeight) - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#4caf50')
    .attr('font-size', '0.9em')
    .attr('font-weight', 'bold')
    .text(`取较小值: ${minHeight}`);
}

/**
 * 渲染水量发现指示器
 */
function renderWaterFoundIndicator(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  heights: number[]
) {
  const barHeight = heights[currentStep.position];
  const minHeight = Math.min(currentStep.leftMax, currentStep.rightMax);
  const waterLevel = Math.max(0, minHeight - barHeight);
  
  if (waterLevel > 0) {
    // 添加水箱效果
    svgContentGroup.append('rect')
      .attr('class', 'compare-indicator water-container')
      .attr('x', (x(currentStep.position.toString()) || 0))
      .attr('y', y(barHeight + waterLevel))
      .attr('width', x.bandwidth())
      .attr('height', y(barHeight) - y(barHeight + waterLevel))
      .attr('fill', 'none')
      .attr('stroke', '#03A9F4')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,1');
      
    // 添加水量标签背景
    svgContentGroup.append('rect')
      .attr('class', 'compare-indicator water-label-bg')
      .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2 - 50)
      .attr('y', y(barHeight + waterLevel / 2) - 10)
      .attr('width', 100)
      .attr('height', 20)
      .attr('fill', 'white')
      .attr('opacity', 0.7)
      .attr('rx', 4);
      
    // 添加水量标签
    svgContentGroup.append('text')
      .attr('class', 'compare-indicator water-label')
      .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2)
      .attr('y', y(barHeight + waterLevel / 2))
      .attr('text-anchor', 'middle')
      .attr('font-size', '0.9em')
      .attr('font-weight', 'bold')
      .attr('fill', '#03A9F4')
      .text(`积水: ${waterLevel}单位`);
  } else {
    // 添加无水提示
    svgContentGroup.append('text')
      .attr('class', 'compare-indicator no-water')
      .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2)
      .attr('y', y(barHeight) - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '0.9em')
      .attr('font-weight', 'bold')
      .attr('fill', '#f44336')
      .text('无法积水');
  }
} 