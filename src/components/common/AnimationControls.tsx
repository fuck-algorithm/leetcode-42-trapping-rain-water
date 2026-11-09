import React, { useEffect, useCallback } from 'react';
import './AnimationControls.css';

interface AnimationControlsProps {
  isPlaying: boolean;
  progress: number;
  currentStep: number;
  totalSteps: number;
  speed: number;
  onNext: () => void;
  onPrev: () => void;
  onPlay: () => void;
  onReset?: () => void;
  onSeek: (progress: number) => void;
  onSpeedChange: (speed: number) => void;
}

const AnimationControls: React.FC<AnimationControlsProps> = ({
  isPlaying,
  progress,
  currentStep,
  totalSteps,
  speed,
  onNext,
  onPrev,
  onPlay,
  onReset,
  onSeek,
  onSpeedChange
}) => {
  // 键盘快捷键处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target;
    if (target instanceof HTMLElement && (
      target.isContentEditable
      || target.closest('input, textarea, select, button, a, [role="button"], [role="slider"], [role="tab"]')
    )) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentStep > 0) {
          onPrev();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentStep < totalSteps - 1) {
          onNext();
        }
        break;
      case ' ':
        e.preventDefault();
        onPlay();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        if (onReset) {
          onReset();
        }
        break;
      default:
        break;
    }
  }, [currentStep, totalSteps, onPrev, onNext, onPlay, onReset]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSpeedChange(Number(e.target.value));
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onSeek(0);
    }
  };

  // 计算进度条样式
  const progressStyle = {
    '--progress': `${progress}%`
  } as React.CSSProperties;

  return (
    <div className="animation-controls">
      <div className="controls-container">
        <div className="step-info">
          {currentStep + 1} / {totalSteps}
        </div>
        
        <div className="controls-buttons">
          <button 
            className="control-button reset-button" 
            onClick={handleReset}
            title="重置 (R)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            <span className="button-shortcut">R</span>
          </button>

          <button 
            className="control-button prev-button" 
            onClick={onPrev}
            disabled={currentStep <= 0}
            title="上一步 (←)"
          >
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span className="button-shortcut">←</span>
          </button>
          
          <button 
            className="control-button play-button" 
            onClick={onPlay}
            title={isPlaying ? "暂停 (空格)" : "播放 (空格)"}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path fill="currentColor" d="M8 5v14l11-7z" />
              </svg>
            )}
            <span className="button-shortcut">空格</span>
          </button>
          
          <button 
            className="control-button next-button" 
            onClick={onNext}
            disabled={currentStep >= totalSteps - 1}
            title="下一步 (→)"
          >
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
            <span className="button-shortcut">→</span>
          </button>
        </div>
        
        <div className="progress-container">
          <input
            type="range"
            aria-label="动画步骤进度"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            className="progress-slider"
            style={progressStyle}
            title={`进度: ${Math.round(progress)}%`}
          />
        </div>
        
        <div className="speed-control">
          <span>速度</span>
          <input
            id="speed-slider"
            type="range"
            aria-label="动画播放速度"
            min="100"
            max="1000"
            step="100"
            value={speed}
            onChange={handleSpeedChange}
            className="speed-slider"
            title={`播放速度: ${Math.floor(1000/speed)}倍速`}
          />
          <span>{Math.floor(1000/speed)}x</span>
        </div>
      </div>
    </div>
  );
};

export default AnimationControls;
