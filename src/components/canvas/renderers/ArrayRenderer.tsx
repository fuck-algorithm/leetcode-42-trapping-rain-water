/**
 * ArrayRenderer Component
 * 
 * Renders an array as a horizontal sequence of cells with index labels.
 * Supports element highlighting and annotations.
 * 
 * Requirements: 3.2
 */

import React from 'react';

// 数组元素
export interface ArrayElement {
  index: number;
  value: any;
  highlighted?: boolean;
  highlightColor?: string;
  annotation?: string;
}

// 数组渲染器属性
export interface ArrayRendererProps {
  elements: ArrayElement[];
  x?: number;
  y?: number;
  cellWidth?: number;
  cellHeight?: number;
  spacing?: number;
  showIndices?: boolean;
  showValues?: boolean;
  fontSize?: number;
  defaultColor?: string;
  defaultHighlightColor?: string;
}

// 默认配置
const DEFAULT_CONFIG = {
  cellWidth: 40,
  cellHeight: 40,
  spacing: 2,
  fontSize: 12,
  defaultColor: '#f0f0f0',
  defaultHighlightColor: '#ffc107',
};

const ArrayRenderer: React.FC<ArrayRendererProps> = ({
  elements,
  x = 0,
  y = 0,
  cellWidth = DEFAULT_CONFIG.cellWidth,
  cellHeight = DEFAULT_CONFIG.cellHeight,
  spacing = DEFAULT_CONFIG.spacing,
  showIndices = true,
  showValues = true,
  fontSize = DEFAULT_CONFIG.fontSize,
  defaultColor = DEFAULT_CONFIG.defaultColor,
  defaultHighlightColor = DEFAULT_CONFIG.defaultHighlightColor,
}) => {
  // 计算单元格位置
  const getCellX = (index: number) => x + index * (cellWidth + spacing);
  
  return (
    <g className="array-renderer" data-testid="array-renderer">
      {elements.map((element, i) => {
        const cellX = getCellX(i);
        const isHighlighted = element.highlighted;
        const fillColor = isHighlighted 
          ? (element.highlightColor || defaultHighlightColor)
          : defaultColor;
        
        return (
          <g 
            key={`array-cell-${element.index}`} 
            className="array-cell"
            data-testid={`array-cell-${element.index}`}
          >
            {/* 单元格背景 */}
            <rect
              x={cellX}
              y={y}
              width={cellWidth}
              height={cellHeight}
              fill={fillColor}
              stroke="#333"
              strokeWidth={isHighlighted ? 2 : 1}
              rx={3}
              ry={3}
            />
            
            {/* 值显示 */}
            {showValues && (
              <text
                x={cellX + cellWidth / 2}
                y={y + cellHeight / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight={isHighlighted ? 'bold' : 'normal'}
                fill="#333"
              >
                {String(element.value)}
              </text>
            )}
            
            {/* 索引标签 */}
            {showIndices && (
              <text
                x={cellX + cellWidth / 2}
                y={y + cellHeight + 12}
                textAnchor="middle"
                fontSize={fontSize - 2}
                fill="#666"
              >
                {element.index}
              </text>
            )}
            
            {/* 标注 */}
            {element.annotation && (
              <g className="array-annotation">
                <rect
                  x={cellX - 5}
                  y={y - 25}
                  width={cellWidth + 10}
                  height={18}
                  fill="rgba(255, 193, 7, 0.9)"
                  stroke="#f57c00"
                  strokeWidth={1}
                  rx={3}
                />
                <text
                  x={cellX + cellWidth / 2}
                  y={y - 13}
                  textAnchor="middle"
                  fontSize={fontSize - 2}
                  fill="#333"
                  fontWeight="500"
                >
                  {element.annotation}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default ArrayRenderer;

/**
 * 辅助函数：从数组创建 ArrayElement 列表
 */
export function createArrayElements(
  values: any[],
  highlightIndices: number[] = [],
  annotations: Record<number, string> = {},
  highlightColor?: string
): ArrayElement[] {
  return values.map((value, index) => ({
    index,
    value,
    highlighted: highlightIndices.includes(index),
    highlightColor,
    annotation: annotations[index],
  }));
}

/**
 * 计算数组渲染的总宽度
 */
export function calculateArrayWidth(
  elementCount: number,
  cellWidth: number = DEFAULT_CONFIG.cellWidth,
  spacing: number = DEFAULT_CONFIG.spacing
): number {
  if (elementCount <= 0) return 0;
  return elementCount * cellWidth + (elementCount - 1) * spacing;
}

/**
 * 计算数组渲染的总高度（包括索引标签）
 */
export function calculateArrayHeight(
  cellHeight: number = DEFAULT_CONFIG.cellHeight,
  showIndices: boolean = true,
  hasAnnotations: boolean = false
): number {
  let height = cellHeight;
  if (showIndices) height += 15; // 索引标签高度
  if (hasAnnotations) height += 25; // 标注高度
  return height;
}
