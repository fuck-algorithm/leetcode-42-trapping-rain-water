import { renderHook, act } from '@testing-library/react';
import useTwoPointersSteps from './useTwoPointersSteps';

describe('useTwoPointersSteps teaching snapshots', () => {
  it('provides semantic actions, narration, and anchors for every step', () => {
    const heights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
    const { result } = renderHook(() => useTwoPointersSteps({ heights }));
    expect(result.current.totalSteps).toBeGreaterThan(1);
    const steps = result.current.steps;
    expect(steps.every(step => Boolean(step.operation && step.narration && step.anchorIds?.length))).toBe(true);
    expect(steps.reduce((water, step) => Math.max(water, step.totalWater), 0)).toBe(6);
    expect(steps.every(step => step.heights.length === heights.length)).toBe(true);
    expect(new Set(steps.map(step => step.anchorIds?.[0])).size).toBeGreaterThan(1);
    expect(result.current.currentStep?.phase).toBe('init');
    expect(result.current.currentStep?.description).toContain('初始化');
  });

  it('resets cleanly for empty input and calculates the canonical example', () => {
    const { result, rerender } = renderHook(({ heights }) => useTwoPointersSteps({ heights }), { initialProps: { heights: [4, 2, 0, 3, 2, 5] } });
    expect(result.current.totalSteps).toBeGreaterThan(0);
    act(() => result.current.goToStep(result.current.totalSteps - 1));
    expect(result.current.currentStep?.totalWater).toBe(9);
    rerender({ heights: [] });
    expect(result.current.totalSteps).toBe(0);
  });
});
