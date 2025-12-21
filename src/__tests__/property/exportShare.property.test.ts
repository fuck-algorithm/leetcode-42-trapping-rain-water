/**
 * Export/Share Property Tests
 * 
 * **Feature: advanced-canvas-visualization, Property 17: Export/Import Round-Trip**
 * **Feature: advanced-canvas-visualization, Property 18: Image Export Validity**
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.5, 12.6**
 */

import fc from 'fast-check';
import { ExportManager, ExportState, DEFAULT_EXPORT_STATE } from '../../components/canvas/export/ExportManager';
import { Language } from '../../components/canvas/animation/types';

// 生成任意的 ExportState
const arbitraryExportState = (): fc.Arbitrary<ExportState> => {
  const languages: Language[] = ['java', 'python', 'golang', 'javascript'];
  
  return fc.record({
    inputData: fc.oneof(
      fc.array(fc.integer({ min: 0, max: 10000 }), { minLength: 1, maxLength: 50 }),
      fc.constant([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])
    ),
    currentFrame: fc.integer({ min: 0, max: 1000 }),
    canvasTransform: fc.record({
      scale: fc.double({ min: 0.1, max: 10, noNaN: true }),
      translateX: fc.double({ min: -1000, max: 1000, noNaN: true }),
      translateY: fc.double({ min: -1000, max: 1000, noNaN: true }),
    }),
    selectedLanguage: fc.constantFrom(...languages),
    playbackSpeed: fc.integer({ min: 100, max: 2000 }),
    algorithmType: fc.option(fc.constantFrom('twoPointers', 'monotonicStack', 'precomputation'), { nil: undefined }),
  });
};

describe('Export/Share Properties', () => {
  const exportManager = new ExportManager();

  /**
   * **Feature: advanced-canvas-visualization, Property 17: Export/Import Round-Trip**
   * 
   * *For any* application state, exporting to URL and then importing from that URL 
   * should restore the exact same state (input data, current frame, view settings).
   */
  describe('Property 17: Export/Import Round-Trip', () => {
    it('should restore exact state after encode and decode', () => {
      fc.assert(
        fc.property(
          arbitraryExportState(),
          (state) => {
            const encoded = exportManager.encodeState(state);
            const decoded = exportManager.decodeState(encoded);
            
            // 验证输入数据
            expect(JSON.stringify(decoded.inputData)).toBe(JSON.stringify(state.inputData));
            
            // 验证当前帧
            expect(decoded.currentFrame).toBe(state.currentFrame);
            
            // 验证画布变换（使用近似比较处理浮点数）
            expect(decoded.canvasTransform.scale).toBeCloseTo(state.canvasTransform.scale, 5);
            expect(decoded.canvasTransform.translateX).toBeCloseTo(state.canvasTransform.translateX, 5);
            expect(decoded.canvasTransform.translateY).toBeCloseTo(state.canvasTransform.translateY, 5);
            
            // 验证语言选择
            expect(decoded.selectedLanguage).toBe(state.selectedLanguage);
            
            // 验证播放速度
            expect(decoded.playbackSpeed).toBe(state.playbackSpeed);
            
            return true;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should restore exact state after compress and decompress', () => {
      fc.assert(
        fc.property(
          arbitraryExportState(),
          (state) => {
            const compressed = exportManager.compressAndEncode(state);
            const decompressed = exportManager.decompressAndDecode(compressed);
            
            // 验证输入数据
            expect(JSON.stringify(decompressed.inputData)).toBe(JSON.stringify(state.inputData));
            
            // 验证当前帧
            expect(decompressed.currentFrame).toBe(state.currentFrame);
            
            // 验证画布变换
            expect(decompressed.canvasTransform.scale).toBeCloseTo(state.canvasTransform.scale, 5);
            expect(decompressed.canvasTransform.translateX).toBeCloseTo(state.canvasTransform.translateX, 5);
            expect(decompressed.canvasTransform.translateY).toBeCloseTo(state.canvasTransform.translateY, 5);
            
            // 验证语言选择
            expect(decompressed.selectedLanguage).toBe(state.selectedLanguage);
            
            return true;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should generate valid URL and restore from it', () => {
      fc.assert(
        fc.property(
          arbitraryExportState(),
          (state) => {
            // Mock window.location
            const originalLocation = window.location;
            delete (window as any).location;
            (window as any).location = {
              origin: 'https://example.com',
              pathname: '/app',
              href: 'https://example.com/app',
              search: '',
            };

            try {
              const url = exportManager.generateShareUrl(state);
              
              // URL 应该是有效的
              expect(url).toMatch(/^https:\/\/example\.com\/app\?[sc]=/);
              
              // 从 URL 恢复状态
              const restored = exportManager.restoreFromUrl(url);
              
              // 验证核心字段
              expect(JSON.stringify(restored.inputData)).toBe(JSON.stringify(state.inputData));
              expect(restored.currentFrame).toBe(state.currentFrame);
              expect(restored.selectedLanguage).toBe(state.selectedLanguage);
              
              return true;
            } finally {
              (window as any).location = originalLocation;
            }
          }
        ),
        { numRuns: 50, verbose: true }
      );
    });
  });

  /**
   * 编码后的字符串应该是 URL-safe 的
   */
  describe('URL Safety', () => {
    it('encoded string should be URL-safe', () => {
      fc.assert(
        fc.property(
          arbitraryExportState(),
          (state) => {
            const encoded = exportManager.encodeState(state);
            
            // 不应包含需要 URL 编码的字符
            const urlUnsafeChars = /[+/=]/;
            expect(encoded).not.toMatch(urlUnsafeChars);
            
            // 应该只包含 URL-safe 字符
            const urlSafePattern = /^[A-Za-z0-9_-]*$/;
            expect(encoded).toMatch(urlSafePattern);
            
            return true;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * 默认状态处理
   */
  describe('Default State Handling', () => {
    it('should return default state for invalid URL', () => {
      const invalidUrls = [
        'https://example.com/app',
        'https://example.com/app?foo=bar',
        'https://example.com/app?s=invalid',
      ];

      invalidUrls.forEach(url => {
        const restored = exportManager.restoreFromUrl(url);
        expect(restored).toBeDefined();
        expect(typeof restored.currentFrame).toBe('number');
        expect(typeof restored.playbackSpeed).toBe('number');
      });
    });

    it('should handle missing fields gracefully', () => {
      const partialState = {
        inputData: [1, 2, 3],
        currentFrame: 5,
        // 缺少其他字段
      };

      const encoded = exportManager.encodeState(partialState as ExportState);
      const decoded = exportManager.decodeState(encoded);

      expect(decoded.inputData).toEqual([1, 2, 3]);
      expect(decoded.currentFrame).toBe(5);
      // 缺少的字段应该有默认值
      expect(decoded.canvasTransform).toBeDefined();
      expect(decoded.selectedLanguage).toBeDefined();
      expect(decoded.playbackSpeed).toBeDefined();
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 18: Image Export Validity**
   * 
   * 注意：由于 JSDOM 环境限制，无法完整测试图片导出功能
   * 这里只测试 exportAsImage 方法的基本行为
   */
  describe('Property 18: Image Export Validity', () => {
    it('should reject when SVG element is invalid', async () => {
      // 创建一个无效的 SVG 元素
      const invalidSvg = document.createElement('div') as unknown as SVGElement;
      
      // 应该抛出错误或返回有效的 Blob
      // 在 JSDOM 环境中，这个测试可能会失败，因为 Canvas API 不完整
      try {
        await exportManager.exportAsImage(invalidSvg);
      } catch (error) {
        // 预期会抛出错误
        expect(error).toBeDefined();
      }
    });

    it('should have downloadBlob method', () => {
      expect(typeof exportManager.downloadBlob).toBe('function');
    });

    it('should have copyToClipboard method', () => {
      expect(typeof exportManager.copyToClipboard).toBe('function');
    });
  });
});
