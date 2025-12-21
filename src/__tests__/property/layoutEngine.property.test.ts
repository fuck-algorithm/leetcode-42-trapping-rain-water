/**
 * Property-Based Tests for Layout Engine
 * 
 * **Feature: advanced-canvas-visualization, Property 12: No Element Overlap**
 * **Validates: Requirements 8.1, 8.3, 8.4**
 * 
 * Tests that the layout engine correctly detects and resolves element overlaps.
 */

import fc from 'fast-check';
import { CanvasElement, BoundingBox } from '../../components/canvas/types';
import LayoutEngine, {
  expandBoundingBox,
  isPointInBox,
  calculateCenterDistance,
  DEFAULT_LAYOUT_CONFIG,
} from '../../components/canvas/layout/LayoutEngine';

// 配置：每个属性测试运行至少100次
const propertyConfig = {
  numRuns: 100,
  verbose: false,
};

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate arbitrary bounding box
 */
const arbitraryBoundingBox: fc.Arbitrary<BoundingBox> = fc.record({
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 1000 }),
  width: fc.integer({ min: 10, max: 200 }),
  height: fc.integer({ min: 10, max: 200 }),
});

/**
 * Generate arbitrary canvas element
 */
const arbitraryCanvasElement: fc.Arbitrary<CanvasElement> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('node', 'array-cell', 'stack-item', 'hashmap-entry', 'edge', 'tree-node', 'pointer'),
  position: fc.record({
    x: fc.integer({ min: 0, max: 800 }),
    y: fc.integer({ min: 0, max: 600 }),
  }),
  size: fc.record({
    width: fc.integer({ min: 20, max: 100 }),
    height: fc.integer({ min: 20, max: 100 }),
  }),
  data: fc.constant({}),
  highlighted: fc.boolean(),
  highlightColor: fc.option(fc.constant('#ff0000'), { nil: undefined }),
}) as fc.Arbitrary<CanvasElement>;

/**
 * Generate array of canvas elements
 */
const arbitraryCanvasElements = (minLength: number = 2, maxLength: number = 10): fc.Arbitrary<CanvasElement[]> =>
  fc.array(arbitraryCanvasElement, { minLength, maxLength });

/**
 * Generate two overlapping bounding boxes
 */
const arbitraryOverlappingBoxes: fc.Arbitrary<[BoundingBox, BoundingBox]> = 
  fc.tuple(
    fc.integer({ min: 0, max: 500 }),
    fc.integer({ min: 0, max: 500 }),
    fc.integer({ min: 50, max: 150 }),
    fc.integer({ min: 50, max: 150 }),
    fc.integer({ min: 10, max: 40 }), // overlap offset
    fc.integer({ min: 10, max: 40 }), // overlap offset
  ).map(([x, y, w, h, ox, oy]) => [
    { x, y, width: w, height: h },
    { x: x + w - ox, y: y + h - oy, width: w, height: h },
  ]);

/**
 * Generate two non-overlapping bounding boxes
 */
const arbitraryNonOverlappingBoxes: fc.Arbitrary<[BoundingBox, BoundingBox]> = 
  fc.tuple(
    fc.integer({ min: 0, max: 300 }),
    fc.integer({ min: 0, max: 300 }),
    fc.integer({ min: 50, max: 100 }),
    fc.integer({ min: 50, max: 100 }),
  ).map(([x, y, w, h]) => [
    { x, y, width: w, height: h },
    { x: x + w + 50, y: y + h + 50, width: w, height: h }, // Clearly separated
  ]);

// ============================================================================
// Property Tests - Bounding Box Operations
// ============================================================================

describe('Layout Engine - Bounding Box Properties', () => {
  const engine = new LayoutEngine();

  /**
   * **Feature: advanced-canvas-visualization, Property 12: No Element Overlap**
   * **Validates: Requirements 8.1**
   * 
   * boxesIntersect should be symmetric.
   */
  describe('Property 12.1: Intersection Symmetry', () => {
    it('should be symmetric - boxesIntersect(a, b) === boxesIntersect(b, a)', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          arbitraryBoundingBox,
          (box1, box2) => {
            return engine.boxesIntersect(box1, box2) === engine.boxesIntersect(box2, box1);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * A box should always intersect with itself.
   */
  describe('Self Intersection', () => {
    it('should always intersect with itself', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          (box) => {
            return engine.boxesIntersect(box, box);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Overlapping boxes should be detected.
   */
  describe('Overlapping Box Detection', () => {
    it('should detect overlapping boxes', () => {
      fc.assert(
        fc.property(
          arbitraryOverlappingBoxes,
          ([box1, box2]) => {
            return engine.boxesIntersect(box1, box2);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Non-overlapping boxes should not be detected as intersecting.
   */
  describe('Non-Overlapping Box Detection', () => {
    it('should not detect non-overlapping boxes as intersecting', () => {
      fc.assert(
        fc.property(
          arbitraryNonOverlappingBoxes,
          ([box1, box2]) => {
            return !engine.boxesIntersect(box1, box2);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Overlap area should be non-negative.
   */
  describe('Overlap Area Non-Negative', () => {
    it('should calculate non-negative overlap area', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          arbitraryBoundingBox,
          (box1, box2) => {
            return engine.calculateOverlapArea(box1, box2) >= 0;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Overlap area should be symmetric.
   */
  describe('Overlap Area Symmetry', () => {
    it('should be symmetric - calculateOverlapArea(a, b) === calculateOverlapArea(b, a)', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          arbitraryBoundingBox,
          (box1, box2) => {
            return engine.calculateOverlapArea(box1, box2) === engine.calculateOverlapArea(box2, box1);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Non-intersecting boxes should have zero overlap area.
   */
  describe('Zero Overlap for Non-Intersecting', () => {
    it('should have zero overlap area for non-intersecting boxes', () => {
      fc.assert(
        fc.property(
          arbitraryNonOverlappingBoxes,
          ([box1, box2]) => {
            return engine.calculateOverlapArea(box1, box2) === 0;
          }
        ),
        propertyConfig
      );
    });
  });
});

// ============================================================================
// Property Tests - Overlap Resolution
// ============================================================================

describe('Layout Engine - Overlap Resolution Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 12: No Element Overlap**
   * **Validates: Requirements 8.3**
   * 
   * After resolving overlaps, no elements should overlap.
   */
  describe('Property 12.2: Overlap Resolution Completeness', () => {
    it('should resolve all overlaps after calling resolveOverlaps', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(2, 8),
          (elements) => {
            const engine = new LayoutEngine({ maxIterations: 200 });
            const resolved = engine.resolveOverlaps(elements);
            
            // 检查解决后是否还有重叠
            return !engine.hasAnyOverlap(resolved);
          }
        ),
        { ...propertyConfig, numRuns: 50 } // 减少运行次数因为这个测试较慢
      );
    });
  });

  /**
   * Resolving overlaps should preserve element count.
   */
  describe('Element Count Preservation', () => {
    it('should preserve element count after resolving overlaps', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(1, 10),
          (elements) => {
            const engine = new LayoutEngine();
            const resolved = engine.resolveOverlaps(elements);
            
            return resolved.length === elements.length;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Resolving overlaps should preserve element IDs.
   */
  describe('Element ID Preservation', () => {
    it('should preserve element IDs after resolving overlaps', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(1, 10),
          (elements) => {
            const engine = new LayoutEngine();
            const resolved = engine.resolveOverlaps(elements);
            
            const originalIds = new Set(elements.map(e => e.id));
            const resolvedIds = new Set(resolved.map(e => e.id));
            
            // 所有原始 ID 应该保留
            for (const id of originalIds) {
              if (!resolvedIds.has(id)) {
                return false;
              }
            }
            
            return true;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Single element should not change after overlap resolution.
   */
  describe('Single Element Unchanged', () => {
    it('should not change single element position', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElement,
          (element) => {
            const engine = new LayoutEngine();
            const resolved = engine.resolveOverlaps([element]);
            
            return (
              resolved.length === 1 &&
              resolved[0].position.x === element.position.x &&
              resolved[0].position.y === element.position.y
            );
          }
        ),
        propertyConfig
      );
    });
  });
});

// ============================================================================
// Property Tests - Element Spreading
// ============================================================================

describe('Layout Engine - Element Spreading Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 12: No Element Overlap**
   * **Validates: Requirements 8.4**
   * 
   * After spreading, elements should be within canvas bounds.
   */
  describe('Property 12.3: Spread Within Bounds', () => {
    it('should keep elements within canvas bounds after spreading', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(1, 10),
          fc.integer({ min: 400, max: 1200 }),
          fc.integer({ min: 300, max: 900 }),
          (elements, canvasWidth, canvasHeight) => {
            const engine = new LayoutEngine();
            const spread = engine.spreadElements(elements, canvasWidth, canvasHeight);
            
            for (const element of spread) {
              const box = engine.getBoundingBox(element);
              
              // 元素应该在画布边界内（考虑边距）
              if (box.x < 0 || box.y < 0) {
                return false;
              }
              if (box.x + box.width > canvasWidth || box.y + box.height > canvasHeight) {
                return false;
              }
            }
            
            return true;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Spreading should preserve element count.
   */
  describe('Spread Element Count Preservation', () => {
    it('should preserve element count after spreading', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(1, 10),
          (elements) => {
            const engine = new LayoutEngine();
            const spread = engine.spreadElements(elements, 800, 600);
            
            return spread.length === elements.length;
          }
        ),
        propertyConfig
      );
    });
  });
});

// ============================================================================
// Property Tests - Total Bounding Box
// ============================================================================

describe('Layout Engine - Total Bounding Box Properties', () => {
  /**
   * Total bounding box should contain all elements.
   */
  describe('Total Bounding Box Containment', () => {
    it('should contain all elements', () => {
      fc.assert(
        fc.property(
          arbitraryCanvasElements(1, 10),
          (elements) => {
            const engine = new LayoutEngine();
            const totalBox = engine.calculateTotalBoundingBox(elements);
            
            if (!totalBox) {
              return elements.length === 0;
            }
            
            for (const element of elements) {
              const box = engine.getBoundingBox(element);
              
              // 每个元素应该在总边界框内
              if (box.x < totalBox.x || box.y < totalBox.y) {
                return false;
              }
              if (box.x + box.width > totalBox.x + totalBox.width) {
                return false;
              }
              if (box.y + box.height > totalBox.y + totalBox.height) {
                return false;
              }
            }
            
            return true;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Empty element list should return null total bounding box.
   */
  describe('Empty List Total Bounding Box', () => {
    it('should return null for empty element list', () => {
      const engine = new LayoutEngine();
      expect(engine.calculateTotalBoundingBox([])).toBeNull();
    });
  });
});

// ============================================================================
// Property Tests - Helper Functions
// ============================================================================

describe('Layout Engine - Helper Function Properties', () => {
  /**
   * expandBoundingBox should increase dimensions.
   */
  describe('Expand Bounding Box', () => {
    it('should increase dimensions by margin', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          fc.integer({ min: 1, max: 50 }),
          (box, margin) => {
            const expanded = expandBoundingBox(box, margin);
            
            return (
              expanded.width === box.width + 2 * margin &&
              expanded.height === box.height + 2 * margin &&
              expanded.x === box.x - margin &&
              expanded.y === box.y - margin
            );
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * isPointInBox should correctly identify points inside/outside.
   */
  describe('Point In Box', () => {
    it('should correctly identify center point as inside', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          (box) => {
            const center = {
              x: box.x + box.width / 2,
              y: box.y + box.height / 2,
            };
            
            return isPointInBox(center, box);
          }
        ),
        propertyConfig
      );
    });

    it('should correctly identify outside point', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          (box) => {
            const outside = {
              x: box.x + box.width + 100,
              y: box.y + box.height + 100,
            };
            
            return !isPointInBox(outside, box);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * calculateCenterDistance should be non-negative.
   */
  describe('Center Distance Non-Negative', () => {
    it('should calculate non-negative distance', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          arbitraryBoundingBox,
          (box1, box2) => {
            return calculateCenterDistance(box1, box2) >= 0;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * calculateCenterDistance should be symmetric.
   */
  describe('Center Distance Symmetry', () => {
    it('should be symmetric', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          arbitraryBoundingBox,
          (box1, box2) => {
            const d1 = calculateCenterDistance(box1, box2);
            const d2 = calculateCenterDistance(box2, box1);
            
            return Math.abs(d1 - d2) < 0.0001; // 浮点数比较
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Distance from box to itself should be zero.
   */
  describe('Self Distance Zero', () => {
    it('should have zero distance to itself', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          (box) => {
            return calculateCenterDistance(box, box) === 0;
          }
        ),
        propertyConfig
      );
    });
  });
});
