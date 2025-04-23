import * as d3 from 'd3';
import { BruteForceStep } from '../types';

/**
 * 渲染比较箭头
 */
export function renderCompareArrows(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  width: number,
  minHeight: number
) {
  // 左侧箭头 - 更粗更明显
  svgContentGroup.append('path')
    .attr('d', d3.line()([[5, y(currentStep.leftMax)], [(x(currentStep.position.toString()) || 0) + x.bandwidth() / 2 - 15, y(minHeight)]]))
    .attr('stroke', '#e91e63')
    .attr('stroke-width', 3)
    .attr('fill', 'none')
    .attr('marker-end', 'url(#arrow-left)');
    
  // 右侧箭头 - 更粗更明显
  svgContentGroup.append('path')
    .attr('d', d3.line()([[width - 5, y(currentStep.rightMax)], [(x(currentStep.position.toString()) || 0) + x.bandwidth() / 2 + 15, y(minHeight)]]))
    .attr('stroke', '#2196f3')
    .attr('stroke-width', 3)
    .attr('fill', 'none')
    .attr('marker-end', 'url(#arrow-right)');
    
  // 添加左侧箭头标记
  svgContentGroup.append('defs').append('marker')
    .attr('id', 'arrow-left')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#e91e63');
    
  // 添加右侧箭头标记
  svgContentGroup.append('defs').append('marker')
    .attr('id', 'arrow-right')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#2196f3');
  
  // 添加左侧最大值说明
  svgContentGroup.append('rect')
    .attr('x', 5)
    .attr('y', y(currentStep.leftMax) - 25)
    .attr('width', 90)
    .attr('height', 20)
    .attr('fill', 'white')
    .attr('stroke', '#e91e63')
    .attr('stroke-width', 1)
    .attr('rx', 4)
    .attr('opacity', 0.8);
    
  svgContentGroup.append('text')
    .attr('x', 50)
    .attr('y', y(currentStep.leftMax) - 12)
    .attr('text-anchor', 'middle')
    .attr('font-size', '0.8em')
    .attr('fill', '#e91e63')
    .attr('font-weight', 'bold')
    .text(`左最大: ${currentStep.leftMax}`);
    
  // 添加右侧最大值说明
  svgContentGroup.append('rect')
    .attr('x', width - 95)
    .attr('y', y(currentStep.rightMax) - 25)
    .attr('width', 90)
    .attr('height', 20)
    .attr('fill', 'white')
    .attr('stroke', '#2196f3')
    .attr('stroke-width', 1)
    .attr('rx', 4)
    .attr('opacity', 0.8);
    
  svgContentGroup.append('text')
    .attr('x', width - 50)
    .attr('y', y(currentStep.rightMax) - 12)
    .attr('text-anchor', 'middle')
    .attr('font-size', '0.8em')
    .attr('fill', '#2196f3')
    .attr('font-weight', 'bold')
    .text(`右最大: ${currentStep.rightMax}`);
}

/**
 * 渲染水量计算
 */
export function renderWaterCalculation(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  heights: number[]
) {
  const minHeight = Math.min(currentStep.leftMax, currentStep.rightMax);
  const waterLevel = Math.max(0, minHeight - heights[currentStep.position]);
  const barHeight = heights[currentStep.position];
  
  // 计算箭头 - 使用更鲜明的样式
  svgContentGroup.append('path')
    .attr('d', d3.line()([
      [(x(currentStep.position.toString()) || 0) + x.bandwidth() / 2, y(minHeight) + 5],
      [(x(currentStep.position.toString()) || 0) + x.bandwidth() / 2, y(barHeight) - 5]
    ]))
    .attr('stroke', '#4caf50')
    .attr('stroke-width', 3)
    .attr('stroke-dasharray', '5,3')
    .attr('fill', 'none')
    .attr('marker-end', 'url(#arrow-water)');
    
  // 添加测量线 - 更直观地显示水位高度
  svgContentGroup.append('line')
    .attr('x1', (x(currentStep.position.toString()) || 0) - 5)
    .attr('x2', (x(currentStep.position.toString()) || 0) - 5)
    .attr('y1', y(minHeight))
    .attr('y2', y(barHeight))
    .attr('stroke', '#4caf50')
    .attr('stroke-width', 2);
    
  svgContentGroup.append('line')
    .attr('x1', (x(currentStep.position.toString()) || 0) - 10)
    .attr('x2', (x(currentStep.position.toString()) || 0))
    .attr('y1', y(minHeight))
    .attr('y2', y(minHeight))
    .attr('stroke', '#4caf50')
    .attr('stroke-width', 1);
    
  svgContentGroup.append('line')
    .attr('x1', (x(currentStep.position.toString()) || 0) - 10)
    .attr('x2', (x(currentStep.position.toString()) || 0))
    .attr('y1', y(barHeight))
    .attr('y2', y(barHeight))
    .attr('stroke', '#4caf50')
    .attr('stroke-width', 1);
    
  // 添加水量计算公式背景 - 更明显的标识
  svgContentGroup.append('rect')
    .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() + 5)
    .attr('y', (y(minHeight) + y(barHeight)) / 2 - 15)
    .attr('width', 120)
    .attr('height', 30)
    .attr('fill', 'white')
    .attr('stroke', '#4caf50')
    .attr('stroke-width', 1)
    .attr('rx', 5);
    
  // 添加水量计算公式
  svgContentGroup.append('text')
    .attr('class', 'water-calc')
    .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() + 65)
    .attr('y', (y(minHeight) + y(barHeight)) / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', '#4caf50')
    .attr('font-size', '0.9em')
    .attr('font-weight', 'bold')
    .text(waterLevel > 0 ? `${minHeight} - ${barHeight} = ${waterLevel}` : '无积水');
    
  // 添加测量值
  svgContentGroup.append('text')
    .attr('x', (x(currentStep.position.toString()) || 0) - 15)
    .attr('y', (y(minHeight) + y(barHeight)) / 2)
    .attr('text-anchor', 'end')
    .attr('fill', '#4caf50')
    .attr('font-size', '0.8em')
    .attr('font-weight', 'bold')
    .text(`${Math.abs(minHeight - barHeight)}`);
    
  // 添加说明标签
  if (waterLevel > 0) {
    svgContentGroup.append('rect')
      .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2 - 50)
      .attr('y', y(barHeight) - 30)
      .attr('width', 100)
      .attr('height', 20)
      .attr('fill', 'rgba(0, 191, 255, 0.2)')
      .attr('stroke', '#03A9F4')
      .attr('stroke-width', 1)
      .attr('rx', 5);
      
    svgContentGroup.append('text')
      .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2)
      .attr('y', y(barHeight) - 17)
      .attr('text-anchor', 'middle')
      .attr('fill', '#03A9F4')
      .attr('font-size', '0.9em')
      .attr('font-weight', 'bold')
      .text(`可积水: ${waterLevel}单位`);
  }
    
  // 添加箭头标记
  svgContentGroup.append('defs').append('marker')
    .attr('id', 'arrow-water')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#4caf50');
} 