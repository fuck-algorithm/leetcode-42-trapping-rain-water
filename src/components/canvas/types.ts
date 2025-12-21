/**
 * Canvas Types and Interfaces
 * 
 * Core type definitions for the interactive canvas system.
 */

// 画布变换状态
export interface CanvasTransform {
  scale: number;      // 当前缩放比例
  translateX: number; // X 轴平移
  translateY: number; // Y 轴平移
}

// 画布元素类型
export type CanvasElementType = 
  | 'node' 
  | 'array-cell' 
  | 'stack-item' 
  | 'hashmap-entry' 
  | 'edge'
  | 'tree-node'
  | 'pointer';

// 画布元素
export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
  highlighted?: boolean;
  highlightColor?: string;
}

// 标注类型
export type AnnotationType = 'state-change' | 'comparison' | 'assignment' | 'info';

// 标注位置
export type AnnotationPosition = 'top' | 'bottom' | 'left' | 'right';

// 标注样式
export interface AnnotationStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: number;
}

// 标注
export interface Annotation {
  id: string;
  targetElementId: string;
  text: string;
  type: AnnotationType;
  position: AnnotationPosition;
  offset?: { x: number; y: number };
  style?: AnnotationStyle;
}

// 箭头端点
export interface ArrowEndpoint {
  elementId: string;
  anchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// 箭头类型
export type ArrowType = 'value-transfer' | 'parameter' | 'return-value' | 'assignment';

// 箭头样式
export interface ArrowStyle {
  color?: string;
  strokeWidth?: number;
  dashArray?: string;
  curved?: boolean;
}

// 数据流箭头
export interface DataFlowArrow {
  id: string;
  from: ArrowEndpoint;
  to: ArrowEndpoint;
  label: string;
  type: ArrowType;
  style?: ArrowStyle;
  animated?: boolean;
}

// 栈帧
export interface StackFrame {
  id: string;
  functionName: string;
  parameters: { name: string; value: any }[];
  localVariables: { name: string; value: any }[];
  returnValue?: any;
  isActive: boolean;
}

// 执行上下文
export interface ExecutionContext {
  stackFrames: StackFrame[];
  currentDepth: number;
  callChain: string[];
}

// 边界框
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// InteractiveCanvas 组件属性
export interface InteractiveCanvasProps {
  width: number;
  height: number;
  elements?: CanvasElement[];
  annotations?: Annotation[];
  arrows?: DataFlowArrow[];
  executionContext?: ExecutionContext;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
  onTransformChange?: (transform: CanvasTransform) => void;
  children?: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
  initialTransform?: CanvasTransform;
}

// 默认变换
export const DEFAULT_TRANSFORM: CanvasTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

// 缩放限制
export const ZOOM_LIMITS = {
  min: 0.1,
  max: 10,
};
