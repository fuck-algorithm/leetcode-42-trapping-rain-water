import { renderHook } from '@testing-library/react';
import { bruteForceCode, monotonicStackCode, precomputationCode, rowByRowCode, twoPointersCode } from '../algorithmCodes';
import { buildMonotonicStackSteps } from '../monotonicStack/useMonotonicStackSteps';
import useTwoPointersSteps from '../twoPointers/useTwoPointersSteps';
import { usePrecomputationSteps } from '../precomputation/usePrecomputationSteps';
import { useRowByRowSteps } from '../rowByRow/useRowByRowSteps';
import { useBruteForceSteps } from '../bruteForce/useBruteForceSteps';
import { SUPPORTED_LANGUAGES, Language } from '../../components/canvas/animation/types';

const HEIGHTS = [4, 2, 0, 3, 2, 5];
type Step = { codeLineBindings?: Record<Language, number[]> };

function expectBindingsWithinSource(steps: Step[], codes: Record<Language, string>): void {
  expect(steps.length).toBeGreaterThan(0);
  for (const step of steps) {
    expect(step.codeLineBindings).toBeDefined();
    for (const language of SUPPORTED_LANGUAGES) {
      const bindings = step.codeLineBindings?.[language] ?? [];
      expect(bindings.length).toBeGreaterThan(0);
      expect(bindings.every(line => line >= 1 && line <= codes[language].split('\n').length)).toBe(true);
    }
  }
}

describe('algorithm code binding integrity', () => {
  it('keeps every precomputation frame bound within each source language', () => {
    const { result } = renderHook(() => usePrecomputationSteps({ heights: HEIGHTS }));
    expectBindingsWithinSource(result.current.steps, precomputationCode);
  });
  it('keeps every monotonic-stack frame bound within each source language', () => {
    expectBindingsWithinSource(buildMonotonicStackSteps(HEIGHTS), monotonicStackCode);
  });
  it('keeps every brute-force frame bound within each source language', () => {
    const heights = HEIGHTS;
    const { result } = renderHook(() => useBruteForceSteps({ heights }));
    expectBindingsWithinSource(result.current.steps, bruteForceCode);
  });
  it('keeps every row-by-row frame bound within each source language', () => {
    const heights = HEIGHTS;
    const { result } = renderHook(() => useRowByRowSteps({ heights }));
    expectBindingsWithinSource(result.current.steps, rowByRowCode);
  });
  it('keeps every two-pointer frame bound within each source language', () => {
    const heights = HEIGHTS;
    const { result } = renderHook(() => useTwoPointersSteps({ heights }));
    expectBindingsWithinSource(result.current.steps, twoPointersCode);
  });
});
