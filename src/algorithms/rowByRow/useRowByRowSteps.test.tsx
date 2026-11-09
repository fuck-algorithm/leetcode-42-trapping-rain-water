import { act, renderHook } from '@testing-library/react';
import { useRowByRowSteps } from './useRowByRowSteps';

describe('useRowByRowSteps snapshots', () => {
  it('prevents large terrains from allocating enormous row-by-row snapshots', () => {
    const heights = Array(200).fill(10000);
    const { result } = renderHook(() => useRowByRowSteps({ heights }));
    expect(result.current.totalSteps).toBe(1);
    expect(result.current.currentStep?.phase).toBe('complete');
    expect(result.current.currentStep?.description).toContain('双数组法或双指针法');
  });

  it('removes unclosed candidate water and returns a complete zero frame for empty/zero terrains', () => {
    const emptyHeights: number[] = [];
    const { result: empty } = renderHook(() => useRowByRowSteps({ heights: emptyHeights }));
    expect(empty.current.totalSteps).toBe(0);

    const zeroHeights = [0, 0, 0];
    const { result: zero } = renderHook(() => useRowByRowSteps({ heights: zeroHeights }));
    expect(zero.current.totalSteps).toBeGreaterThan(0);
    act(() => zero.current.goToStep(zero.current.totalSteps - 1));
    expect(zero.current.currentStep?.phase).toBe('complete');
    expect(zero.current.currentStep?.totalWater).toBe(0);

    const openBasinHeights = [0, 2, 0];
    const { result: openBasin } = renderHook(() => useRowByRowSteps({ heights: openBasinHeights }));
    act(() => openBasin.current.goToStep(openBasin.current.totalSteps - 1));
    expect(openBasin.current.currentStep?.totalWater).toBe(0);
    expect(openBasin.current.currentStep?.waterMatrix.flat().some(Boolean)).toBe(false);
  });

  it('keeps earlier water snapshots immutable while sharing unchanged rows', () => {
    const heights = [3, 0, 2, 0, 4];
    const { result } = renderHook(() => useRowByRowSteps({ heights }));
    expect(result.current.steps.every(step => step.codeLineBindings && Object.values(step.codeLineBindings).every(lines => lines.length > 0))).toBe(true);
    const first = result.current.currentStep?.waterMatrix;
    let afterWater: number[][] | undefined;
    let confirmedWater: number[][] | undefined;

    for (let index = 0; index < result.current.totalSteps - 1; index++) {
      act(() => result.current.nextStep());
      const matrix = result.current.currentStep?.waterMatrix;
      if (matrix?.[0]?.some(Boolean)) afterWater = matrix;
      if (result.current.currentStep?.phase === 'rowComplete' && matrix?.[0]?.some(Boolean)) {
        confirmedWater = matrix;
        break;
      }
    }

    expect(first?.every(row => row.every(cell => cell === 0))).toBe(true);
    expect(afterWater?.some(row => row.some(Boolean))).toBe(true);
    expect(confirmedWater?.some(row => row.some(Boolean))).toBe(true);
    expect(first).not.toBe(afterWater);
    const changedRow = afterWater?.findIndex((row, index) => row !== first?.[index]) ?? -1;
    expect(changedRow).toBeGreaterThanOrEqual(0);
    expect(first?.[changedRow]?.every(cell => cell === 0)).toBe(true);
    expect(first?.[changedRow + 1]).toBe(afterWater?.[changedRow + 1]);
    act(() => result.current.goToStep(result.current.totalSteps - 1));
    expect(result.current.currentStep?.totalWater).toBe(7);
  });
});
