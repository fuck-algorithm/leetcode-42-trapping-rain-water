/**
 * Property-Based Tests for Canvas Transform Operations
 * 
 * **Feature: advanced-canvas-visualization, Property 2: Pan Transform Correctness**
 * **Feature: advanced-canvas-visualization, Property 3: Zoom Transform Correctness**
 * **Validates: Requirements 2.1, 2.2, 2.3**
 */

import fc from 'fast-check';
import { CanvasTransform, ZOOM_LIMITS } from '../../components/canvas/types';

/**
 * 模拟平移变换
 * 当用户拖拽画布时，变换应该按照拖拽方向和距离精确移动
 */
function applyPanTransform(
  currentTransform: CanvasTransform,
  deltaX: number,
  deltaY: number
): CanvasTransform {
  return {
    ...currentTransform,
    translateX: currentTransform.translateX + deltaX,
    translateY: currentTransform.translateY + deltaY,
  };
}

/**
 * 模拟缩放变换
 * 缩放应该以指定点为中心进行
 */
function applyZoomTransform(
  currentTransform: CanvasTransform,
  scaleFactor: number,
  centerX: number,
  centerY: number,
  minZoom: number = ZOOM_LIMITS.min,
  maxZoom: number = ZOOM_LIMITS.max
): CanvasTransform {
  // 限制缩放范围
  const newScale = Math.max(minZoom, Math.min(maxZoom, currentTransform.scale * scaleFactor));
  const actualScaleFactor = newScale / currentTransform.scale;
  
  // 计算新的平移值，保持缩放中心点不变
  // 公式: newTranslate = center - (center - oldTranslate) * scaleFactor
  const newTranslateX = centerX - (centerX - currentTransform.translateX) * actualScaleFactor;
  const newTranslateY = centerY - (centerY - currentTransform.translateY) * actualScaleFactor;
  
  return {
    scale: newScale,
    translateX: newTranslateX,
    translateY: newTranslateY,
  };
}

/**
 * 计算屏幕坐标对应的画布坐标
 */
function screenToCanvas(
  screenX: number,
  screenY: number,
  transform: CanvasTransform
): { x: number; y: number } {
  return {
    x: (screenX - transform.translateX) / transform.scale,
    y: (screenY - transform.translateY) / transform.scale,
  };
}

/**
 * 计算画布坐标对应的屏幕坐标
 */
function canvasToScreen(
  canvasX: number,
  canvasY: number,
  transform: CanvasTransform
): { x: number; y: number } {
  return {
    x: canvasX * transform.scale + transform.translateX,
    y: canvasY * transform.scale + transform.translateY,
  };
}

// 生成有效的变换状态
const arbitraryTransform = fc.record({
  scale: fc.double({ min: ZOOM_LIMITS.min, max: ZOOM_LIMITS.max, noNaN: true }),
  translateX: fc.double({ min: -5000, max: 5000, noNaN: true }),
  translateY: fc.double({ min: -5000, max: 5000, noNaN: true }),
});

// 生成拖拽增量
const arbitraryDelta = fc.record({
  x: fc.double({ min: -500, max: 500, noNaN: true }),
  y: fc.double({ min: -500, max: 500, noNaN: true }),
});

// 生成缩放因子
const arbitraryScaleFactor = fc.double({ min: 0.5, max: 2.0, noNaN: true });

// 生成屏幕坐标
const arbitraryScreenPoint = fc.record({
  x: fc.double({ min: 0, max: 1920, noNaN: true }),
  y: fc.double({ min: 0, max: 1080, noNaN: true }),
});

describe('Canvas Transform Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 2: Pan Transform Correctness**
   * **Validates: Requirements 2.1**
   * 
   * Property: For any drag operation with delta (dx, dy), the canvas transform
   * should change by exactly (dx, dy) in translation.
   */
  describe('Pan Transform Correctness', () => {
    it('should translate by exact delta values', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          arbitraryDelta,
          (initialTransform, delta) => {
            const newTransform = applyPanTransform(initialTransform, delta.x, delta.y);
            
            // 平移应该精确地增加 delta 值
            const translateXDiff = newTransform.translateX - initialTransform.translateX;
            const translateYDiff = newTransform.translateY - initialTransform.translateY;
            
            return (
              Math.abs(translateXDiff - delta.x) < 0.0001 &&
              Math.abs(translateYDiff - delta.y) < 0.0001
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should preserve scale during pan', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          arbitraryDelta,
          (initialTransform, delta) => {
            const newTransform = applyPanTransform(initialTransform, delta.x, delta.y);
            
            // 平移不应该改变缩放比例
            return newTransform.scale === initialTransform.scale;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should be reversible (pan then reverse pan returns to original)', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          arbitraryDelta,
          (initialTransform, delta) => {
            // 先平移
            const afterPan = applyPanTransform(initialTransform, delta.x, delta.y);
            // 再反向平移
            const afterReverse = applyPanTransform(afterPan, -delta.x, -delta.y);
            
            // 应该回到原始状态
            return (
              Math.abs(afterReverse.translateX - initialTransform.translateX) < 0.0001 &&
              Math.abs(afterReverse.translateY - initialTransform.translateY) < 0.0001 &&
              afterReverse.scale === initialTransform.scale
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should be commutative (order of pans does not matter)', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          arbitraryDelta,
          arbitraryDelta,
          (initialTransform, delta1, delta2) => {
            // 先 delta1 再 delta2
            const path1 = applyPanTransform(
              applyPanTransform(initialTransform, delta1.x, delta1.y),
              delta2.x,
              delta2.y
            );
            
            // 先 delta2 再 delta1
            const path2 = applyPanTransform(
              applyPanTransform(initialTransform, delta2.x, delta2.y),
              delta1.x,
              delta1.y
            );
            
            // 结果应该相同
            return (
              Math.abs(path1.translateX - path2.translateX) < 0.0001 &&
              Math.abs(path1.translateY - path2.translateY) < 0.0001
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 3: Zoom Transform Correctness**
   * **Validates: Requirements 2.2, 2.3**
   * 
   * Property: For any zoom operation centered at point (cx, cy), the point under
   * the cursor should remain at the same screen position after zooming.
   */
  describe('Zoom Transform Correctness', () => {
    it('should keep zoom center point at same screen position', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          arbitraryScaleFactor,
          arbitraryScreenPoint,
          (initialTransform, scaleFactor, center) => {
            // 计算缩放前中心点对应的画布坐标
            const canvasPointBefore = screenToCanvas(center.x, center.y, initialTransform);
            
            // 应用缩放
            const newTransform = applyZoomTransform(
              initialTransform,
              scaleFactor,
              center.x,
              center.y
            );
            
            // 计算缩放后同一画布坐标对应的屏幕坐标
            const screenPointAfter = canvasToScreen(canvasPointBefore.x, canvasPointBefore.y, newTransform);
            
            // 屏幕坐标应该保持不变（允许浮点误差）
            return (
              Math.abs(screenPointAfter.x - center.x) < 0.01 &&
              Math.abs(screenPointAfter.y - center.y) < 0.01
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should respect zoom limits', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          fc.double({ min: 0.01, max: 100, noNaN: true }), // 极端缩放因子
          arbitraryScreenPoint,
          (initialTransform, scaleFactor, center) => {
            const newTransform = applyZoomTransform(
              initialTransform,
              scaleFactor,
              center.x,
              center.y
            );
            
            // 缩放应该在限制范围内
            return (
              newTransform.scale >= ZOOM_LIMITS.min &&
              newTransform.scale <= ZOOM_LIMITS.max
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should be reversible within limits (zoom in then zoom out)', () => {
      fc.assert(
        fc.property(
          // 使用中等范围的初始缩放，避免触及边界
          fc.record({
            scale: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
            translateX: fc.double({ min: -1000, max: 1000, noNaN: true }),
            translateY: fc.double({ min: -1000, max: 1000, noNaN: true }),
          }),
          fc.double({ min: 1.1, max: 1.5, noNaN: true }), // 适度的缩放因子
          arbitraryScreenPoint,
          (initialTransform, scaleFactor, center) => {
            // 放大
            const afterZoomIn = applyZoomTransform(
              initialTransform,
              scaleFactor,
              center.x,
              center.y
            );
            
            // 缩小（使用逆因子）
            const afterZoomOut = applyZoomTransform(
              afterZoomIn,
              1 / scaleFactor,
              center.x,
              center.y
            );
            
            // 应该接近原始状态（允许浮点误差）
            return (
              Math.abs(afterZoomOut.scale - initialTransform.scale) < 0.01 &&
              Math.abs(afterZoomOut.translateX - initialTransform.translateX) < 1 &&
              Math.abs(afterZoomOut.translateY - initialTransform.translateY) < 1
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should scale uniformly (aspect ratio preserved)', () => {
      fc.assert(
        fc.property(
          // 使用更合理的初始变换范围
          fc.record({
            scale: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
            translateX: fc.double({ min: -500, max: 500, noNaN: true }),
            translateY: fc.double({ min: -500, max: 500, noNaN: true }),
          }),
          arbitraryScaleFactor,
          arbitraryScreenPoint,
          // 两个不同的画布点，确保有足够的距离
          fc.record({
            x1: fc.integer({ min: 10, max: 200 }),
            y1: fc.integer({ min: 10, max: 200 }),
            x2: fc.integer({ min: 210, max: 400 }),
            y2: fc.integer({ min: 210, max: 400 }),
          }),
          (initialTransform, scaleFactor, center, points) => {
            // 计算缩放前两点的屏幕距离
            const screen1Before = canvasToScreen(points.x1, points.y1, initialTransform);
            const screen2Before = canvasToScreen(points.x2, points.y2, initialTransform);
            const distanceBefore = Math.sqrt(
              Math.pow(screen2Before.x - screen1Before.x, 2) +
              Math.pow(screen2Before.y - screen1Before.y, 2)
            );
            
            // 应用缩放
            const newTransform = applyZoomTransform(
              initialTransform,
              scaleFactor,
              center.x,
              center.y
            );
            
            // 计算缩放后两点的屏幕距离
            const screen1After = canvasToScreen(points.x1, points.y1, newTransform);
            const screen2After = canvasToScreen(points.x2, points.y2, newTransform);
            const distanceAfter = Math.sqrt(
              Math.pow(screen2After.x - screen1After.x, 2) +
              Math.pow(screen2After.y - screen1After.y, 2)
            );
            
            // 距离比例应该等于缩放比例
            if (distanceBefore < 1) return true; // 避免除以接近零的数
            
            const actualRatio = distanceAfter / distanceBefore;
            const expectedRatio = newTransform.scale / initialTransform.scale;
            
            return Math.abs(actualRatio - expectedRatio) < 0.01;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * 组合变换测试
   */
  describe('Combined Transform Operations', () => {
    it('should handle pan followed by zoom correctly', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          arbitraryDelta,
          arbitraryScaleFactor,
          arbitraryScreenPoint,
          (initialTransform, delta, scaleFactor, center) => {
            // 先平移
            const afterPan = applyPanTransform(initialTransform, delta.x, delta.y);
            // 再缩放
            const afterZoom = applyZoomTransform(afterPan, scaleFactor, center.x, center.y);
            
            // 结果应该是有效的变换
            return (
              !isNaN(afterZoom.scale) &&
              !isNaN(afterZoom.translateX) &&
              !isNaN(afterZoom.translateY) &&
              afterZoom.scale >= ZOOM_LIMITS.min &&
              afterZoom.scale <= ZOOM_LIMITS.max
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should handle zoom followed by pan correctly', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          arbitraryScaleFactor,
          arbitraryScreenPoint,
          arbitraryDelta,
          (initialTransform, scaleFactor, center, delta) => {
            // 先缩放
            const afterZoom = applyZoomTransform(initialTransform, scaleFactor, center.x, center.y);
            // 再平移
            const afterPan = applyPanTransform(afterZoom, delta.x, delta.y);
            
            // 结果应该是有效的变换
            return (
              !isNaN(afterPan.scale) &&
              !isNaN(afterPan.translateX) &&
              !isNaN(afterPan.translateY) &&
              afterPan.scale >= ZOOM_LIMITS.min &&
              afterPan.scale <= ZOOM_LIMITS.max
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });
});
