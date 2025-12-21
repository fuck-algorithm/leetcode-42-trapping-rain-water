/**
 * Property-Based Tests for Variables Panel
 * 
 * **Feature: advanced-canvas-visualization, Property 16: Variable Panel Completeness**
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
 * 
 * Tests that the variables panel correctly displays all variables and highlights changes.
 */

import fc from 'fast-check';
import { VariableState } from '../../components/canvas/animation/types';
import {
  formatVariableValue,
  getTypeLabel,
  isExpandable,
  shouldHighlightVariable,
  getChangedVariables,
  getReferencedVariables,
} from '../../components/canvas/panels/VariablesPanel';

// 配置：每个属性测试运行至少100次
const propertyConfig = {
  numRuns: 100,
  verbose: false,
};

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate arbitrary variable value
 */
const arbitraryValue = fc.oneof(
  fc.integer(),
  fc.string({ maxLength: 50 }),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
  fc.array(fc.integer(), { maxLength: 10 }),
  fc.dictionary(fc.string({ maxLength: 10 }), fc.integer(), { maxKeys: 5 })
);

/**
 * Generate arbitrary variable state
 */
const arbitraryVariableState: fc.Arbitrary<VariableState> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
  value: arbitraryValue,
  type: fc.constantFrom('number', 'string', 'boolean', 'array', 'object'),
  changed: fc.boolean(),
  referencedInStep: fc.boolean(),
});

/**
 * Generate array of variable states
 */
const arbitraryVariableStates = (minLength: number = 0, maxLength: number = 10): fc.Arbitrary<VariableState[]> =>
  fc.array(arbitraryVariableState, { minLength, maxLength });

// ============================================================================
// Property Tests - Variable Panel Completeness
// ============================================================================

describe('Variables Panel Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 16: Variable Panel Completeness**
   * **Validates: Requirements 11.1**
   * 
   * For any animation frame with variables, all variables should be displayable.
   */
  describe('Property 16.1: All Variables Displayable', () => {
    it('should be able to format any variable value', () => {
      fc.assert(
        fc.property(
          arbitraryValue,
          (value) => {
            const formatted = formatVariableValue(value);
            return typeof formatted === 'string' && formatted.length > 0;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 16: Variable Panel Completeness**
   * **Validates: Requirements 11.2**
   * 
   * Changed variables should be highlighted.
   */
  describe('Property 16.2: Changed Variables Highlighted', () => {
    it('should highlight changed variables', () => {
      fc.assert(
        fc.property(
          arbitraryVariableStates(1, 10),
          (variables) => {
            const changedVars = getChangedVariables(variables);
            
            // 所有变化的变量都应该被标记为需要高亮
            for (const v of changedVars) {
              if (!shouldHighlightVariable(v)) {
                return false;
              }
            }
            
            return true;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 16: Variable Panel Completeness**
   * **Validates: Requirements 11.4**
   * 
   * Referenced variables should be highlighted.
   */
  describe('Property 16.3: Referenced Variables Highlighted', () => {
    it('should highlight referenced variables', () => {
      fc.assert(
        fc.property(
          arbitraryVariableStates(1, 10),
          (variables) => {
            const referencedVars = getReferencedVariables(variables);
            
            // 所有引用的变量都应该被标记为需要高亮
            for (const v of referencedVars) {
              if (!shouldHighlightVariable(v)) {
                return false;
              }
            }
            
            return true;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 16: Variable Panel Completeness**
   * **Validates: Requirements 11.3**
   * 
   * Complex data structures should be expandable.
   */
  describe('Property 16.4: Complex Structures Expandable', () => {
    it('should mark arrays as expandable', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 0, maxLength: 10 }),
          (arr) => {
            return isExpandable(arr) === true;
          }
        ),
        propertyConfig
      );
    });

    it('should mark objects as expandable', () => {
      fc.assert(
        fc.property(
          fc.dictionary(fc.string({ maxLength: 10 }), fc.integer(), { maxKeys: 5 }),
          (obj) => {
            return isExpandable(obj) === true;
          }
        ),
        propertyConfig
      );
    });

    it('should not mark primitives as expandable', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.string(), fc.boolean()),
          (primitive) => {
            return isExpandable(primitive) === false;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * getChangedVariables should return only changed variables.
   */
  describe('Changed Variables Filter', () => {
    it('should return only changed variables', () => {
      fc.assert(
        fc.property(
          arbitraryVariableStates(1, 10),
          (variables) => {
            const changed = getChangedVariables(variables);
            
            // 所有返回的变量都应该是变化的
            return changed.every(v => v.changed === true);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * getReferencedVariables should return only referenced variables.
   */
  describe('Referenced Variables Filter', () => {
    it('should return only referenced variables', () => {
      fc.assert(
        fc.property(
          arbitraryVariableStates(1, 10),
          (variables) => {
            const referenced = getReferencedVariables(variables);
            
            // 所有返回的变量都应该是被引用的
            return referenced.every(v => v.referencedInStep === true);
          }
        ),
        propertyConfig
      );
    });
  });
});

// ============================================================================
// Property Tests - Value Formatting
// ============================================================================

describe('Value Formatting Properties', () => {
  /**
   * formatVariableValue should never throw.
   */
  describe('Format Safety', () => {
    it('should format any value without throwing', () => {
      fc.assert(
        fc.property(
          arbitraryValue,
          (value) => {
            try {
              formatVariableValue(value);
              return true;
            } catch {
              return false;
            }
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * formatVariableValue should respect max length.
   */
  describe('Format Max Length', () => {
    it('should respect max length parameter', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 200 }),
          fc.integer({ min: 10, max: 50 }),
          (str, maxLength) => {
            const formatted = formatVariableValue(str, maxLength);
            // 格式化后的字符串不应该超过 maxLength + 一些额外字符（引号等）
            return formatted.length <= maxLength + 10;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Null should format as 'null'.
   */
  describe('Null Formatting', () => {
    it('should format null as "null"', () => {
      expect(formatVariableValue(null)).toBe('null');
    });
  });

  /**
   * Undefined should format as 'undefined'.
   */
  describe('Undefined Formatting', () => {
    it('should format undefined as "undefined"', () => {
      expect(formatVariableValue(undefined)).toBe('undefined');
    });
  });

  /**
   * Strings should be wrapped in quotes.
   */
  describe('String Formatting', () => {
    it('should wrap strings in quotes', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 20 }),
          (str) => {
            const formatted = formatVariableValue(str);
            return formatted.startsWith('"') && (formatted.endsWith('"') || formatted.endsWith('..."'));
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Arrays should be formatted with brackets.
   */
  describe('Array Formatting', () => {
    it('should format arrays with brackets', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { maxLength: 5 }),
          (arr) => {
            const formatted = formatVariableValue(arr);
            return formatted.startsWith('[') && (formatted.endsWith(']') || formatted.endsWith('...]'));
          }
        ),
        propertyConfig
      );
    });
  });
});

// ============================================================================
// Property Tests - Type Labels
// ============================================================================

describe('Type Label Properties', () => {
  /**
   * getTypeLabel should return correct type for primitives.
   */
  describe('Primitive Type Labels', () => {
    it('should return "number" for numbers', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          (num) => {
            return getTypeLabel(num) === 'number';
          }
        ),
        propertyConfig
      );
    });

    it('should return "string" for strings', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (str) => {
            return getTypeLabel(str) === 'string';
          }
        ),
        propertyConfig
      );
    });

    it('should return "boolean" for booleans', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (bool) => {
            return getTypeLabel(bool) === 'boolean';
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * getTypeLabel should return array with length for arrays.
   */
  describe('Array Type Labels', () => {
    it('should return array with length', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { maxLength: 10 }),
          (arr) => {
            const label = getTypeLabel(arr);
            return label === `array[${arr.length}]`;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * getTypeLabel should return 'null' for null.
   */
  describe('Null Type Label', () => {
    it('should return "null" for null', () => {
      expect(getTypeLabel(null)).toBe('null');
    });
  });

  /**
   * getTypeLabel should return 'undefined' for undefined.
   */
  describe('Undefined Type Label', () => {
    it('should return "undefined" for undefined', () => {
      expect(getTypeLabel(undefined)).toBe('undefined');
    });
  });
});

// ============================================================================
// Property Tests - Highlight Logic
// ============================================================================

describe('Highlight Logic Properties', () => {
  /**
   * shouldHighlightVariable should return true for changed or referenced.
   */
  describe('Highlight Conditions', () => {
    it('should highlight if changed', () => {
      const variable: VariableState = {
        name: 'test',
        value: 1,
        type: 'number',
        changed: true,
        referencedInStep: false,
      };
      expect(shouldHighlightVariable(variable)).toBe(true);
    });

    it('should highlight if referenced', () => {
      const variable: VariableState = {
        name: 'test',
        value: 1,
        type: 'number',
        changed: false,
        referencedInStep: true,
      };
      expect(shouldHighlightVariable(variable)).toBe(true);
    });

    it('should not highlight if neither changed nor referenced', () => {
      const variable: VariableState = {
        name: 'test',
        value: 1,
        type: 'number',
        changed: false,
        referencedInStep: false,
      };
      expect(shouldHighlightVariable(variable)).toBe(false);
    });
  });
});
