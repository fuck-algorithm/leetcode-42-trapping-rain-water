import * as d3 from 'd3';
import { BruteForceStep } from './types';
import { renderCompareArrows, renderWaterCalculation } from './compareRender';

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
  
  // 如果在左侧扫描阶段和有扫描索引，显示当前扫描位置指示器
  if (
    (currentStep.phase === 'scanLeftUpdate' || 
     currentStep.phase === 'scanRightUpdate') && 
    typeof currentStep.scanIndex === 'number'
  ) {
    const scanIndex = currentStep.scanIndex;
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
      
    // 添加扫描指示箭头 - 更大更明显
    svgContentGroup.append('path')
      .attr('class', 'scan-indicator scanning-arrow')
      .attr('d', `M${(x(scanIndex.toString()) || 0) + x.bandwidth() / 2},${y(scanBarHeight) - 25} 
                  L${(x(scanIndex.toString()) || 0) + x.bandwidth() / 2 - 12},${y(scanBarHeight) - 10} 
                  L${(x(scanIndex.toString()) || 0) + x.bandwidth() / 2 + 12},${y(scanBarHeight) - 10} Z`)
      .attr('fill', '#4caf50');
      
    // 添加扫描标签 - 增加背景提高可读性
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
  }
  
  // 如果是完成阶段，添加总结文字
  if (currentStep.phase === 'complete') {
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
}

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
  }
  
  // 右侧最大值线
  if (currentStep.phase !== 'init' && currentStep.phase !== 'scanLeftStart' && 
      currentStep.phase !== 'scanLeftUpdate' && currentStep.phase !== 'scanLeftComplete' && 
      currentStep.rightMax > 0) {
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
  }
}

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
} 