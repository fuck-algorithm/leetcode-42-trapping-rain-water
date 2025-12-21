/**
 * ArrowManager
 * 
 * Manages data flow arrows on canvas.
 * Supports adding, removing, clearing arrows.
 * Implements path calculation (straight and curved).
 * Supports arrow labels.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { DataFlowArrow, ArrowType, ArrowStyle, ArrowEndpoint, BoundingBox } from './types';
import { ElementPosition } from './AnnotationManager';

// 默认箭头样式
const DEFAULT_STYLES: Record<ArrowType, ArrowStyle> = {
  'value-transfer': {
    color: '#2196f3',
    strokeWidth: 2,
    curved: false,
  },
  'parameter': {
    color: '#4caf50',
    strokeWidth: 2,
    curved: true,
  },
  'return-value': {
    color: '#ff9800',
    strokeWidth: 2,
    curved: true,
    dashArray: '5,3',
  },
  'assignment': {
    color: '#9c27b0',
    strokeWidth: 2,
    curved: false,
  },
};

// 箭头配置
const ARROW_CONFIG = {
  labelOffset: 10,
  curveOffset: 30,
  arrowHeadSize: 8,
  minCurveDistance: 50,
};

export interface ArrowPath {
  d: string;
  labelPosition: { x: number; y: number };
  angle: number;
}

export class ArrowManager {
  private arrows: Map<string, DataFlowArrow> = new Map();
  private elementPositions: Map<string, ElementPosition> = new Map();

  /**
   * 添加箭头
   */
  addArrow(arrow: DataFlowArrow): void {
    const style = {
      ...DEFAULT_STYLES[arrow.type],
      ...arrow.style,
    };
    
    this.arrows.set(arrow.id, {
      ...arrow,
      style,
    });
  }

  /**
   * 批量添加箭头
   */
  addArrows(arrows: DataFlowArrow[]): void {
    arrows.forEach(a => this.addArrow(a));
  }

  /**
   * 移除箭头
   */
  removeArrow(id: string): boolean {
    return this.arrows.delete(id);
  }

  /**
   * 清除所有箭头
   */
  clearArrows(): void {
    this.arrows.clear();
  }

  /**
   * 获取所有箭头
   */
  getAllArrows(): DataFlowArrow[] {
    return Array.from(this.arrows.values());
  }

  /**
   * 更新元素位置
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
   * 获取锚点位置
   */
  getAnchorPosition(
    elementPos: ElementPosition,
    anchor: ArrowEndpoint['anchor']
  ): { x: number; y: number } {
    const { x, y, width, height } = elementPos;
    
    switch (anchor) {
      case 'top':
        return { x: x + width / 2, y };
      case 'bottom':
        return { x: x + width / 2, y: y + height };
      case 'left':
        return { x, y: y + height / 2 };
      case 'right':
        return { x: x + width, y: y + height / 2 };
      case 'center':
      default:
        return { x: x + width / 2, y: y + height / 2 };
    }
  }

  /**
   * 计算直线路径
   */
  calculateStraightPath(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): ArrowPath {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // 缩短终点以留出箭头空间
    const length = Math.sqrt(dx * dx + dy * dy);
    const shortenBy = ARROW_CONFIG.arrowHeadSize;
    const ratio = (length - shortenBy) / length;
    
    const endX = from.x + dx * ratio;
    const endY = from.y + dy * ratio;
    
    return {
      d: `M ${from.x} ${from.y} L ${endX} ${endY}`,
      labelPosition: {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2 - ARROW_CONFIG.labelOffset,
      },
      angle,
    };
  }

  /**
   * 计算曲线路径
   */
  calculateCurvedPath(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): ArrowPath {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 计算控制点
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    // 垂直于连线的偏移
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    const curveOffset = Math.min(ARROW_CONFIG.curveOffset, distance / 3);
    const controlX = midX + perpX * curveOffset;
    const controlY = midY + perpY * curveOffset;
    
    // 计算终点角度
    const endAngle = Math.atan2(to.y - controlY, to.x - controlX) * (180 / Math.PI);
    
    // 缩短终点
    const shortenBy = ARROW_CONFIG.arrowHeadSize;
    const endDx = to.x - controlX;
    const endDy = to.y - controlY;
    const endLength = Math.sqrt(endDx * endDx + endDy * endDy);
    const ratio = (endLength - shortenBy) / endLength;
    
    const endX = controlX + endDx * ratio;
    const endY = controlY + endDy * ratio;
    
    return {
      d: `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${endX} ${endY}`,
      labelPosition: {
        x: controlX,
        y: controlY - ARROW_CONFIG.labelOffset,
      },
      angle: endAngle,
    };
  }

  /**
   * 计算箭头路径
   */
  calculateArrowPath(arrow: DataFlowArrow): ArrowPath | null {
    const fromPos = this.elementPositions.get(arrow.from.elementId);
    const toPos = this.elementPositions.get(arrow.to.elementId);
    
    if (!fromPos || !toPos) return null;
    
    const from = this.getAnchorPosition(fromPos, arrow.from.anchor);
    const to = this.getAnchorPosition(toPos, arrow.to.anchor);
    
    const isCurved = arrow.style?.curved ?? DEFAULT_STYLES[arrow.type].curved;
    
    if (isCurved) {
      return this.calculateCurvedPath(from, to);
    }
    
    return this.calculateStraightPath(from, to);
  }

  /**
   * 获取箭头渲染数据
   */
  getArrowRenderData(arrow: DataFlowArrow): {
    arrow: DataFlowArrow;
    path: ArrowPath;
    style: ArrowStyle;
  } | null {
    const path = this.calculateArrowPath(arrow);
    if (!path) return null;
    
    return {
      arrow,
      path,
      style: arrow.style || DEFAULT_STYLES[arrow.type],
    };
  }

  /**
   * 获取所有箭头渲染数据
   */
  getAllArrowRenderData(): Array<{
    arrow: DataFlowArrow;
    path: ArrowPath;
    style: ArrowStyle;
  }> {
    const result: Array<{
      arrow: DataFlowArrow;
      path: ArrowPath;
      style: ArrowStyle;
    }> = [];
    
    this.arrows.forEach(arrow => {
      const data = this.getArrowRenderData(arrow);
      if (data) {
        result.push(data);
      }
    });
    
    return result;
  }

  /**
   * 创建值传递箭头
   */
  static createValueTransferArrow(
    id: string,
    fromElementId: string,
    toElementId: string,
    label: string,
    fromAnchor: ArrowEndpoint['anchor'] = 'right',
    toAnchor: ArrowEndpoint['anchor'] = 'left'
  ): DataFlowArrow {
    return {
      id,
      from: { elementId: fromElementId, anchor: fromAnchor },
      to: { elementId: toElementId, anchor: toAnchor },
      label,
      type: 'value-transfer',
    };
  }

  /**
   * 创建参数传递箭头
   */
  static createParameterArrow(
    id: string,
    fromElementId: string,
    toElementId: string,
    label: string
  ): DataFlowArrow {
    return {
      id,
      from: { elementId: fromElementId, anchor: 'bottom' },
      to: { elementId: toElementId, anchor: 'top' },
      label,
      type: 'parameter',
    };
  }

  /**
   * 创建返回值箭头
   */
  static createReturnValueArrow(
    id: string,
    fromElementId: string,
    toElementId: string,
    label: string
  ): DataFlowArrow {
    return {
      id,
      from: { elementId: fromElementId, anchor: 'top' },
      to: { elementId: toElementId, anchor: 'bottom' },
      label,
      type: 'return-value',
    };
  }

  /**
   * 创建赋值箭头
   */
  static createAssignmentArrow(
    id: string,
    fromElementId: string,
    toElementId: string,
    label: string
  ): DataFlowArrow {
    return {
      id,
      from: { elementId: fromElementId, anchor: 'right' },
      to: { elementId: toElementId, anchor: 'left' },
      label,
      type: 'assignment',
    };
  }
}

export default ArrowManager;
