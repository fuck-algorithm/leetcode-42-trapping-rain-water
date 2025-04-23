import * as d3 from 'd3';
import { BruteForceStep } from '../types';

/**
 * 渲染水矩形
 */
export function renderWaterRectangle(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  index: number,
  barHeight: number,
  waterHeight: number,
  currentStep: BruteForceStep
) {
  try {
    const xPos = x(index.toString()) || 0;
    const barY = y(barHeight);
    const waterY = y(barHeight + waterHeight);
    const waterHeight_px = barY - waterY; // 实际像素高度
    
    // 防止高度为负值
    if (waterHeight_px <= 0) return;
    
    // 水的底部边缘
    svgContentGroup.append('line')
      .attr('class', 'water-effect water-bottom-line')
      .attr('x1', xPos)
      .attr('x2', xPos + x.bandwidth())
      .attr('y1', barY)
      .attr('y2', barY)
      .attr('stroke', '#03A9F4')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,1');
    
    // 水的顶部边缘
    svgContentGroup.append('line')
      .attr('class', 'water-effect water-top-line')
      .attr('x1', xPos)
      .attr('x2', xPos + x.bandwidth())
      .attr('y1', waterY)
      .attr('y2', waterY)
      .attr('stroke', '#03A9F4')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');
    
    // 绘制水的矩形 - 使用渐变色增强视觉效果
    const gradientId = `water-gradient-${index}`;
    
    // 创建渐变
    const gradient = svgContentGroup.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
      
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(3, 169, 244, 0.8)');
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(3, 169, 244, 0.5)');
    
    // 绘制水的矩形
    svgContentGroup.append('rect')
      .attr('class', 'water-effect water')
      .attr('x', xPos)
      .attr('y', waterY)
      .attr('width', x.bandwidth())
      .attr('height', waterHeight_px)
      .attr('fill', `url(#${gradientId})`)
      .attr('rx', 1)
      .attr('ry', 1)
      .attr('stroke', '#03A9F4')
      .attr('stroke-width', index === currentStep.currentIndex ? 1 : 0.5);
      
    // 波浪效果（水平线）- 增加更多线条
    if (waterHeight > 1 && waterHeight_px > 5) {
      renderWaterWaves(svgContentGroup, x, xPos, waterY, waterHeight_px);
    }
    
    // 高亮当前填充的水
    if (index === currentStep.currentIndex && currentStep.phase === 'waterFound') {
      svgContentGroup.append('rect')
        .attr('class', 'water-effect water-highlight')
        .attr('x', xPos)
        .attr('y', waterY)
        .attr('width', x.bandwidth())
        .attr('height', waterHeight_px)
        .attr('fill', 'none')
        .attr('stroke', '#FF9800')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,1');
    }
  } catch (error) {
    console.error("渲染水矩形时出错:", error);
  }
}

/**
 * 渲染水波浪效果
 */
function renderWaterWaves(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  xPos: number,
  waterY: number,
  waterHeight_px: number
) {
  const waveCount = Math.min(Math.floor(waterHeight_px / 3), 5);
  for (let w = 1; w <= waveCount; w++) {
    svgContentGroup.append('path')
      .attr('class', 'water-effect water-wave')
      .attr('d', `M${xPos + 2},${waterY + w * (waterHeight_px / (waveCount + 1))} 
                 Q${xPos + x.bandwidth()/4},${waterY + w * (waterHeight_px / (waveCount + 1)) - 2}
                 ${xPos + x.bandwidth()/2},${waterY + w * (waterHeight_px / (waveCount + 1))}
                 Q${xPos + x.bandwidth()*3/4},${waterY + w * (waterHeight_px / (waveCount + 1)) + 2}
                 ${xPos + x.bandwidth() - 2},${waterY + w * (waterHeight_px / (waveCount + 1))}`)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.7)')
      .attr('stroke-width', 1);
  }
}

/**
 * 渲染水量标签
 */
export function renderWaterLabel(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  index: number,
  barHeight: number,
  waterHeight: number,
  currentStep: BruteForceStep
) {
  try {
    const xPos = (x(index.toString()) || 0) + x.bandwidth() / 2;
    const yPos = y(barHeight + waterHeight / 2);
    const isCurrentPosition = index === currentStep.currentIndex;
    
    // 水量背景 - 提高可读性
    svgContentGroup.append('rect')
      .attr('class', 'water-effect water-label-bg')
      .attr('x', xPos - 10)
      .attr('y', yPos - 10)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', 'white')
      .attr('opacity', 0.7)
      .attr('rx', 10)
      .attr('ry', 10);
    
    // 添加水量标签
    svgContentGroup.append('text')
      .attr('class', 'water-effect water-label')
      .attr('x', xPos)
      .attr('y', yPos)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', isCurrentPosition ? '1em' : '0.8em')
      .attr('fill', isCurrentPosition ? '#0277BD' : '#03A9F4')
      .attr('font-weight', isCurrentPosition ? 'bold' : 'normal')
      .text(waterHeight);
  } catch (error) {
    console.error("渲染水标签时出错:", error);
  }
}

/**
 * 渲染当前水位指示器
 */
export function renderWaterIndicator(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  index: number,
  barHeight: number,
  waterHeight: number
) {
  try {
    const xPos = (x(index.toString()) || 0) + x.bandwidth() / 2;
    const yPos = y(barHeight + waterHeight);
    
    // 添加一个突出显示的箭头 - 更大更明显
    svgContentGroup.append('path')
      .attr('class', 'water-effect water-indicator-arrow')
      .attr('d', `M${xPos},${yPos - 20} L${xPos - 15},${yPos - 35} L${xPos + 15},${yPos - 35} Z`)
      .attr('fill', '#FF5722')
      .attr('stroke', '#E64A19')
      .attr('stroke-width', 1);
      
    // 添加文字背景
    svgContentGroup.append('rect')
      .attr('class', 'water-effect water-indicator-bg')
      .attr('x', xPos - 45)
      .attr('y', yPos - 55)
      .attr('width', 90)
      .attr('height', 20)
      .attr('fill', 'white')
      .attr('stroke', '#FF5722')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('opacity', 0.9);
      
    // 添加文字标签
    svgContentGroup.append('text')
      .attr('class', 'water-effect water-indicator-text')
      .attr('x', xPos)
      .attr('y', yPos - 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '0.9em')
      .attr('font-weight', 'bold')
      .attr('fill', '#FF5722')
      .text(`积水: ${waterHeight}单位`);
      
    // 添加连接线
    svgContentGroup.append('line')
      .attr('class', 'water-effect water-level-line')
      .attr('x1', 0)
      .attr('x2', x.range()[1])
      .attr('y1', yPos)
      .attr('y2', yPos)
      .attr('stroke', '#FF9800')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.7);
  } catch (error) {
    console.error("渲染水指示器时出错:", error);
  }
} 