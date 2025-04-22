import React from 'react';
import './VisualizerControls.css';

interface VisualizerControlsProps {
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onProgressChange: (value: number) => void;
}

const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  isPlaying,
  progress,
  onTogglePlay,
  onNext,
  onPrev,
  onProgressChange
}) => {
  return (
    <div className="visualizer-controls">
      <button 
        className="control-button"
        onClick={onPrev}
        title="上一步"
      >
        ⏮️
      </button>
      
      <button 
        className="control-button play-button"
        onClick={onTogglePlay}
        title={isPlaying ? "暂停" : "播放"}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      
      <button 
        className="control-button"
        onClick={onNext}
        title="下一步"
      >
        ⏭️
      </button>
      
      <div className="progress-container">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          className="progress-slider"
          onChange={(e) => onProgressChange(Number(e.target.value))}
        />
        <span className="progress-label">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default VisualizerControls; 