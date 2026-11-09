import { resolveHeightDomain } from './visualDomain';

describe('resolveHeightDomain', () => {
  it.each([
    [[], [0, 1]],
    [[0, 0, 0], [0, 1]],
    [[2, 0, 3], [0, 3]],
    [[-2, 0, 4], [0, 4]],
    [[NaN, 5], [0, 5]],
    [[NaN, Infinity, -Infinity], [0, 1]],
    [[-5, -1], [0, 1]],
    [[0.25], [0, 1]],
  ])('returns a finite non-degenerate domain for %j', (values, expected) => {
    expect(resolveHeightDomain(values as number[])).toEqual(expected);
  });
});
