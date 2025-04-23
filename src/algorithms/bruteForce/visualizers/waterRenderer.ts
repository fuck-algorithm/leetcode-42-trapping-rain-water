import * as d3 from 'd3';
import { BruteForceStep } from '../types';
import { renderWaterRectangle, renderWaterLabel, renderWaterIndicator } from './waterElements';

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
        renderTotalWaterLabel(svgContentGroup, x, y, d3.max(heights) || 0, currentStep.totalWater);
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
        renderWaterAccumulation(svgContentGroup, currentStep);
      }
    }
  } catch (error) {
    console.error("渲染水时出错:", error);
  }
}

/**
 * 渲染总水量标签
 */
function renderTotalWaterLabel(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  maxHeight: number,
  totalWater: number
) {
  // 添加总水量背景
  svgContentGroup.append('rect')
    .attr('class', 'water-effect total-water-bg')
    .attr('x', x.range()[0] + (x.range()[1] - x.range()[0]) / 2 - 70)
    .attr('y', y(maxHeight) - 40)
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
    .attr('y', y(maxHeight) - 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .attr('fill', '#0277BD')
    .text(`总积水量: ${totalWater}单位`);
}

/**
 * 渲染水量累计指示
 */
function renderWaterAccumulation(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep
) {
  const currentPosition = currentStep.currentIndex || 0;
  // 使用非空断言，因为在调用本函数之前已经判断过waterLevel存在
  const currentWaterHeight = (currentStep.waterLevel as Record<number, number>)[currentPosition] || 0;
  
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