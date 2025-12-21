/**
 * FrameInfoDisplay Component
 * 
 * Displays current frame information including frame number, total frames,
 * and operation description.
 * 
 * Requirements: 7.6
 */

import React from 'react';
import { AnimationFrame } from './types';

export interface FrameInfoDisplayProps {
  /** 当前帧 */
  currentFrame: AnimationFrame | null;
  /** 总帧数 */
  totalFrames: number;
  /** 当前帧索引（从0开始） */
  currentFrameIndex: number;
  /** 是否正在播放 */
  isPlaying?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示描述 */
  showDescription?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
}

// 默认样式
const DEFAULT_STYLES = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '14px',
  } as React.CSSProperties,
  frameCounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 'bold',
    color: '#1976d2',
  } as React.CSSProperties,
  description: {
    flex: 1,
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  playingIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    animation: 'pulse 1s infinite',
  } as React.CSSProperties,
};

// 紧凑模式样式
const COMPACT_STYLES = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '4px',
    fontSize: '12px',
  } as React.CSSProperties,
};

/**
 * 帧计数器组件
 */
const FrameCounter: React.FC<{
  current: number;
  total: number;
  style?: React.CSSProperties;
}> = ({ current, total, style }) => {
  // 显示从1开始的帧号
  const displayCurrent = current + 1;
  
  return (
    <div
      className="frame-counter"
      data-testid="frame-counter"
      style={{ ...DEFAULT_STYLES.frameCounter, ...style }}
    >
      <span className="current-frame">{displayCurrent}</span>
      <span className="separator">/</span>
      <span className="total-frames">{total}</span>
    </div>
  );
};

/**
 * 操作描述组件
 */
const OperationDescription: React.FC<{
  description: string;
  style?: React.CSSProperties;
}> = ({ description, style }) => {
  return (
    <div
      className="operation-description"
      data-testid="operation-description"
      style={{ ...DEFAULT_STYLES.description, ...style }}
      title={description}
    >
      {description || '无描述'}
    </div>
  );
};

/**
 * 播放状态指示器
 */
const PlayingIndicator: React.FC<{
  isPlaying: boolean;
}> = ({ isPlaying }) => {
  if (!isPlaying) return null;
  
  return (
    <div
      className="playing-indicator"
      data-testid="playing-indicator"
      style={DEFAULT_STYLES.playingIndicator}
      title="正在播放"
    />
  );
};

/**
 * Main FrameInfoDisplay component
 */
const FrameInfoDisplay: React.FC<FrameInfoDisplayProps> = ({
  currentFrame,
  totalFrames,
  currentFrameIndex,
  isPlaying = false,
  style,
  showDescription = true,
  compact = false,
}) => {
  const containerStyle = compact
    ? { ...COMPACT_STYLES.container, ...style }
    : { ...DEFAULT_STYLES.container, ...style };

  if (totalFrames === 0) {
    return (
      <div
        className="frame-info-display empty"
        data-testid="frame-info-display"
        style={containerStyle}
      >
        <span style={{ color: '#999' }}>无动画帧</span>
      </div>
    );
  }

  return (
    <div
      className="frame-info-display"
      data-testid="frame-info-display"
      style={containerStyle}
    >
      <PlayingIndicator isPlaying={isPlaying} />
      
      <FrameCounter
        current={currentFrameIndex}
        total={totalFrames}
      />
      
      {showDescription && currentFrame && (
        <OperationDescription
          description={currentFrame.description}
        />
      )}
    </div>
  );
};

export default FrameInfoDisplay;

/**
 * 格式化帧信息为字符串
 */
export function formatFrameInfo(
  currentFrameIndex: number,
  totalFrames: number,
  description?: string
): string {
  const frameNumber = currentFrameIndex + 1;
  const frameInfo = `帧 ${frameNumber}/${totalFrames}`;
  
  if (description) {
    return `${frameInfo}: ${description}`;
  }
  
  return frameInfo;
}

/**
 * 计算帧进度百分比
 */
export function calculateFrameProgress(
  currentFrameIndex: number,
  totalFrames: number
): number {
  if (totalFrames <= 1) {
    return 100;
  }
  return Math.round((currentFrameIndex / (totalFrames - 1)) * 100);
}

/**
 * 获取帧状态描述
 */
export function getFrameStatusDescription(
  currentFrameIndex: number,
  totalFrames: number
): string {
  if (totalFrames === 0) {
    return '无帧';
  }
  
  if (currentFrameIndex === 0) {
    return '开始';
  }
  
  if (currentFrameIndex === totalFrames - 1) {
    return '结束';
  }
  
  const progress = calculateFrameProgress(currentFrameIndex, totalFrames);
  return `进度 ${progress}%`;
}
