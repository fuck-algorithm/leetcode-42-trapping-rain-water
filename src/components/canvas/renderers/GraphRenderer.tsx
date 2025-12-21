/**
 * GraphRenderer Component
 * 
 * Renders a graph with nodes and edges.
 * Supports directed edges with arrow indicators.
 * Uses force-directed or hierarchical layout.
 * 
 * Requirements: 3.5
 */

import React, { useMemo } from 'react';

// 图节点
export interface GraphNode {
  id: string;
  value: any;
  x?: number;
  y?: number;
  highlighted?: boolean;
  highlightColor?: string;
  annotation?: string;
}

// 图边
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  directed?: boolean;
  highlighted?: boolean;
  highlightColor?: string;
}

// 图渲染器属性
export interface GraphRendererProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  nodeRadius?: number;
  fontSize?: number;
  defaultNodeColor?: string;
  defaultEdgeColor?: string;
  defaultHighlightColor?: string;
  layout?: 'force' | 'circular' | 'grid';
}

// 默认配置
const DEFAULT_CONFIG = {
  width: 400,
  height: 300,
  nodeRadius: 20,
  fontSize: 11,
  defaultNodeColor: '#e8eaf6',
  defaultEdgeColor: '#999',
  defaultHighlightColor: '#4caf50',
};

/**
 * 计算圆形布局
 */
function calculateCircularLayout(
  nodes: GraphNode[],
  width: number,
  height: number,
  nodeRadius: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - nodeRadius - 20;
  
  nodes.forEach((node, index) => {
    if (node.x !== undefined && node.y !== undefined) {
      positions.set(node.id, { x: node.x, y: node.y });
    } else {
      const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
  });
  
  return positions;
}

/**
 * 计算网格布局
 */
function calculateGridLayout(
  nodes: GraphNode[],
  width: number,
  height: number,
  nodeRadius: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  const cellWidth = (width - nodeRadius * 2) / cols;
  const cellHeight = (height - nodeRadius * 2) / rows;
  
  nodes.forEach((node, index) => {
    if (node.x !== undefined && node.y !== undefined) {
      positions.set(node.id, { x: node.x, y: node.y });
    } else {
      const col = index % cols;
      const row = Math.floor(index / cols);
      positions.set(node.id, {
        x: nodeRadius + col * cellWidth + cellWidth / 2,
        y: nodeRadius + row * cellHeight + cellHeight / 2,
      });
    }
  });
  
  return positions;
}

/**
 * 计算边的路径
 */
function calculateEdgePath(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  nodeRadius: number,
  directed: boolean
): { path: string; labelPos: { x: number; y: number }; angle: number } {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) {
    return {
      path: '',
      labelPos: { x: sourcePos.x, y: sourcePos.y },
      angle: 0,
    };
  }
  
  // 计算起点和终点（考虑节点半径）
  const unitX = dx / distance;
  const unitY = dy / distance;
  
  const startX = sourcePos.x + unitX * nodeRadius;
  const startY = sourcePos.y + unitY * nodeRadius;
  const endX = targetPos.x - unitX * (nodeRadius + (directed ? 8 : 0));
  const endY = targetPos.y - unitY * (nodeRadius + (directed ? 8 : 0));
  
  // 标签位置在边的中点
  const labelPos = {
    x: (startX + endX) / 2,
    y: (startY + endY) / 2 - 8,
  };
  
  // 计算角度（用于箭头）
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  return {
    path: `M ${startX} ${startY} L ${endX} ${endY}`,
    labelPos,
    angle,
  };
}

const GraphRenderer: React.FC<GraphRendererProps> = ({
  nodes,
  edges,
  x = 0,
  y = 0,
  width = DEFAULT_CONFIG.width,
  height = DEFAULT_CONFIG.height,
  nodeRadius = DEFAULT_CONFIG.nodeRadius,
  fontSize = DEFAULT_CONFIG.fontSize,
  defaultNodeColor = DEFAULT_CONFIG.defaultNodeColor,
  defaultEdgeColor = DEFAULT_CONFIG.defaultEdgeColor,
  defaultHighlightColor = DEFAULT_CONFIG.defaultHighlightColor,
  layout = 'circular',
}) => {
  // 计算节点位置
  const nodePositions = useMemo(() => {
    switch (layout) {
      case 'grid':
        return calculateGridLayout(nodes, width, height, nodeRadius);
      case 'circular':
      default:
        return calculateCircularLayout(nodes, width, height, nodeRadius);
    }
  }, [nodes, width, height, nodeRadius, layout]);
  
  if (nodes.length === 0) {
    return (
      <g className="graph-renderer" data-testid="graph-renderer">
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fontSize={fontSize}
          fill="#999"
          fontStyle="italic"
        >
          (空图)
        </text>
      </g>
    );
  }
  
  return (
    <g 
      className="graph-renderer" 
      data-testid="graph-renderer"
      transform={`translate(${x}, ${y})`}
    >
      {/* 箭头标记定义 */}
      <defs>
        <marker
          id="graph-arrow"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={defaultEdgeColor} />
        </marker>
        <marker
          id="graph-arrow-highlight"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={defaultHighlightColor} />
        </marker>
      </defs>
      
      {/* 绘制边 */}
      {edges.map((edge) => {
        const sourcePos = nodePositions.get(edge.source);
        const targetPos = nodePositions.get(edge.target);
        
        if (!sourcePos || !targetPos) return null;
        
        const { path, labelPos } = calculateEdgePath(
          sourcePos,
          targetPos,
          nodeRadius,
          edge.directed ?? true
        );
        
        const isHighlighted = edge.highlighted;
        const strokeColor = isHighlighted
          ? (edge.highlightColor || defaultHighlightColor)
          : defaultEdgeColor;
        
        return (
          <g key={edge.id} className="graph-edge" data-testid={`graph-edge-${edge.id}`}>
            <path
              d={path}
              stroke={strokeColor}
              strokeWidth={isHighlighted ? 3 : 2}
              fill="none"
              markerEnd={edge.directed !== false 
                ? (isHighlighted ? 'url(#graph-arrow-highlight)' : 'url(#graph-arrow)')
                : undefined
              }
            />
            
            {/* 边标签 */}
            {edge.label && (
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                fontSize={fontSize - 1}
                fill={strokeColor}
                fontWeight={isHighlighted ? 'bold' : 'normal'}
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
      
      {/* 绘制节点 */}
      {nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;
        
        const isHighlighted = node.highlighted;
        const fillColor = isHighlighted
          ? (node.highlightColor || defaultHighlightColor)
          : defaultNodeColor;
        
        return (
          <g 
            key={node.id} 
            className="graph-node"
            data-testid={`graph-node-${node.id}`}
          >
            {/* 节点圆圈 */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={nodeRadius}
              fill={fillColor}
              stroke={isHighlighted ? '#2e7d32' : '#5c6bc0'}
              strokeWidth={isHighlighted ? 3 : 2}
            />
            
            {/* 节点值 */}
            <text
              x={pos.x}
              y={pos.y}
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
              <g className="graph-annotation">
                <rect
                  x={pos.x - 25}
                  y={pos.y - nodeRadius - 22}
                  width={50}
                  height={18}
                  fill="rgba(255, 193, 7, 0.9)"
                  stroke="#f57c00"
                  strokeWidth={1}
                  rx={3}
                />
                <text
                  x={pos.x}
                  y={pos.y - nodeRadius - 10}
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

export default GraphRenderer;

/**
 * 辅助函数：从邻接表创建图
 */
export function createGraphFromAdjacencyList(
  adjacencyList: Record<string, string[]>,
  nodeValues?: Record<string, any>,
  highlightNodes: string[] = [],
  highlightEdges: string[] = [],
  directed: boolean = true
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = Object.keys(adjacencyList).map(id => ({
    id,
    value: nodeValues?.[id] ?? id,
    highlighted: highlightNodes.includes(id),
  }));
  
  const edges: GraphEdge[] = [];
  const addedEdges = new Set<string>();
  
  Object.entries(adjacencyList).forEach(([source, targets]) => {
    targets.forEach(target => {
      const edgeId = directed ? `${source}-${target}` : [source, target].sort().join('-');
      
      if (!addedEdges.has(edgeId)) {
        addedEdges.add(edgeId);
        edges.push({
          id: edgeId,
          source,
          target,
          directed,
          highlighted: highlightEdges.includes(edgeId),
        });
      }
    });
  });
  
  return { nodes, edges };
}
