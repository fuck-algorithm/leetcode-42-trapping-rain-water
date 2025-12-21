/**
 * Property-Based Tests for Annotation System
 * 
 * **Feature: advanced-canvas-visualization, Property 5: Node Value Display**
 * **Feature: advanced-canvas-visualization, Property 6: Annotation Creation on State Change**
 * **Feature: advanced-canvas-visualization, Property 7: Annotation Non-Overlap**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
 */

import fc from 'fast-check';
import { AnnotationManager, ElementPosition } from '../../components/canvas/AnnotationManager';
import {
  boxesIntersect,
  detectOverlaps,
  resolveOverlaps,
  hasRemainingOverlaps,
  calculateOverlapArea,
} from '../../components/canvas/OverlapResolver';
import { Annotation, BoundingBox, AnnotationType, AnnotationPosition } from '../../components/canvas/types';

// 生成有效的边界框
const arbitraryBoundingBox = fc.record({
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 1000 }),
  width: fc.integer({ min: 10, max: 200 }),
  height: fc.integer({ min: 10, max: 100 }),
});

// 生成标注类型
const arbitraryAnnotationType = fc.constantFrom<AnnotationType>(
  'state-change',
  'comparison',
  'assignment',
  'info'
);

// 生成标注位置
const arbitraryAnnotationPosition = fc.constantFrom<AnnotationPosition>(
  'top',
  'bottom',
  'left',
  'right'
);

// 生成元素位置
const arbitraryElementPosition = (id: string) => fc.record({
  id: fc.constant(id),
  x: fc.integer({ min: 50, max: 800 }),
  y: fc.integer({ min: 50, max: 600 }),
  width: fc.integer({ min: 30, max: 100 }),
  height: fc.integer({ min: 30, max: 100 }),
});

// 生成标注
const arbitraryAnnotation = (id: string, targetId: string) => fc.record({
  id: fc.constant(id),
  targetElementId: fc.constant(targetId),
  text: fc.string({ minLength: 1, maxLength: 30 }),
  type: arbitraryAnnotationType,
  position: arbitraryAnnotationPosition,
});

describe('Annotation System Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 5: Node Value Display**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any element with a value, the annotation manager should be able
   * to create and store annotations for that element.
   */
  describe('Node Value Display', () => {
    it('should store annotations for any element', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (elementCount) => {
            const manager = new AnnotationManager();
            
            // 为每个元素创建标注
            for (let i = 0; i < elementCount; i++) {
              const annotation = AnnotationManager.createInfoAnnotation(
                `annotation-${i}`,
                `element-${i}`,
                `Value: ${i}`
              );
              manager.addAnnotation(annotation);
            }
            
            // 验证所有标注都被存储
            const allAnnotations = manager.getAllAnnotations();
            return allAnnotations.length === elementCount;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should retrieve annotations for specific elements', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 5 }),
          (elementCount, annotationsPerElement) => {
            const manager = new AnnotationManager();
            
            // 为每个元素创建多个标注
            for (let i = 0; i < elementCount; i++) {
              for (let j = 0; j < annotationsPerElement; j++) {
                const annotation = AnnotationManager.createInfoAnnotation(
                  `annotation-${i}-${j}`,
                  `element-${i}`,
                  `Info ${j}`
                );
                manager.addAnnotation(annotation);
              }
            }
            
            // 验证每个元素的标注数量正确
            for (let i = 0; i < elementCount; i++) {
              const elementAnnotations = manager.getAnnotationsForElement(`element-${i}`);
              if (elementAnnotations.length !== annotationsPerElement) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 6: Annotation Creation on State Change**
   * **Validates: Requirements 4.2, 4.3, 4.4**
   * 
   * Property: For any state change, comparison, or assignment operation,
   * there should be a corresponding annotation created with descriptive text.
   */
  describe('Annotation Creation on State Change', () => {
    it('should create state-change annotations with correct type', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (text, elementId) => {
            const annotation = AnnotationManager.createStateChangeAnnotation(
              'test-id',
              elementId,
              text
            );
            
            return (
              annotation.type === 'state-change' &&
              annotation.text === text &&
              annotation.targetElementId === elementId
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should create comparison annotations with correct type', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (text, elementId) => {
            const annotation = AnnotationManager.createComparisonAnnotation(
              'test-id',
              elementId,
              text
            );
            
            return (
              annotation.type === 'comparison' &&
              annotation.text === text &&
              annotation.targetElementId === elementId
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should create assignment annotations with correct type', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (text, elementId) => {
            const annotation = AnnotationManager.createAssignmentAnnotation(
              'test-id',
              elementId,
              text
            );
            
            return (
              annotation.type === 'assignment' &&
              annotation.text === text &&
              annotation.targetElementId === elementId
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should preserve annotation text exactly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          arbitraryAnnotationType,
          (text, type) => {
            const manager = new AnnotationManager();
            
            let annotation: Annotation;
            switch (type) {
              case 'state-change':
                annotation = AnnotationManager.createStateChangeAnnotation('id', 'elem', text);
                break;
              case 'comparison':
                annotation = AnnotationManager.createComparisonAnnotation('id', 'elem', text);
                break;
              case 'assignment':
                annotation = AnnotationManager.createAssignmentAnnotation('id', 'elem', text);
                break;
              default:
                annotation = AnnotationManager.createInfoAnnotation('id', 'elem', text);
            }
            
            manager.addAnnotation(annotation);
            const retrieved = manager.getAllAnnotations()[0];
            
            return retrieved.text === text;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 7: Annotation Non-Overlap**
   * **Validates: Requirements 4.5, 4.6**
   * 
   * Property: For any set of annotations on the canvas, after overlap resolution,
   * no two annotation bounding boxes should intersect.
   */
  describe('Annotation Non-Overlap', () => {
    it('should detect overlapping bounding boxes', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          (box1, offsetX, offsetY) => {
            // 创建一个与 box1 重叠的 box2
            const box2: BoundingBox = {
              x: box1.x + offsetX,
              y: box1.y + offsetY,
              width: box1.width,
              height: box1.height,
            };
            
            // 如果偏移小于尺寸，应该检测到重叠
            const shouldOverlap = offsetX < box1.width && offsetY < box1.height;
            const detected = boxesIntersect(box1, box2);
            
            return detected === shouldOverlap;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should not detect overlap for non-intersecting boxes', () => {
      fc.assert(
        fc.property(
          arbitraryBoundingBox,
          fc.integer({ min: 1, max: 500 }),
          (box1, gap) => {
            // 创建一个不与 box1 重叠的 box2（在右边）
            const box2: BoundingBox = {
              x: box1.x + box1.width + gap,
              y: box1.y,
              width: box1.width,
              height: box1.height,
            };
            
            return !boxesIntersect(box1, box2);
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should resolve overlaps so no boxes intersect', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryBoundingBox, { minLength: 2, maxLength: 10 }),
          (boxes) => {
            const resolved = resolveOverlaps(boxes, { minSpacing: 4 });
            
            // 检查解决后是否还有重叠
            return !hasRemainingOverlaps(resolved, 4);
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should preserve original box dimensions after resolution', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryBoundingBox, { minLength: 2, maxLength: 10 }),
          (boxes) => {
            const resolved = resolveOverlaps(boxes);
            
            // 检查每个解决后的框的尺寸是否与原始相同
            return resolved.every((rb, i) => 
              rb.resolvedBox.width === boxes[i].width &&
              rb.resolvedBox.height === boxes[i].height
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should calculate correct overlap area', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 50, max: 200 }),
          fc.integer({ min: 50, max: 200 }),
          fc.integer({ min: 1, max: 49 }),
          fc.integer({ min: 1, max: 49 }),
          (x1, y1, w, h, overlapX, overlapY) => {
            const box1: BoundingBox = { x: x1, y: y1, width: w, height: h };
            const box2: BoundingBox = {
              x: x1 + w - overlapX,
              y: y1 + h - overlapY,
              width: w,
              height: h,
            };
            
            const area = calculateOverlapArea(box1, box2);
            const expectedArea = overlapX * overlapY;
            
            return Math.abs(area - expectedArea) < 1;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should detect all overlaps in a set of boxes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 200 }),
          fc.integer({ min: 100, max: 200 }),
          fc.integer({ min: 50, max: 100 }),
          fc.integer({ min: 50, max: 100 }),
          (x, y, w, h) => {
            // 创建三个重叠的框
            const boxes: BoundingBox[] = [
              { x, y, width: w, height: h },
              { x: x + w / 2, y: y + h / 2, width: w, height: h },
              { x: x + w, y: y + h, width: w, height: h },
            ];
            
            const overlaps = detectOverlaps(boxes);
            
            // 第一个和第二个重叠，第二个和第三个重叠
            // 第一个和第三个可能重叠也可能不重叠
            return overlaps.length >= 2;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * 标注管理器的完整性测试
   */
  describe('Annotation Manager Completeness', () => {
    it('should remove annotations correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          fc.integer({ min: 0, max: 4 }),
          (count, removeIndex) => {
            const manager = new AnnotationManager();
            
            // 添加标注
            for (let i = 0; i < count; i++) {
              manager.addAnnotation(
                AnnotationManager.createInfoAnnotation(`ann-${i}`, `elem-${i}`, `Text ${i}`)
              );
            }
            
            // 移除一个标注
            const removed = manager.removeAnnotation(`ann-${removeIndex}`);
            const remaining = manager.getAllAnnotations();
            
            return removed && remaining.length === count - 1;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should clear all annotations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (count) => {
            const manager = new AnnotationManager();
            
            // 添加标注
            for (let i = 0; i < count; i++) {
              manager.addAnnotation(
                AnnotationManager.createInfoAnnotation(`ann-${i}`, `elem-${i}`, `Text ${i}`)
              );
            }
            
            // 清除所有
            manager.clearAnnotations();
            
            return manager.getAllAnnotations().length === 0;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should calculate bounding box for annotations with element positions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 30, max: 100 }),
          fc.integer({ min: 30, max: 100 }),
          arbitraryAnnotationPosition,
          (x, y, w, h, position) => {
            const manager = new AnnotationManager();
            
            // 设置元素位置
            manager.updateElementPosition({
              id: 'elem-1',
              x, y, width: w, height: h,
            });
            
            // 添加标注
            const annotation: Annotation = {
              id: 'ann-1',
              targetElementId: 'elem-1',
              text: 'Test annotation',
              type: 'info',
              position,
            };
            manager.addAnnotation(annotation);
            
            // 计算边界框
            const boundingBox = manager.calculateAnnotationBoundingBox(annotation);
            
            // 边界框应该存在且有有效尺寸
            return (
              boundingBox !== null &&
              boundingBox.width > 0 &&
              boundingBox.height > 0
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });
});
