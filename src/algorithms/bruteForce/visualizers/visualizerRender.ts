import * as d3 from 'd3';
import { BruteForceStep } from '../types';
import { 
  renderScanIndicators, 
  renderMaxHeightIndicators, 
  renderCompareAndWaterCalculation,
  renderWater
} from './index';

/**
 * 渲染当前步骤的可视化效果
 */
export function renderVisualization(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  contentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  currentStep: BruteForceStep,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  heights: number[],
  width: number
) {
  // 渲染扫描指示器
  renderScanIndicators(contentGroup, currentStep, x, y, heights);
  
  // 渲染左右最大高度指示器
  renderMaxHeightIndicators(contentGroup, currentStep, x, y, width);
  
  // 渲染比较和水量计算指示器
  renderCompareAndWaterCalculation(contentGroup, currentStep, x, y, heights, width);
  
  // 渲染水的积累效果
  renderWater(contentGroup, currentStep, x, y, heights);
} 