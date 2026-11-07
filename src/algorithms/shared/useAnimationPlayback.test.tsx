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
