import { renderHook, act } from '@testing-library/react';
import { useAnimationPlayback } from './useAnimationPlayback';

jest.useFakeTimers();

describe('useAnimationPlayback', () => {
  it('replays bounded snapshots deterministically and stops at the end', () => {
    const steps = ['init', 'compare', 'done'];
    const { result } = renderHook(() => useAnimationPlayback(steps, 500));
    act(() => result.current.togglePlay());
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.currentStep).toBe('done');
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.progress).toBe(100);
    act(() => result.current.prevStep());
    expect(result.current.currentStep).toBe('compare');
  });

  it('wraps replay from the final frame, handles a single-frame sequence, and clamps negative seek', () => {
    const steps = ['first', 'last'];
    const { result } = renderHook(() => useAnimationPlayback(steps, 500));
    act(() => result.current.goToStep(99));
    expect(result.current.currentStep).toBe('last');
    act(() => result.current.togglePlay());
    expect(result.current.currentStep).toBe('first');
    act(() => jest.advanceTimersByTime(500));
    expect(result.current.currentStep).toBe('last');
    expect(result.current.isPlaying).toBe(false);

    const { result: oneFrameResult } = renderHook(() => useAnimationPlayback(['only']));
    act(() => oneFrameResult.current.togglePlay());
    act(() => jest.runOnlyPendingTimers());
    expect(oneFrameResult.current.currentStep).toBe('only');
    expect(oneFrameResult.current.progress).toBe(0);
    act(() => oneFrameResult.current.setProgress(-20));
    expect(oneFrameResult.current.currentStep).toBe('only');
  });

  it('resets to the first snapshot when the data changes and clamps seeks', () => {
    const initial = [1, 2, 3];
    const next = [4, 5];
    const { result, rerender } = renderHook(({ steps }) => useAnimationPlayback(steps), { initialProps: { steps: initial } });
    act(() => result.current.setProgress(150));
    expect(result.current.currentStep).toBe(3);
    rerender({ steps: next });
    expect(result.current.currentStep).toBe(4);
    expect(result.current.progress).toBe(0);
  });
});
