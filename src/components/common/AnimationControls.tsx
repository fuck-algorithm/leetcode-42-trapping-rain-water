import React from 'react';
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
  onSeek,
  onSpeedChange
}) => {
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSpeedChange(Number(e.target.value));
  };

  return (
    <div className="animation-controls">
      <div className="controls-row">
        <button 
          className="control-button prev-button" 
          onClick={onPrev}
          disabled={currentStep <= 0}
          title="上一步"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        
        <button 
          className="control-button play-button" 
          onClick={onPlay}
          title={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        
        <button 
          className="control-button next-button" 
          onClick={onNext}
          disabled={currentStep >= totalSteps - 1}
          title="下一步"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>
      
      <div className="progress-container">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="progress-slider"
        />
        <div className="step-info">
          步骤: {currentStep + 1} / {totalSteps}
        </div>
      </div>

      <div className="speed-control">
        <label htmlFor="speed-slider">动画速度：</label>
        <input
          id="speed-slider"
          type="range"
          min="100"
          max="1000"
          step="100"
          value={speed}
          onChange={handleSpeedChange}
          className="speed-slider"
        />
        <span>{speed}ms</span>
      </div>
    </div>
  );
};

export default AnimationControls; 