import { VALIDATION_RULES, generateRandomHeights, validateHeights } from './validation';

describe('rainwater input validation boundaries', () => {
  it('distinguishes empty, malformed, empty-token, too-short, overlong, negative, and too-high inputs', () => {
    expect(validateHeights('   ').isValid).toBe(false);
    expect(validateHeights('1,x,3').error).toMatch(/只能包含/);
    expect(validateHeights(',,').error).toMatch(/至少一个数字/);
    expect(validateHeights(`${VALIDATION_RULES.MAX_VALUE + 1}`).error).toMatch(/超过最大值/);
    const overlong = Array(VALIDATION_RULES.MAX_LENGTH + 1).fill(1).join(',');
    expect(validateHeights(overlong).error).toMatch(/不能超过/);
    expect(validateHeights('-1').error).toMatch(/只能包含/);
    expect(validateHeights('0,5').heights).toEqual([0, 5]);
  });

  it('clamps pathological random generator ranges and height limits', () => {
    const result = generateRandomHeights(-50, 10000, VALIDATION_RULES.MAX_VALUE + 100);
    expect(result.length).toBeGreaterThanOrEqual(VALIDATION_RULES.MIN_LENGTH);
    expect(result.length).toBeLessThanOrEqual(VALIDATION_RULES.MAX_LENGTH);
    expect(result.every(height => Number.isInteger(height) && height >= 0 && height <= VALIDATION_RULES.MAX_VALUE)).toBe(true);
  });
});
