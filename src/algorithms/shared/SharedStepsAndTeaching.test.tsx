import { act, renderHook } from '@testing-library/react';
import usePrecomputationSteps from '../precomputation/usePrecomputationSteps';
import useMonotonicStackSteps, { buildMonotonicStackSteps } from '../monotonicStack/useMonotonicStackSteps';
import { useRowByRowSteps } from '../rowByRow/useRowByRowSteps';
import useBruteForceSteps from '../bruteForce/useBruteForceSteps';
import { bruteForceCode } from '../algorithmCodes';
import { useBruteForceSteps as useBruteForceStepsHook } from '../bruteForce/useBruteForceSteps';
import { calculateWaterByBoundaries } from './algorithmDomain';

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

  it('explains a stack pop without a left wall as a non-basin event', () => {
    const heights = [1, 2];
    const steps = buildMonotonicStackSteps(heights);
    const unboundedPop = steps.find(step => step.description?.includes('缺少左墙'));
    expect(unboundedPop?.phase).toBe('pop');
    expect(unboundedPop?.description).toContain('缺少左墙');
    expect(steps.at(-1)?.totalWater).toBe(0);
  });

  it.each([
    ['precomputation', (heights: number[]) => usePrecomputationSteps({ heights })],
    ['monotonic stack', (heights: number[]) => useMonotonicStackSteps({ heights })],
    ['row-by-row', (heights: number[]) => useRowByRowSteps({ heights })],
    ['brute force', (heights: number[]) => useBruteForceStepsHook({ heights })],
  ])('matches the independent per-column oracle for %s', (_name, useSteps) => {
    const heights = [0, 3, 0, 2, 0, 4];
    const expected = calculateWaterByBoundaries(heights);
    const { result } = renderHook(() => useSteps(heights));
    act(() => result.current.goToStep(result.current.totalSteps - 1));
    const finalStep = result.current.currentStep as { water?: number[]; waterLevel?: Record<number, number>; waterMatrix?: number[][] };
    const actualWater = finalStep.water
      ?? (finalStep.waterLevel ? heights.map((_, index) => finalStep.waterLevel?.[index] ?? 0) : undefined)
      ?? heights.map((_, index) => finalStep.waterMatrix?.reduce((amount, row) => amount + (row[index] ?? 0), 0) ?? 0);
    expect(actualWater).toEqual(expected.water);
    expect(result.current.currentStep?.totalWater).toBe(expected.total);
  });

  it('binds brute-force scan and water steps to real code lines', () => {
    const heights = [3, 0, 3];
    const { result } = renderHook(() => useBruteForceStepsHook({ heights }));
    const steps = result.current.steps;
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every(step => step.codeLineBindings && step.codeLineBindings.java.every(line => line <= bruteForceCode.java.split('\n').length))).toBe(true);
    const codeLines = (language: 'java' | 'python' | 'golang' | 'javascript') => bruteForceCode[language].split('\n');
    expect(steps.every(step => step.codeLineBindings && Object.entries(step.codeLineBindings).every(([language, lines]) => (lines as number[]).every((line: number) => line <= codeLines(language as keyof typeof bruteForceCode).length)))).toBe(true);
    expect(steps.find(step => step.phase === 'scanLeftStart')?.codeLineBindings?.java).toContain(9);
    expect(steps.find(step => step.phase === 'scanLeftComplete')?.codeLineBindings?.java).toContain(11);
    expect(steps.find(step => step.phase === 'scanRightComplete')?.codeLineBindings?.java).toContain(17);
    expect(steps.find(step => step.phase === 'compare')?.codeLineBindings?.java).toContain(18);
    expect(steps.find(step => step.phase === 'waterFound')?.codeLineBindings?.java).toContain(19);
  });
});
