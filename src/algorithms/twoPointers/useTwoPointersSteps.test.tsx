import { renderHook, act } from '@testing-library/react';
import useTwoPointersSteps from './useTwoPointersSteps';

describe('useTwoPointersSteps teaching snapshots', () => {
  it('provides unique semantic operations, causal narration, and valid anchors', () => {
    const heights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
    const { result } = renderHook(() => useTwoPointersSteps({ heights }));
    const steps = result.current.steps;
    expect(steps.length).toBeGreaterThan(1);
    expect(steps.every(step => Boolean(step.operation && step.narration && step.anchorIds?.length))).toBe(true);
    expect(steps.filter(step => step.phase !== 'init').flatMap(step => step.anchorIds || []).every(id => /^column-\d+$/.test(id))).toBe(true);
    expect(steps[0].narration).toMatch(/初始化.*因为/);
    expect(steps[1].operation).toBe('compare');
    expect(steps[1].narration).toMatch(/比较.*因为/);
    expect(steps[2].operation).toBe('move');
    expect(steps[2].narration).toMatch(/左侧第 1 列.*边界高度 1/);
    expect(steps[2].codeLineBindings?.java).toEqual([10, 11]);
    const fillStep = steps.find(step => step.currentFill);
    expect(fillStep?.codeLineBindings?.java).toEqual([12, 13]);
    expect(fillStep?.codeLineBindings?.python).toEqual([13, 14]);
    expect(fillStep?.codeLineBindings?.golang).toEqual([12, 13]);
    expect(fillStep?.codeLineBindings?.javascript).toEqual([12, 13]);
    const transitions = steps.slice(1).map((step, index) => {
      const previous = steps[index];
      const held = step.heights.filter((_, i) => previous.water[i] === step.water[i]).length;
      return held / step.heights.length;
    });
    expect(transitions.every(ratio => ratio >= 0.6)).toBe(true);
    expect(Math.max(...steps.map(step => step.totalWater))).toBe(6);
  });

  it('covers equal endpoint decision and right-side fill/update branches', () => {
    const equalHeights = [2, 0, 2];
    const { result: equalResult } = renderHook(() => useTwoPointersSteps({ heights: equalHeights }));
    const equalDecision = equalResult.current.steps.find(step => step.decision?.comparison === 'equal');
    expect(equalDecision?.decision?.action).toBe('move_left');

    const rightFillHeights = [3, 0, 2];
    const { result: fillResult } = renderHook(() => useTwoPointersSteps({ heights: rightFillHeights }));
    const rightFill = fillResult.current.steps.find(step => step.phase === 'moveRight' && step.currentFill);
    expect(rightFill?.currentFill).toBeGreaterThan(0);

    const rightWallHeights = [1, 2, 0];
    const { result: updateResult } = renderHook(() => useTwoPointersSteps({ heights: rightWallHeights }));
    expect(updateResult.current.steps.some(step => step.phase === 'moveRight' && !step.currentFill && step.rightMax === 2)).toBe(true);
  });

  it.each([
    [[], 0],
    [[1], 0],
    [[0, 0, 0], 0],
    [[1, 2, 3, 4], 0],
    [[4, 3, 2, 1], 0],
    [[3, 0, 2, 0, 4], 7],
  ])('matches the expected water total for %j', (input, expected) => {
    const heights = input as number[];
    const { result } = renderHook(() => useTwoPointersSteps({ heights }));
    const steps = result.current.steps;
    expect(steps.at(-1)?.totalWater ?? 0).toBe(expected);
    expect(steps.every(step => step.totalWater >= 0)).toBe(true);
  });

  it('renders an explicit no-read result for an empty input', () => {
    const heights: number[] = [];
    const { result } = renderHook(() => useTwoPointersSteps({ heights }));
    expect(result.current.totalSteps).toBe(1);
    expect(result.current.currentStep?.narration).toContain('不读取端点');
    expect(result.current.currentStep?.totalWater).toBe(0);
  });

  it('resets empty data and calculates the second example', () => {
    const { result, rerender } = renderHook(({ heights }) => useTwoPointersSteps({ heights }), { initialProps: { heights: [4, 2, 0, 3, 2, 5] } });
    act(() => result.current.goToStep(result.current.totalSteps - 1));
    expect(result.current.currentStep?.totalWater).toBe(9);
    const emptyHeights: number[] = [];
    rerender({ heights: emptyHeights });
    expect(result.current.totalSteps).toBe(1);
    expect(result.current.currentStep?.totalWater).toBe(0);
  });
});
