/**
 * HashMapRenderer Component
 * 
 * Renders a HashMap as key-value pairs with clear visual separation.
 * Supports entry highlighting.
 * 
 * Requirements: 3.3
 */

import React from 'react';

// HashMap 条目
export interface HashMapEntry {
  key: string;
  value: any;
  highlighted?: boolean;
  highlightColor?: string;
}

// HashMap 渲染器属性
export interface HashMapRendererProps {
  entries: HashMapEntry[];
  x?: number;
  y?: number;
  keyWidth?: number;
  valueWidth?: number;
  rowHeight?: number;
  spacing?: number;
  fontSize?: number;
  title?: string;
  maxVisibleEntries?: number;
  defaultKeyColor?: string;
  defaultValueColor?: string;
  defaultHighlightColor?: string;
}

// 默认配置
const DEFAULT_CONFIG = {
  keyWidth: 50,
  valueWidth: 60,
  rowHeight: 28,
  spacing: 2,
  fontSize: 11,
  maxVisibleEntries: 10,
  defaultKeyColor: '#e8eaf6',
  defaultValueColor: '#fff3e0',
  defaultHighlightColor: '#ffeb3b',
};

const HashMapRenderer: React.FC<HashMapRendererProps> = ({
  entries,
  x = 0,
  y = 0,
  keyWidth = DEFAULT_CONFIG.keyWidth,
  valueWidth = DEFAULT_CONFIG.valueWidth,
  rowHeight = DEFAULT_CONFIG.rowHeight,
  spacing = DEFAULT_CONFIG.spacing,
  fontSize = DEFAULT_CONFIG.fontSize,
  title = 'HashMap',
  maxVisibleEntries = DEFAULT_CONFIG.maxVisibleEntries,
  defaultKeyColor = DEFAULT_CONFIG.defaultKeyColor,
  defaultValueColor = DEFAULT_CONFIG.defaultValueColor,
  defaultHighlightColor = DEFAULT_CONFIG.defaultHighlightColor,
}) => {
  // 限制显示的条目数量
  const visibleEntries = entries.slice(0, maxVisibleEntries);
  const hasHiddenEntries = entries.length > maxVisibleEntries;
  
  // 计算行Y位置
  const getRowY = (index: number) => y + 30 + index * (rowHeight + spacing);
  
  // 总宽度
  const totalWidth = keyWidth + valueWidth + 10;
  
  return (
    <g className="hashmap-renderer" data-testid="hashmap-renderer">
      {/* 标题 */}
      <text
        x={x + totalWidth / 2}
        y={y + 12}
        textAnchor="middle"
        fontSize={fontSize + 1}
        fontWeight="bold"
        fill="#333"
      >
        {title}
      </text>
      
      {/* 表头 */}
      <g className="hashmap-header">
        <rect
          x={x}
          y={y + 18}
          width={keyWidth}
          height={rowHeight - 5}
          fill="#5c6bc0"
          rx={3}
        />
        <text
          x={x + keyWidth / 2}
          y={y + 18 + (rowHeight - 5) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize - 1}
          fill="#fff"
          fontWeight="bold"
        >
          Key
        </text>
        
        <rect
          x={x + keyWidth + 5}
          y={y + 18}
          width={valueWidth}
          height={rowHeight - 5}
          fill="#ff7043"
          rx={3}
        />
        <text
          x={x + keyWidth + 5 + valueWidth / 2}
          y={y + 18 + (rowHeight - 5) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize - 1}
          fill="#fff"
          fontWeight="bold"
        >
          Value
        </text>
      </g>
      
      {/* 条目 */}
      {visibleEntries.map((entry, index) => {
        const rowY = getRowY(index);
        const isHighlighted = entry.highlighted;
        const keyColor = isHighlighted ? defaultHighlightColor : defaultKeyColor;
        const valueColor = isHighlighted ? defaultHighlightColor : defaultValueColor;
        
        return (
          <g 
            key={entry.key} 
            className="hashmap-entry"
            data-testid={`hashmap-entry-${entry.key}`}
          >
            {/* Key 单元格 */}
            <rect
              x={x}
              y={rowY}
              width={keyWidth}
              height={rowHeight}
              fill={keyColor}
              stroke={isHighlighted ? '#f57c00' : '#9fa8da'}
              strokeWidth={isHighlighted ? 2 : 1}
              rx={3}
            />
            <text
              x={x + keyWidth / 2}
              y={rowY + rowHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontWeight={isHighlighted ? 'bold' : 'normal'}
              fill="#333"
            >
              {entry.key}
            </text>
            
            {/* 箭头连接 */}
            <path
              d={`M ${x + keyWidth + 1} ${rowY + rowHeight / 2} L ${x + keyWidth + 4} ${rowY + rowHeight / 2}`}
              stroke="#666"
              strokeWidth={1}
            />
            
            {/* Value 单元格 */}
            <rect
              x={x + keyWidth + 5}
              y={rowY}
              width={valueWidth}
              height={rowHeight}
              fill={valueColor}
              stroke={isHighlighted ? '#f57c00' : '#ffab91'}
              strokeWidth={isHighlighted ? 2 : 1}
              rx={3}
            />
            <text
              x={x + keyWidth + 5 + valueWidth / 2}
              y={rowY + rowHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontWeight={isHighlighted ? 'bold' : 'normal'}
              fill="#333"
            >
              {String(entry.value)}
            </text>
          </g>
        );
      })}
      
      {/* 隐藏条目指示 */}
      {hasHiddenEntries && (
        <text
          x={x + totalWidth / 2}
          y={getRowY(visibleEntries.length) + 10}
          textAnchor="middle"
          fontSize={fontSize - 1}
          fill="#999"
        >
          ... ({entries.length - maxVisibleEntries} more)
        </text>
      )}
      
      {/* 空 HashMap 提示 */}
      {entries.length === 0 && (
        <text
          x={x + totalWidth / 2}
          y={y + 60}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#999"
          fontStyle="italic"
        >
          (空)
        </text>
      )}
    </g>
  );
};

export default HashMapRenderer;

/**
 * 辅助函数：从对象创建 HashMapEntry 列表
 */
export function createHashMapEntries(
  map: Record<string, any>,
  highlightKeys: string[] = [],
  highlightColor?: string
): HashMapEntry[] {
  return Object.entries(map).map(([key, value]) => ({
    key,
    value,
    highlighted: highlightKeys.includes(key),
    highlightColor,
  }));
}

/**
 * 计算 HashMap 渲染的总高度
 */
export function calculateHashMapHeight(
  entryCount: number,
  rowHeight: number = DEFAULT_CONFIG.rowHeight,
  spacing: number = DEFAULT_CONFIG.spacing,
  maxVisibleEntries: number = DEFAULT_CONFIG.maxVisibleEntries
): number {
  const visibleCount = Math.min(entryCount, maxVisibleEntries);
  return 30 + visibleCount * (rowHeight + spacing) + 20;
}

/**
 * 计算 HashMap 渲染的总宽度
 */
export function calculateHashMapWidth(
  keyWidth: number = DEFAULT_CONFIG.keyWidth,
  valueWidth: number = DEFAULT_CONFIG.valueWidth
): number {
  return keyWidth + valueWidth + 10;
}
