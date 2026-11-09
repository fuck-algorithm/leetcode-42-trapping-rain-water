import React from 'react';
import CodeDisplay from '../../components/CodeDisplay/CodeDisplay';
import { rowByRowCode } from '../algorithmCodes';
import { RowByRowStep } from './useRowByRowSteps';
import './AlgorithmCodePanel.css';

interface RowByRowCodePanelProps {
  step?: RowByRowStep;
}

const RowByRowCodePanel: React.FC<RowByRowCodePanelProps> = ({ step }) => <CodeDisplay
  title="按行法执行代码"
  className="code-display-compact"
  codes={rowByRowCode}
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
      { name: 'level', value: step.currentRow, line: 8 },
      { name: 'i', value: step.currentCol, line: 10 },
      { name: 'water', value: step.totalWater, line: 7 },
    ],
    python: [
      { name: 'level', value: step.currentRow, line: 8 },
      { name: 'i', value: step.currentCol, line: 10 },
      { name: 'water', value: step.totalWater, line: 6 },
    ],
    golang: [
      { name: 'level', value: step.currentRow, line: 10 },
      { name: 'i', value: step.currentCol, line: 12 },
      { name: 'water', value: step.totalWater, line: 9 },
    ],
    javascript: [
      { name: 'level', value: step.currentRow, line: 7 },
      { name: 'i', value: step.currentCol, line: 9 },
      { name: 'water', value: step.totalWater, line: 5 },
    ],
  } : {}}
/>;

export default RowByRowCodePanel;
