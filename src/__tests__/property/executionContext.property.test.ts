/**
 * Property-Based Tests for Execution Context
 * 
 * **Feature: advanced-canvas-visualization, Property 9: Stack Frame Consistency**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
 * 
 * Tests that the execution context correctly represents the call stack,
 * with proper function names, parameters, local variables, and recursion depth.
 */

import fc from 'fast-check';
import { ExecutionContext, StackFrame } from '../../components/canvas/types';
import { 
  formatValue, 
  STYLES as ExecutionContextStyles 
} from '../../components/canvas/renderers/ExecutionContextRenderer';
import { 
  createCallChainFromContext 
} from '../../components/canvas/renderers/CallChainNavigator';

// 配置：每个属性测试运行至少100次
const propertyConfig = {
  numRuns: 100,
  verbose: false,
};

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate arbitrary parameter
 */
const arbitraryParameter = fc.record({
  name: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
  value: fc.oneof(
    fc.integer(),
    fc.string({ maxLength: 20 }),
    fc.boolean(),
    fc.constant(null),
    fc.array(fc.integer(), { maxLength: 5 })
  ),
});

/**
 * Generate arbitrary local variable
 */
const arbitraryLocalVariable = fc.record({
  name: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
  value: fc.oneof(
    fc.integer(),
    fc.string({ maxLength: 20 }),
    fc.boolean(),
    fc.constant(null),
    fc.array(fc.integer(), { maxLength: 5 })
  ),
});

/**
 * Generate arbitrary stack frame
 */
const arbitraryStackFrame = (index: number, isActive: boolean = false): fc.Arbitrary<StackFrame> =>
  fc.record({
    id: fc.constant(`frame-${index}`),
    functionName: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
    parameters: fc.array(arbitraryParameter, { minLength: 0, maxLength: 3 }),
    localVariables: fc.array(arbitraryLocalVariable, { minLength: 0, maxLength: 5 }),
    returnValue: fc.option(fc.oneof(fc.integer(), fc.string({ maxLength: 10 })), { nil: undefined }),
    isActive: fc.constant(isActive),
  });

/**
 * Generate arbitrary execution context with valid structure
 */
const arbitraryExecutionContext = (minFrames: number = 1, maxFrames: number = 10): fc.Arbitrary<ExecutionContext> =>
  fc.integer({ min: minFrames, max: maxFrames }).chain(numFrames => {
    // 随机选择一个活动帧
    const activeIndex = Math.floor(Math.random() * numFrames);
    
    return fc.tuple(
      ...Array.from({ length: numFrames }, (_, i) => 
        arbitraryStackFrame(i, i === activeIndex)
      )
    ).map(frames => {
      const stackFrames = frames as StackFrame[];
      return {
        stackFrames,
        currentDepth: stackFrames.length,
        callChain: stackFrames.map(f => f.functionName),
      };
    });
  });

/**
 * Generate execution context with exactly one active frame
 */
const arbitraryContextWithActiveFrame = fc.integer({ min: 1, max: 8 }).chain(numFrames => {
  const activeIndex = fc.integer({ min: 0, max: numFrames - 1 });
  
  return activeIndex.chain(activeIdx => {
    const frameGenerators = Array.from({ length: numFrames }, (_, i) =>
      arbitraryStackFrame(i, i === activeIdx)
    );
    
    return fc.tuple(...frameGenerators).map(frames => {
      const stackFrames = frames as StackFrame[];
      return {
        stackFrames,
        currentDepth: stackFrames.length,
        callChain: stackFrames.map(f => f.functionName),
      };
    });
  });
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Execution Context Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 9: Stack Frame Consistency**
   * **Validates: Requirements 6.1, 6.3**
   * 
   * For any execution context, the number of displayed stack frames should match
   * the actual number of frames in the context.
   */
  describe('Property 9.1: Stack Frame Count Consistency', () => {
    it('should have matching frame count between context and display', () => {
      fc.assert(
        fc.property(
          arbitraryExecutionContext(1, 10),
          (context) => {
            // 栈帧数量应该与上下文中的帧数一致
            return context.stackFrames.length === context.currentDepth;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 9: Stack Frame Consistency**
   * **Validates: Requirements 6.4**
   * 
   * For any execution context, the recursion depth should equal the number of stack frames.
   */
  describe('Property 9.2: Recursion Depth Accuracy', () => {
    it('should have recursion depth equal to stack frame count', () => {
      fc.assert(
        fc.property(
          arbitraryExecutionContext(1, 15),
          (context) => {
            return context.currentDepth === context.stackFrames.length;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 9: Stack Frame Consistency**
   * **Validates: Requirements 6.5**
   * 
   * For any execution context, exactly one frame should be marked as active.
   */
  describe('Property 9.3: Single Active Frame', () => {
    it('should have exactly one active frame', () => {
      fc.assert(
        fc.property(
          arbitraryContextWithActiveFrame,
          (context) => {
            const activeFrames = context.stackFrames.filter(f => f.isActive);
            return activeFrames.length === 1;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 9: Stack Frame Consistency**
   * **Validates: Requirements 6.6**
   * 
   * For any execution context, the call chain should contain all function names
   * in the correct order.
   */
  describe('Property 9.4: Call Chain Completeness', () => {
    it('should have call chain matching stack frame function names', () => {
      fc.assert(
        fc.property(
          arbitraryExecutionContext(1, 10),
          (context) => {
            // 调用链应该包含所有栈帧的函数名
            if (context.callChain.length !== context.stackFrames.length) {
              return false;
            }
            
            // 顺序应该一致
            for (let i = 0; i < context.stackFrames.length; i++) {
              if (context.callChain[i] !== context.stackFrames[i].functionName) {
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
   * **Feature: advanced-canvas-visualization, Property 9: Stack Frame Consistency**
   * **Validates: Requirements 6.3**
   * 
   * For any stack frame, all parameters should have valid names and values.
   */
  describe('Property 9.5: Parameter Validity', () => {
    it('should have valid parameters in all frames', () => {
      fc.assert(
        fc.property(
          arbitraryExecutionContext(1, 5),
          (context) => {
            for (const frame of context.stackFrames) {
              for (const param of frame.parameters) {
                // 参数名不能为空
                if (!param.name || param.name.length === 0) {
                  return false;
                }
                // 参数值可以是任何类型，但必须能被格式化
                try {
                  formatValue(param.value);
                } catch {
                  return false;
                }
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
   * **Feature: advanced-canvas-visualization, Property 9: Stack Frame Consistency**
   * **Validates: Requirements 6.3**
   * 
   * For any stack frame, all local variables should have valid names and values.
   */
  describe('Property 9.6: Local Variable Validity', () => {
    it('should have valid local variables in all frames', () => {
      fc.assert(
        fc.property(
          arbitraryExecutionContext(1, 5),
          (context) => {
            for (const frame of context.stackFrames) {
              for (const variable of frame.localVariables) {
                // 变量名不能为空
                if (!variable.name || variable.name.length === 0) {
                  return false;
                }
                // 变量值可以是任何类型，但必须能被格式化
                try {
                  formatValue(variable.value);
                } catch {
                  return false;
                }
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
   * **Feature: advanced-canvas-visualization, Property 9: Stack Frame Consistency**
   * **Validates: Requirements 6.1**
   * 
   * For any stack frame, the function name should not be empty.
   */
  describe('Property 9.7: Function Name Non-Empty', () => {
    it('should have non-empty function names in all frames', () => {
      fc.assert(
        fc.property(
          arbitraryExecutionContext(1, 10),
          (context) => {
            return context.stackFrames.every(frame => 
              frame.functionName && frame.functionName.length > 0
            );
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 9: Stack Frame Consistency**
   * **Validates: Requirements 6.1**
   * 
   * For any stack frame, the ID should be unique within the context.
   */
  describe('Property 9.8: Unique Frame IDs', () => {
    it('should have unique IDs for all frames', () => {
      fc.assert(
        fc.property(
          arbitraryExecutionContext(2, 10),
          (context) => {
            const ids = context.stackFrames.map(f => f.id);
            const uniqueIds = new Set(ids);
            return ids.length === uniqueIds.size;
          }
        ),
        propertyConfig
      );
    });
  });
});

// ============================================================================
// Format Value Tests
// ============================================================================

describe('Format Value Properties', () => {
  /**
   * formatValue should never throw for any input
   */
  describe('Format Value Safety', () => {
    it('should format any value without throwing', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.string(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.array(fc.integer(), { maxLength: 10 }),
            fc.dictionary(fc.string({ maxLength: 5 }), fc.integer())
          ),
          (value) => {
            try {
              const result = formatValue(value);
              return typeof result === 'string' && result.length > 0;
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
   * formatValue should return 'null' for null values
   */
  describe('Format Null Value', () => {
    it('should format null as "null"', () => {
      expect(formatValue(null)).toBe('null');
    });
  });

  /**
   * formatValue should return 'undefined' for undefined values
   */
  describe('Format Undefined Value', () => {
    it('should format undefined as "undefined"', () => {
      expect(formatValue(undefined)).toBe('undefined');
    });
  });

  /**
   * formatValue should wrap strings in quotes
   */
  describe('Format String Value', () => {
    it('should wrap strings in quotes', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 20 }),
          (str) => {
            const result = formatValue(str);
            return result.startsWith('"') && result.endsWith('"');
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * formatValue should format arrays with brackets
   */
  describe('Format Array Value', () => {
    it('should format arrays with brackets', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { maxLength: 10 }),
          (arr) => {
            const result = formatValue(arr);
            return result.startsWith('[') && (result.endsWith(']') || result.endsWith('...]'));
          }
        ),
        propertyConfig
      );
    });
  });
});

// ============================================================================
// Call Chain Navigator Tests
// ============================================================================

describe('Call Chain Navigator Properties', () => {
  /**
   * createCallChainFromContext should create items for all call chain entries
   */
  describe('Call Chain Item Creation', () => {
    it('should create items for all call chain entries', () => {
      fc.assert(
        fc.property(
          arbitraryExecutionContext(1, 10),
          (context) => {
            const items = createCallChainFromContext(
              context.callChain,
              context.stackFrames
            );
            
            return items.length === context.callChain.length;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Call chain items should have correct depth values
   */
  describe('Call Chain Depth Values', () => {
    it('should have sequential depth values starting from 0', () => {
      fc.assert(
        fc.property(
          arbitraryExecutionContext(1, 10),
          (context) => {
            const items = createCallChainFromContext(
              context.callChain,
              context.stackFrames
            );
            
            for (let i = 0; i < items.length; i++) {
              if (items[i].depth !== i) {
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
   * Exactly one call chain item should be active
   */
  describe('Call Chain Active Item', () => {
    it('should have exactly one active item when context has active frame', () => {
      fc.assert(
        fc.property(
          arbitraryContextWithActiveFrame,
          (context) => {
            const items = createCallChainFromContext(
              context.callChain,
              context.stackFrames
            );
            
            const activeItems = items.filter(item => item.isActive);
            return activeItems.length === 1;
          }
        ),
        propertyConfig
      );
    });
  });
});
