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
    expect(screen.getByRole('slider', { name: '动画步骤进度' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: '动画播放速度' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider', { name: '动画步骤进度' }), { target: { value: '50' } });
    fireEvent.change(screen.getByRole('slider', { name: '动画播放速度' }), { target: { value: '250' } });
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

  it('does not hijack keyboard events from focused buttons, sliders, or tabs', () => {
    const props = makeProps({ onReset: jest.fn() });
    render(<AnimationControls {...props} />);
    const button = document.createElement('button');
    document.body.appendChild(button);
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.keyDown(screen.getByRole('slider', { name: '动画步骤进度' }), { key: 'ArrowRight' });
    expect(props.onPlay).not.toHaveBeenCalled();
    expect(props.onNext).not.toHaveBeenCalled();
    button.remove();
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
