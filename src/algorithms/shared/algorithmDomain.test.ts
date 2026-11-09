import { calculateWaterByBoundaries, validateWaterHeights } from './algorithmDomain';

describe('water problem input and oracle helpers', () => {
  it('rejects invalid input with specific issue tags and indexes', () => {
    expect(validateWaterHeights([])).toMatchObject({ valid: false, issue: 'empty' });
    expect(validateWaterHeights([0, 1, 2], 2)).toMatchObject({ valid: false, issue: 'too-many-bars' });
    expect(validateWaterHeights([0, -1])).toMatchObject({ valid: false, issue: 'invalid-height', index: 1 });
    expect(validateWaterHeights([0, 1.5])).toMatchObject({ valid: false, issue: 'invalid-height', index: 1 });
    expect(validateWaterHeights([0, 11], 10, 10)).toMatchObject({ valid: false, issue: 'height-out-of-range', index: 1 });
    expect(validateWaterHeights([0, 3, 0])).toEqual({ valid: true });
    expect(validateWaterHeights([0], 200, -1)).toMatchObject({ valid: false, issue: 'height-out-of-range' });
  });

  it('acts as a differential oracle for generated valid arrays', () => {
    const cases = [[0], [0, 2], [4, 2, 0, 3, 2, 5], [5, 1, 1, 1, 5], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1]];
    for (const heights of cases) {
      const oracle = calculateWaterByBoundaries(heights);
      const { algorithm: rowByRow } = require('../rowByRow/rowByRow');
      const { algorithm: bruteForce } = require('../bruteForce/bruteForce');
      expect(rowByRow(heights)).toBe(oracle.total);
      expect(bruteForce(heights)).toBe(oracle.total);
    }
  });

  it('handles the maximum problem length without repeated range rescans', () => {
    const heights = Array(20000).fill(1);
    expect(calculateWaterByBoundaries(heights)).toEqual({ water: Array(20000).fill(0), total: 0 });
  });

  it('calculates per-column and total water for common and degenerate terrains', () => {
    expect(calculateWaterByBoundaries([4, 2, 0, 3, 2, 5])).toEqual({ water: [0, 2, 4, 1, 2, 0], total: 9 });
    expect(calculateWaterByBoundaries([0, 1, 0, 2])).toEqual({ water: [0, 0, 1, 0], total: 1 });
    expect(calculateWaterByBoundaries([0, 0, 0])).toEqual({ water: [0, 0, 0], total: 0 });
    expect(calculateWaterByBoundaries([1, 2, 3])).toEqual({ water: [0, 0, 0], total: 0 });
  });
});
