/**
 * AnimatedExecutionContext Component
 * 
 * Provides animated stack frame transitions for recursive algorithm visualization.
 * Supports push/pop animations and active frame highlighting.
 * 
 * Requirements: 6.2, 6.5
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExecutionContext, StackFrame } from '../types';
import ExecutionContextRenderer from './ExecutionContextRenderer';

export interface AnimatedExecutionContextProps {
  context: ExecutionContext;
  x?: number;
  y?: number;
  width?: number;
  frameHeight?: number;
  animationDuration?: number;
  onFrameClick?: (frameId: string) => void;
  onAnimationComplete?: () => void;
}

export interface StackFrameAnimation {
  type: 'push' | 'pop' | 'highlight';
  frameId: string;
  progress: number; // 0 to 1
}

// 动画状态
type AnimationState = 'idle' | 'pushing' | 'popping' | 'highlighting';

/**
 * Hook to manage stack frame animations
 */
export function useStackFrameAnimation(
  currentContext: ExecutionContext,
  animationDuration: number = 300
) {
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [animatingFrameId, setAnimatingFrameId] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const previousContextRef = useRef<ExecutionContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 检测栈帧变化
  useEffect(() => {
    const prevContext = previousContextRef.current;
    
    if (!prevContext) {
      previousContextRef.current = currentContext;
      return;
    }

    const prevFrameIds = new Set(prevContext.stackFrames.map(f => f.id));
    const currentFrameIds = new Set(currentContext.stackFrames.map(f => f.id));

    // 检测新增帧 (push)
    const newFrames = currentContext.stackFrames.filter(f => !prevFrameIds.has(f.id));
    if (newFrames.length > 0) {
      startAnimation('pushing', newFrames[newFrames.length - 1].id);
    }

    // 检测移除帧 (pop)
    const removedFrames = prevContext.stackFrames.filter(f => !currentFrameIds.has(f.id));
    if (removedFrames.length > 0 && newFrames.length === 0) {
      startAnimation('popping', removedFrames[removedFrames.length - 1].id);
    }

    // 检测活动帧变化 (highlight)
    const prevActive = prevContext.stackFrames.find(f => f.isActive);
    const currentActive = currentContext.stackFrames.find(f => f.isActive);
    if (prevActive?.id !== currentActive?.id && currentActive && newFrames.length === 0 && removedFrames.length === 0) {
      startAnimation('highlighting', currentActive.id);
    }

    previousContextRef.current = currentContext;
  }, [currentContext]);

  // 启动动画
  const startAnimation = useCallback((type: AnimationState, frameId: string) => {
    setAnimationState(type);
    setAnimatingFrameId(frameId);
    setAnimationProgress(0);

    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setAnimationState('idle');
        setAnimatingFrameId(null);
        setAnimationProgress(0);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animationDuration]);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    animationState,
    animatingFrameId,
    animationProgress,
    isAnimating: animationState !== 'idle',
  };
}

/**
 * Easing function for smooth animations
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

/**
 * Animated Stack Frame Component
 */
const AnimatedStackFrame: React.FC<{
  frame: StackFrame;
  index: number;
  totalFrames: number;
  x: number;
  y: number;
  width: number;
  height: number;
  animationType: AnimationState;
  animationProgress: number;
  isAnimating: boolean;
  onClick?: () => void;
}> = ({
  frame,
  index,
  totalFrames,
  x,
  y,
  width,
  height,
  animationType,
  animationProgress,
  isAnimating,
  onClick,
}) => {
  const spacing = 10;
  const baseY = y + (totalFrames - 1 - index) * (height + spacing);
  
  // 计算动画变换
  let transform = '';
  let opacity = 1;
  let scale = 1;

  if (isAnimating) {
    const easedProgress = easeOutCubic(animationProgress);
    
    switch (animationType) {
      case 'pushing':
        // 从上方滑入
        const slideDistance = 50;
        const slideY = slideDistance * (1 - easedProgress);
        opacity = easedProgress;
        transform = `translate(0, ${-slideY})`;
        scale = 0.8 + 0.2 * easedProgress;
        break;
        
      case 'popping':
        // 向上滑出并淡出
        const popDistance = 50 * easeInCubic(animationProgress);
        opacity = 1 - animationProgress;
        transform = `translate(0, ${-popDistance})`;
        scale = 1 - 0.2 * animationProgress;
        break;
        
      case 'highlighting':
        // 脉冲效果
        const pulse = Math.sin(animationProgress * Math.PI);
        scale = 1 + 0.05 * pulse;
        break;
    }
  }

  const isActive = frame.isActive;
  const activeColor = '#e3f2fd';
  const activeBorder = '#2196f3';
  const inactiveColor = '#f5f5f5';
  const inactiveBorder = '#bdbdbd';

  // 格式化参数
  const paramsText = frame.parameters
    .map(p => `${p.name}=${formatValue(p.value)}`)
    .join(', ');

  return (
    <g
      className="animated-stack-frame"
      data-testid={`animated-frame-${frame.id}`}
      transform={transform}
      style={{ 
        opacity,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <g transform={`translate(${x}, ${baseY}) scale(${scale})`}>
        {/* 帧背景 */}
        <rect
          width={width}
          height={height}
          rx={4}
          fill={isActive ? activeColor : inactiveColor}
          stroke={isActive ? activeBorder : inactiveBorder}
          strokeWidth={isActive ? 2 : 1}
        />
        
        {/* 帧头部 */}
        <rect
          width={width}
          height={24}
          rx={4}
          fill={isActive ? '#1976d2' : inactiveBorder}
        />
        <rect
          y={20}
          width={width}
          height={4}
          fill={isActive ? '#1976d2' : inactiveBorder}
        />
        
        {/* 帧索引 */}
        <text
          x={8}
          y={16}
          fontSize={12}
          fill="#ffffff"
          fontWeight="bold"
        >
          #{index} {isActive ? '(当前)' : ''}
        </text>
        
        {/* 函数名 */}
        <text
          x={8}
          y={40}
          fontSize={11}
          fill="#1565c0"
          fontWeight="bold"
        >
          {frame.functionName}({paramsText})
        </text>
        
        {/* 局部变量 */}
        {frame.localVariables.length > 0 && (
          <text
            x={8}
            y={56}
            fontSize={10}
            fill="#666"
          >
            局部: {frame.localVariables.slice(0, 2).map(v => 
              `${v.name}=${formatValue(v.value)}`
            ).join(', ')}
          </text>
        )}
        
        {/* 返回值 */}
        {frame.returnValue !== undefined && (
          <text
            x={8}
            y={72}
            fontSize={10}
            fill="#ff9800"
            fontWeight="bold"
          >
            返回: {formatValue(frame.returnValue)}
          </text>
        )}
      </g>
    </g>
  );
};

/**
 * Format value for display
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (Array.isArray(value)) {
    if (value.length <= 3) return `[${value.join(', ')}]`;
    return `[${value.slice(0, 3).join(', ')}...]`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value).slice(0, 15) + '...';
  }
  return String(value);
}

/**
 * Main AnimatedExecutionContext component
 */
const AnimatedExecutionContext: React.FC<AnimatedExecutionContextProps> = ({
  context,
  x = 0,
  y = 0,
  width = 200,
  frameHeight = 80,
  animationDuration = 300,
  onFrameClick,
  onAnimationComplete,
}) => {
  const {
    animationState,
    animatingFrameId,
    animationProgress,
    isAnimating,
  } = useStackFrameAnimation(context, animationDuration);

  // 动画完成回调
  useEffect(() => {
    if (!isAnimating && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [isAnimating, onAnimationComplete]);

  const { stackFrames, currentDepth, callChain } = context;

  if (stackFrames.length === 0) {
    return null;
  }

  return (
    <g
      className="animated-execution-context"
      data-testid="animated-execution-context"
      transform={`translate(${x}, ${y})`}
    >
      {/* 标题 */}
      <text
        x={0}
        y={-10}
        fontSize={14}
        fontWeight="bold"
        fill="#333"
      >
        执行上下文
      </text>
      
      {/* 递归深度指示器 */}
      <g transform={`translate(${width - 80}, -35)`}>
        <rect
          width={80}
          height={28}
          rx={14}
          fill="#ff9800"
        />
        <text
          x={40}
          y={18}
          textAnchor="middle"
          fontSize={12}
          fill="#ffffff"
          fontWeight="bold"
        >
          深度: {currentDepth}
        </text>
      </g>
      
      {/* 调用链 */}
      {callChain.length > 0 && (
        <g data-testid="call-chain">
          <rect
            x={0}
            y={5}
            width={width}
            height={24}
            rx={4}
            fill="#fff3e0"
            stroke="#e65100"
          />
          <text
            x={8}
            y={21}
            fontSize={10}
            fill="#e65100"
          >
            调用链: {callChain.join(' → ').slice(-40)}
          </text>
        </g>
      )}
      
      {/* 动画栈帧 */}
      <g transform={`translate(0, ${callChain.length > 0 ? 40 : 10})`}>
        <text
          x={width / 2}
          y={-5}
          textAnchor="middle"
          fontSize={10}
          fill="#999"
        >
          ↑ 栈顶
        </text>
        
        {stackFrames.map((frame, index) => (
          <AnimatedStackFrame
            key={frame.id}
            frame={frame}
            index={index}
            totalFrames={stackFrames.length}
            x={0}
            y={10}
            width={width}
            height={frameHeight}
            animationType={animatingFrameId === frame.id ? animationState : 'idle'}
            animationProgress={animatingFrameId === frame.id ? animationProgress : 0}
            isAnimating={animatingFrameId === frame.id && isAnimating}
            onClick={onFrameClick ? () => onFrameClick(frame.id) : undefined}
          />
        ))}
        
        <text
          x={width / 2}
          y={stackFrames.length * (frameHeight + 10) + 20}
          textAnchor="middle"
          fontSize={10}
          fill="#999"
        >
          ↓ 栈底
        </text>
      </g>
      
      {/* 动画状态指示器 (调试用) */}
      {isAnimating && (
        <g transform={`translate(${width + 10}, 0)`} data-testid="animation-indicator">
          <rect
            width={60}
            height={20}
            rx={4}
            fill={animationState === 'pushing' ? '#4caf50' : 
                  animationState === 'popping' ? '#f44336' : '#2196f3'}
            opacity={0.8}
          />
          <text
            x={30}
            y={14}
            textAnchor="middle"
            fontSize={10}
            fill="#fff"
          >
            {animationState === 'pushing' ? 'PUSH' :
             animationState === 'popping' ? 'POP' : 'FOCUS'}
          </text>
        </g>
      )}
    </g>
  );
};

export default AnimatedExecutionContext;

// 导出辅助函数用于外部使用
export { easeOutCubic, easeInCubic };
