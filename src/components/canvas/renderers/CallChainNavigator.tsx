/**
 * CallChainNavigator Component
 * 
 * Displays the call chain from entry point to current state with navigation support.
 * Allows users to click on any call in the chain to navigate to that frame.
 * 
 * Requirements: 6.6
 */

import React, { useMemo, useState } from 'react';

export interface CallChainItem {
  id: string;
  functionName: string;
  depth: number;
  isActive: boolean;
}

export interface CallChainNavigatorProps {
  callChain: CallChainItem[];
  x?: number;
  y?: number;
  maxWidth?: number;
  onNavigate?: (itemId: string) => void;
}

// 样式常量
const STYLES = {
  itemHeight: 24,
  itemMinWidth: 60,
  itemMaxWidth: 120,
  itemSpacing: 4,
  arrowWidth: 16,
  padding: 6,
  fontSize: 11,
  colors: {
    activeBg: '#1976d2',
    activeText: '#ffffff',
    inactiveBg: '#e3f2fd',
    inactiveText: '#1565c0',
    hoverBg: '#bbdefb',
    arrowColor: '#90a4ae',
    entryBg: '#4caf50',
    entryText: '#ffffff',
  },
};

/**
 * Single call chain item
 */
const CallChainItemRenderer: React.FC<{
  item: CallChainItem;
  index: number;
  x: number;
  y: number;
  width: number;
  isFirst: boolean;
  isLast: boolean;
  onNavigate?: () => void;
}> = ({ item, index, x, y, width, isFirst, isLast, onNavigate }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const bgColor = item.isActive 
    ? STYLES.colors.activeBg 
    : isFirst 
      ? STYLES.colors.entryBg
      : isHovered 
        ? STYLES.colors.hoverBg 
        : STYLES.colors.inactiveBg;
        
  const textColor = item.isActive || isFirst
    ? STYLES.colors.activeText
    : STYLES.colors.inactiveText;

  // 截断函数名
  const displayName = item.functionName.length > 12 
    ? item.functionName.slice(0, 10) + '..'
    : item.functionName;

  return (
    <g
      className="call-chain-item"
      data-testid={`call-chain-item-${item.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onNavigate}
      style={{ cursor: onNavigate ? 'pointer' : 'default' }}
    >
      {/* 背景 */}
      <rect
        x={x}
        y={y}
        width={width}
        height={STYLES.itemHeight}
        rx={4}
        fill={bgColor}
        stroke={item.isActive ? '#0d47a1' : 'transparent'}
        strokeWidth={item.isActive ? 2 : 0}
      />
      
      {/* 函数名 */}
      <text
        x={x + width / 2}
        y={y + STYLES.itemHeight / 2 + 4}
        textAnchor="middle"
        fontSize={STYLES.fontSize}
        fill={textColor}
        fontWeight={item.isActive ? 'bold' : 'normal'}
      >
        {displayName}
      </text>
      
      {/* 深度标签 */}
      {item.depth > 0 && (
        <text
          x={x + width - 4}
          y={y + 10}
          textAnchor="end"
          fontSize={8}
          fill={textColor}
          opacity={0.7}
        >
          {item.depth}
        </text>
      )}
      
      {/* 入口标记 */}
      {isFirst && (
        <text
          x={x + 4}
          y={y + 10}
          fontSize={8}
          fill={textColor}
          opacity={0.8}
        >
          入口
        </text>
      )}
      
      {/* 当前标记 */}
      {item.isActive && (
        <circle
          cx={x + width - 8}
          cy={y + STYLES.itemHeight / 2}
          r={4}
          fill="#ffeb3b"
        />
      )}
    </g>
  );
};

/**
 * Arrow between call chain items
 */
const CallChainArrow: React.FC<{
  x: number;
  y: number;
}> = ({ x, y }) => {
  const arrowY = y + STYLES.itemHeight / 2;
  
  return (
    <g className="call-chain-arrow">
      <line
        x1={x}
        y1={arrowY}
        x2={x + STYLES.arrowWidth - 4}
        y2={arrowY}
        stroke={STYLES.colors.arrowColor}
        strokeWidth={2}
      />
      <polygon
        points={`${x + STYLES.arrowWidth - 4},${arrowY - 4} ${x + STYLES.arrowWidth},${arrowY} ${x + STYLES.arrowWidth - 4},${arrowY + 4}`}
        fill={STYLES.colors.arrowColor}
      />
    </g>
  );
};

/**
 * Main CallChainNavigator component
 */
const CallChainNavigator: React.FC<CallChainNavigatorProps> = ({
  callChain,
  x = 0,
  y = 0,
  maxWidth = 600,
  onNavigate,
}) => {
  // 计算每个项目的宽度
  const itemWidths = useMemo(() => {
    return callChain.map(item => {
      const textWidth = item.functionName.length * 7 + STYLES.padding * 2;
      return Math.max(STYLES.itemMinWidth, Math.min(STYLES.itemMaxWidth, textWidth));
    });
  }, [callChain]);

  // 计算总宽度
  const totalWidth = useMemo(() => {
    const itemsWidth = itemWidths.reduce((sum, w) => sum + w, 0);
    const arrowsWidth = (callChain.length - 1) * (STYLES.arrowWidth + STYLES.itemSpacing * 2);
    return itemsWidth + arrowsWidth;
  }, [itemWidths, callChain.length]);

  // 计算是否需要压缩
  const needsCompression = totalWidth > maxWidth;
  const compressionRatio = needsCompression ? maxWidth / totalWidth : 1;

  // 计算每个项目的位置
  const itemPositions = useMemo(() => {
    const positions: { x: number; width: number }[] = [];
    let currentX = 0;
    
    callChain.forEach((_, index) => {
      const width = itemWidths[index] * compressionRatio;
      positions.push({ x: currentX, width });
      currentX += width + (STYLES.arrowWidth + STYLES.itemSpacing * 2) * compressionRatio;
    });
    
    return positions;
  }, [callChain, itemWidths, compressionRatio]);

  if (callChain.length === 0) {
    return null;
  }

  return (
    <g
      className="call-chain-navigator"
      data-testid="call-chain-navigator"
      transform={`translate(${x}, ${y})`}
    >
      {/* 标题 */}
      <text
        x={0}
        y={-8}
        fontSize={10}
        fill="#666"
      >
        调用链
      </text>
      
      {/* 调用链项目 */}
      {callChain.map((item, index) => (
        <React.Fragment key={item.id}>
          <CallChainItemRenderer
            item={item}
            index={index}
            x={itemPositions[index].x}
            y={0}
            width={itemPositions[index].width}
            isFirst={index === 0}
            isLast={index === callChain.length - 1}
            onNavigate={onNavigate ? () => onNavigate(item.id) : undefined}
          />
          
          {/* 箭头 (除了最后一个) */}
          {index < callChain.length - 1 && (
            <CallChainArrow
              x={itemPositions[index].x + itemPositions[index].width + STYLES.itemSpacing * compressionRatio}
              y={0}
            />
          )}
        </React.Fragment>
      ))}
      
      {/* 溢出指示器 */}
      {needsCompression && (
        <text
          x={maxWidth + 5}
          y={STYLES.itemHeight / 2 + 4}
          fontSize={10}
          fill="#999"
        >
          ...
        </text>
      )}
    </g>
  );
};

export default CallChainNavigator;

/**
 * Helper function to create call chain items from execution context
 * Uses index-based matching to handle duplicate function names correctly
 */
export function createCallChainFromContext(
  callChain: string[],
  stackFrames: { id: string; functionName: string; isActive: boolean }[]
): CallChainItem[] {
  return callChain.map((funcName, index) => {
    // 使用索引匹配，因为调用链和栈帧应该是一一对应的
    const frame = stackFrames[index];
    return {
      id: frame?.id || `call-${index}`,
      functionName: funcName,
      depth: index,
      isActive: frame?.isActive || false,
    };
  });
}
