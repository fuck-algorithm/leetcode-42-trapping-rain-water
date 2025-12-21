/**
 * AutoFitManager
 * 
 * Manages automatic view fitting for canvas elements.
 * Calculates optimal zoom levels and handles manual zoom preservation.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { CanvasElement, BoundingBox, CanvasTransform } from '../types';
import LayoutEngine from './LayoutEngine';

/**
 * 自动适配配置
 */
export interface AutoFitConfig {
  minElementSize: number;      // 最小可读元素尺寸
  padding: number;             // 视口边距
  minZoom: number;             // 最小缩放比例
  maxZoom: number;             // 最大缩放比例
  smallDataZoomFactor: number; // 小数据放大系数
  smallDataThreshold: number;  // 小数据阈值（元素数量）
}

/**
 * 默认自动适配配置
 */
export const DEFAULT_AUTOFIT_CONFIG: AutoFitConfig = {
  minElementSize: 20,
  padding: 50,
  minZoom: 0.1,
  maxZoom: 3,
  smallDataZoomFactor: 1.5,
  smallDataThreshold: 5,
};

/**
 * 自动适配结果
 */
export interface AutoFitResult {
  transform: CanvasTransform;
  fitsAllElements: boolean;
  meetsMinSize: boolean;
  zoomLevel: number;
}

/**
 * 自动适配管理器
 */
class AutoFitManager {
  private config: AutoFitConfig;
  private layoutEngine: LayoutEngine;
  private isManualZoom: boolean = false;
  private lastManualTransform: CanvasTransform | null = null;

  constructor(config: Partial<AutoFitConfig> = {}) {
    this.config = { ...DEFAULT_AUTOFIT_CONFIG, ...config };
    this.layoutEngine = new LayoutEngine();
  }

  /**
   * 计算最优缩放比例以适配所有元素
   */
  calculateOptimalZoom(
    elements: CanvasElement[],
    viewportWidth: number,
    viewportHeight: number
  ): number {
    if (elements.length === 0) {
      return 1;
    }

    // 计算所有元素的总边界框
    const totalBounds = this.layoutEngine.calculateTotalBoundingBox(elements);
    if (!totalBounds) {
      return 1;
    }

    // 计算可用视口尺寸（减去边距）
    const availableWidth = viewportWidth - 2 * this.config.padding;
    const availableHeight = viewportHeight - 2 * this.config.padding;

    // 确保可用尺寸为正
    if (availableWidth <= 0 || availableHeight <= 0) {
      return this.config.minZoom;
    }

    // 计算缩放比例以适配所有元素
    const scaleX = availableWidth / totalBounds.width;
    const scaleY = availableHeight / totalBounds.height;
    let fitZoom = Math.min(scaleX, scaleY);

    // 应用缩放限制
    fitZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, fitZoom));

    // 检查最小元素尺寸
    const minElementDimension = this.getMinElementDimension(elements);
    let optimalZoom = fitZoom;
    
    if (minElementDimension * fitZoom < this.config.minElementSize) {
      // 需要放大以满足最小尺寸，但不能超过适配缩放
      const minSizeZoom = this.config.minElementSize / minElementDimension;
      // 取较小值以确保元素仍然可见
      optimalZoom = Math.min(minSizeZoom, fitZoom, this.config.maxZoom);
    }

    // 小数据放大 - 但不能超过适配缩放
    if (elements.length <= this.config.smallDataThreshold) {
      const smallDataZoom = Math.min(this.config.smallDataZoomFactor, fitZoom, this.config.maxZoom);
      optimalZoom = Math.max(optimalZoom, smallDataZoom);
      // 确保不超过适配缩放
      optimalZoom = Math.min(optimalZoom, fitZoom);
    }

    return optimalZoom;
  }

  /**
   * 计算自动适配变换
   */
  calculateAutoFitTransform(
    elements: CanvasElement[],
    viewportWidth: number,
    viewportHeight: number
  ): AutoFitResult {
    if (elements.length === 0) {
      return {
        transform: { scale: 1, translateX: 0, translateY: 0 },
        fitsAllElements: true,
        meetsMinSize: true,
        zoomLevel: 1,
      };
    }

    // 计算最优缩放
    const optimalZoom = this.calculateOptimalZoom(elements, viewportWidth, viewportHeight);

    // 计算总边界框
    const totalBounds = this.layoutEngine.calculateTotalBoundingBox(elements);
    if (!totalBounds) {
      return {
        transform: { scale: optimalZoom, translateX: 0, translateY: 0 },
        fitsAllElements: true,
        meetsMinSize: true,
        zoomLevel: optimalZoom,
      };
    }

    // 计算居中偏移
    const scaledWidth = totalBounds.width * optimalZoom;
    const scaledHeight = totalBounds.height * optimalZoom;
    
    const translateX = (viewportWidth - scaledWidth) / 2 - totalBounds.x * optimalZoom;
    const translateY = (viewportHeight - scaledHeight) / 2 - totalBounds.y * optimalZoom;

    // 检查是否所有元素都可见
    const fitsAllElements = this.checkAllElementsVisible(
      elements,
      { scale: optimalZoom, translateX, translateY },
      viewportWidth,
      viewportHeight
    );

    // 检查是否满足最小尺寸
    const meetsMinSize = this.checkMinSizeRequirement(elements, optimalZoom);

    return {
      transform: { scale: optimalZoom, translateX, translateY },
      fitsAllElements,
      meetsMinSize,
      zoomLevel: optimalZoom,
    };
  }

  /**
   * 检查所有元素是否在视口内可见
   */
  checkAllElementsVisible(
    elements: CanvasElement[],
    transform: CanvasTransform,
    viewportWidth: number,
    viewportHeight: number
  ): boolean {
    for (const element of elements) {
      const box = this.layoutEngine.getBoundingBox(element);
      
      // 应用变换
      const transformedX = box.x * transform.scale + transform.translateX;
      const transformedY = box.y * transform.scale + transform.translateY;
      const transformedWidth = box.width * transform.scale;
      const transformedHeight = box.height * transform.scale;

      // 检查是否在视口内
      if (
        transformedX < 0 ||
        transformedY < 0 ||
        transformedX + transformedWidth > viewportWidth ||
        transformedY + transformedHeight > viewportHeight
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * 检查是否满足最小尺寸要求
   */
  checkMinSizeRequirement(elements: CanvasElement[], zoom: number): boolean {
    for (const element of elements) {
      const scaledWidth = element.size.width * zoom;
      const scaledHeight = element.size.height * zoom;
      
      if (scaledWidth < this.config.minElementSize || scaledHeight < this.config.minElementSize) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取最小元素尺寸
   */
  private getMinElementDimension(elements: CanvasElement[]): number {
    let minDimension = Infinity;
    
    for (const element of elements) {
      minDimension = Math.min(minDimension, element.size.width, element.size.height);
    }
    
    return minDimension === Infinity ? 1 : minDimension;
  }

  /**
   * 标记为手动缩放
   */
  setManualZoom(transform: CanvasTransform): void {
    this.isManualZoom = true;
    this.lastManualTransform = { ...transform };
  }

  /**
   * 重置手动缩放状态
   */
  resetManualZoom(): void {
    this.isManualZoom = false;
    this.lastManualTransform = null;
  }

  /**
   * 检查是否处于手动缩放状态
   */
  isInManualZoomMode(): boolean {
    return this.isManualZoom;
  }

  /**
   * 获取最后的手动变换
   */
  getLastManualTransform(): CanvasTransform | null {
    return this.lastManualTransform ? { ...this.lastManualTransform } : null;
  }

  /**
   * 获取自动适配变换（考虑手动缩放状态）
   */
  getTransform(
    elements: CanvasElement[],
    viewportWidth: number,
    viewportHeight: number
  ): CanvasTransform {
    // 如果处于手动缩放模式，返回最后的手动变换
    if (this.isManualZoom && this.lastManualTransform) {
      return { ...this.lastManualTransform };
    }

    // 否则计算自动适配变换
    const result = this.calculateAutoFitTransform(elements, viewportWidth, viewportHeight);
    return result.transform;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AutoFitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): AutoFitConfig {
    return { ...this.config };
  }
}

export default AutoFitManager;

/**
 * 计算元素在变换后的边界框
 */
export function getTransformedBoundingBox(
  box: BoundingBox,
  transform: CanvasTransform
): BoundingBox {
  return {
    x: box.x * transform.scale + transform.translateX,
    y: box.y * transform.scale + transform.translateY,
    width: box.width * transform.scale,
    height: box.height * transform.scale,
  };
}

/**
 * 检查变换后的边界框是否在视口内
 */
export function isBoxInViewport(
  box: BoundingBox,
  viewportWidth: number,
  viewportHeight: number
): boolean {
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewportWidth &&
    box.y + box.height <= viewportHeight
  );
}

/**
 * 计算使边界框居中的变换
 */
export function calculateCenterTransform(
  box: BoundingBox,
  viewportWidth: number,
  viewportHeight: number,
  scale: number = 1
): CanvasTransform {
  const scaledWidth = box.width * scale;
  const scaledHeight = box.height * scale;
  
  return {
    scale,
    translateX: (viewportWidth - scaledWidth) / 2 - box.x * scale,
    translateY: (viewportHeight - scaledHeight) / 2 - box.y * scale,
  };
}
