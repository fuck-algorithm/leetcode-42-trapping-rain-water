import * as d3 from 'd3';
import { BruteForceStep } from '../types';

/**
 * 渲染左右扫描的指示器
 */
export function renderScanIndicators(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  heights: number[]
) {
  // 清除之前的扫描提示
  svgContentGroup.selectAll('.scan-indicator').remove();

  // 高亮当前处理的位置
  if (currentStep.position >= 0) {
    renderPositionHighlight(svgContentGroup, currentStep, x, y, heights);
  }
  
  // 如果在左侧扫描阶段和有扫描索引，显示当前扫描位置指示器
  if (
    (currentStep.phase === 'scanLeftUpdate' || 
     currentStep.phase === 'scanRightUpdate') && 
    typeof currentStep.scanIndex === 'number'
  ) {
    renderScanningPosition(svgContentGroup, currentStep, x, y, heights);
  }
  
  // 如果是完成阶段，添加总结文字
  if (currentStep.phase === 'complete') {
    renderCompletionMessage(svgContentGroup, currentStep, x, y);
  }
}

/**
 * 渲染当前位置高亮
 */
function renderPositionHighlight(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  heights: number[]
) {
  svgContentGroup.append('rect')
    .attr('class', 'scan-indicator current-position')
    .attr('x', x(currentStep.position.toString()) || 0)
    .attr('y', 0)
    .attr('width', x.bandwidth())
    .attr('height', y(0))
    .attr('fill', 'rgba(255, 193, 7, 0.2)')
    .attr('stroke', '#FF9800')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,3');
  
  // 添加当前位置标识文字
  svgContentGroup.append('text')
    .attr('class', 'scan-indicator position-label')
    .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', '#FF5722')
    .text(`当前位置: ${currentStep.position}`)
    .attr('background', 'white');

  // 添加高度标识文字
  svgContentGroup.append('text')
    .attr('class', 'scan-indicator height-label')
    .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() / 2)
    .attr('y', y(heights[currentStep.position]) - 5)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', '#FF5722')
    .text(`高度: ${heights[currentStep.position]}`);
}

/**
 * 渲染扫描位置
 */
function renderScanningPosition(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  heights: number[]
) {
  const scanIndex = currentStep.scanIndex!;
  const scanBarHeight = heights[scanIndex];
  
  // 高亮当前扫描的柱子
  svgContentGroup.append('rect')
    .attr('class', 'scan-indicator scanning-bar')
    .attr('x', x(scanIndex.toString()) || 0)
    .attr('y', y(scanBarHeight))
    .attr('width', x.bandwidth())
    .attr('height', y(0) - y(scanBarHeight))
    .attr('fill', 'rgba(139, 195, 74, 0.7)')
    .attr('rx', 2)
    .attr('ry', 2)
    .attr('stroke', '#4CAF50')
    .attr('stroke-width', 2);
    
  renderScanningArrow(svgContentGroup, x, y, scanIndex, scanBarHeight);
  renderScanningLabel(svgContentGroup, currentStep, x, y, scanIndex, scanBarHeight);
  renderScanningDirection(svgContentGroup, currentStep, x, y, scanIndex);
}

/**
 * 渲染扫描箭头
 */
function renderScanningArrow(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  scanIndex: number,
  scanBarHeight: number
) {
  // 添加扫描指示箭头 - 更大更明显
  svgContentGroup.append('path')
    .attr('class', 'scan-indicator scanning-arrow')
    .attr('d', `M${(x(scanIndex.toString()) || 0) + x.bandwidth() / 2},${y(scanBarHeight) - 25} 
                L${(x(scanIndex.toString()) || 0) + x.bandwidth() / 2 - 12},${y(scanBarHeight) - 10} 
                L${(x(scanIndex.toString()) || 0) + x.bandwidth() / 2 + 12},${y(scanBarHeight) - 10} Z`)
    .attr('fill', '#4caf50');
}

/**
 * 渲染扫描标签
 */
function renderScanningLabel(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  scanIndex: number,
  scanBarHeight: number
) {
  const scanText = currentStep.phase === 'scanLeftUpdate' ? 
    `扫描左侧: 位置${scanIndex}` : 
    `扫描右侧: 位置${scanIndex}`;
  
  // 文字背景
  svgContentGroup.append('rect')
    .attr('class', 'scan-indicator text-bg')
    .attr('x', (x(scanIndex.toString()) || 0) + x.bandwidth() / 2 - 50)
    .attr('y', y(scanBarHeight) - 45)
    .attr('width', 100)
    .attr('height', 20)
    .attr('fill', 'white')
    .attr('rx', 4)
    .attr('opacity', 0.8);
  
  // 文字
  svgContentGroup.append('text')
    .attr('class', 'scan-indicator scanning-text')
    .attr('x', (x(scanIndex.toString()) || 0) + x.bandwidth() / 2)
    .attr('y', y(scanBarHeight) - 30)
    .attr('text-anchor', 'middle')
    .attr('font-size', '0.8em')
    .attr('font-weight', 'bold')
    .attr('fill', '#4caf50')
    .text(scanText);
    
  // 添加高度值标签
  svgContentGroup.append('text')
    .attr('class', 'scan-indicator height-value')
    .attr('x', (x(scanIndex.toString()) || 0) + x.bandwidth() / 2)
    .attr('y', y(scanBarHeight) + 15)
    .attr('text-anchor', 'middle')
    .attr('font-size', '0.8em')
    .attr('font-weight', 'bold')
    .attr('fill', '#4caf50')
    .text(`高度: ${scanBarHeight}`);
}

/**
 * 渲染扫描方向
 */
function renderScanningDirection(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  scanIndex: number
) {
  // 添加箭头标记
  svgContentGroup.append('defs').append('marker')
    .attr('id', 'arrow-direction')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#4caf50');
    
  // 标记扫描方向
  if (currentStep.phase === 'scanLeftUpdate') {
    // 从左向右的扫描方向箭头
    svgContentGroup.append('path')
      .attr('class', 'scan-indicator direction-arrow')
      .attr('d', `M30,${y(0) - 20} L${(x(scanIndex.toString()) || 0)},${y(0) - 20}`)
      .attr('stroke', '#4caf50')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-direction)');
  } else {
    // 从右向左的扫描方向箭头
    svgContentGroup.append('path')
      .attr('class', 'scan-indicator direction-arrow')
      .attr('d', `M${x.range()[1]},${y(0) - 20} L${(x(scanIndex.toString()) || 0) + x.bandwidth()},${y(0) - 20}`)
      .attr('stroke', '#4caf50')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-direction)');
  }
}

/**
 * 渲染算法完成信息
 */
function renderCompletionMessage(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>
) {
  svgContentGroup.append('rect')
    .attr('class', 'scan-indicator completion-bg')
    .attr('x', x.range()[0] + (x.range()[1] - x.range()[0]) / 2 - 150)
    .attr('y', 20)
    .attr('width', 300)
    .attr('height', 30)
    .attr('fill', 'rgba(76, 175, 80, 0.1)')
    .attr('rx', 6)
    .attr('stroke', '#4CAF50')
    .attr('stroke-width', 2);
    
  svgContentGroup.append('text')
    .attr('class', 'scan-indicator completion-text')
    .attr('x', x.range()[0] + (x.range()[1] - x.range()[0]) / 2)
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr('fill', '#4CAF50')
    .text(`算法完成! 总雨水量: ${currentStep.totalWater}单位`);
} 