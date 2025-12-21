/**
 * StackRenderer Component
 * 
 * Renders a stack as a vertical arrangement of elements.
 * Shows top and bottom indicators, supports push/pop animations.
 * 
 * Requirements: 3.4
 */

import React from 'react';

// 栈元素
export interface StackItem {
  id: string;
  value: any;
  highlighted?: boolean;
  highlightColor?: string;
  annotation?: string;
}

// 栈渲染器属性
export interface StackRendererProps {
  items: StackItem[];
  x?: number;
  y?: number;
  itemWidth?: number;
  itemHeight?: number;
  spacing?: number;
  showLabels?: boolean;
  fontSize?: number;
  title?: string;
  maxVisibleItems?: number;
  defaultColor?: string;
  defaultHighlightColor?: string;
}

// 默认配置
const DEFAULT_CONFIG = {
  itemWidth: 60,
  itemHeight: 30,
  spacing: 2,
  fontSize: 11,
  maxVisibleItems: 10,
  defaultColor: '#e3f2fd',
  defaultHighlightColor: '#4caf50',
};

const StackRenderer: React.FC<StackRendererProps> = ({
  items,
  x = 0,
  y = 0,
  itemWidth = DEFAULT_CONFIG.itemWidth,
  itemHeight = DEFAULT_CONFIG.itemHeight,
  spacing = DEFAULT_CONFIG.spacing,
  showLabels = true,
  fontSize = DEFAULT_CONFIG.fontSize,
  title = 'Stack',
  maxVisibleItems = DEFAULT_CONFIG.maxVisibleItems,
  defaultColor = DEFAULT_CONFIG.defaultColor,
  defaultHighlightColor = DEFAULT_CONFIG.defaultHighlightColor,
}) => {
  // 限制显示的元素数量
  const visibleItems = items.slice(-maxVisibleItems);
  const hasHiddenItems = items.length > maxVisibleItems;
  
  // 计算栈的总高度
  const stackHeight = visibleItems.length * (itemHeight + spacing) + 40; // 40 for title and bottom label
  
  // 计算元素Y位置（栈顶在上）
  const getItemY = (index: number) => {
    const reversedIndex = visibleItems.length - 1 - index;
    return y + 25 + reversedIndex * (itemHeight + spacing);
  };
  
  return (
    <g className="stack-renderer" data-testid="stack-renderer">
      {/* 标题 */}
      <text
        x={x + itemWidth / 2}
        y={y + 10}
        textAnchor="middle"
        fontSize={fontSize + 1}
        fontWeight="bold"
        fill="#333"
      >
        {title}
      </text>
      
      {/* 栈容器边框 */}
      <rect
        x={x - 5}
        y={y + 18}
        width={itemWidth + 10}
        height={stackHeight - 15}
        fill="none"
        stroke="#999"
        strokeWidth={1}
        strokeDasharray="4,2"
        rx={4}
      />
      
      {/* 隐藏元素指示 */}
      {hasHiddenItems && (
        <text
          x={x + itemWidth / 2}
          y={y + stackHeight - 5}
          textAnchor="middle"
          fontSize={fontSize - 1}
          fill="#999"
        >
          ... ({items.length - maxVisibleItems} more)
        </text>
      )}
      
      {/* 栈底标签 */}
      {showLabels && visibleItems.length > 0 && (
        <text
          x={x + itemWidth + 15}
          y={getItemY(0) + itemHeight / 2 + 4}
          fontSize={fontSize - 1}
          fill="#666"
        >
          底
        </text>
      )}
      
      {/* 栈元素 */}
      {visibleItems.map((item, index) => {
        const itemY = getItemY(index);
        const isTop = index === visibleItems.length - 1;
        const isHighlighted = item.highlighted;
        const fillColor = isHighlighted
          ? (item.highlightColor || defaultHighlightColor)
          : defaultColor;
        
        return (
          <g 
            key={item.id} 
            className="stack-item"
            data-testid={`stack-item-${item.id}`}
          >
            {/* 元素背景 */}
            <rect
              x={x}
              y={itemY}
              width={itemWidth}
              height={itemHeight}
              fill={fillColor}
              stroke={isHighlighted ? '#2e7d32' : '#1976d2'}
              strokeWidth={isHighlighted ? 2 : 1}
              rx={3}
            />
            
            {/* 值显示 */}
            <text
              x={x + itemWidth / 2}
              y={itemY + itemHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontWeight={isHighlighted ? 'bold' : 'normal'}
              fill={isHighlighted ? '#fff' : '#333'}
            >
              {String(item.value)}
            </text>
            
            {/* 栈顶标签 */}
            {showLabels && isTop && (
              <g>
                <text
                  x={x + itemWidth + 15}
                  y={itemY + itemHeight / 2 + 4}
                  fontSize={fontSize - 1}
                  fill="#e91e63"
                  fontWeight="bold"
                >
                  顶
                </text>
                {/* 栈顶箭头 */}
                <path
                  d={`M ${x + itemWidth + 8} ${itemY + itemHeight / 2} L ${x + itemWidth + 3} ${itemY + itemHeight / 2}`}
                  stroke="#e91e63"
                  strokeWidth={2}
                  markerEnd="url(#stack-arrow)"
                />
              </g>
            )}
            
            {/* 标注 */}
            {item.annotation && (
              <g className="stack-annotation">
                <rect
                  x={x - 60}
                  y={itemY + 5}
                  width={55}
                  height={itemHeight - 10}
                  fill="rgba(255, 152, 0, 0.9)"
                  stroke="#f57c00"
                  strokeWidth={1}
                  rx={3}
                />
                <text
                  x={x - 32}
                  y={itemY + itemHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize - 2}
                  fill="#333"
                >
                  {item.annotation}
                </text>
              </g>
            )}
          </g>
        );
      })}
      
      {/* 空栈提示 */}
      {items.length === 0 && (
        <text
          x={x + itemWidth / 2}
          y={y + 50}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#999"
          fontStyle="italic"
        >
          (空栈)
        </text>
      )}
      
      {/* 箭头标记定义 */}
      <defs>
        <marker
          id="stack-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="0"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#e91e63" />
        </marker>
      </defs>
    </g>
  );
};

export default StackRenderer;

/**
 * 辅助函数：从数组创建 StackItem 列表
 */
export function createStackItems(
  values: any[],
  highlightIndices: number[] = [],
  annotations: Record<number, string> = {},
  highlightColor?: string
): StackItem[] {
  return values.map((value, index) => ({
    id: `stack-${index}`,
    value,
    highlighted: highlightIndices.includes(index),
    highlightColor,
    annotation: annotations[index],
  }));
}

/**
 * 计算栈渲染的总高度
 */
export function calculateStackHeight(
  itemCount: number,
  itemHeight: number = DEFAULT_CONFIG.itemHeight,
  spacing: number = DEFAULT_CONFIG.spacing,
  maxVisibleItems: number = DEFAULT_CONFIG.maxVisibleItems
): number {
  const visibleCount = Math.min(itemCount, maxVisibleItems);
  return visibleCount * (itemHeight + spacing) + 40;
}

/**
 * 计算栈渲染的总宽度
 */
export function calculateStackWidth(
  itemWidth: number = DEFAULT_CONFIG.itemWidth,
  showLabels: boolean = true
): number {
  return itemWidth + (showLabels ? 30 : 10);
}
