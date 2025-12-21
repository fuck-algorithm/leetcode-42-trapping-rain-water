/**
 * Property-Based Tests for Data Flow Arrow System
 * 
 * **Feature: advanced-canvas-visualization, Property 8: Data Flow Arrow Completeness**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**
 */

import fc from 'fast-check';
import { ArrowManager } from '../../components/canvas/ArrowManager';
import { DataFlowArrow, ArrowType } from '../../components/canvas/types';

// 生成箭头类型
const arbitraryArrowType = fc.constantFrom<ArrowType>(
  'value-transfer',
  'parameter',
  'return-value',
  'assignment'
);

// 生成锚点
const arbitraryAnchor = fc.constantFrom<'top' | 'bottom' | 'left' | 'right' | 'center'>(
  'top', 'bottom', 'left', 'right', 'center'
);

describe('Data Flow Arrow Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 8: Data Flow Arrow Completeness**
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**
   */
  describe('Arrow Completeness', () => {
    it('should store all added arrows', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (arrowCount) => {
            const manager = new ArrowManager();
            
            for (let i = 0; i < arrowCount; i++) {
              manager.addArrow(
                ArrowManager.createValueTransferArrow(
                  `arrow-${i}`,
                  `elem-${i}`,
                  `elem-${i + 1}`,
                  `Transfer ${i}`
                )
              );
            }
            
            return manager.getAllArrows().length === arrowCount;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should preserve arrow labels', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          arbitraryArrowType,
          (label, type) => {
            const manager = new ArrowManager();
            
            let arrow: DataFlowArrow;
            switch (type) {
              case 'value-transfer':
                arrow = ArrowManager.createValueTransferArrow('id', 'from', 'to', label);
                break;
              case 'parameter':
                arrow = ArrowManager.createParameterArrow('id', 'from', 'to', label);
                break;
              case 'return-value':
                arrow = ArrowManager.createReturnValueArrow('id', 'from', 'to', label);
                break;
              default:
                arrow = ArrowManager.createAssignmentArrow('id', 'from', 'to', label);
            }
            
            manager.addArrow(arrow);
            const retrieved = manager.getAllArrows()[0];
            
            return retrieved.label === label;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should create arrows with correct types', () => {
      fc.assert(
        fc.property(
          arbitraryArrowType,
          (type) => {
            let arrow: DataFlowArrow;
            
            switch (type) {
              case 'value-transfer':
                arrow = ArrowManager.createValueTransferArrow('id', 'from', 'to', 'label');
                break;
              case 'parameter':
                arrow = ArrowManager.createParameterArrow('id', 'from', 'to', 'label');
                break;
              case 'return-value':
                arrow = ArrowManager.createReturnValueArrow('id', 'from', 'to', 'label');
                break;
              default:
                arrow = ArrowManager.createAssignmentArrow('id', 'from', 'to', 'label');
            }
            
            return arrow.type === type;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should calculate path when element positions are set', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 500 }),
          fc.integer({ min: 50, max: 500 }),
          fc.integer({ min: 50, max: 500 }),
          fc.integer({ min: 50, max: 500 }),
          arbitraryAnchor,
          arbitraryAnchor,
          (x1, y1, x2, y2, fromAnchor, toAnchor) => {
            const manager = new ArrowManager();
            
            manager.updateElementPositions([
              { id: 'from', x: x1, y: y1, width: 50, height: 50 },
              { id: 'to', x: x2, y: y2, width: 50, height: 50 },
            ]);
            
            const arrow: DataFlowArrow = {
              id: 'test',
              from: { elementId: 'from', anchor: fromAnchor },
              to: { elementId: 'to', anchor: toAnchor },
              label: 'Test',
              type: 'value-transfer',
            };
            
            manager.addArrow(arrow);
            const path = manager.calculateArrowPath(arrow);
            
            return path !== null && path.d.length > 0;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should return null path when element positions are missing', () => {
      const manager = new ArrowManager();
      
      const arrow = ArrowManager.createValueTransferArrow(
        'test',
        'nonexistent1',
        'nonexistent2',
        'Test'
      );
      
      manager.addArrow(arrow);
      const path = manager.calculateArrowPath(arrow);
      
      expect(path).toBeNull();
    });

    it('should remove arrows correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          fc.integer({ min: 0, max: 4 }),
          (count, removeIndex) => {
            const manager = new ArrowManager();
            
            for (let i = 0; i < count; i++) {
              manager.addArrow(
                ArrowManager.createValueTransferArrow(
                  `arrow-${i}`,
                  `from-${i}`,
                  `to-${i}`,
                  `Label ${i}`
                )
              );
            }
            
            const removed = manager.removeArrow(`arrow-${removeIndex}`);
            const remaining = manager.getAllArrows();
            
            return removed && remaining.length === count - 1;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should clear all arrows', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (count) => {
            const manager = new ArrowManager();
            
            for (let i = 0; i < count; i++) {
              manager.addArrow(
                ArrowManager.createValueTransferArrow(
                  `arrow-${i}`,
                  `from-${i}`,
                  `to-${i}`,
                  `Label ${i}`
                )
              );
            }
            
            manager.clearArrows();
            
            return manager.getAllArrows().length === 0;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should calculate label position on path', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 400 }),
          fc.integer({ min: 100, max: 400 }),
          fc.integer({ min: 100, max: 400 }),
          fc.integer({ min: 100, max: 400 }),
          (x1, y1, x2, y2) => {
            const manager = new ArrowManager();
            
            manager.updateElementPositions([
              { id: 'from', x: x1, y: y1, width: 50, height: 50 },
              { id: 'to', x: x2, y: y2, width: 50, height: 50 },
            ]);
            
            const arrow = ArrowManager.createValueTransferArrow(
              'test',
              'from',
              'to',
              'Test Label'
            );
            
            manager.addArrow(arrow);
            const path = manager.calculateArrowPath(arrow);
            
            // Label position should be somewhere between the two elements
            if (!path) return false;
            
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1 + 50, x2 + 50);
            const minY = Math.min(y1, y2) - 50; // Allow some offset
            const maxY = Math.max(y1 + 50, y2 + 50);
            
            return (
              path.labelPosition.x >= minX - 50 &&
              path.labelPosition.x <= maxX + 50 &&
              path.labelPosition.y >= minY - 50 &&
              path.labelPosition.y <= maxY + 50
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  describe('Arrow Type Specific Behavior', () => {
    it('should create value-transfer arrows with correct endpoints', () => {
      const arrow = ArrowManager.createValueTransferArrow(
        'test',
        'from',
        'to',
        'value'
      );
      
      expect(arrow.from.anchor).toBe('right');
      expect(arrow.to.anchor).toBe('left');
    });

    it('should create parameter arrows with correct endpoints', () => {
      const arrow = ArrowManager.createParameterArrow(
        'test',
        'from',
        'to',
        'param'
      );
      
      expect(arrow.from.anchor).toBe('bottom');
      expect(arrow.to.anchor).toBe('top');
    });

    it('should create return-value arrows with correct endpoints', () => {
      const arrow = ArrowManager.createReturnValueArrow(
        'test',
        'from',
        'to',
        'return'
      );
      
      expect(arrow.from.anchor).toBe('top');
      expect(arrow.to.anchor).toBe('bottom');
    });

    it('should create assignment arrows with correct endpoints', () => {
      const arrow = ArrowManager.createAssignmentArrow(
        'test',
        'from',
        'to',
        'assign'
      );
      
      expect(arrow.from.anchor).toBe('right');
      expect(arrow.to.anchor).toBe('left');
    });
  });
});
