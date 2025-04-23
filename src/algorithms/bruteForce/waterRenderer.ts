import * as d3 from 'd3';
import { BruteForceStep } from './types';

/**
 * 渲染水的积累效果
 */
export function renderWater(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  heights: number[]
) {
  try {
    // 清除之前的水效果元素
    svgContentGroup.selectAll('.water-effect').remove();
    
    // 在"水找到"阶段逐步显示所有积水
    if ((currentStep.phase === 'waterFound' || currentStep.phase === 'complete') && currentStep.waterLevel) {
      console.log("渲染水，阶段:", currentStep.phase, "水高度:", currentStep.waterLevel);
      
      // 添加总水量标识
      if (currentStep.phase === 'complete') {
        // 添加总水量背景
        svgContentGroup.append('rect')
          .attr('class', 'water-effect total-water-bg')
          .attr('x', x.range()[0] + (x.range()[1] - x.range()[0]) / 2 - 70)
          .attr('y', y(d3.max(heights) || 0) - 40)
          .attr('width', 140)
          .attr('height', 30)
          .attr('fill', 'rgba(3, 169, 244, 0.2)')
          .attr('stroke', '#03A9F4')
          .attr('stroke-width', 2)
          .attr('rx', 6);
          
        // 添加总水量文字
        svgContentGroup.append('text')
          .attr('class', 'water-effect total-water-text')
          .attr('x', x.range()[0] + (x.range()[1] - x.range()[0]) / 2)
          .attr('y', y(d3.max(heights) || 0) - 20)
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('fill', '#0277BD')
          .text(`总积水量: ${currentStep.totalWater}单位`);
      }
      
      Object.entries(currentStep.waterLevel).forEach(([index, waterHeight]) => {
        const i = parseInt(index);
        
        // 只渲染到当前处理位置的水
        if (i <= (currentStep.currentIndex || heights.length - 1) && waterHeight > 0) {
          const barHeight = heights[i];
          
          // 绘制水
          renderWaterRectangle(svgContentGroup, x, y, i, barHeight, waterHeight, currentStep);
          
          // 添加水量标签
          renderWaterLabel(svgContentGroup, x, y, i, barHeight, waterHeight, currentStep);
          
          // 为当前位置添加指示
          if (i === currentStep.currentIndex && currentStep.phase === 'waterFound') {
            renderWaterIndicator(svgContentGroup, x, y, i, barHeight, waterHeight);
          }
        }
      });
      
      // 添加水量累计指示
      if (currentStep.totalWater > 0 && currentStep.phase === 'waterFound') {
        const currentPosition = currentStep.currentIndex || 0;
        const currentWaterHeight = currentStep.waterLevel[currentPosition] || 0;
        
        if (currentWaterHeight > 0) {
          // 添加水量累计背景
          svgContentGroup.append('rect')
            .attr('class', 'water-effect accumulated-water-bg')
            .attr('x', 10)
            .attr('y', 10)
            .attr('width', 150)
            .attr('height', 60)
            .attr('fill', 'rgba(3, 169, 244, 0.1)')
            .attr('stroke', '#03A9F4')
            .attr('stroke-width', 1)
            .attr('rx', 5);
            
          // 添加累计水量说明
          svgContentGroup.append('text')
            .attr('class', 'water-effect accumulated-title')
            .attr('x', 85)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', '#0277BD')
            .text('累计积水量');
            
          // 添加累计公式
          svgContentGroup.append('text')
            .attr('class', 'water-effect accumulated-formula')
            .attr('x', 85)
            .attr('y', 50)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', '#0277BD')
            .text(`${currentStep.totalWater - currentWaterHeight} + ${currentWaterHeight} = ${currentStep.totalWater}`);
        }
      }
    }
  } catch (error) {
    console.error("渲染水时出错:", error);
  }
}

/**
 * 渲染水矩形
 */
function renderWaterRectangle(
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
 * 渲染水量标签
 */
function renderWaterLabel(
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
function renderWaterIndicator(
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