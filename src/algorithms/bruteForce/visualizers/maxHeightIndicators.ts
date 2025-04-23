import * as d3 from 'd3';
import { BruteForceStep } from '../types';

/**
 * 渲染左右最大高度指示器
 */
export function renderMaxHeightIndicators(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  width: number
) {
  // 清除之前的标记
  svgContentGroup.selectAll('.max-indicator').remove();
  
  // 左侧最大值线
  if (currentStep.phase !== 'init' && currentStep.leftMax > 0) {
    renderLeftMaxHeight(svgContentGroup, currentStep, x, y, width);
  }
  
  // 右侧最大值线
  if (currentStep.phase !== 'init' && currentStep.phase !== 'scanLeftStart' && 
      currentStep.phase !== 'scanLeftUpdate' && currentStep.phase !== 'scanLeftComplete' && 
      currentStep.rightMax > 0) {
    renderRightMaxHeight(svgContentGroup, currentStep, x, y, width);
  }
}

/**
 * 渲染左侧最大高度
 */
function renderLeftMaxHeight(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  width: number
) {
  // 左侧最大高度背景
  svgContentGroup.append('rect')
    .attr('class', 'max-indicator left-max-bg')
    .attr('x', 0)
    .attr('y', y(currentStep.leftMax) - 15)
    .attr('width', 90)
    .attr('height', 20)
    .attr('fill', 'rgba(233, 30, 99, 0.1)')
    .attr('rx', 4);
    
  // 左侧最大值线
  svgContentGroup.append('line')
    .attr('class', 'max-indicator left-max-line')
    .attr('x1', 0)
    .attr('x2', (currentStep.position >= 0 ? (x(currentStep.position.toString()) || 0) : width))
    .attr('y1', y(currentStep.leftMax))
    .attr('y2', y(currentStep.leftMax))
    .attr('stroke', '#e91e63')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,3');
    
  // 左侧最大值标签
  svgContentGroup.append('text')
    .attr('class', 'max-indicator left-max-value')
    .attr('x', 5)
    .attr('y', y(currentStep.leftMax) - 5)
    .attr('text-anchor', 'start')
    .attr('fill', '#e91e63')
    .attr('font-size', '0.9em')
    .attr('font-weight', 'bold')
    .text(`左最大: ${currentStep.leftMax}`);
  
  // 添加左侧扫描范围指示器
  if (currentStep.position >= 0) {
    renderLeftScanRange(svgContentGroup, currentStep, x, y);
  }
}

/**
 * 渲染左侧扫描范围
 */
function renderLeftScanRange(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>
) {
  // 左侧扫描范围框
  svgContentGroup.append('rect')
    .attr('class', 'max-indicator left-scan-range')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', x(currentStep.position.toString()) || 0)
    .attr('height', y(0))
    .attr('fill', 'rgba(233, 30, 99, 0.05)')
    .attr('stroke', '#e91e63')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3');
    
  // "左侧扫描范围"文字
  svgContentGroup.append('text')
    .attr('class', 'max-indicator left-scan-text')
    .attr('x', (x(currentStep.position.toString()) || 0) / 2)
    .attr('y', y(0) - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '0.8em')
    .attr('fill', '#e91e63')
    .text('左侧扫描范围');
}

/**
 * 渲染右侧最大高度
 */
function renderRightMaxHeight(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  width: number
) {
  // 右侧最大高度背景
  svgContentGroup.append('rect')
    .attr('class', 'max-indicator right-max-bg')
    .attr('x', width - 90)
    .attr('y', y(currentStep.rightMax) - 15)
    .attr('width', 90)
    .attr('height', 20)
    .attr('fill', 'rgba(33, 150, 243, 0.1)')
    .attr('rx', 4);
    
  // 右侧最大值线
  svgContentGroup.append('line')
    .attr('class', 'max-indicator right-max-line')
    .attr('x1', (x(currentStep.position.toString()) || 0) + x.bandwidth())
    .attr('x2', width)
    .attr('y1', y(currentStep.rightMax))
    .attr('y2', y(currentStep.rightMax))
    .attr('stroke', '#2196f3')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,3');
    
  // 右侧最大值标签
  svgContentGroup.append('text')
    .attr('class', 'max-indicator right-max-value')
    .attr('x', width - 5)
    .attr('y', y(currentStep.rightMax) - 5)
    .attr('text-anchor', 'end')
    .attr('fill', '#2196f3')
    .attr('font-size', '0.9em')
    .attr('font-weight', 'bold')
    .text(`右最大: ${currentStep.rightMax}`);
    
  // 添加右侧扫描范围指示器
  if (currentStep.position >= 0) {
    renderRightScanRange(svgContentGroup, currentStep, x, y, width);
  }
}

/**
 * 渲染右侧扫描范围
 */
function renderRightScanRange(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  width: number
) {
  // 右侧扫描范围框
  svgContentGroup.append('rect')
    .attr('class', 'max-indicator right-scan-range')
    .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth())
    .attr('y', 0)
    .attr('width', width - ((x(currentStep.position.toString()) || 0) + x.bandwidth()))
    .attr('height', y(0))
    .attr('fill', 'rgba(33, 150, 243, 0.05)')
    .attr('stroke', '#2196f3')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3');
    
  // "右侧扫描范围"文字
  svgContentGroup.append('text')
    .attr('class', 'max-indicator right-scan-text')
    .attr('x', (x(currentStep.position.toString()) || 0) + x.bandwidth() + 
          (width - ((x(currentStep.position.toString()) || 0) + x.bandwidth())) / 2)
    .attr('y', y(0) - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '0.8em')
    .attr('fill', '#2196f3')
    .text('右侧扫描范围');
} 