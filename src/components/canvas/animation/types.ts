/**
 * Animation Frame Types and Interfaces
 * 
 * Core type definitions for the animation frame system with multi-language code binding.
 * 
 * Requirements: 7.3, 7.4
 */

import { CanvasElement, Annotation, DataFlowArrow, ExecutionContext, CanvasTransform } from '../types';

// 支持的编程语言
export type Language = 'java' | 'python' | 'golang' | 'javascript';

// 所有支持的语言列表
export const SUPPORTED_LANGUAGES: Language[] = ['java', 'python', 'golang', 'javascript'];

/**
 * 代码行绑定映射表
 * 将动画帧映射到各语言的代码行号
 */
export interface CodeLineBinding {
  java: number[];      // Java 代码行号（可能是多行）
  python: number[];    // Python 代码行号
  golang: number[];    // Go 代码行号
  javascript: number[]; // JavaScript 代码行号
}

/**
 * 创建空的代码行绑定
 */
export function createEmptyCodeLineBinding(): CodeLineBinding {
  return {
    java: [],
    python: [],
    golang: [],
    javascript: [],
  };
}

/**
 * 创建代码行绑定
 */
export function createCodeLineBinding(
  java: number | number[],
  python: number | number[],
  golang: number | number[],
  javascript: number | number[]
): CodeLineBinding {
  return {
    java: Array.isArray(java) ? java : [java],
    python: Array.isArray(python) ? python : [python],
    golang: Array.isArray(golang) ? golang : [golang],
    javascript: Array.isArray(javascript) ? javascript : [javascript],
  };
}

/**
 * 验证代码行绑定是否有效
 */
export function isValidCodeLineBinding(binding: CodeLineBinding): boolean {
  // 行号必须是正整数
  const allValidLines = [
    ...binding.java,
    ...binding.python,
    ...binding.golang,
    ...binding.javascript,
  ].every(line => Number.isInteger(line) && line > 0);
  
  return allValidLines;
}

/**
 * 获取指定语言的代码行
 */
export function getCodeLinesForLanguage(binding: CodeLineBinding, language: Language): number[] {
  return binding[language] || [];
}

/**
 * 画布状态快照
 */
export interface CanvasState {
  elements: CanvasElement[];
  highlightedElements: string[];
  transform: CanvasTransform;
}

/**
 * 变量状态
 */
export interface VariableState {
  name: string;
  value: any;
  type: string;
  changed: boolean;           // 本帧是否变化
  referencedInStep: boolean;  // 本步骤是否被引用
}

/**
 * 动画帧
 * 表示算法执行过程中的一个离散步骤
 */
export interface AnimationFrame {
  id: string;
  frameNumber: number;
  description: string;
  
  // 多语言代码行绑定
  codeLineBindings: CodeLineBinding;
  
  // 画布状态
  canvasState: CanvasState;
  
  // 变量状态
  variables: VariableState[];
  
  // 标注
  annotations: Annotation[];
  
  // 数据流箭头
  arrows: DataFlowArrow[];
  
  // 执行上下文（递归时）
  executionContext?: ExecutionContext;
}

/**
 * 执行轨迹
 * 记录算法执行过程中的单个操作
 */
export interface ExecutionTrace {
  operation: string;
  description: string;
  stateSnapshot: any;
  codeLocation: CodeLineBinding;
  timestamp?: number;
}

/**
 * 帧生成器接口
 */
export interface FrameGenerator {
  /**
   * 从输入生成动画帧
   */
  generateFrames(input: any): AnimationFrame[];
  
  /**
   * 获取帧总数
   */
  getFrameCount(): number;
  
  /**
   * 获取指定索引的帧
   */
  getFrame(index: number): AnimationFrame | null;
  
  /**
   * 获取所有帧
   */
  getAllFrames(): AnimationFrame[];
}

/**
 * 帧生成管道接口
 */
export interface FrameGenerationPipeline {
  /**
   * 解析算法输入
   */
  parseInput(input: any): any;
  
  /**
   * 执行算法并记录步骤
   */
  executeWithTracing(parsedInput: any): ExecutionTrace[];
  
  /**
   * 将执行轨迹转换为动画帧
   */
  traceToFrames(traces: ExecutionTrace[]): AnimationFrame[];
  
  /**
   * 绑定代码行
   */
  bindCodeLines(frames: AnimationFrame[], codes: Record<Language, string>): AnimationFrame[];
}

/**
 * 创建空的动画帧
 */
export function createEmptyFrame(frameNumber: number, description: string = ''): AnimationFrame {
  return {
    id: `frame-${frameNumber}`,
    frameNumber,
    description,
    codeLineBindings: createEmptyCodeLineBinding(),
    canvasState: {
      elements: [],
      highlightedElements: [],
      transform: { scale: 1, translateX: 0, translateY: 0 },
    },
    variables: [],
    annotations: [],
    arrows: [],
  };
}

/**
 * 验证动画帧是否有效
 */
export function isValidAnimationFrame(frame: AnimationFrame): boolean {
  // 帧号必须是非负整数
  if (!Number.isInteger(frame.frameNumber) || frame.frameNumber < 0) {
    return false;
  }
  
  // ID 不能为空
  if (!frame.id || frame.id.trim() === '') {
    return false;
  }
  
  // 代码行绑定必须有效
  if (!isValidCodeLineBinding(frame.codeLineBindings)) {
    // 允许空绑定
    const isEmpty = SUPPORTED_LANGUAGES.every(
      lang => frame.codeLineBindings[lang].length === 0
    );
    if (!isEmpty) {
      return false;
    }
  }
  
  return true;
}

/**
 * 检查两个连续帧之间是否有跳过的状态
 */
export function hasSkippedStates(frame1: AnimationFrame, frame2: AnimationFrame): boolean {
  // 帧号应该连续
  return frame2.frameNumber - frame1.frameNumber !== 1;
}

/**
 * 验证帧序列的粒度
 * 确保没有跳过中间状态
 */
export function validateFrameGranularity(frames: AnimationFrame[]): boolean {
  if (frames.length <= 1) {
    return true;
  }
  
  for (let i = 1; i < frames.length; i++) {
    if (hasSkippedStates(frames[i - 1], frames[i])) {
      return false;
    }
  }
  
  return true;
}
