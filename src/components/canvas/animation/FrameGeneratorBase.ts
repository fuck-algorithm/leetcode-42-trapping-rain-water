/**
 * FrameGeneratorBase
 * 
 * Base class for generating animation frames from algorithm execution.
 * Provides common functionality for frame generation and management.
 * 
 * Requirements: 7.1, 7.5
 */

import {
  AnimationFrame,
  ExecutionTrace,
  FrameGenerator,
  CodeLineBinding,
  createEmptyFrame,
  createEmptyCodeLineBinding,
  Language,
} from './types';
import { CanvasElement, Annotation, DataFlowArrow, ExecutionContext } from '../types';

/**
 * 帧生成器基类
 * 提供通用的帧生成和管理功能
 */
class FrameGeneratorBase implements FrameGenerator {
  protected frames: AnimationFrame[] = [];
  protected currentFrameNumber: number = 0;

  /**
   * 从输入生成动画帧
   * 子类应该重写此方法
   */
  generateFrames(input: any): AnimationFrame[] {
    this.frames = [];
    this.currentFrameNumber = 0;
    return this.frames;
  }

  /**
   * 获取帧总数
   */
  getFrameCount(): number {
    return this.frames.length;
  }

  /**
   * 获取指定索引的帧
   */
  getFrame(index: number): AnimationFrame | null {
    if (index < 0 || index >= this.frames.length) {
      return null;
    }
    return this.frames[index];
  }

  /**
   * 获取所有帧
   */
  getAllFrames(): AnimationFrame[] {
    return [...this.frames];
  }

  /**
   * 添加新帧
   */
  protected addFrame(
    description: string,
    options: Partial<AnimationFrame> = {}
  ): AnimationFrame {
    const frame: AnimationFrame = {
      id: `frame-${this.currentFrameNumber}`,
      frameNumber: this.currentFrameNumber,
      description,
      codeLineBindings: options.codeLineBindings || createEmptyCodeLineBinding(),
      canvasState: options.canvasState || {
        elements: [],
        highlightedElements: [],
        transform: { scale: 1, translateX: 0, translateY: 0 },
      },
      variables: options.variables || [],
      annotations: options.annotations || [],
      arrows: options.arrows || [],
      executionContext: options.executionContext,
    };

    this.frames.push(frame);
    this.currentFrameNumber++;
    return frame;
  }

  /**
   * 从执行轨迹创建帧
   */
  protected createFrameFromTrace(trace: ExecutionTrace): AnimationFrame {
    return this.addFrame(trace.description, {
      codeLineBindings: trace.codeLocation,
    });
  }

  /**
   * 批量从执行轨迹创建帧
   */
  protected createFramesFromTraces(traces: ExecutionTrace[]): AnimationFrame[] {
    return traces.map(trace => this.createFrameFromTrace(trace));
  }

  /**
   * 更新帧的画布状态
   */
  protected updateFrameCanvasState(
    frameIndex: number,
    elements: CanvasElement[],
    highlightedElements: string[] = []
  ): void {
    if (frameIndex >= 0 && frameIndex < this.frames.length) {
      this.frames[frameIndex].canvasState = {
        ...this.frames[frameIndex].canvasState,
        elements,
        highlightedElements,
      };
    }
  }

  /**
   * 添加标注到帧
   */
  protected addAnnotationToFrame(
    frameIndex: number,
    annotation: Annotation
  ): void {
    if (frameIndex >= 0 && frameIndex < this.frames.length) {
      this.frames[frameIndex].annotations.push(annotation);
    }
  }

  /**
   * 添加箭头到帧
   */
  protected addArrowToFrame(
    frameIndex: number,
    arrow: DataFlowArrow
  ): void {
    if (frameIndex >= 0 && frameIndex < this.frames.length) {
      this.frames[frameIndex].arrows.push(arrow);
    }
  }

  /**
   * 设置帧的执行上下文
   */
  protected setFrameExecutionContext(
    frameIndex: number,
    context: ExecutionContext
  ): void {
    if (frameIndex >= 0 && frameIndex < this.frames.length) {
      this.frames[frameIndex].executionContext = context;
    }
  }

  /**
   * 设置帧的代码行绑定
   */
  protected setFrameCodeLineBindings(
    frameIndex: number,
    bindings: CodeLineBinding
  ): void {
    if (frameIndex >= 0 && frameIndex < this.frames.length) {
      this.frames[frameIndex].codeLineBindings = bindings;
    }
  }

  /**
   * 清除所有帧
   */
  protected clearFrames(): void {
    this.frames = [];
    this.currentFrameNumber = 0;
  }

  /**
   * 获取最后一帧
   */
  protected getLastFrame(): AnimationFrame | null {
    if (this.frames.length === 0) {
      return null;
    }
    return this.frames[this.frames.length - 1];
  }

  /**
   * 复制上一帧的状态到新帧
   */
  protected cloneLastFrameState(): Partial<AnimationFrame> {
    const lastFrame = this.getLastFrame();
    if (!lastFrame) {
      return {};
    }

    return {
      canvasState: {
        elements: [...lastFrame.canvasState.elements],
        highlightedElements: [...lastFrame.canvasState.highlightedElements],
        transform: { ...lastFrame.canvasState.transform },
      },
      variables: lastFrame.variables.map(v => ({ ...v, changed: false })),
      executionContext: lastFrame.executionContext
        ? {
            stackFrames: [...lastFrame.executionContext.stackFrames],
            currentDepth: lastFrame.executionContext.currentDepth,
            callChain: [...lastFrame.executionContext.callChain],
          }
        : undefined,
    };
  }
}

export default FrameGeneratorBase;

/**
 * 创建执行轨迹的辅助函数
 */
export function createExecutionTrace(
  operation: string,
  description: string,
  stateSnapshot: any,
  codeLocation: CodeLineBinding
): ExecutionTrace {
  return {
    operation,
    description,
    stateSnapshot,
    codeLocation,
    timestamp: Date.now(),
  };
}

/**
 * 创建简单的代码行绑定
 * 当所有语言的行号相同时使用
 */
export function createSimpleCodeLineBinding(lineNumber: number): CodeLineBinding {
  return {
    java: [lineNumber],
    python: [lineNumber],
    golang: [lineNumber],
    javascript: [lineNumber],
  };
}
