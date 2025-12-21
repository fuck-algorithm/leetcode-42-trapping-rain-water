/**
 * CodeHighlightSync Component
 * 
 * Synchronizes code highlighting with animation frames.
 * Highlights the corresponding code lines based on the current frame's codeLineBindings.
 * 
 * Requirements: 7.2
 */

import React, { useMemo, useCallback } from 'react';
import { CodeLineBinding, Language, SUPPORTED_LANGUAGES, getCodeLinesForLanguage } from './types';

export interface CodeHighlightSyncProps {
  /** 当前帧的代码行绑定 */
  codeLineBindings: CodeLineBinding;
  /** 当前选中的语言 */
  currentLanguage: Language;
  /** 代码内容（按行分割） */
  codeLines: string[];
  /** 高亮行的回调 */
  onHighlightLines?: (lines: number[]) => void;
  /** 自定义高亮样式 */
  highlightStyle?: React.CSSProperties;
  /** 是否显示行号 */
  showLineNumbers?: boolean;
  /** 起始行号 */
  startLineNumber?: number;
}

// 默认高亮样式
const DEFAULT_HIGHLIGHT_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(255, 235, 59, 0.3)',
  borderLeft: '3px solid #ffc107',
};

/**
 * Hook to get highlighted lines for current language
 */
export function useHighlightedLines(
  codeLineBindings: CodeLineBinding,
  currentLanguage: Language
): number[] {
  return useMemo(() => {
    return getCodeLinesForLanguage(codeLineBindings, currentLanguage);
  }, [codeLineBindings, currentLanguage]);
}

/**
 * Hook to check if a line should be highlighted
 */
export function useLineHighlightChecker(
  codeLineBindings: CodeLineBinding,
  currentLanguage: Language
): (lineNumber: number) => boolean {
  const highlightedLines = useHighlightedLines(codeLineBindings, currentLanguage);
  
  return useCallback(
    (lineNumber: number) => highlightedLines.includes(lineNumber),
    [highlightedLines]
  );
}

/**
 * 代码行组件
 */
const CodeLine: React.FC<{
  lineNumber: number;
  content: string;
  isHighlighted: boolean;
  highlightStyle: React.CSSProperties;
  showLineNumber: boolean;
}> = ({ lineNumber, content, isHighlighted, highlightStyle, showLineNumber }) => {
  const lineStyle: React.CSSProperties = isHighlighted
    ? { ...highlightStyle, display: 'flex', alignItems: 'center' }
    : { display: 'flex', alignItems: 'center' };

  return (
    <div
      className={`code-line ${isHighlighted ? 'highlighted' : ''}`}
      style={lineStyle}
      data-testid={`code-line-${lineNumber}`}
      data-highlighted={isHighlighted}
    >
      {showLineNumber && (
        <span
          className="line-number"
          style={{
            minWidth: '40px',
            paddingRight: '12px',
            color: isHighlighted ? '#ff9800' : '#999',
            textAlign: 'right',
            userSelect: 'none',
            fontWeight: isHighlighted ? 'bold' : 'normal',
          }}
        >
          {lineNumber}
        </span>
      )}
      <span
        className="line-content"
        style={{
          flex: 1,
          whiteSpace: 'pre',
          fontFamily: 'monospace',
        }}
      >
        {content}
      </span>
    </div>
  );
};

/**
 * Main CodeHighlightSync component
 */
const CodeHighlightSync: React.FC<CodeHighlightSyncProps> = ({
  codeLineBindings,
  currentLanguage,
  codeLines,
  onHighlightLines,
  highlightStyle = DEFAULT_HIGHLIGHT_STYLE,
  showLineNumbers = true,
  startLineNumber = 1,
}) => {
  const highlightedLines = useHighlightedLines(codeLineBindings, currentLanguage);
  
  // 通知父组件高亮行变化
  React.useEffect(() => {
    onHighlightLines?.(highlightedLines);
  }, [highlightedLines, onHighlightLines]);

  return (
    <div
      className="code-highlight-sync"
      data-testid="code-highlight-sync"
      style={{
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
    >
      {codeLines.map((line, index) => {
        const lineNumber = startLineNumber + index;
        const isHighlighted = highlightedLines.includes(lineNumber);
        
        return (
          <CodeLine
            key={lineNumber}
            lineNumber={lineNumber}
            content={line}
            isHighlighted={isHighlighted}
            highlightStyle={highlightStyle}
            showLineNumber={showLineNumbers}
          />
        );
      })}
    </div>
  );
};

export default CodeHighlightSync;

/**
 * 获取所有语言的高亮行
 */
export function getAllHighlightedLines(
  codeLineBindings: CodeLineBinding
): Record<Language, number[]> {
  const result: Record<Language, number[]> = {} as Record<Language, number[]>;
  
  for (const lang of SUPPORTED_LANGUAGES) {
    result[lang] = getCodeLinesForLanguage(codeLineBindings, lang);
  }
  
  return result;
}

/**
 * 检查代码行绑定是否在语言切换时保持一致
 * 即所有语言都有对应的行号
 */
export function isBindingConsistentAcrossLanguages(
  codeLineBindings: CodeLineBinding
): boolean {
  const hasLines = SUPPORTED_LANGUAGES.map(
    lang => codeLineBindings[lang].length > 0
  );
  
  // 要么所有语言都有行号，要么都没有
  const allHave = hasLines.every(h => h);
  const noneHave = hasLines.every(h => !h);
  
  return allHave || noneHave;
}

/**
 * 合并多个代码行绑定
 */
export function mergeCodeLineBindings(
  ...bindings: CodeLineBinding[]
): CodeLineBinding {
  const result: CodeLineBinding = {
    java: [],
    python: [],
    golang: [],
    javascript: [],
  };
  
  for (const binding of bindings) {
    for (const lang of SUPPORTED_LANGUAGES) {
      const combined = [...result[lang], ...binding[lang]];
      result[lang] = Array.from(new Set(combined)).sort((a, b) => a - b);
    }
  }
  
  return result;
}
