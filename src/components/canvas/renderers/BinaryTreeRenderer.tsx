/**
 * BinaryTreeRenderer Component
 * 
 * Renders a binary tree with nodes and parent-child connections.
 * Supports node annotations and highlighting.
 * 
 * Requirements: 3.1
 */

import React from 'react';

// 树节点
export interface TreeNode {
  id: string;
  value: any;
  left?: TreeNode;
  right?: TreeNode;
  highlighted?: boolean;
  highlightColor?: string;
  annotation?: string;
}

// 计算后的节点位置
interface NodePosition {
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
}

// 二叉树渲染器属性
export interface BinaryTreeRendererProps {
  root: TreeNode | null;
  x?: number;
  y?: number;
  nodeRadius?: number;
  levelHeight?: number;
  minHorizontalSpacing?: number;
  fontSize?: number;
  defaultColor?: string;
  defaultHighlightColor?: string;
}

// 默认配置
const DEFAULT_CONFIG = {
  nodeRadius: 20,
  levelHeight: 60,
  minHorizontalSpacing: 30,
  fontSize: 11,
  defaultColor: '#e3f2fd',
  defaultHighlightColor: '#4caf50',
};

/**
 * 计算树的布局
 */
function calculateTreeLayout(
  root: TreeNode | null,
  nodeRadius: number,
  levelHeight: number,
  minHorizontalSpacing: number
): { positions: NodePosition[]; width: number; height: number } {
  if (!root) {
    return { positions: [], width: 0, height: 0 };
  }
  
  const positions: NodePosition[] = [];
  let minX = 0;
  let maxX = 0;
  let maxDepth = 0;
  
  // 使用中序遍历分配 x 坐标
  let xCounter = 0;
  
  function inorderTraverse(node: TreeNode, depth: number): void {
    if (node.left) {
      inorderTraverse(node.left, depth + 1);
    }
    
    const x = xCounter * (nodeRadius * 2 + minHorizontalSpacing);
    const y = depth * levelHeight;
    
    positions.push({ node, x, y, depth });
    
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    maxDepth = Math.max(maxDepth, depth);
    
    xCounter++;
    
    if (node.right) {
      inorderTraverse(node.right, depth + 1);
    }
  }
  
  inorderTraverse(root, 0);
  
  // 调整所有位置使最小 x 为 0
  const offsetX = -minX + nodeRadius;
  positions.forEach(pos => {
    pos.x += offsetX;
  });
  
  return {
    positions,
    width: maxX - minX + nodeRadius * 2 + minHorizontalSpacing,
    height: (maxDepth + 1) * levelHeight + nodeRadius,
  };
}

/**
 * 获取节点位置映射
 */
function getPositionMap(positions: NodePosition[]): Map<string, NodePosition> {
  const map = new Map<string, NodePosition>();
  positions.forEach(pos => {
    map.set(pos.node.id, pos);
  });
  return map;
}

const BinaryTreeRenderer: React.FC<BinaryTreeRendererProps> = ({
  root,
  x = 0,
  y = 0,
  nodeRadius = DEFAULT_CONFIG.nodeRadius,
  levelHeight = DEFAULT_CONFIG.levelHeight,
  minHorizontalSpacing = DEFAULT_CONFIG.minHorizontalSpacing,
  fontSize = DEFAULT_CONFIG.fontSize,
  defaultColor = DEFAULT_CONFIG.defaultColor,
  defaultHighlightColor = DEFAULT_CONFIG.defaultHighlightColor,
}) => {
  if (!root) {
    return (
      <g className="binary-tree-renderer" data-testid="binary-tree-renderer">
        <text
          x={x + 50}
          y={y + 30}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#999"
          fontStyle="italic"
        >
          (空树)
        </text>
      </g>
    );
  }
  
  const { positions } = calculateTreeLayout(
    root,
    nodeRadius,
    levelHeight,
    minHorizontalSpacing
  );
  
  const positionMap = getPositionMap(positions);
  
  // 收集所有边
  const edges: { from: NodePosition; to: NodePosition }[] = [];
  
  function collectEdges(node: TreeNode): void {
    const fromPos = positionMap.get(node.id);
    if (!fromPos) return;
    
    if (node.left) {
      const toPos = positionMap.get(node.left.id);
      if (toPos) {
        edges.push({ from: fromPos, to: toPos });
      }
      collectEdges(node.left);
    }
    
    if (node.right) {
      const toPos = positionMap.get(node.right.id);
      if (toPos) {
        edges.push({ from: fromPos, to: toPos });
      }
      collectEdges(node.right);
    }
  }
  
  collectEdges(root);
  
  return (
    <g 
      className="binary-tree-renderer" 
      data-testid="binary-tree-renderer"
      transform={`translate(${x}, ${y})`}
    >
      {/* 绘制边 */}
      {edges.map((edge, index) => (
        <line
          key={`edge-${index}`}
          x1={edge.from.x}
          y1={edge.from.y + nodeRadius}
          x2={edge.to.x}
          y2={edge.to.y - nodeRadius}
          stroke="#999"
          strokeWidth={2}
        />
      ))}
      
      {/* 绘制节点 */}
      {positions.map(({ node, x: nodeX, y: nodeY }) => {
        const isHighlighted = node.highlighted;
        const fillColor = isHighlighted
          ? (node.highlightColor || defaultHighlightColor)
          : defaultColor;
        
        return (
          <g 
            key={node.id} 
            className="tree-node"
            data-testid={`tree-node-${node.id}`}
          >
            {/* 节点圆圈 */}
            <circle
              cx={nodeX}
              cy={nodeY}
              r={nodeRadius}
              fill={fillColor}
              stroke={isHighlighted ? '#2e7d32' : '#1976d2'}
              strokeWidth={isHighlighted ? 3 : 2}
            />
            
            {/* 节点值 */}
            <text
              x={nodeX}
              y={nodeY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontWeight={isHighlighted ? 'bold' : 'normal'}
              fill={isHighlighted ? '#fff' : '#333'}
            >
              {String(node.value)}
            </text>
            
            {/* 标注 */}
            {node.annotation && (
              <g className="tree-annotation">
                <rect
                  x={nodeX - 25}
                  y={nodeY - nodeRadius - 22}
                  width={50}
                  height={18}
                  fill="rgba(255, 193, 7, 0.9)"
                  stroke="#f57c00"
                  strokeWidth={1}
                  rx={3}
                />
                <text
                  x={nodeX}
                  y={nodeY - nodeRadius - 10}
                  textAnchor="middle"
                  fontSize={fontSize - 2}
                  fill="#333"
                  fontWeight="500"
                >
                  {node.annotation}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default BinaryTreeRenderer;

/**
 * 辅助函数：从数组创建二叉树（层序）
 */
export function createBinaryTreeFromArray(
  values: (any | null)[],
  highlightIds: string[] = [],
  annotations: Record<string, string> = {},
  highlightColor?: string
): TreeNode | null {
  if (values.length === 0 || values[0] === null) {
    return null;
  }
  
  const nodes: (TreeNode | null)[] = values.map((value, index) => {
    if (value === null) return null;
    return {
      id: `node-${index}`,
      value,
      highlighted: highlightIds.includes(`node-${index}`),
      highlightColor,
      annotation: annotations[`node-${index}`],
    };
  });
  
  // 建立父子关系
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node) {
      const leftIndex = 2 * i + 1;
      const rightIndex = 2 * i + 2;
      
      if (leftIndex < nodes.length) {
        node.left = nodes[leftIndex] || undefined;
      }
      if (rightIndex < nodes.length) {
        node.right = nodes[rightIndex] || undefined;
      }
    }
  }
  
  return nodes[0];
}

/**
 * 计算二叉树渲染的尺寸
 */
export function calculateTreeSize(
  root: TreeNode | null,
  nodeRadius: number = DEFAULT_CONFIG.nodeRadius,
  levelHeight: number = DEFAULT_CONFIG.levelHeight,
  minHorizontalSpacing: number = DEFAULT_CONFIG.minHorizontalSpacing
): { width: number; height: number } {
  const { width, height } = calculateTreeLayout(
    root,
    nodeRadius,
    levelHeight,
    minHorizontalSpacing
  );
  return { width, height };
}
