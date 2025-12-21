/**
 * ExportManager - 导出与分享管理器
 * 
 * 实现状态编码/解码、生成分享 URL、从 URL 恢复状态
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { CanvasTransform } from '../types';
import { Language } from '../animation/types';
import pako from 'pako';

/**
 * 导出状态接口
 */
export interface ExportState {
  inputData: any;
  currentFrame: number;
  canvasTransform: CanvasTransform;
  selectedLanguage: Language;
  playbackSpeed: number;
  algorithmType?: string;
}

/**
 * 默认导出状态
 */
export const DEFAULT_EXPORT_STATE: ExportState = {
  inputData: [],
  currentFrame: 0,
  canvasTransform: { scale: 1, translateX: 0, translateY: 0 },
  selectedLanguage: 'javascript',
  playbackSpeed: 500,
};

// URL 参数名
const URL_PARAM_STATE = 's';
const URL_PARAM_COMPRESSED = 'c';

// 最大 URL 长度（超过此长度使用压缩）
const MAX_URL_LENGTH = 2000;

/**
 * ExportManager 类
 * 管理应用状态的导出和导入
 */
export class ExportManager {
  /**
   * 编码状态为 Base64 字符串
   */
  encodeState(state: ExportState): string {
    try {
      const jsonStr = JSON.stringify(state);
      // 使用 URL-safe Base64 编码
      return this.toBase64Url(jsonStr);
    } catch (error) {
      console.error('Failed to encode state:', error);
      throw new Error('状态编码失败');
    }
  }

  /**
   * 解码 Base64 字符串为状态
   */
  decodeState(encoded: string): ExportState {
    try {
      const jsonStr = this.fromBase64Url(encoded);
      const state = JSON.parse(jsonStr);
      return this.validateAndNormalizeState(state);
    } catch (error) {
      console.error('Failed to decode state:', error);
      throw new Error('状态解码失败');
    }
  }

  /**
   * 压缩并编码状态
   */
  compressAndEncode(state: ExportState): string {
    try {
      const jsonStr = JSON.stringify(state);
      const compressed = pako.deflate(jsonStr);
      // 将 Uint8Array 转换为 Base64
      const base64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
      return this.toBase64Url(base64);
    } catch (error) {
      console.error('Failed to compress state:', error);
      throw new Error('状态压缩失败');
    }
  }

  /**
   * 解压缩并解码状态
   */
  decompressAndDecode(compressed: string): ExportState {
    try {
      const base64 = this.fromBase64Url(compressed);
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const jsonStr = pako.inflate(bytes, { to: 'string' });
      const state = JSON.parse(jsonStr);
      return this.validateAndNormalizeState(state);
    } catch (error) {
      console.error('Failed to decompress state:', error);
      throw new Error('状态解压失败');
    }
  }

  /**
   * 生成分享 URL
   */
  generateShareUrl(state: ExportState): string {
    const baseUrl = window.location.origin + window.location.pathname;
    
    // 先尝试不压缩
    const encoded = this.encodeState(state);
    const simpleUrl = `${baseUrl}?${URL_PARAM_STATE}=${encoded}`;
    
    if (simpleUrl.length <= MAX_URL_LENGTH) {
      return simpleUrl;
    }
    
    // URL 过长，使用压缩
    const compressed = this.compressAndEncode(state);
    return `${baseUrl}?${URL_PARAM_COMPRESSED}=${compressed}`;
  }

  /**
   * 从 URL 恢复状态
   */
  restoreFromUrl(url: string): ExportState {
    try {
      const urlObj = new URL(url);
      
      // 检查是否有压缩参数
      const compressed = urlObj.searchParams.get(URL_PARAM_COMPRESSED);
      if (compressed) {
        return this.decompressAndDecode(compressed);
      }
      
      // 检查普通状态参数
      const encoded = urlObj.searchParams.get(URL_PARAM_STATE);
      if (encoded) {
        return this.decodeState(encoded);
      }
      
      // 没有状态参数，返回默认状态
      return { ...DEFAULT_EXPORT_STATE };
    } catch (error) {
      console.error('Failed to restore state from URL:', error);
      return { ...DEFAULT_EXPORT_STATE };
    }
  }

  /**
   * 检查当前 URL 是否包含分享状态
   */
  hasSharedState(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has(URL_PARAM_STATE) || urlParams.has(URL_PARAM_COMPRESSED);
  }

  /**
   * 从当前 URL 恢复状态
   */
  restoreFromCurrentUrl(): ExportState {
    return this.restoreFromUrl(window.location.href);
  }

  /**
   * 复制文本到剪贴板
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('复制到剪贴板失败');
    }
  }

  /**
   * 导出画布为 PNG 图片
   */
  async exportAsImage(svgElement: SVGElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // 克隆 SVG 以避免修改原始元素
        const clonedSvg = svgElement.cloneNode(true) as SVGElement;
        
        // 获取 SVG 尺寸
        const bbox = svgElement.getBoundingClientRect();
        const width = bbox.width || 800;
        const height = bbox.height || 600;
        
        // 设置 SVG 属性
        clonedSvg.setAttribute('width', String(width));
        clonedSvg.setAttribute('height', String(height));
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // 内联所有样式
        this.inlineStyles(clonedSvg);
        
        // 序列化 SVG
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        
        // 创建 Blob
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        // 创建 Image 对象
        const img = new Image();
        img.onload = () => {
          // 创建 Canvas
          const canvas = document.createElement('canvas');
          canvas.width = width * 2; // 2x 分辨率
          canvas.height = height * 2;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建 Canvas 上下文'));
            return;
          }
          
          // 设置白色背景
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 绘制 SVG
          ctx.scale(2, 2);
          ctx.drawImage(img, 0, 0);
          
          // 转换为 Blob
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('无法生成图片'));
            }
          }, 'image/png');
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('图片加载失败'));
        };
        
        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 下载 Blob 为文件
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ============ 私有方法 ============

  /**
   * 转换为 URL-safe Base64
   */
  private toBase64Url(str: string): string {
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * 从 URL-safe Base64 解码
   */
  private fromBase64Url(base64Url: string): string {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // 补齐 padding
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(escape(atob(base64)));
  }

  /**
   * 验证并规范化状态
   */
  private validateAndNormalizeState(state: any): ExportState {
    return {
      inputData: state.inputData ?? DEFAULT_EXPORT_STATE.inputData,
      currentFrame: typeof state.currentFrame === 'number' ? state.currentFrame : DEFAULT_EXPORT_STATE.currentFrame,
      canvasTransform: this.validateTransform(state.canvasTransform),
      selectedLanguage: this.validateLanguage(state.selectedLanguage),
      playbackSpeed: typeof state.playbackSpeed === 'number' ? state.playbackSpeed : DEFAULT_EXPORT_STATE.playbackSpeed,
      algorithmType: state.algorithmType,
    };
  }

  /**
   * 验证画布变换
   */
  private validateTransform(transform: any): CanvasTransform {
    if (!transform || typeof transform !== 'object') {
      return { ...DEFAULT_EXPORT_STATE.canvasTransform };
    }
    return {
      scale: typeof transform.scale === 'number' ? transform.scale : 1,
      translateX: typeof transform.translateX === 'number' ? transform.translateX : 0,
      translateY: typeof transform.translateY === 'number' ? transform.translateY : 0,
    };
  }

  /**
   * 验证语言选择
   */
  private validateLanguage(language: any): Language {
    const validLanguages: Language[] = ['java', 'python', 'golang', 'javascript'];
    if (validLanguages.includes(language)) {
      return language;
    }
    return DEFAULT_EXPORT_STATE.selectedLanguage;
  }

  /**
   * 内联 SVG 样式
   */
  private inlineStyles(element: Element): void {
    const computedStyle = window.getComputedStyle(element);
    const styleProps = ['fill', 'stroke', 'stroke-width', 'font-family', 'font-size', 'font-weight', 'opacity'];
    
    let styleStr = '';
    styleProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value) {
        styleStr += `${prop}:${value};`;
      }
    });
    
    if (styleStr) {
      element.setAttribute('style', styleStr);
    }
    
    // 递归处理子元素
    Array.from(element.children).forEach(child => {
      this.inlineStyles(child);
    });
  }
}

// 导出单例
export const exportManager = new ExportManager();

export default ExportManager;
