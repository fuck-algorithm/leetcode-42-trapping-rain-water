import fc from 'fast-check';
import { validateHeights, generateRandomHeights, VALIDATION_RULES } from '../../utils/validation';

const propertyConfig = {
  numRuns: 100,
  verbose: true
};

describe('Input Validation Properties', () => {
  /**
   * **Feature: leetcode-algorithm-visualizer, Property 2: Valid Input Acceptance**
   * **Validates: Requirements 3.2**
   * 
   * For any string input that matches the pattern of comma-separated non-negative integers
   * within valid ranges (0-10000) and valid array length (1-200), the system should accept
   * the input and update the heights array accordingly.
   */
  it('Property 2: should accept all valid height inputs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: VALIDATION_RULES.MIN_VALUE, max: VALIDATION_RULES.MAX_VALUE }), 
          { minLength: VALIDATION_RULES.MIN_LENGTH, maxLength: VALIDATION_RULES.MAX_LENGTH }
        ),
        (heights) => {
          const input = heights.join(',');
          const result = validateHeights(input);
          return result.isValid === true && 
                 result.heights !== undefined &&
                 result.heights.length === heights.length;
        }
      ),
      propertyConfig
    );
  });

  /**
   * **Feature: leetcode-algorithm-visualizer, Property 3: Invalid Input Rejection**
   * **Validates: Requirements 3.3**
   * 
   * For any string input that does not match the valid input pattern, the system should
   * reject the input and display an appropriate error message.
   */
  describe('Property 3: Invalid Input Rejection', () => {
    it('should reject inputs with negative numbers', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -1000, max: -1 }), { minLength: 1, maxLength: 10 }),
          (negativeNumbers) => {
            const input = negativeNumbers.join(',');
            const result = validateHeights(input);
            return result.isValid === false && result.error !== undefined;
          }
        ),
        propertyConfig
      );
    });

    it('should reject inputs with values exceeding max', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: VALIDATION_RULES.MAX_VALUE + 1, max: VALIDATION_RULES.MAX_VALUE + 10000 }), 
            { minLength: 1, maxLength: 10 }
          ),
          (largeNumbers) => {
            const input = largeNumbers.join(',');
            const result = validateHeights(input);
            return result.isValid === false && result.error !== undefined;
          }
        ),
        propertyConfig
      );
    });

    it('should reject inputs with non-numeric characters', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom('a', 'b', 'c', 'x', 'y', 'z', '!', '@', '#'), { minLength: 1, maxLength: 10 }),
          (invalidChars) => {
            const invalidString = invalidChars.join('');
            const result = validateHeights(invalidString);
            return result.isValid === false && result.error !== undefined;
          }
        ),
        propertyConfig
      );
    });

    it('should reject empty inputs', () => {
      const emptyInputs = ['', '   ', '\t', '\n'];
      emptyInputs.forEach(input => {
        const result = validateHeights(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject arrays exceeding max length', () => {
      const tooLongArray = Array(VALIDATION_RULES.MAX_LENGTH + 1).fill(1);
      const input = tooLongArray.join(',');
      const result = validateHeights(input);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('不能超过');
    });
  });
});

describe('Random Generation Properties', () => {
  /**
   * **Feature: leetcode-algorithm-visualizer, Property 4: Random Generation Validity**
   * **Validates: Requirements 3.6, 3.7**
   * 
   * For any invocation of the random data generation function, the output should always
   * be a valid heights array where all values are non-negative integers between 0-10000
   * and the array length is between 1-200.
   */
  it('Property 4: should always generate valid random heights', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (minLen, maxLenOffset, maxHeight) => {
          const maxLen = minLen + maxLenOffset;
          const heights = generateRandomHeights(minLen, maxLen, maxHeight);
          
          // 验证生成的数组
          const result = validateHeights(heights.join(','));
          
          // 检查长度在预期范围内
          const expectedMinLen = Math.max(VALIDATION_RULES.MIN_LENGTH, Math.min(minLen, VALIDATION_RULES.MAX_LENGTH));
          const expectedMaxLen = Math.max(expectedMinLen, Math.min(maxLen, VALIDATION_RULES.MAX_LENGTH));
          
          return result.isValid === true &&
                 heights.length >= expectedMinLen &&
                 heights.length <= expectedMaxLen &&
                 heights.every(h => h >= 0 && h <= Math.min(maxHeight, VALIDATION_RULES.MAX_VALUE));
        }
      ),
      propertyConfig
    );
  });

  it('should generate arrays within specified length range', () => {
    for (let i = 0; i < 100; i++) {
      const heights = generateRandomHeights(8, 15, 9);
      expect(heights.length).toBeGreaterThanOrEqual(8);
      expect(heights.length).toBeLessThanOrEqual(15);
      heights.forEach(h => {
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(9);
      });
    }
  });
});
