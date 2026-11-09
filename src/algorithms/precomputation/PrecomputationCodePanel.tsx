import React from 'react';
import CodeDisplay from '../../components/CodeDisplay/CodeDisplay';
import { precomputationCode } from '../algorithmCodes';
import { AnimationStep } from './usePrecomputationSteps';
import './AlgorithmCodePanel.css';

interface PrecomputationCodePanelProps {
  step?: AnimationStep;
}

const PrecomputationCodePanel: React.FC<PrecomputationCodePanelProps> = ({ step }) => <CodeDisplay
  title="双数组法执行代码"
  className="code-display-compact"
  codes={precomputationCode}
  currentLineByLanguage={step?.codeLineBindings ? {
    java: step.codeLineBindings.java[0], python: step.codeLineBindings.python[0],
    golang: step.codeLineBindings.golang[0], javascript: step.codeLineBindings.javascript[0],
  } : {}}
  highlightLinesByLanguage={step?.codeLineBindings ? {
    java: step.codeLineBindings.java, python: step.codeLineBindings.python,
    golang: step.codeLineBindings.golang, javascript: step.codeLineBindings.javascript,
  } : {}}
  variablesByLanguage={step ? {
    java: [
      { name: 'i', value: step.currentIndex, line: 22 },
      { name: 'leftMax', value: step.leftMax[step.currentIndex] ?? 0, line: 10 },
      { name: 'rightMax', value: step.rightMax[step.currentIndex] ?? 0, line: 16 },
      { name: 'water', value: step.totalWater, line: 21 },
    ],
    python: [
      { name: 'i', value: step.currentIndex, line: 21 },
      { name: 'left_max', value: step.leftMax[step.currentIndex] ?? 0, line: 11 },
      { name: 'right_max', value: step.rightMax[step.currentIndex] ?? 0, line: 17 },
      { name: 'water', value: step.totalWater, line: 20 },
    ],
    golang: [
      { name: 'i', value: step.currentIndex, line: 25 },
      { name: 'leftMax', value: step.leftMax[step.currentIndex] ?? 0, line: 12 },
      { name: 'rightMax', value: step.rightMax[step.currentIndex] ?? 0, line: 18 },
      { name: 'water', value: step.totalWater, line: 23 },
    ],
    javascript: [
      { name: 'i', value: step.currentIndex, line: 22 },
      { name: 'leftMax', value: step.leftMax[step.currentIndex] ?? 0, line: 10 },
      { name: 'rightMax', value: step.rightMax[step.currentIndex] ?? 0, line: 16 },
      { name: 'water', value: step.totalWater, line: 21 },
    ],
  } : {}}
/>;

export default PrecomputationCodePanel;
