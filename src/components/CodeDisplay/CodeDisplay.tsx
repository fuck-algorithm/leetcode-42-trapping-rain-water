import React, { useState, useEffect } from 'react';
import './CodeDisplay.css';
import { saveSetting, getSetting, SETTING_KEYS } from '../../utils/indexedDB';

// 支持的编程语言
export type Language = 'java' | 'python' | 'golang' | 'javascript';

// 语言配置
const languageConfig: Record<Language, { name: string; extension: string }> = {
  java: { name: 'Java', extension: 'java' },
  python: { name: 'Python', extension: 'py' },
  golang: { name: 'Go', extension: 'go' },
  javascript: { name: 'JavaScript', extension: 'js' }
};

// 变量状态
export interface VariableState {
  name: string;
  value: string | number;
  line: number; // 变量所在行
}

interface CodeDisplayProps {
  codes: Record<Language, string>;
  currentLine?: number; // 当前执行行（从1开始）
  variables?: VariableState[]; // 当前变量状态
  highlightLines?: number[]; // 需要高亮的行
}

// 简单的语法高亮函数
const highlightSyntax = (code: string, language: Language): string => {
  // 关键字
  const keywords: Record<Language, string[]> = {
    java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 
           'static', 'final', 'void', 'int', 'long', 'double', 'float', 'boolean', 'char',
           'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return',
           'new', 'this', 'super', 'null', 'true', 'false', 'try', 'catch', 'finally', 'throw'],
    python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'return',
             'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda',
             'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'pass', 'yield', 'global'],
    golang: ['func', 'package', 'import', 'var', 'const', 'type', 'struct', 'interface',
             'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue',
             'return', 'go', 'defer', 'chan', 'map', 'make', 'new', 'nil', 'true', 'false'],
    javascript: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'do',
                 'switch', 'case', 'break', 'continue', 'return', 'class', 'extends',
                 'new', 'this', 'super', 'null', 'undefined', 'true', 'false', 'try',
                 'catch', 'finally', 'throw', 'async', 'await', 'import', 'export', 'default']
  };

  // 类型关键字
  const types: Record<Language, string[]> = {
    java: ['int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'String', 'Integer', 'Long', 'Double', 'Boolean'],
    python: ['int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'List', 'Dict', 'Tuple', 'Set', 'Optional'],
    golang: ['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'float32', 'float64', 'string', 'bool', 'byte', 'rune', 'error'],
    javascript: ['number', 'string', 'boolean', 'object', 'Array', 'Object', 'String', 'Number', 'Boolean']
  };

  let result = code;
  
  // 转义 HTML 特殊字符
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 高亮字符串（单引号和双引号）
  result = result.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="code-string">$&</span>');
  
  // 高亮注释
  if (language === 'python') {
    result = result.replace(/(#.*)$/gm, '<span class="code-comment">$1</span>');
  } else {
    result = result.replace(/(\/\/.*)$/gm, '<span class="code-comment">$1</span>');
  }
  
  // 高亮数字
  result = result.replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>');
  
  // 高亮关键字
  keywords[language].forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    result = result.replace(regex, '<span class="code-keyword">$1</span>');
  });
  
  // 高亮类型
  types[language].forEach(type => {
    const regex = new RegExp(`\\b(${type})\\b`, 'g');
    result = result.replace(regex, '<span class="code-type">$1</span>');
  });
  
  return result;
};

const CodeDisplay: React.FC<CodeDisplayProps> = ({
  codes,
  currentLine,
  variables = [],
  highlightLines = []
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('javascript');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 从 IndexedDB 恢复语言选择
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await getSetting<Language>(SETTING_KEYS.SELECTED_LANGUAGE, 'javascript');
      setSelectedLanguage(savedLanguage);
    };
    loadLanguage();
  }, []);

  // 处理语言切换并持久化
  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    saveSetting(SETTING_KEYS.SELECTED_LANGUAGE, lang);
  };
  
  // 获取当前代码
  const currentCode = codes[selectedLanguage] || '';
  const lines = currentCode.split('\n');
  
  // 获取某行的变量状态
  const getVariablesForLine = (lineNumber: number): VariableState[] => {
    return variables.filter(v => v.line === lineNumber);
  };

  return (
    <div className={`code-display ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="code-header">
        <div className="code-title" onClick={() => setIsCollapsed(!isCollapsed)}>
          <span className="toggle-icon">{isCollapsed ? '▶' : '▼'}</span>
          <span>算法代码</span>
        </div>
        <div className="language-tabs">
          {(Object.keys(languageConfig) as Language[]).map(lang => (
            <button
              key={lang}
              className={`language-tab ${selectedLanguage === lang ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang)}
            >
              {languageConfig[lang].name}
            </button>
          ))}
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="code-content">
          <div className="code-lines">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isCurrentLine = currentLine === lineNumber;
              const isHighlighted = highlightLines.includes(lineNumber);
              const lineVariables = getVariablesForLine(lineNumber);
              
              return (
                <div
                  key={index}
                  className={`code-line ${isCurrentLine ? 'current' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                >
                  <span className="line-number">{lineNumber}</span>
                  <span 
                    className="line-content"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSyntax(line, selectedLanguage) || '&nbsp;' 
                    }}
                  />
                  {lineVariables.length > 0 && (
                    <span className="line-variables">
                      {lineVariables.map((v, i) => (
                        <span key={i} className="variable-badge">
                          {v.name}={v.value}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeDisplay;
