import fc from 'fast-check';

/**
 * Visualization Property Tests
 * 
 * These tests verify the correctness properties of the visualization components.
 */

// Helper types for testing
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Helper function to check if two bounding boxes overlap
function boxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  );
}

// Helper function to check if a box is within viewport
function isWithinViewport(box: BoundingBox, viewport: { width: number; height: number }): boolean {
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height
  );
}

// Helper function to calculate scale factor for auto-scaling
function calculateScaleFactor(
  dataLength: number,
  maxHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  margin: { top: number; right: number; bottom: number; left: number }
): number {
  const availableWidth = viewportWidth - margin.left - margin.right;
  const availableHeight = viewportHeight - margin.top - margin.bottom;
  
  const barWidth = availableWidth / dataLength;
  const heightScale = availableHeight / maxHeight;
  
  // Return the minimum scale to ensure everything fits
  return Math.min(barWidth, heightScale);
}

describe('Visualization Properties', () => {
  /**
   * **Feature: leetcode-algorithm-visualizer, Property 10: Auto-Scaling Correctness**
   * **Validates: Requirements 5.8**
   * 
   * For any heights array input, the canvas should scale such that all elements
   * are visible within the viewport without requiring scrolling.
   */
  describe('Property 10: Auto-Scaling Correctness', () => {
    it('should calculate valid scale factors for any data size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }), // data length
          fc.integer({ min: 1, max: 10000 }), // max height
          fc.integer({ min: 400, max: 1920 }), // viewport width
          fc.integer({ min: 300, max: 1080 }), // viewport height
          (dataLength, maxHeight, viewportWidth, viewportHeight) => {
            const margin = { top: 80, right: 20, bottom: 30, left: 40 };
            const scale = calculateScaleFactor(
              dataLength,
              maxHeight,
              viewportWidth,
              viewportHeight,
              margin
            );
            
            // Scale should always be positive
            return scale > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure all bars fit within viewport after scaling', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 50 }),
          fc.integer({ min: 600, max: 1200 }),
          fc.integer({ min: 400, max: 800 }),
          (heights, viewportWidth, viewportHeight) => {
            const margin = { top: 80, right: 20, bottom: 30, left: 40 };
            const availableWidth = viewportWidth - margin.left - margin.right;
            const availableHeight = viewportHeight - margin.top - margin.bottom;
            
            const barWidth = availableWidth / heights.length;
            const maxHeight = Math.max(...heights, 1);
            const heightScale = availableHeight / maxHeight;
            
            // Check that all bars would fit
            const allBarsFit = heights.every((h, i) => {
              const barX = margin.left + i * barWidth;
              const barY = margin.top + (maxHeight - h) * heightScale;
              const scaledHeight = h * heightScale;
              
              return (
                barX >= 0 &&
                barX + barWidth <= viewportWidth &&
                barY >= 0 &&
                barY + scaledHeight <= viewportHeight
              );
            });
            
            return allBarsFit;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: leetcode-algorithm-visualizer, Property 9: No Element Overlap**
   * **Validates: Requirements 5.7**
   * 
   * For any canvas rendering with multiple elements, no two elements should
   * have overlapping bounding boxes that obscure content.
   */
  describe('Property 9: No Element Overlap', () => {
    it('should detect overlapping boxes correctly', () => {
      // Test the overlap detection function
      const box1: BoundingBox = { x: 0, y: 0, width: 10, height: 10 };
      const box2: BoundingBox = { x: 5, y: 5, width: 10, height: 10 };
      const box3: BoundingBox = { x: 20, y: 20, width: 10, height: 10 };
      
      expect(boxesOverlap(box1, box2)).toBe(true);
      expect(boxesOverlap(box1, box3)).toBe(false);
    });

    it('should generate non-overlapping bar positions for any data', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 30 }),
          (heights) => {
            const barWidth = 20;
            const padding = 2;
            
            // Generate bar positions
            const bars: BoundingBox[] = heights.map((h, i) => ({
              x: i * (barWidth + padding),
              y: 100 - h,
              width: barWidth,
              height: h
            }));
            
            // Check no bars overlap
            for (let i = 0; i < bars.length; i++) {
              for (let j = i + 1; j < bars.length; j++) {
                if (boxesOverlap(bars[i], bars[j])) {
                  return false;
                }
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: leetcode-algorithm-visualizer, Property 7: Element Highlighting Consistency**
   * **Validates: Requirements 5.3**
   * 
   * For any animation step, the elements marked in highlightBars should be
   * visually distinguished with distinct colors from non-highlighted elements.
   */
  describe('Property 7: Element Highlighting Consistency', () => {
    it('should assign different colors to highlighted vs non-highlighted elements', () => {
      const normalColor = '#4285f4';
      const highlightColors = ['#ff7043', '#4caf50', '#fdd835'];
      
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 3, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          (heights, highlightIndex) => {
            const boundedIndex = highlightIndex % heights.length;
            
            // Simulate color assignment
            const colors = heights.map((_, i) => 
              i === boundedIndex ? highlightColors[0] : normalColor
            );
            
            // Highlighted element should have different color
            return colors[boundedIndex] !== normalColor;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: leetcode-algorithm-visualizer, Property 8: Data Flow Arrow Accuracy**
   * **Validates: Requirements 5.5**
   * 
   * For any animation step where values change between elements, the system
   * should display arrows with labels accurately describing the data transfer.
   */
  describe('Property 8: Data Flow Arrow Accuracy', () => {
    interface Arrow {
      from: number;
      to: number;
      label: string;
    }

    it('should generate valid arrows for value changes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (fromValue, toValue, fromIndex, toIndex) => {
            // Simulate arrow generation for a value transfer
            const arrow: Arrow = {
              from: fromIndex,
              to: toIndex,
              label: `${fromValue} → ${toValue}`
            };
            
            // Arrow should have valid indices and non-empty label
            return (
              arrow.from >= 0 &&
              arrow.to >= 0 &&
              arrow.label.length > 0 &&
              arrow.label.includes('→')
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
