/**
 * LayoutEngine
 * 
 * Smart layout engine for canvas elements.
 * Handles bounding box calculations, overlap detection, and resolution.
 * 
 * Requirements: 8.1, 8.5
 */

import { CanvasElement, BoundingBox } from '../types';

/**
 * 重叠检测结果
 */
export interface OverlapResult {
  element1Id: string;
  element2Id: string;
  overlapArea: number;
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  minSpacing: number;        // 最小间距
  preferredSpacing: number;  // 首选间距
  canvasMargin: number;      // 画布边距
  spreadFactor: number;      // 分散系数
  maxIterations: number;     // 最大迭代次数
}

/**
 * 默认布局配置
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  minSpacing: 10,
  preferredSpacing: 20,
  canvasMargin: 50,
  spreadFactor: 1.5,
  maxIterations: 100,
};

/**
 * 布局引擎类
 */
class LayoutEngine {
  private config: LayoutConfig;

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  }

  /**
   * 获取元素的边界框
   */
  getBoundingBox(element: CanvasElement): BoundingBox {
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
    };
  }

  /**
   * 检查两个边界框是否相交
   */
  boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.x + a.width <= b.x ||
      b.x + b.width <= a.x ||
      a.y + a.height <= b.y ||
      b.y + b.height <= a.y
    );
  }

  /**
   * 计算两个边界框的重叠面积
   */
  calculateOverlapArea(a: BoundingBox, b: BoundingBox): number {
    if (!this.boxesIntersect(a, b)) {
      return 0;
    }

    const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

    return Math.max(0, overlapX) * Math.max(0, overlapY);
  }

  /**
   * 检测所有元素之间的重叠
   */
  detectOverlaps(elements: CanvasElement[]): OverlapResult[] {
    const overlaps: OverlapResult[] = [];

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const box1 = this.getBoundingBox(elements[i]);
        const box2 = this.getBoundingBox(elements[j]);

        if (this.boxesIntersect(box1, box2)) {
          overlaps.push({
            element1Id: elements[i].id,
            element2Id: elements[j].id,
            overlapArea: this.calculateOverlapArea(box1, box2),
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * 检测边界框数组中的重叠
   */
  detectBoxOverlaps(boxes: BoundingBox[]): { index1: number; index2: number; area: number }[] {
    const overlaps: { index1: number; index2: number; area: number }[] = [];

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (this.boxesIntersect(boxes[i], boxes[j])) {
          overlaps.push({
            index1: i,
            index2: j,
            area: this.calculateOverlapArea(boxes[i], boxes[j]),
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * 计算元素布局位置
   */
  calculateLayout(elements: CanvasElement[]): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    // 初始化位置
    for (const element of elements) {
      positions.set(element.id, { ...element.position });
    }

    return positions;
  }

  /**
   * 解决元素重叠
   */
  resolveOverlaps(elements: CanvasElement[]): CanvasElement[] {
    if (elements.length <= 1) {
      return elements;
    }

    // 复制元素数组
    const result = elements.map(e => ({
      ...e,
      position: { ...e.position },
      size: { ...e.size },
    }));

    let iterations = 0;
    let hasOverlaps = true;

    while (hasOverlaps && iterations < this.config.maxIterations) {
      hasOverlaps = false;
      iterations++;

      for (let i = 0; i < result.length; i++) {
        for (let j = i + 1; j < result.length; j++) {
          const box1 = this.getBoundingBox(result[i]);
          const box2 = this.getBoundingBox(result[j]);

          if (this.boxesIntersect(box1, box2)) {
            hasOverlaps = true;
            this.separateElements(result[i], result[j]);
          }
        }
      }
    }

    return result;
  }

  /**
   * 分离两个重叠的元素
   */
  private separateElements(element1: CanvasElement, element2: CanvasElement): void {
    const box1 = this.getBoundingBox(element1);
    const box2 = this.getBoundingBox(element2);

    // 计算中心点
    const center1 = {
      x: box1.x + box1.width / 2,
      y: box1.y + box1.height / 2,
    };
    const center2 = {
      x: box2.x + box2.width / 2,
      y: box2.y + box2.height / 2,
    };

    // 计算分离方向
    let dx = center2.x - center1.x;
    let dy = center2.y - center1.y;

    // 如果中心点重合，使用随机方向
    if (dx === 0 && dy === 0) {
      dx = Math.random() - 0.5;
      dy = Math.random() - 0.5;
    }

    // 归一化方向向量
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;

    // 计算需要的分离距离
    const overlapX = Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x);
    const overlapY = Math.min(box1.y + box1.height, box2.y + box2.height) - Math.max(box1.y, box2.y);

    // 选择较小的重叠方向进行分离
    const separationDistance = Math.min(overlapX, overlapY) / 2 + this.config.minSpacing;

    // 移动两个元素
    element1.position.x -= dx * separationDistance;
    element1.position.y -= dy * separationDistance;
    element2.position.x += dx * separationDistance;
    element2.position.y += dy * separationDistance;
  }

  /**
   * 将元素分散到画布区域
   */
  spreadElements(
    elements: CanvasElement[],
    canvasWidth: number,
    canvasHeight: number
  ): CanvasElement[] {
    if (elements.length === 0) {
      return elements;
    }

    const result = elements.map(e => ({
      ...e,
      position: { ...e.position },
      size: { ...e.size },
    }));

    // 计算网格布局
    const cols = Math.ceil(Math.sqrt(elements.length));
    const rows = Math.ceil(elements.length / cols);

    const cellWidth = (canvasWidth - 2 * this.config.canvasMargin) / cols;
    const cellHeight = (canvasHeight - 2 * this.config.canvasMargin) / rows;

    for (let i = 0; i < result.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      result[i].position.x = this.config.canvasMargin + col * cellWidth + (cellWidth - result[i].size.width) / 2;
      result[i].position.y = this.config.canvasMargin + row * cellHeight + (cellHeight - result[i].size.height) / 2;
    }

    return result;
  }

  /**
   * 计算所有元素的总边界框
   */
  calculateTotalBoundingBox(elements: CanvasElement[]): BoundingBox | null {
    if (elements.length === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of elements) {
      const box = this.getBoundingBox(element);
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * 检查是否有任何重叠
   */
  hasAnyOverlap(elements: CanvasElement[]): boolean {
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const box1 = this.getBoundingBox(elements[i]);
        const box2 = this.getBoundingBox(elements[j]);

        if (this.boxesIntersect(box1, box2)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): LayoutConfig {
    return { ...this.config };
  }
}

export default LayoutEngine;

/**
 * 创建带有边距的边界框
 */
export function expandBoundingBox(box: BoundingBox, margin: number): BoundingBox {
  return {
    x: box.x - margin,
    y: box.y - margin,
    width: box.width + 2 * margin,
    height: box.height + 2 * margin,
  };
}

/**
 * 检查点是否在边界框内
 */
export function isPointInBox(point: { x: number; y: number }, box: BoundingBox): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

/**
 * 计算两个边界框中心点之间的距离
 */
export function calculateCenterDistance(box1: BoundingBox, box2: BoundingBox): number {
  const center1 = {
    x: box1.x + box1.width / 2,
    y: box1.y + box1.height / 2,
  };
  const center2 = {
    x: box2.x + box2.width / 2,
    y: box2.y + box2.height / 2,
  };

  const dx = center2.x - center1.x;
  const dy = center2.y - center1.y;

  return Math.sqrt(dx * dx + dy * dy);
}
