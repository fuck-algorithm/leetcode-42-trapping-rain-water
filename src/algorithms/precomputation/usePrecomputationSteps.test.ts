import { renderHook, act } from '@testing-library/react';
import usePrecomputationSteps from './usePrecomputationSteps';
import { precomputationCode } from '../algorithmCodes';

describe('usePrecomputationSteps', () => {
  it('binds steps to valid source lines and keeps current water separate from the running total', () => {
    const { result } = renderHook(() => usePrecomputationSteps({ heights: [3, 0, 2] }));
    const steps = result.current.steps;
    expect(steps.every(step => step.codeLineBindings && Object.entries(step.codeLineBindings).every(([language, lines]) => (lines as number[]).every(line => line <= precomputationCode[language as keyof typeof precomputationCode].split('\n').length)))).toBe(true);
    const calculations = steps.filter(step => step.phase === 'waterCalculation');
    expect(calculations.map(step => step.currentWater)).toEqual([0, 2, 0]);
    expect(calculations.map(step => step.totalWater)).toEqual([0, 2, 2]);
    expect(calculations[1].description).toContain('较矮边界 2 − 柱高 0');
  });

  it('preserves total water across supported sample terrains', () => {
    const { result } = renderHook(() => usePrecomputationSteps({ heights: [4, 2, 0, 3, 2, 5] }));
    act(() => result.current.goToStep(result.current.totalSteps - 1));
    expect(result.current.currentStep?.totalWater).toBe(9);
  });
});
