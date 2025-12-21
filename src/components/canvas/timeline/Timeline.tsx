/**
 * Timeline Component
 * 
 * Displays animation frames as navigable markers with visual distinction
 * for past, current, and future frames.
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';

export interface TimelineMarker {
  frameNumber: number;
  state: 'past' | 'current' | 'future';
  description?: string;
}

export interface TimelineProps {
  totalFrames: number;
  currentFrame: number;
  onFrameSelect: (frame: number) => void;
  onHover?: (frame: number | null) => void;
  isPlaying?: boolean;
  width?: number;
  height?: number;
  showTooltip?: boolean;
  frameDescriptions?: string[];
}

// 样式常量
const STYLES = {
  markerSize: 12,
  markerSpacing: 4,
  trackHeight: 4,
  colors: {
    past: '#90caf9',
    current: '#1976d2',
    future: '#e0e0e0',
    track: '#e0e0e0',
    trackFilled: '#90caf9',
    hover: '#42a5f5',
    playing: '#4caf50',
  },
};

/**
 * 单个时间轴标记
 */
const TimelineMarkerComponent: React.FC<{
  marker: TimelineMarker;
  x: number;
  y: number;
  size: number;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isHovered: boolean;
}> = ({ marker, x, y, size, onClick, onMouseEnter, onMouseLeave, isHovered }) => {
  const getColor = () => {
    if (isHovered) return STYLES.colors.hover;
    switch (marker.state) {
      case 'past': return STYLES.colors.past;
      case 'current': return STYLES.colors.current;
      case 'future': return STYLES.colors.future;
    }
  };

  const isCurrent = marker.state === 'current';

  return (
    <g
      className="timeline-marker"
      data-testid={`timeline-marker-${marker.frameNumber}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      <circle
        cx={x}
        cy={y}
        r={isCurrent ? size * 0.7 : size * 0.5}
        fill={getColor()}
        stroke={isCurrent ? '#0d47a1' : 'transparent'}
        strokeWidth={isCurrent ? 2 : 0}
      />
      {isCurrent && (
        <circle
          cx={x}
          cy={y}
          r={size * 0.3}
          fill="#ffffff"
        />
      )}
    </g>
  );
};

/**
 * 时间轴轨道
 */
const TimelineTrack: React.FC<{
  width: number;
  height: number;
  progress: number;
  y: number;
}> = ({ width, height, progress, y }) => {
  return (
    <g className="timeline-track">
      {/* 背景轨道 */}
      <rect
        x={0}
        y={y - height / 2}
        width={width}
        height={height}
        rx={height / 2}
        fill={STYLES.colors.track}
      />
      {/* 已播放部分 */}
      <rect
        x={0}
        y={y - height / 2}
        width={width * progress}
        height={height}
        rx={height / 2}
        fill={STYLES.colors.trackFilled}
      />
    </g>
  );
};

/**
 * Tooltip 组件
 */
const TimelineTooltip: React.FC<{
  x: number;
  y: number;
  frameNumber: number;
  description?: string;
  visible: boolean;
}> = ({ x, y, frameNumber, description, visible }) => {
  if (!visible) return null;

  const text = description || `帧 ${frameNumber + 1}`;
  const padding = 8;
  const textWidth = text.length * 8 + padding * 2;

  return (
    <g className="timeline-tooltip" data-testid="timeline-tooltip">
      <rect
        x={x - textWidth / 2}
        y={y - 30}
        width={textWidth}
        height={24}
        rx={4}
        fill="rgba(0, 0, 0, 0.8)"
      />
      <text
        x={x}
        y={y - 14}
        textAnchor="middle"
        fontSize={12}
        fill="#ffffff"
      >
        {text}
      </text>
    </g>
  );
};

/**
 * 播放指示器
 */
const PlayingIndicator: React.FC<{
  x: number;
  y: number;
  isPlaying: boolean;
}> = ({ x, y, isPlaying }) => {
  if (!isPlaying) return null;

  return (
    <g className="playing-indicator" data-testid="playing-indicator">
      <circle
        cx={x}
        cy={y}
        r={4}
        fill={STYLES.colors.playing}
      >
        <animate
          attributeName="opacity"
          values="1;0.5;1"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
};

/**
 * Main Timeline component
 */
const Timeline: React.FC<TimelineProps> = ({
  totalFrames,
  currentFrame,
  onFrameSelect,
  onHover,
  isPlaying = false,
  width = 600,
  height = 40,
  showTooltip = true,
  frameDescriptions = [],
}) => {
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null);
  const containerRef = useRef<SVGSVGElement>(null);

  // 计算标记位置
  const markers = useMemo((): TimelineMarker[] => {
    if (totalFrames === 0) return [];

    return Array.from({ length: totalFrames }, (_, i) => ({
      frameNumber: i,
      state: i < currentFrame ? 'past' : i === currentFrame ? 'current' : 'future',
      description: frameDescriptions[i],
    }));
  }, [totalFrames, currentFrame, frameDescriptions]);

  // 计算每个标记的 X 位置
  const getMarkerX = useCallback((frameNumber: number): number => {
    if (totalFrames <= 1) return width / 2;
    const padding = STYLES.markerSize;
    const availableWidth = width - 2 * padding;
    return padding + (frameNumber / (totalFrames - 1)) * availableWidth;
  }, [totalFrames, width]);

  // 计算进度
  const progress = useMemo(() => {
    if (totalFrames <= 1) return currentFrame === 0 ? 0 : 1;
    return currentFrame / (totalFrames - 1);
  }, [currentFrame, totalFrames]);

  // 处理标记点击
  const handleMarkerClick = useCallback((frameNumber: number) => {
    onFrameSelect(frameNumber);
  }, [onFrameSelect]);

  // 处理鼠标悬停
  const handleMarkerHover = useCallback((frameNumber: number | null) => {
    setHoveredFrame(frameNumber);
    onHover?.(frameNumber);
  }, [onHover]);

  // 处理轨道点击
  const handleTrackClick = useCallback((event: React.MouseEvent<SVGRectElement>) => {
    if (totalFrames === 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = clickX / width;
    const frameNumber = Math.round(ratio * (totalFrames - 1));
    const clampedFrame = Math.max(0, Math.min(totalFrames - 1, frameNumber));
    onFrameSelect(clampedFrame);
  }, [totalFrames, width, onFrameSelect]);

  const centerY = height / 2;

  if (totalFrames === 0) {
    return (
      <svg
        ref={containerRef}
        width={width}
        height={height}
        className="timeline"
        data-testid="timeline"
      >
        <text
          x={width / 2}
          y={centerY + 4}
          textAnchor="middle"
          fontSize={12}
          fill="#999"
        >
          无动画帧
        </text>
      </svg>
    );
  }

  return (
    <svg
      ref={containerRef}
      width={width}
      height={height}
      className="timeline"
      data-testid="timeline"
    >
      {/* 轨道 */}
      <TimelineTrack
        width={width}
        height={STYLES.trackHeight}
        progress={progress}
        y={centerY}
      />

      {/* 可点击区域 */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="transparent"
        onClick={handleTrackClick}
        style={{ cursor: 'pointer' }}
      />

      {/* 标记 */}
      {markers.map((marker) => (
        <TimelineMarkerComponent
          key={marker.frameNumber}
          marker={marker}
          x={getMarkerX(marker.frameNumber)}
          y={centerY}
          size={STYLES.markerSize}
          onClick={() => handleMarkerClick(marker.frameNumber)}
          onMouseEnter={() => handleMarkerHover(marker.frameNumber)}
          onMouseLeave={() => handleMarkerHover(null)}
          isHovered={hoveredFrame === marker.frameNumber}
        />
      ))}

      {/* 播放指示器 */}
      <PlayingIndicator
        x={getMarkerX(currentFrame)}
        y={centerY - STYLES.markerSize}
        isPlaying={isPlaying}
      />

      {/* Tooltip */}
      {showTooltip && hoveredFrame !== null && (
        <TimelineTooltip
          x={getMarkerX(hoveredFrame)}
          y={centerY}
          frameNumber={hoveredFrame}
          description={frameDescriptions[hoveredFrame]}
          visible={true}
        />
      )}
    </svg>
  );
};

export default Timeline;

/**
 * 计算时间轴标记状态
 */
export function getMarkerState(
  frameNumber: number,
  currentFrame: number
): 'past' | 'current' | 'future' {
  if (frameNumber < currentFrame) return 'past';
  if (frameNumber === currentFrame) return 'current';
  return 'future';
}

/**
 * 计算时间轴进度百分比
 */
export function calculateTimelineProgress(
  currentFrame: number,
  totalFrames: number
): number {
  if (totalFrames <= 1) return currentFrame === 0 ? 0 : 100;
  return Math.round((currentFrame / (totalFrames - 1)) * 100);
}
