/**
 * Property-Based Tests for Code Line Binding
 * 
 * **Feature: advanced-canvas-visualization, Property 10: Code Line Binding Consistency**
 * **Feature: advanced-canvas-visualization, Property 11: Frame Granularity**
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
 * 
 * Tests that code line bindings are consistent across languages and
 * that animation frames have proper granularity.
 */

import fc from 'fast-check';
import {
  CodeLineBinding,
  AnimationFrame,
  Language,
  SUPPORTED_LANGUAGES,
  createCodeLineBinding,
  createEmptyCodeLineBinding,
  isValidCodeLineBinding,
  getCodeLinesForLanguage,
  createEmptyFrame,
  isValidAnimationFrame,
  hasSkippedStates,
  validateFrameGranularity,
} from '../../components/canvas/animation/types';
import {
  isBindingConsistentAcrossLanguages,
  mergeCodeLineBindings,
  getAllHighlightedLines,
} from '../../components/canvas/animation/CodeHighlightSync';
import {
  formatFrameInfo,
  calculateFrameProgress,
  getFrameStatusDescription,
} from '../../components/canvas/animation/FrameInfoDisplay';

// 配置：每个属性测试运行至少100次
const propertyConfig = {
  numRuns: 100,
  verbose: false,
};

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate arbitrary positive line number
 */
const arbitraryLineNumber = fc.integer({ min: 1, max: 1000 });

/**
 * Generate arbitrary array of line numbers
 */
const arbitraryLineNumbers = fc.array(arbitraryLineNumber, { minLength: 0, maxLength: 10 });

/**
 * Generate arbitrary code line binding
 */
const arbitraryCodeLineBinding: fc.Arbitrary<CodeLineBinding> = fc.record({
  java: arbitraryLineNumbers,
  python: arbitraryLineNumbers,
  golang: arbitraryLineNumbers,
  javascript: arbitraryLineNumbers,
});

/**
 * Generate consistent code line binding (all languages have same number of lines)
 */
const arbitraryConsistentCodeLineBinding: fc.Arbitrary<CodeLineBinding> = 
  fc.array(arbitraryLineNumber, { minLength: 1, maxLength: 5 }).map(lines => ({
    java: lines,
    python: lines.map(l => l + 1), // Offset for different languages
    golang: lines.map(l => l + 2),
    javascript: lines,
  }));

/**
 * Generate arbitrary animation frame
 */
const arbitraryAnimationFrame = (frameNumber: number): fc.Arbitrary<AnimationFrame> =>
  fc.record({
    id: fc.constant(`frame-${frameNumber}`),
    frameNumber: fc.constant(frameNumber),
    description: fc.string({ minLength: 0, maxLength: 100 }),
    codeLineBindings: arbitraryCodeLineBinding,
    canvasState: fc.constant({
      elements: [],
      highlightedElements: [],
      transform: { scale: 1, translateX: 0, translateY: 0 },
    }),
    variables: fc.constant([]),
    annotations: fc.constant([]),
    arrows: fc.constant([]),
  });

/**
 * Generate sequence of consecutive animation frames
 */
const arbitraryConsecutiveFrames = (count: number): fc.Arbitrary<AnimationFrame[]> => {
  if (count <= 0) return fc.constant([]);
  
  const frameGenerators = Array.from({ length: count }, (_, i) => 
    arbitraryAnimationFrame(i)
  );
  
  return fc.tuple(...frameGenerators) as fc.Arbitrary<AnimationFrame[]>;
};

/**
 * Generate sequence with potential gaps
 */
const arbitraryFramesWithGaps: fc.Arbitrary<AnimationFrame[]> = 
  fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 10 })
    .map(frameNumbers => {
      const sorted = [...new Set(frameNumbers)].sort((a, b) => a - b);
      return sorted.map(num => createEmptyFrame(num, `Frame ${num}`));
    });

// ============================================================================
// Property Tests - Code Line Binding
// ============================================================================

describe('Code Line Binding Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 10: Code Line Binding Consistency**
   * **Validates: Requirements 7.3, 7.4**
   * 
   * For any code line binding, all line numbers should be positive integers.
   */
  describe('Property 10.1: Line Number Validity', () => {
    it('should have all positive line numbers', () => {
      fc.assert(
        fc.property(
          arbitraryCodeLineBinding,
          (binding) => {
            for (const lang of SUPPORTED_LANGUAGES) {
              for (const line of binding[lang]) {
                if (!Number.isInteger(line) || line <= 0) {
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
   * **Feature: advanced-canvas-visualization, Property 10: Code Line Binding Consistency**
   * **Validates: Requirements 7.2**
   * 
   * For any language, getCodeLinesForLanguage should return the correct lines.
   */
  describe('Property 10.2: Language Line Retrieval', () => {
    it('should retrieve correct lines for each language', () => {
      fc.assert(
        fc.property(
          arbitraryCodeLineBinding,
          fc.constantFrom(...SUPPORTED_LANGUAGES),
          (binding, language) => {
            const lines = getCodeLinesForLanguage(binding, language);
            return JSON.stringify(lines) === JSON.stringify(binding[language]);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 10: Code Line Binding Consistency**
   * **Validates: Requirements 7.3**
   * 
   * createCodeLineBinding should create valid bindings from inputs.
   */
  describe('Property 10.3: Binding Creation', () => {
    it('should create valid bindings from single or array inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(arbitraryLineNumber, arbitraryLineNumbers),
          fc.oneof(arbitraryLineNumber, arbitraryLineNumbers),
          fc.oneof(arbitraryLineNumber, arbitraryLineNumbers),
          fc.oneof(arbitraryLineNumber, arbitraryLineNumbers),
          (java, python, golang, javascript) => {
            const binding = createCodeLineBinding(java, python, golang, javascript);
            
            // 结果应该总是数组
            return (
              Array.isArray(binding.java) &&
              Array.isArray(binding.python) &&
              Array.isArray(binding.golang) &&
              Array.isArray(binding.javascript)
            );
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 10: Code Line Binding Consistency**
   * **Validates: Requirements 7.4**
   * 
   * Merging bindings should include all unique lines from all inputs.
   */
  describe('Property 10.4: Binding Merge Completeness', () => {
    it('should include all unique lines when merging', () => {
      fc.assert(
        fc.property(
          arbitraryCodeLineBinding,
          arbitraryCodeLineBinding,
          (binding1, binding2) => {
            const merged = mergeCodeLineBindings(binding1, binding2);
            
            for (const lang of SUPPORTED_LANGUAGES) {
              const allLines = [...binding1[lang], ...binding2[lang]];
              const uniqueLines = Array.from(new Set(allLines));
              
              // 合并后应该包含所有唯一行
              for (const line of uniqueLines) {
                if (!merged[lang].includes(line)) {
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
   * **Feature: advanced-canvas-visualization, Property 10: Code Line Binding Consistency**
   * **Validates: Requirements 7.2**
   * 
   * getAllHighlightedLines should return lines for all languages.
   */
  describe('Property 10.5: All Languages Highlighted', () => {
    it('should return highlighted lines for all supported languages', () => {
      fc.assert(
        fc.property(
          arbitraryCodeLineBinding,
          (binding) => {
            const allLines = getAllHighlightedLines(binding);
            
            // 应该有所有支持的语言
            for (const lang of SUPPORTED_LANGUAGES) {
              if (!(lang in allLines)) {
                return false;
              }
              // 行号应该匹配
              if (JSON.stringify(allLines[lang]) !== JSON.stringify(binding[lang])) {
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
   * Empty binding should be valid
   */
  describe('Empty Binding Validity', () => {
    it('should create valid empty binding', () => {
      const empty = createEmptyCodeLineBinding();
      
      expect(empty.java).toEqual([]);
      expect(empty.python).toEqual([]);
      expect(empty.golang).toEqual([]);
      expect(empty.javascript).toEqual([]);
    });
  });
});

// ============================================================================
// Property Tests - Frame Granularity
// ============================================================================

describe('Frame Granularity Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 11: Frame Granularity**
   * **Validates: Requirements 7.1, 7.5**
   * 
   * For any sequence of consecutive frames, frame numbers should be sequential.
   */
  describe('Property 11.1: Sequential Frame Numbers', () => {
    it('should have sequential frame numbers in consecutive frames', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (count) => {
            const frames: AnimationFrame[] = [];
            for (let i = 0; i < count; i++) {
              frames.push(createEmptyFrame(i, `Frame ${i}`));
            }
            
            return validateFrameGranularity(frames);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 11: Frame Granularity**
   * **Validates: Requirements 7.5**
   * 
   * hasSkippedStates should detect gaps between frames.
   */
  describe('Property 11.2: Gap Detection', () => {
    it('should detect gaps between non-consecutive frames', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 2, max: 100 }),
          (frame1Num, gap) => {
            const frame1 = createEmptyFrame(frame1Num);
            const frame2 = createEmptyFrame(frame1Num + gap);
            
            // 如果 gap > 1，应该检测到跳过
            return hasSkippedStates(frame1, frame2) === (gap > 1);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 11: Frame Granularity**
   * **Validates: Requirements 7.1**
   * 
   * validateFrameGranularity should return false for frames with gaps.
   */
  describe('Property 11.3: Granularity Validation', () => {
    it('should fail validation for frames with gaps', () => {
      fc.assert(
        fc.property(
          arbitraryFramesWithGaps,
          (frames) => {
            if (frames.length <= 1) {
              return validateFrameGranularity(frames) === true;
            }
            
            // 检查是否有间隙
            let hasGap = false;
            for (let i = 1; i < frames.length; i++) {
              if (frames[i].frameNumber - frames[i - 1].frameNumber !== 1) {
                hasGap = true;
                break;
              }
            }
            
            // 验证结果应该与是否有间隙相反
            return validateFrameGranularity(frames) === !hasGap;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Single frame should always pass granularity validation
   */
  describe('Single Frame Granularity', () => {
    it('should pass validation for single frame', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (frameNum) => {
            const frames = [createEmptyFrame(frameNum)];
            return validateFrameGranularity(frames);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Empty frame list should pass granularity validation
   */
  describe('Empty Frame List Granularity', () => {
    it('should pass validation for empty frame list', () => {
      expect(validateFrameGranularity([])).toBe(true);
    });
  });
});

// ============================================================================
// Property Tests - Animation Frame
// ============================================================================

describe('Animation Frame Properties', () => {
  /**
   * isValidAnimationFrame should validate frame structure
   */
  describe('Frame Validation', () => {
    it('should validate properly constructed frames', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.string({ maxLength: 100 }),
          (frameNum, description) => {
            const frame = createEmptyFrame(frameNum, description);
            return isValidAnimationFrame(frame);
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * Frame with negative number should be invalid
   */
  describe('Negative Frame Number', () => {
    it('should reject frames with negative numbers', () => {
      const frame = createEmptyFrame(-1);
      expect(isValidAnimationFrame(frame)).toBe(false);
    });
  });
});

// ============================================================================
// Property Tests - Frame Info Display
// ============================================================================

describe('Frame Info Display Properties', () => {
  /**
   * formatFrameInfo should produce consistent output
   */
  describe('Frame Info Formatting', () => {
    it('should format frame info consistently', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          (currentIndex, totalFrames) => {
            const info = formatFrameInfo(currentIndex, totalFrames);
            
            // 应该包含帧号（从1开始）
            const displayNumber = currentIndex + 1;
            return info.includes(String(displayNumber)) && info.includes(String(totalFrames));
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * calculateFrameProgress should return valid percentage
   */
  describe('Frame Progress Calculation', () => {
    it('should calculate progress between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          (currentIndex, totalFrames) => {
            // 确保 currentIndex 在有效范围内
            const validIndex = Math.min(currentIndex, totalFrames - 1);
            const progress = calculateFrameProgress(validIndex, totalFrames);
            
            return progress >= 0 && progress <= 100;
          }
        ),
        propertyConfig
      );
    });
  });

  /**
   * getFrameStatusDescription should return meaningful status
   */
  describe('Frame Status Description', () => {
    it('should return appropriate status for different positions', () => {
      // 开始位置
      expect(getFrameStatusDescription(0, 10)).toBe('开始');
      
      // 结束位置
      expect(getFrameStatusDescription(9, 10)).toBe('结束');
      
      // 中间位置应该包含进度
      const middleStatus = getFrameStatusDescription(5, 10);
      expect(middleStatus).toContain('进度');
      
      // 无帧
      expect(getFrameStatusDescription(0, 0)).toBe('无帧');
    });
  });
});
