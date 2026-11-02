import { renderHook, act } from '@testing-library/react';
import useTwoPointersSteps from './useTwoPointersSteps';

describe('useTwoPointersSteps teaching snapshots', () => {
  it('provides unique semantic operations, causal narration, and valid anchors', () => {
    const heights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
    const { result } = renderHook(() => useTwoPointersSteps({ heights }));
    const steps = result.current.steps;
    expect(steps.length).toBeGreaterThan(1);
    expect(steps.every(step => Boolean(step.operation && step.narration && step.anchorIds?.length))).toBe(true);
    expect(steps[0].narration).toMatch(/初始化.*因为/);
    expect(steps[1].operation).toBe('compare');
    expect(steps[1].narration).toMatch(/比较.*因为/);
    expect(steps[2].operation).toBe('move');
    expect(steps[2].narration).toMatch(/处理.*因为/);
    const transitions = steps.slice(1).map((step, index) => {
      const previous = steps[index];
      const held = step.heights.filter((_, i) => previous.water[i] === step.water[i]).length;
      return held / step.heights.length;
    });
    expect(transitions.every(ratio => ratio >= 0.6)).toBe(true);
    expect(Math.max(...steps.map(step => step.totalWater))).toBe(6);
  });

  it('resets empty data and calculates the second example', () => {
    const { result, rerender } = renderHook(({ heights }) => useTwoPointersSteps({ heights }), { initialProps: { heights: [4, 2, 0, 3, 2, 5] } });
    act(() => result.current.goToStep(result.current.totalSteps - 1));
    expect(result.current.currentStep?.totalWater).toBe(9);
    rerender({ heights: [] });
    expect(result.current.totalSteps).toBe(0);
  });
});
