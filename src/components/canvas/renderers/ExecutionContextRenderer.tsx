/**
 * ExecutionContextRenderer Component
 * 
 * Renders the execution context including stack frames, recursion depth,
 * and call chain for recursive algorithm visualization.
 * 
 * Requirements: 6.1, 6.3, 6.4
 */

import React, { useMemo } from 'react';
import { ExecutionContext, StackFrame } from '../types';

export interface ExecutionContextRendererProps {
  context: ExecutionContext;
  x?: number;
  y?: number;
  width?: number;
  frameHeight?: number;
  onFrameClick?: (frameId: string) => void;
}

// 样式常量
const STYLES = {
  frameWidth: 200,
  frameHeight: 80,
  frameSpacing: 10,
  headerHeight: 24,
  padding: 8,
  fontSize: {
    header: 12,
    functionName: 11,
    variable: 10,
  },
  colors: {
    activeFrame: '#e3f2fd',
    activeBorder: '#2196f3',
    inactiveFrame: '#f5f5f5',
    inactiveBorder: '#bdbdbd',
    headerBg: '#1976d2',
    headerText: '#ffffff',
    functionName: '#1565c0',
    paramLabel: '#666666',
    paramValue: '#333333',
    depthIndicator: '#ff9800',
    callChainBg: '#fff3e0',
    callChainText: '#e65100',
  },
};

/**
 * Renders a single stack frame
 */
const StackFrameRenderer: React.FC<{
  frame: StackFrame;
  index: number;
  totalFrames: number;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
}> = ({ frame, index, totalFrames, x, y, width, height, onClick }) => {
  const isActive = frame.isActive;
  const frameY = y + (totalFrames - 1 - index) * (height + STYLES.frameSpacing);
  
  // 格式化参数显示
  const paramsText = frame.parameters
    .map(p => `${p.name}=${formatValue(p.value)}`)
    .join(', ');
  
  // 格式化局部变量显示
  const localsText = frame.localVariables
    .slice(0, 3) // 最多显示3个
    .map(v => `${v.name}=${formatValue(v.value)}`)
    .join(', ');
  
  const hasMoreLocals = frame.localVariables.length > 3;

  return (
    <g 
      className="stack-frame" 
      data-testid={`stack-frame-${frame.id}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* 帧背景 */}
      <rect
        x={x}
        y={frameY}
        width={width}
        height={height}
        rx={4}
        ry={4}
        fill={isActive ? STYLES.colors.activeFrame : STYLES.colors.inactiveFrame}
        stroke={isActive ? STYLES.colors.activeBorder : STYLES.colors.inactiveBorder}
        strokeWidth={isActive ? 2 : 1}
      />
      
      {/* 帧头部 - 显示帧索引 */}
      <rect
        x={x}
        y={frameY}
        width={width}
        height={STYLES.headerHeight}
        rx={4}
        ry={4}
        fill={isActive ? STYLES.colors.headerBg : STYLES.colors.inactiveBorder}
      />
      <rect
        x={x}
        y={frameY + STYLES.headerHeight - 4}
        width={width}
        height={4}
        fill={isActive ? STYLES.colors.headerBg : STYLES.colors.inactiveBorder}
      />
      
      {/* 帧索引标签 */}
      <text
        x={x + STYLES.padding}
        y={frameY + STYLES.headerHeight / 2 + 4}
        fontSize={STYLES.fontSize.header}
        fill={STYLES.colors.headerText}
        fontWeight="bold"
      >
        #{index} {isActive ? '(当前)' : ''}
      </text>
      
      {/* 函数名 */}
      <text
        x={x + STYLES.padding}
        y={frameY + STYLES.headerHeight + 16}
        fontSize={STYLES.fontSize.functionName}
        fill={STYLES.colors.functionName}
        fontWeight="bold"
      >
        {frame.functionName}({paramsText})
      </text>
      
      {/* 局部变量 */}
      {frame.localVariables.length > 0 && (
        <text
          x={x + STYLES.padding}
          y={frameY + STYLES.headerHeight + 32}
          fontSize={STYLES.fontSize.variable}
          fill={STYLES.colors.paramLabel}
        >
          局部: {localsText}{hasMoreLocals ? '...' : ''}
        </text>
      )}
      
      {/* 返回值 (如果有) */}
      {frame.returnValue !== undefined && (
        <text
          x={x + STYLES.padding}
          y={frameY + STYLES.headerHeight + 48}
          fontSize={STYLES.fontSize.variable}
          fill={STYLES.colors.depthIndicator}
          fontWeight="bold"
        >
          返回: {formatValue(frame.returnValue)}
        </text>
      )}
    </g>
  );
};

/**
 * Renders the recursion depth indicator
 */
const DepthIndicator: React.FC<{
  depth: number;
  x: number;
  y: number;
}> = ({ depth, x, y }) => {
  return (
    <g className="depth-indicator" data-testid="depth-indicator">
      <rect
        x={x}
        y={y}
        width={80}
        height={28}
        rx={14}
        fill={STYLES.colors.depthIndicator}
      />
      <text
        x={x + 40}
        y={y + 18}
        textAnchor="middle"
        fontSize={12}
        fill="#ffffff"
        fontWeight="bold"
      >
        深度: {depth}
      </text>
    </g>
  );
};

/**
 * Renders the call chain
 */
const CallChainRenderer: React.FC<{
  callChain: string[];
  x: number;
  y: number;
  maxWidth: number;
}> = ({ callChain, x, y, maxWidth }) => {
  if (callChain.length === 0) return null;
  
  const chainText = callChain.join(' → ');
  const displayText = chainText.length > 50 
    ? '...' + chainText.slice(-47) 
    : chainText;

  return (
    <g className="call-chain" data-testid="call-chain">
      <rect
        x={x}
        y={y}
        width={maxWidth}
        height={24}
        rx={4}
        fill={STYLES.colors.callChainBg}
        stroke={STYLES.colors.callChainText}
        strokeWidth={1}
      />
      <text
        x={x + 8}
        y={y + 16}
        fontSize={10}
        fill={STYLES.colors.callChainText}
      >
        调用链: {displayText}
      </text>
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
    if (value.length <= 3) {
      return `[${value.join(', ')}]`;
    }
    return `[${value.slice(0, 3).join(', ')}...]`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value).slice(0, 20) + '...';
  }
  return String(value);
}

/**
 * Main ExecutionContextRenderer component
 */
const ExecutionContextRenderer: React.FC<ExecutionContextRendererProps> = ({
  context,
  x = 0,
  y = 0,
  width = STYLES.frameWidth,
  frameHeight = STYLES.frameHeight,
  onFrameClick,
}) => {
  const { stackFrames, currentDepth, callChain } = context;
  
  // 计算总高度
  const totalHeight = useMemo(() => {
    const framesHeight = stackFrames.length * (frameHeight + STYLES.frameSpacing);
    const depthIndicatorHeight = 40;
    const callChainHeight = callChain.length > 0 ? 36 : 0;
    return framesHeight + depthIndicatorHeight + callChainHeight;
  }, [stackFrames.length, frameHeight, callChain.length]);

  if (stackFrames.length === 0) {
    return null;
  }

  return (
    <g 
      className="execution-context-renderer" 
      data-testid="execution-context-renderer"
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
      <DepthIndicator 
        depth={currentDepth} 
        x={width - 80} 
        y={-35}
      />
      
      {/* 调用链 */}
      <CallChainRenderer
        callChain={callChain}
        x={0}
        y={5}
        maxWidth={width}
      />
      
      {/* 栈帧列表 */}
      <g transform={`translate(0, ${callChain.length > 0 ? 40 : 10})`}>
        {/* 栈标签 */}
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
          <StackFrameRenderer
            key={frame.id}
            frame={frame}
            index={index}
            totalFrames={stackFrames.length}
            x={0}
            y={10}
            width={width}
            height={frameHeight}
            onClick={onFrameClick ? () => onFrameClick(frame.id) : undefined}
          />
        ))}
        
        {/* 栈底标签 */}
        <text
          x={width / 2}
          y={stackFrames.length * (frameHeight + STYLES.frameSpacing) + 20}
          textAnchor="middle"
          fontSize={10}
          fill="#999"
        >
          ↓ 栈底
        </text>
      </g>
    </g>
  );
};

export default ExecutionContextRenderer;

// 导出辅助函数用于测试
export { formatValue, STYLES };
