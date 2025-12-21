/**
 * OverlapResolver
 * 
 * Detects and resolves overlapping bounding boxes.
 * Used for annotations, labels, and other canvas elements.
 * 
 * Requirements: 4.5, 4.6
 */

import { BoundingBox } from './types';

// 重叠检测结果
export interface OverlapResult {
  box1Index: number;
  box2Index: number;
  overlapArea: number;
  overlapBox: BoundingBox;
}

// 解决后的边界框
export interface ResolvedBox {
  originalIndex: number;
  originalBox: BoundingBox;
  resolvedBox: BoundingBox;
  wasAdjusted: boolean;
}

// 配置选项
export interface OverlapResolverConfig {
  minSpacing: number;        // 最小间距
  preferredSpacing: number;  // 首选间距
  maxIterations: number;     // 最大迭代次数
  stackDirection: 'vertical' | 'horizontal'; // 堆叠方向
}

const DEFAULT_CONFIG: OverlapResolverConfig = {
  minSpacing: 4,
  preferredSpacing: 8,
  maxIterations: 100,
  stackDirection: 'vertical',
};

/**
 * 检测两个边界框是否相交
 */
export function boxesIntersect(a: BoundingBox, b: BoundingBox, spacing: number = 0): boolean {
  return !(
    a.x + a.width + spacing <= b.x ||
    b.x + b.width + spacing <= a.x ||
    a.y + a.height + spacing <= b.y ||
    b.y + b.height + spacing <= a.y
  );
}

/**
 * 计算两个边界框的重叠区域
 */
export function calculateOverlapArea(a: BoundingBox, b: BoundingBox): number {
  const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return xOverlap * yOverlap;
}

/**
 * 计算重叠的边界框
 */
export function calculateOverlapBox(a: BoundingBox, b: BoundingBox): BoundingBox | null {
  if (!boxesIntersect(a, b)) return null;
  
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  
  return {
    x,
    y,
    width: x2 - x,
    height: y2 - y,
  };
}

/**
 * 检测所有重叠
 */
export function detectOverlaps(boxes: BoundingBox[], spacing: number = 0): OverlapResult[] {
  const overlaps: OverlapResult[] = [];
  
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxesIntersect(boxes[i], boxes[j], spacing)) {
        const overlapBox = calculateOverlapBox(boxes[i], boxes[j]);
        if (overlapBox) {
          overlaps.push({
            box1Index: i,
            box2Index: j,
            overlapArea: calculateOverlapArea(boxes[i], boxes[j]),
            overlapBox,
          });
        }
      }
    }
  }
  
  return overlaps;
}

/**
 * 解决重叠 - 垂直堆叠策略
 */
export function resolveOverlapsVertical(
  boxes: BoundingBox[],
  config: Partial<OverlapResolverConfig> = {}
): ResolvedBox[] {
  const { minSpacing, maxIterations } = { ...DEFAULT_CONFIG, ...config };
  
  // 复制边界框
  const resolvedBoxes: ResolvedBox[] = boxes.map((box, index) => ({
    originalIndex: index,
    originalBox: { ...box },
    resolvedBox: { ...box },
    wasAdjusted: false,
  }));
  
  // 按 Y 坐标排序
  resolvedBoxes.sort((a, b) => a.resolvedBox.y - b.resolvedBox.y);
  
  // 迭代解决重叠
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasOverlap = false;
    
    for (let i = 0; i < resolvedBoxes.length; i++) {
      for (let j = i + 1; j < resolvedBoxes.length; j++) {
        const boxA = resolvedBoxes[i].resolvedBox;
        const boxB = resolvedBoxes[j].resolvedBox;
        
        if (boxesIntersect(boxA, boxB, minSpacing)) {
          hasOverlap = true;
          
          // 将下方的框向下移动
          const overlap = boxA.y + boxA.height + minSpacing - boxB.y;
          if (overlap > 0) {
            resolvedBoxes[j].resolvedBox.y += overlap;
            resolvedBoxes[j].wasAdjusted = true;
          }
        }
      }
    }
    
    if (!hasOverlap) break;
  }
  
  // 恢复原始顺序
  resolvedBoxes.sort((a, b) => a.originalIndex - b.originalIndex);
  
  return resolvedBoxes;
}

/**
 * 解决重叠 - 水平堆叠策略
 */
export function resolveOverlapsHorizontal(
  boxes: BoundingBox[],
  config: Partial<OverlapResolverConfig> = {}
): ResolvedBox[] {
  const { minSpacing, maxIterations } = { ...DEFAULT_CONFIG, ...config };
  
  // 复制边界框
  const resolvedBoxes: ResolvedBox[] = boxes.map((box, index) => ({
    originalIndex: index,
    originalBox: { ...box },
    resolvedBox: { ...box },
    wasAdjusted: false,
  }));
  
  // 按 X 坐标排序
  resolvedBoxes.sort((a, b) => a.resolvedBox.x - b.resolvedBox.x);
  
  // 迭代解决重叠
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasOverlap = false;
    
    for (let i = 0; i < resolvedBoxes.length; i++) {
      for (let j = i + 1; j < resolvedBoxes.length; j++) {
        const boxA = resolvedBoxes[i].resolvedBox;
        const boxB = resolvedBoxes[j].resolvedBox;
        
        if (boxesIntersect(boxA, boxB, minSpacing)) {
          hasOverlap = true;
          
          // 将右边的框向右移动
          const overlap = boxA.x + boxA.width + minSpacing - boxB.x;
          if (overlap > 0) {
            resolvedBoxes[j].resolvedBox.x += overlap;
            resolvedBoxes[j].wasAdjusted = true;
          }
        }
      }
    }
    
    if (!hasOverlap) break;
  }
  
  // 恢复原始顺序
  resolvedBoxes.sort((a, b) => a.originalIndex - b.originalIndex);
  
  return resolvedBoxes;
}

/**
 * 解决重叠 - 自动选择策略
 */
export function resolveOverlaps(
  boxes: BoundingBox[],
  config: Partial<OverlapResolverConfig> = {}
): ResolvedBox[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (fullConfig.stackDirection === 'horizontal') {
    return resolveOverlapsHorizontal(boxes, config);
  }
  
  return resolveOverlapsVertical(boxes, config);
}

/**
 * 检查解决后是否还有重叠
 */
export function hasRemainingOverlaps(
  resolvedBoxes: ResolvedBox[],
  spacing: number = 0
): boolean {
  const boxes = resolvedBoxes.map(rb => rb.resolvedBox);
  return detectOverlaps(boxes, spacing).length > 0;
}

/**
 * 计算边界框的中心点
 */
export function getBoxCenter(box: BoundingBox): { x: number; y: number } {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

/**
 * 扩展边界框（添加边距）
 */
export function expandBox(box: BoundingBox, margin: number): BoundingBox {
  return {
    x: box.x - margin,
    y: box.y - margin,
    width: box.width + margin * 2,
    height: box.height + margin * 2,
  };
}

/**
 * 合并多个边界框为一个包含所有的边界框
 */
export function mergeBoxes(boxes: BoundingBox[]): BoundingBox | null {
  if (boxes.length === 0) return null;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  boxes.forEach(box => {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export default {
  boxesIntersect,
  calculateOverlapArea,
  calculateOverlapBox,
  detectOverlaps,
  resolveOverlaps,
  resolveOverlapsVertical,
  resolveOverlapsHorizontal,
  hasRemainingOverlaps,
  getBoxCenter,
  expandBox,
  mergeBoxes,
};
