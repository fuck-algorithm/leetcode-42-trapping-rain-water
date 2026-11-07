import { act, renderHook } from '@testing-library/react';
import usePrecomputationSteps from '../precomputation/usePrecomputationSteps';
import useMonotonicStackSteps from '../monotonicStack/useMonotonicStackSteps';
import { useRowByRowSteps } from '../rowByRow/useRowByRowSteps';
import useBruteForceSteps from '../bruteForce/useBruteForceSteps';

describe('shared playback across solution families', () => {
  it.each([
    ['precomputation', (heights: number[]) => usePrecomputationSteps({ heights })],
    ['monotonic stack', (heights: number[]) => useMonotonicStackSteps({ heights })],
    ['row-by-row', (heights: number[]) => useRowByRowSteps({ heights })],
    ['brute force', (heights: number[]) => useBruteForceSteps({ heights })],
  ])('%s returns bounded snapshots and the sample answer', (_name, useSteps) => {
    const heights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
    const { result } = renderHook(() => useSteps(heights));
    expect(result.current.totalSteps).toBeGreaterThan(1);
    act(() => result.current.goToStep(result.current.totalSteps - 1));
    expect(result.current.currentStep?.totalWater).toBe(6);
    expect(result.current.progress).toBe(100);
  });
});
