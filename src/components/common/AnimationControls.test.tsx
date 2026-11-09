import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AnimationControls from './AnimationControls';

const makeProps = (overrides: Partial<React.ComponentProps<typeof AnimationControls>> = {}) => ({
  isPlaying: false,
  progress: 0,
  currentStep: 0,
  totalSteps: 5,
  speed: 500,
  onNext: jest.fn(),
  onPrev: jest.fn(),
  onPlay: jest.fn(),
  onSeek: jest.fn(),
  onSpeedChange: jest.fn(),
  ...overrides,
});

describe('AnimationControls behavior', () => {
  it('seeks by progress range and forwards the selected playback speed', () => {
    const props = makeProps();
    render(<AnimationControls {...props} />);
    fireEvent.change(screen.getByTitle(/进度/), { target: { value: '50' } });
    fireEvent.change(screen.getByTitle(/播放速度/), { target: { value: '250' } });
    expect(props.onSeek).toHaveBeenCalledWith(50);
    expect(props.onSpeedChange).toHaveBeenCalledWith(250);
  });

  it('moves when arrow keys are pressed, skips them for text inputs, and resets through R', () => {
    const props = makeProps({ currentStep: 2, onReset: jest.fn() });
    render(<AnimationControls {...props} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'R' });
    expect(props.onNext).toHaveBeenCalledTimes(1);
    expect(props.onPrev).toHaveBeenCalledTimes(1);
    expect(props.onReset).toHaveBeenCalledTimes(1);

    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(props.onNext).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it('blocks arrow-key stepping beyond either end and toggles playback from Space', () => {
    const props = makeProps({ currentStep: 0 });
    render(<AnimationControls {...props} />);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: ' ' });
    expect(props.onPrev).not.toHaveBeenCalled();
    expect(props.onNext).toHaveBeenCalledTimes(1);
    expect(props.onPlay).toHaveBeenCalledTimes(1);
  });

  it('falls back to seeking zero when no custom reset callback is provided', () => {
    const props = makeProps();
    render(<AnimationControls {...props} />);
    fireEvent.click(screen.getByTitle(/重置/));
    expect(props.onSeek).toHaveBeenCalledWith(0);
  });
});
