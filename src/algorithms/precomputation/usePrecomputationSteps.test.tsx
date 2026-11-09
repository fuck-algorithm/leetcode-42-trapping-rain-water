import { act, renderHook } from '@testing-library/react';
import usePrecomputationSteps from './usePrecomputationSteps';
import { precomputationCode } from '../algorithmCodes';

describe('usePrecomputationSteps with shared playback', () => {
  it('binds scan, calculation, and return frames to actual Java and JavaScript lines', () => {
    const heights = [2, 0, 2];
    const { result } = renderHook(() => usePrecomputationSteps({ heights }));
    const steps = result.current.steps;
    expect(steps[0]?.codeLineBindings?.java).toEqual([2, 3, 4, 5, 6]);
    expect(steps[0]?.codeLineBindings?.golang).toEqual([2, 3, 4, 5, 6, 7]);
    expect(steps.find((step) => step.phase === 'leftScan' && step.currentIndex === 0 && step.description?.includes('leftMax[0]'))?.codeLineBindings?.java).toEqual([9]);
    expect(steps.find((step) => step.phase === 'leftScan' && step.currentIndex === 0 && step.description?.includes('leftMax[0]'))?.codeLineBindings?.golang).toEqual([11]);
    expect(steps.find((step) => step.phase === 'rightScan')?.codeLineBindings?.javascript).toEqual([14]);
    expect(steps.find((step) => step.phase === 'waterCalculation')?.codeLineBindings?.golang).toEqual([25]);
    expect(steps[steps.length - 1]?.codeLineBindings?.java).toEqual([25]);
    expect(steps.every(step => step.codeLineBindings && Object.entries(step.codeLineBindings).every(([language, lines]) => (lines as number[]).every((line: number) => line <= precomputationCode[language as keyof typeof precomputationCode].split('\n').length)))).toBe(true);
  });

  it('keeps deterministic snapshots and returns the sample total', () => {
    const heights = [4, 2, 0, 3, 2, 5];
    const { result, rerender } = renderHook(({ input }) => usePrecomputationSteps({ heights: input }), { initialProps: { input: heights } });
    act(() => result.current.goToStep(result.current.totalSteps - 1));
    expect(result.current.currentStep?.totalWater).toBe(9);
    rerender({ input: [2, 0, 2] });
    expect(result.current.currentStepIndex).toBe(0);
    act(() => result.current.goToStep(result.current.totalSteps - 1));
    expect(result.current.currentStep?.totalWater).toBe(2);
  });
});
