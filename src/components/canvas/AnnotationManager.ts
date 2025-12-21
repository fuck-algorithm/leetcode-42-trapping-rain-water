/**
 * AnnotationManager
 * 
 * Manages annotations on canvas elements.
 * Supports adding, removing, clearing annotations.
 * Implements positioning algorithm for different positions (top/bottom/left/right).
 * Supports multiple annotation types (state-change, comparison, assignment, info).
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { Annotation, AnnotationType, AnnotationPosition, AnnotationStyle, BoundingBox } from './types';

// 默认标注样式
const DEFAULT_STYLES: Record<AnnotationType, AnnotationStyle> = {
  'state-change': {
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    textColor: '#333',
    borderColor: '#f57c00',
    fontSize: 11,
  },
  'comparison': {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    textColor: '#fff',
    borderColor: '#1976d2',
    fontSize: 11,
  },
  'assignment': {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    textColor: '#fff',
    borderColor: '#388e3c',
    fontSize: 11,
  },
  'info': {
    backgroundColor: 'rgba(158, 158, 158, 0.9)',
    textColor: '#fff',
    borderColor: '#616161',
    fontSize: 11,
  },
};

// 标注尺寸配置
const ANNOTATION_CONFIG = {
  padding: { x: 8, y: 4 },
  minWidth: 40,
  maxWidth: 200,
  lineHeight: 16,
  borderRadius: 4,
  offset: 8, // 与目标元素的距离
};

export interface ElementPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AnnotationManager {
  private annotations: Map<string, Annotation> = new Map();
  private elementPositions: Map<string, ElementPosition> = new Map();

  /**
   * 添加标注
   */
  addAnnotation(annotation: Annotation): void {
    // 应用默认样式
    const style = {
      ...DEFAULT_STYLES[annotation.type],
      ...annotation.style,
    };
    
    this.annotations.set(annotation.id, {
      ...annotation,
      style,
    });
  }

  /**
   * 批量添加标注
   */
  addAnnotations(annotations: Annotation[]): void {
    annotations.forEach(a => this.addAnnotation(a));
  }

  /**
   * 移除标注
   */
  removeAnnotation(id: string): boolean {
    return this.annotations.delete(id);
  }

  /**
   * 清除所有标注
   */
  clearAnnotations(): void {
    this.annotations.clear();
  }

  /**
   * 获取所有标注
   */
  getAllAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  /**
   * 获取指定元素的标注
   */
  getAnnotationsForElement(elementId: string): Annotation[] {
    return this.getAllAnnotations().filter(a => a.targetElementId === elementId);
  }

  /**
   * 更新元素位置信息
   */
  updateElementPosition(position: ElementPosition): void {
    this.elementPositions.set(position.id, position);
  }

  /**
   * 批量更新元素位置
   */
  updateElementPositions(positions: ElementPosition[]): void {
    positions.forEach(p => this.updateElementPosition(p));
  }

  /**
   * 计算标注的边界框
   */
  calculateAnnotationBoundingBox(annotation: Annotation): BoundingBox | null {
    const elementPos = this.elementPositions.get(annotation.targetElementId);
    if (!elementPos) return null;

    const textLength = annotation.text.length;
    const estimatedWidth = Math.min(
      Math.max(textLength * 7 + ANNOTATION_CONFIG.padding.x * 2, ANNOTATION_CONFIG.minWidth),
      ANNOTATION_CONFIG.maxWidth
    );
    const height = ANNOTATION_CONFIG.lineHeight + ANNOTATION_CONFIG.padding.y * 2;

    const position = this.calculateAnnotationPosition(
      annotation,
      elementPos,
      estimatedWidth,
      height
    );

    return {
      x: position.x,
      y: position.y,
      width: estimatedWidth,
      height,
    };
  }

  /**
   * 计算标注位置
   */
  calculateAnnotationPosition(
    annotation: Annotation,
    elementPos: ElementPosition,
    annotationWidth: number,
    annotationHeight: number
  ): { x: number; y: number } {
    const offset = annotation.offset || { x: 0, y: 0 };
    const baseOffset = ANNOTATION_CONFIG.offset;

    switch (annotation.position) {
      case 'top':
        return {
          x: elementPos.x + elementPos.width / 2 - annotationWidth / 2 + offset.x,
          y: elementPos.y - annotationHeight - baseOffset + offset.y,
        };
      case 'bottom':
        return {
          x: elementPos.x + elementPos.width / 2 - annotationWidth / 2 + offset.x,
          y: elementPos.y + elementPos.height + baseOffset + offset.y,
        };
      case 'left':
        return {
          x: elementPos.x - annotationWidth - baseOffset + offset.x,
          y: elementPos.y + elementPos.height / 2 - annotationHeight / 2 + offset.y,
        };
      case 'right':
        return {
          x: elementPos.x + elementPos.width + baseOffset + offset.x,
          y: elementPos.y + elementPos.height / 2 - annotationHeight / 2 + offset.y,
        };
      default:
        return {
          x: elementPos.x + elementPos.width / 2 - annotationWidth / 2 + offset.x,
          y: elementPos.y - annotationHeight - baseOffset + offset.y,
        };
    }
  }

  /**
   * 获取标注的渲染数据
   */
  getAnnotationRenderData(annotation: Annotation): {
    annotation: Annotation;
    boundingBox: BoundingBox;
    style: AnnotationStyle;
  } | null {
    const boundingBox = this.calculateAnnotationBoundingBox(annotation);
    if (!boundingBox) return null;

    return {
      annotation,
      boundingBox,
      style: annotation.style || DEFAULT_STYLES[annotation.type],
    };
  }

  /**
   * 获取所有标注的渲染数据
   */
  getAllAnnotationRenderData(): Array<{
    annotation: Annotation;
    boundingBox: BoundingBox;
    style: AnnotationStyle;
  }> {
    const result: Array<{
      annotation: Annotation;
      boundingBox: BoundingBox;
      style: AnnotationStyle;
    }> = [];

    this.annotations.forEach(annotation => {
      const data = this.getAnnotationRenderData(annotation);
      if (data) {
        result.push(data);
      }
    });

    return result;
  }

  /**
   * 创建状态变更标注
   */
  static createStateChangeAnnotation(
    id: string,
    targetElementId: string,
    text: string,
    position: AnnotationPosition = 'top'
  ): Annotation {
    return {
      id,
      targetElementId,
      text,
      type: 'state-change',
      position,
    };
  }

  /**
   * 创建比较标注
   */
  static createComparisonAnnotation(
    id: string,
    targetElementId: string,
    text: string,
    position: AnnotationPosition = 'top'
  ): Annotation {
    return {
      id,
      targetElementId,
      text,
      type: 'comparison',
      position,
    };
  }

  /**
   * 创建赋值标注
   */
  static createAssignmentAnnotation(
    id: string,
    targetElementId: string,
    text: string,
    position: AnnotationPosition = 'top'
  ): Annotation {
    return {
      id,
      targetElementId,
      text,
      type: 'assignment',
      position,
    };
  }

  /**
   * 创建信息标注
   */
  static createInfoAnnotation(
    id: string,
    targetElementId: string,
    text: string,
    position: AnnotationPosition = 'top'
  ): Annotation {
    return {
      id,
      targetElementId,
      text,
      type: 'info',
      position,
    };
  }
}

export default AnnotationManager;
