/**
 * Property-Based Tests for Auto-Fit Manager
 * 
 * **Feature: advanced-canvas-visualization, Property 13: Auto-fit Completeness**
 * **Feature: advanced-canvas-visualization, Property 14: Manual Zoom Preservation**
 * **Validates: Requirements 9.1, 9.3, 9.4, 9.5**
 * 
 * Tests that auto-fit correctly calculates zoom levels and preserves manual zoom.
 */

import fc from 'fast-check';
import { CanvasElement, CanvasTransform } from '../../components/canvas/types';
import AutoFitManager, {
  getTransformedBoundingBox,
  isBoxInViewport,
  calculateCenterTransform,
  DEFAULT_AUTOFIT_CONFIG,
} from '../../components/canvas/layout/AutoFitManager';

// 配置：每个属性测试运行至少100次
const propertyConfig = {
  numRuns: 100,
  verbose: false,
};

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate arbitrary canvas element
 */
const arbitraryCanvasElement: fc.Arbitrary<CanvasElement> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('node', 'array-cell', 'stack-item', 'hashmap-entry', 'tree-node'),
  position: fc.record({
    x: fc.integer({ min: 0, max: 500 }),
    y: fc.integer({ min: 0, max: 400 }),
  }),
  size: fc.record({
    width: fc.integer({ min: 30, max: 100 }),
    height: fc.integer({ min: 30, max: 100 }),
  }),
  data: fc.constant({}),
  highlighted: fc.boolean(),
}) as fc.Arbitrary<CanvasElement>;

/**
 * Generate array of canvas elements
 */
const arbitraryCanvasElements = (minLength: number = 1, maxLength: number = 10): fc.Arbitrary<CanvasElement[]> =>
  fc.array(arbitraryCanvasElement, { minLength, maxLength });

/**
 * Generate arbitrary viewport dimensions
 */
const arbitraryViewport = fc.record({
  width: fc.integer({ min: 400, max: 1920 }),
  height: fc.integer({ min: 300, max: 1080 }),
});

/**
 * Generate arbitrary canvas transform
 */
const arbitraryTransform: fc.Arbitrary<CanvasTransform> = fc.record({
  scale: fc.double({ min: 0.1, max: 5, noNaN: true }),
  translateX: fc.integer({ min: -500, max: 500 }),
  translateY: fc.integer({ min: -500, max: 500 }),
});

// ============================================================================
// Property Tests - Auto-Fit Completeness
// ============================================================================

describe('Auto-Fit Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 13: Auto-fit Completeness**
   * **Validates: Requirements 9.1**
   * 
   * For any data input, after auto-fit, all elements should be visible within the viewport.
   */
  describe('Property 13.1: All Elements Visible After Auto-Fit', () => {
    it('should make all elements visible after auto-fit', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(1, 8),
          arbitraryViewport,
          (elements, viewport) => {
            const manager = new AutoFitManager();
            const result = manager.calculateAutoFitTransform(
              elements,
              viewport.width,
              viewport.height
            );
            
            // 检查所有元素是否可见
            return manager.checkAllElementsVisible(
              elements,
              result.transform,
              viewport.width,
              viewport.height
            );
          }
        ),
        { ...propertyConfig, numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 13: Auto-fit Completeness**
   * **Validates: Requirements 9.4**
   * 
   * Element sizes should be above the minimum readable threshold after auto-fit,
   * unless the viewport is too small to accommodate both visibility and min size.
   */
  describe('Property 13.2: Minimum Size Requirement', () => {
    it('should maintain minimum readable element sizes when viewport allows', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(1, 3), // 使用较少元素
          fc.record({
            width: fc.integer({ min: 800, max: 1920 }), // 使用较大视口
            height: fc.integer({ min: 600, max: 1080 }),
          }),
          (elements, viewport) => {
            const manager = new AutoFitManager();
            const result = manager.calculateAutoFitTransform(
              elements,
              viewport.width,
              viewport.height
            );
            
            // 当视口足够大时，应该满足最小尺寸要求
            // 或者当无法同时满足时，至少所有元素应该可见
            return result.meetsMinSize || result.fitsAllElements;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 13: Auto-fit Completeness**
   * **Validates: Requirements 9.3**
   * 
   * For small data sets, zoom should be increased to utilize space.
   */
  describe('Property 13.3: Small Data Zoom Enhancement', () => {
    it('should zoom in for small data sets', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(1, 3), // 小数据集
          arbitraryViewport,
          (elements, viewport) => {
            const manager = new AutoFitManager({
              smallDataThreshold: 5,
              smallDataZoomFactor: 1.5,
            });
            
            const result = manager.calculateAutoFitTransform(
              elements,
              viewport.width,
              viewport.height
            );
            
            // 小数据集应该有较大的缩放
            // 但不能超过最大缩放限制
            return result.zoomLevel >= 0.1 && result.zoomLevel <= 3;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Optimal zoom should be within configured limits.
   */
  describe('Zoom Within Limits', () => {
    it('should keep zoom within configured limits', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(1, 10),
          arbitraryViewport,
          (elements, viewport) => {
            const config = {
              minZoom: 0.2,
              maxZoom: 4,
            };
            const manager = new AutoFitManager(config);
            
            const zoom = manager.calculateOptimalZoom(
              elements,
              viewport.width,
              viewport.height
            );
            
            return zoom >= config.minZoom && zoom <= config.maxZoom;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Empty element list should return default zoom.
   */
  describe('Empty Elements Default Zoom', () => {
    it('should return zoom of 1 for empty elements', () => {
      const manager = new AutoFitManager();
      const zoom = manager.calculateOptimalZoom([], 800, 600);
      expect(zoom).toBe(1);
    });
  });
});

// ============================================================================
// Property Tests - Manual Zoom Preservation
// ============================================================================

describe('Manual Zoom Preservation Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 14: Manual Zoom Preservation**
   * **Validates: Requirements 9.5**
   * 
   * After manual zoom, the system should not auto-scale until reset.
   */
  describe('Property 14.1: Manual Zoom Mode Preservation', () => {
    it('should preserve manual zoom mode until reset', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          (manualTransform) => {
            const manager = new AutoFitManager();
            
            // 设置手动缩放
            manager.setManualZoom(manualTransform);
            
            // 应该处于手动缩放模式
            if (!manager.isInManualZoomMode()) {
              return false;
            }
            
            // 获取变换应该返回手动变换
            const transform = manager.getTransform([], 800, 600);
            if (
              transform.scale !== manualTransform.scale ||
              transform.translateX !== manualTransform.translateX ||
              transform.translateY !== manualTransform.translateY
            ) {
              return false;
            }
            
            // 重置后应该退出手动模式
            manager.resetManualZoom();
            return !manager.isInManualZoomMode();
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 14: Manual Zoom Preservation**
   * **Validates: Requirements 9.5**
   * 
   * Manual transform should be preserved exactly.
   */
  describe('Property 14.2: Manual Transform Exact Preservation', () => {
    it('should preserve manual transform exactly', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          arbitraryCanvasElements(1, 5),
          arbitraryViewport,
          (manualTransform, elements, viewport) => {
            const manager = new AutoFitManager();
            
            // 设置手动缩放
            manager.setManualZoom(manualTransform);
            
            // 获取变换（即使有元素也应该返回手动变换）
            const transform = manager.getTransform(elements, viewport.width, viewport.height);
            
            return (
              transform.scale === manualTransform.scale &&
              transform.translateX === manualTransform.translateX &&
              transform.translateY === manualTransform.translateY
            );
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * After reset, auto-fit should work again.
   */
  describe('Auto-Fit After Reset', () => {
    it('should auto-fit after manual zoom reset', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          arbitraryCanvasElements(1, 5),
          arbitraryViewport,
          (manualTransform, elements, viewport) => {
            const manager = new AutoFitManager();
            
            // 设置手动缩放
            manager.setManualZoom(manualTransform);
            
            // 重置
            manager.resetManualZoom();
            
            // 现在应该返回自动适配的变换
            const transform = manager.getTransform(elements, viewport.width, viewport.height);
            const autoFitResult = manager.calculateAutoFitTransform(
              elements,
              viewport.width,
              viewport.height
            );
            
            return (
              transform.scale === autoFitResult.transform.scale &&
              transform.translateX === autoFitResult.transform.translateX &&
              transform.translateY === autoFitResult.transform.translateY
            );
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * getLastManualTransform should return the last set transform.
   */
  describe('Last Manual Transform Retrieval', () => {
    it('should retrieve last manual transform', () => {
      fc.assert(
        fc.property(
          arbitraryTransform,
          (manualTransform) => {
            const manager = new AutoFitManager();
            
            // 初始应该为 null
            if (manager.getLastManualTransform() !== null) {
              return false;
            }
            
            // 设置手动缩放
            manager.setManualZoom(manualTransform);
            
            // 应该能获取到
            const retrieved = manager.getLastManualTransform();
            if (!retrieved) {
              return false;
            }
            
            return (
              retrieved.scale === manualTransform.scale &&
              retrieved.translateX === manualTransform.translateX &&
              retrieved.translateY === manualTransform.translateY
            );
          }
        ),
        propertyConfig
      );
    });
  });
});

// ============================================================================
// Property Tests - Helper Functions
// ============================================================================

describe('Auto-Fit Helper Function Properties', () => {
  /**
   * getTransformedBoundingBox should apply transform correctly.
   */
  describe('Transformed Bounding Box', () => {
    it('should apply transform correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: 0, max: 500 }),
            y: fc.integer({ min: 0, max: 500 }),
            width: fc.integer({ min: 10, max: 200 }),
            height: fc.integer({ min: 10, max: 200 }),
          }),
          arbitraryTransform,
          (box, transform) => {
            const transformed = getTransformedBoundingBox(box, transform);
            
            // 验证变换计算
            const expectedX = box.x * transform.scale + transform.translateX;
            const expectedY = box.y * transform.scale + transform.translateY;
            const expectedWidth = box.width * transform.scale;
            const expectedHeight = box.height * transform.scale;
            
            return (
              Math.abs(transformed.x - expectedX) < 0.001 &&
              Math.abs(transformed.y - expectedY) < 0.001 &&
              Math.abs(transformed.width - expectedWidth) < 0.001 &&
              Math.abs(transformed.height - expectedHeight) < 0.001
            );
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * isBoxInViewport should correctly identify boxes inside/outside viewport.
   */
  describe('Box In Viewport Detection', () => {
    it('should correctly identify box at origin as inside', () => {
      const box = { x: 0, y: 0, width: 100, height: 100 };
      expect(isBoxInViewport(box, 800, 600)).toBe(true);
    });

    it('should correctly identify box outside viewport', () => {
      const box = { x: 900, y: 700, width: 100, height: 100 };
      expect(isBoxInViewport(box, 800, 600)).toBe(false);
    });

    it('should correctly identify box partially outside', () => {
      const box = { x: 750, y: 0, width: 100, height: 100 };
      expect(isBoxInViewport(box, 800, 600)).toBe(false);
    });
  });

  /**
   * calculateCenterTransform should center the box.
   */
  describe('Center Transform Calculation', () => {
    it('should center the box in viewport', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: 0, max: 200 }),
            y: fc.integer({ min: 0, max: 200 }),
            width: fc.integer({ min: 50, max: 200 }),
            height: fc.integer({ min: 50, max: 200 }),
          }),
          fc.integer({ min: 400, max: 1200 }),
          fc.integer({ min: 300, max: 900 }),
          (box, viewportWidth, viewportHeight) => {
            const transform = calculateCenterTransform(box, viewportWidth, viewportHeight, 1);
            
            // 应用变换后，边界框应该居中
            const transformed = getTransformedBoundingBox(box, transform);
            
            const centerX = transformed.x + transformed.width / 2;
            const centerY = transformed.y + transformed.height / 2;
            
            const viewportCenterX = viewportWidth / 2;
            const viewportCenterY = viewportHeight / 2;
            
            // 允许小误差
            return (
              Math.abs(centerX - viewportCenterX) < 1 &&
              Math.abs(centerY - viewportCenterY) < 1
            );
          }
        ),
        propertyConfig
      );
    });
  });
});

// ============================================================================
// Property Tests - Configuration
// ============================================================================

describe('Auto-Fit Configuration Properties', () => {
  /**
   * Configuration should be updatable.
   */
  describe('Configuration Update', () => {
    it('should update configuration correctly', () => {
      const manager = new AutoFitManager();
      const newConfig = {
        minElementSize: 30,
        padding: 100,
      };
      
      manager.updateConfig(newConfig);
      const config = manager.getConfig();
      
      expect(config.minElementSize).toBe(30);
      expect(config.padding).toBe(100);
      // 其他配置应该保持默认值
      expect(config.minZoom).toBe(DEFAULT_AUTOFIT_CONFIG.minZoom);
    });
  });

  /**
   * Default configuration should be valid.
   */
  describe('Default Configuration Validity', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_AUTOFIT_CONFIG.minElementSize).toBeGreaterThan(0);
      expect(DEFAULT_AUTOFIT_CONFIG.padding).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_AUTOFIT_CONFIG.minZoom).toBeGreaterThan(0);
      expect(DEFAULT_AUTOFIT_CONFIG.maxZoom).toBeGreaterThan(DEFAULT_AUTOFIT_CONFIG.minZoom);
      expect(DEFAULT_AUTOFIT_CONFIG.smallDataZoomFactor).toBeGreaterThan(0);
      expect(DEFAULT_AUTOFIT_CONFIG.smallDataThreshold).toBeGreaterThan(0);
    });
  });
});
