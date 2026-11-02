import React from 'react';
import { twoPointersCode } from '../algorithmCodes';
import { TwoPointersStep } from './useTwoPointersSteps';
import { getSetting, saveSetting, SETTING_KEYS } from '../../utils/indexedDB';
import './TwoPointersCodePanel.css';

const LANGUAGES = [
  { id: 'java', name: 'Java' },
  { id: 'python', name: 'Python' },
  { id: 'golang', name: 'Go' },
  { id: 'javascript', name: 'JavaScript' },
] as const;
type CodeLanguage = (typeof LANGUAGES)[number]['id'];

interface TwoPointersCodePanelProps {
  currentStep?: Pick<TwoPointersStep, 'codeLineBindings' | 'left' | 'right' | 'leftMax' | 'rightMax' | 'totalWater'>;
}

const TwoPointersCodePanel: React.FC<TwoPointersCodePanelProps> = ({ currentStep }) => {
  const [language, setLanguage] = React.useState<CodeLanguage>('java');
  React.useEffect(() => {
    let mounted = true;
    getSetting<CodeLanguage>(SETTING_KEYS.SELECTED_LANGUAGE, 'java').then(value => {
      if (mounted && LANGUAGES.some(item => item.id === value)) setLanguage(value);
    });
    return () => { mounted = false; };
  }, []);
  const lines = twoPointersCode[language].split('\n');
  const activeLines = currentStep?.codeLineBindings?.[language] || [];
  const setLanguagePreference = (value: CodeLanguage) => {
    setLanguage(value);
    void saveSetting(SETTING_KEYS.SELECTED_LANGUAGE, value);
  };

  return <aside className="two-pointer-code-panel" aria-label="算法代码面板">
    <header className="two-pointer-code-header">
      <strong>执行代码</strong>
      <span>当前步骤同步高亮</span>
    </header>
    <nav className="two-pointer-language-tabs" aria-label="代码语言">
      {LANGUAGES.map(item => <button key={item.id} type="button" aria-pressed={language === item.id} className={language === item.id ? 'active' : ''} onClick={() => setLanguagePreference(item.id)}>{item.name}</button>)}
    </nav>
    <div className="two-pointer-variable-watch" aria-label="关键变量">
      {[['left', currentStep?.left], ['right', currentStep?.right], ['leftMax', currentStep?.leftMax], ['rightMax', currentStep?.rightMax], ['water', currentStep?.totalWater]].map(([name, value]) => <span key={name as string}>{name} = {value ?? '—'}</span>)}
    </div>
    <div className="two-pointer-code-scroll" role="region" aria-label={`${language} 算法代码`}>
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        const active = activeLines.includes(lineNumber);
        return <div className={`two-pointer-code-line${active ? ' current' : ''}`} data-line={lineNumber} key={lineNumber}>
          <span className="two-pointer-line-number">{lineNumber}</span>
          <code>{line || ' '}</code>
        </div>;
      })}
    </div>
  </aside>;
};

export default TwoPointersCodePanel;
