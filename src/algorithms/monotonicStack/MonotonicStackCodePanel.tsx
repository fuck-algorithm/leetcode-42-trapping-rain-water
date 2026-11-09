import React from 'react';
import CodeDisplay from '../../components/CodeDisplay/CodeDisplay';
import { monotonicStackCode } from '../algorithmCodes';
import { MonotonicStackStep } from './useMonotonicStackSteps';

interface MonotonicStackCodePanelProps {
  step?: MonotonicStackStep;
  className?: string;
}

const MonotonicStackCodePanel: React.FC<MonotonicStackCodePanelProps> = ({ step, className }) => <CodeDisplay
  className={className}
  title="单调栈执行代码"
  codes={monotonicStackCode}
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
    java: [{ name: 'i', value: step.currentIndex, line: 5 }, { name: 'stack', value: step.stack.length, line: 3 }, { name: 'water', value: step.totalWater, line: 2 }],
    python: [{ name: 'i', value: step.currentIndex, line: 4 }, { name: 'stack', value: step.stack.length, line: 2 }, { name: 'water', value: step.totalWater, line: 2 }],
    golang: [{ name: 'i', value: step.currentIndex, line: 5 }, { name: 'stack', value: step.stack.length, line: 3 }, { name: 'water', value: step.totalWater, line: 2 }],
    javascript: [{ name: 'i', value: step.currentIndex, line: 4 }, { name: 'stack', value: step.stack.length, line: 2 }, { name: 'water', value: step.totalWater, line: 2 }],
  } : {}}
/>;

export default MonotonicStackCodePanel;
