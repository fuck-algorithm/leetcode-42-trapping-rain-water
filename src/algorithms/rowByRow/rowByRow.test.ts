import fc from 'fast-check';
import { algorithm } from './rowByRow';
import { calculateWaterByBoundaries } from '../shared/algorithmDomain';

const smallHeights = fc.array(fc.integer({ min: 0, max: 12 }), { minLength: 0, maxLength: 30 });

describe('rowByRow.algorithm', () => {
  it('matches the independent boundary oracle for generated terrains', () => {
    fc.assert(fc.property(smallHeights, heights => algorithm(heights) === calculateWaterByBoundaries(heights).total), { numRuns: 120 });
  });

  it('does not count an open right edge as a basin', () => {
    expect(algorithm([3, 0, 2, 0])).toBe(2);
    expect(algorithm([0, 2, 0])).toBe(0);
    expect(algorithm([3, 0, 2, 0, 4])).toBe(7);
  });
});
