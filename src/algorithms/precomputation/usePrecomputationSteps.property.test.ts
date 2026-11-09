import { act, renderHook } from '@testing-library/react';
import fc from 'fast-check';
import { calculateWaterByBoundaries } from '../shared/algorithmDomain';
import { usePrecomputationSteps } from './usePrecomputationSteps';

describe('precomputation step properties', () => {
  it('matches the independent per-column oracle for generated valid inputs', () => {
    fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 1, maxLength: 16 }), heights => {
      const { result, unmount } = renderHook(() => usePrecomputationSteps({ heights }));
      act(() => result.current.goToStep(result.current.totalSteps - 1));
      const finalStep = result.current.currentStep;
      const expected = calculateWaterByBoundaries(heights);
      unmount();
      return finalStep?.totalWater === expected.total
        && JSON.stringify(finalStep?.water) === JSON.stringify(expected.water);
    }), { numRuns: 35 });
  });
});
