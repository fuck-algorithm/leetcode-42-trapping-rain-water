/**
 * InteractiveCanvas Component
 * 
 * A D3.js-based SVG canvas component with zoom and pan capabilities.
 * Supports mouse wheel zoom, drag pan, touch pinch zoom, and double-click reset.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.6
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  InteractiveCanvasProps, 
  CanvasTransform, 
  DEFAULT_TRANSFORM,
  ZOOM_LIMITS 
} from './types';
import './InteractiveCanvas.css';

const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  width,
  height,
  elements = [],
  annotations = [],
  arrows = [],
  executionContext,
  onZoomChange,
  onPanChange,
  onTransformChange,
  children,
  minZoom = ZOOM_LIMITS.min,
  maxZoom = ZOOM_LIMITS.max,
  initialTransform = DEFAULT_TRANSFORM,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  const [transform, setTransform] = useState<CanvasTransform>(initialTransform);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // 重置视图到默认状态
  const resetView = useCallback(() => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition()
        .duration(300)
        .call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity
        );
    }
  }, []);

  // 缩放到指定级别
  const zoomTo = useCallback((scale: number) => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      const currentTransform = d3.zoomTransform(svgRef.current);
      
      svg.transition()
        .duration(200)
        .call(
          zoomBehaviorRef.current.scaleTo,
          Math.max(minZoom, Math.min(maxZoom, scale)),
          [width / 2, height / 2]
        );
    }
  }, [width, height, minZoom, maxZoom]);

  // 放大
  const zoomIn = useCallback(() => {
    zoomTo(transform.scale * 1.2);
  }, [transform.scale, zoomTo]);

  // 缩小
  const zoomOut = useCallback(() => {
    zoomTo(transform.scale / 1.2);
  }, [transform.scale, zoomTo]);

  // 初始化 D3 zoom 行为
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // 创建 zoom 行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([minZoom, maxZoom])
      .on('start', () => {
        setIsUserInteracting(true);
      })
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { transform: d3Transform } = event;
        
        const newTransform: CanvasTransform = {
          scale: d3Transform.k,
          translateX: d3Transform.x,
          translateY: d3Transform.y,
        };
        
        setTransform(newTransform);
        
        // 应用变换到容器
        if (containerRef.current) {
          d3.select(containerRef.current)
            .attr('transform', d3Transform.toString());
        }
        
        // 触发回调
        onZoomChange?.(d3Transform.k);
        onPanChange?.({ x: d3Transform.x, y: d3Transform.y });
        onTransformChange?.(newTransform);
      })
      .on('end', () => {
        setIsUserInteracting(false);
      });

    // 应用 zoom 行为到 SVG
    svg.call(zoom);
    
    // 双击重置视图
    svg.on('dblclick.zoom', () => {
      resetView();
    });

    // 保存 zoom 行为引用
    zoomBehaviorRef.current = zoom;

    // 应用初始变换
    if (initialTransform.scale !== 1 || initialTransform.translateX !== 0 || initialTransform.translateY !== 0) {
      svg.call(
        zoom.transform,
        d3.zoomIdentity
          .translate(initialTransform.translateX, initialTransform.translateY)
          .scale(initialTransform.scale)
      );
    }

    // 清理
    return () => {
      svg.on('.zoom', null);
    };
  }, [minZoom, maxZoom, initialTransform, onZoomChange, onPanChange, onTransformChange, resetView]);

  // 格式化缩放百分比
  const zoomPercentage = Math.round(transform.scale * 100);

  return (
    <div className="interactive-canvas-container" data-testid="interactive-canvas">
      {/* 缩放控制面板 */}
      <div className="zoom-controls" data-testid="zoom-controls">
        <button 
          className="zoom-btn" 
          onClick={zoomIn}
          title="放大"
          data-testid="zoom-in-btn"
        >
          +
        </button>
        <span className="zoom-level" data-testid="zoom-level">
          {zoomPercentage}%
        </span>
        <button 
          className="zoom-btn" 
          onClick={zoomOut}
          title="缩小"
          data-testid="zoom-out-btn"
        >
          −
        </button>
        <button 
          className="zoom-btn reset-btn" 
          onClick={resetView}
          title="重置视图 (双击画布)"
          data-testid="reset-view-btn"
        >
          ⟲
        </button>
      </div>

      {/* SVG 画布 */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="interactive-canvas-svg"
        data-testid="canvas-svg"
      >
        {/* 背景网格 (可选) */}
        <defs>
          <pattern
            id="grid-pattern"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#grid-pattern)"
          className="canvas-background"
        />

        {/* 可变换的内容容器 */}
        <g ref={containerRef} className="canvas-content" data-testid="canvas-content">
          {children}
        </g>
      </svg>

      {/* 交互提示 */}
      {isUserInteracting && (
        <div className="interaction-hint" data-testid="interaction-hint">
          拖拽平移 | 滚轮缩放 | 双击重置
        </div>
      )}
    </div>
  );
};

export default InteractiveCanvas;
