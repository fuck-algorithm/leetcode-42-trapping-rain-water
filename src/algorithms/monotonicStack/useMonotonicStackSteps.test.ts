import fc from 'fast-check';
import { calculateWaterByBoundaries } from '../shared/algorithmDomain';
import { buildMonotonicStackSteps } from './useMonotonicStackSteps';

describe('buildMonotonicStackSteps', () => {
  it('matches the independent boundary oracle for arbitrary small terrains', () => {
    fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 12 }), { minLength: 0, maxLength: 24 }), heights => {
      const steps = buildMonotonicStackSteps(heights);
      const expected = calculateWaterByBoundaries(heights);
      const actual = steps.at(-1);
      return (actual?.totalWater ?? 0) === expected.total
        && JSON.stringify(actual?.water ?? []) === JSON.stringify(expected.water);
    }), { numRuns: 120 });
  });

  it('keeps overlapping basin snapshots and cumulative water consistent per column', () => {
    const steps = buildMonotonicStackSteps([5, 1, 2, 1, 4]);
    expect(steps.at(-1)).toMatchObject({ water: [0, 3, 2, 3, 0], totalWater: 8 });
    for (const step of steps) {
      expect(step.totalWater).toBe(step.water.reduce((sum, amount) => sum + amount, 0));
    }
  });

  it('shows distinct pop-without-left-wall and area-closed basin events', () => {
    const noLeftWall = buildMonotonicStackSteps([1, 2]).find(step => step.description?.includes('缺少左墙'));
    const basin = buildMonotonicStackSteps([3, 0, 2]).find(step => step.phase === 'calculate');
    expect(noLeftWall?.totalWater).toBe(0);
    expect(noLeftWall?.description).toContain('缺少左墙');
    expect(basin).toMatchObject({ width: 1, height: 2, area: 2, totalWater: 2 });
  });
});
