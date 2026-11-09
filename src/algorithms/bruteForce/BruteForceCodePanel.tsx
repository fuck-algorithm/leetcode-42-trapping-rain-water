import React from 'react';
import CodeDisplay from '../../components/CodeDisplay/CodeDisplay';
import { bruteForceCode } from '../algorithmCodes';
import { BruteForceStep } from './types';
import './BruteForceCodePanel.css';

interface BruteForceCodePanelProps {
  step?: BruteForceStep;
}

const BruteForceCodePanel: React.FC<BruteForceCodePanelProps> = ({ step }) => <div className="brute-force-code-panel">
  <CodeDisplay title="暴力法执行代码" className="code-display-compact" codes={bruteForceCode}
    currentLineByLanguage={step?.codeLineBindings ? {
      java: step.codeLineBindings.java[0],
      python: step.codeLineBindings.python[0],
      golang: step.codeLineBindings.golang[0],
      javascript: step.codeLineBindings.javascript[0],
    } : {}}
    highlightLinesByLanguage={step?.codeLineBindings ? {
      java: step.codeLineBindings.java,
      python: step.codeLineBindings.python,
      golang: step.codeLineBindings.golang,
      javascript: step.codeLineBindings.javascript,
    } : {}}
    variablesByLanguage={step ? {
    java: [{ name: 'i', value: step.position, line: 6 }, { name: 'leftMax', value: step.leftMax, line: 7 }, { name: 'rightMax', value: step.rightMax, line: 7 }, { name: 'water', value: step.totalWater, line: 3 }],
    python: [{ name: 'i', value: step.position, line: 5 }, { name: 'left_max', value: step.leftMax, line: 6 }, { name: 'right_max', value: step.rightMax, line: 7 }, { name: 'water', value: step.totalWater, line: 3 }],
    golang: [{ name: 'i', value: step.position, line: 5 }, { name: 'leftMax', value: step.leftMax, line: 6 }, { name: 'rightMax', value: step.rightMax, line: 6 }, { name: 'water', value: step.totalWater, line: 3 }],
    javascript: [{ name: 'i', value: step.position, line: 5 }, { name: 'leftMax', value: step.leftMax, line: 6 }, { name: 'rightMax', value: step.rightMax, line: 6 }, { name: 'water', value: step.totalWater, line: 3 }],
  } : {}} />
</div>;

export default BruteForceCodePanel;
