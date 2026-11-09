import fc from 'fast-check';
import { algorithm } from './bruteForce';
import { calculateWaterByBoundaries } from '../shared/algorithmDomain';

const smallHeights = fc.array(fc.integer({ min: 0, max: 12 }), { minLength: 0, maxLength: 30 });

describe('bruteForce.algorithm', () => {
  it('matches the independent boundary oracle for generated terrains', () => {
    fc.assert(fc.property(smallHeights, heights => algorithm(heights) === calculateWaterByBoundaries(heights).total), { numRuns: 120 });
  });

  it('uses the wider boundary for ridges and returns zero for monotone slopes', () => {
    expect(algorithm([5, 1, 1, 1, 5])).toBe(12);
    expect(algorithm([0, 1, 2, 3, 4])).toBe(0);
    expect(algorithm([4, 3, 2, 1, 0])).toBe(0);
  });
});
