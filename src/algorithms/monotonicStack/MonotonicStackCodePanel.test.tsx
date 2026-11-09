import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import MonotonicStackCodePanel from './MonotonicStackCodePanel';
import { buildMonotonicStackSteps } from './useMonotonicStackSteps';
/* eslint-disable testing-library/no-node-access */

describe('MonotonicStackCodePanel', () => {
  it('maps active line for each selected language', () => {
    const steps = buildMonotonicStackSteps([2, 0, 2]);
    const step = steps.find(item => item.phase === 'calculate')!;
    render(<MonotonicStackCodePanel step={step} />);
    const panel = screen.getByText('单调栈执行代码').closest('.code-display') as HTMLElement;
    const expected: Array<[string, string]> = [['Java', '11'], ['Python', '10'], ['Go', '14'], ['JavaScript', '11']];
    for (const [language, line] of expected) {
      fireEvent.click(within(panel).getByRole('button', { name: language }));
      expect(panel.querySelector('.code-line.current .line-number')?.textContent).toBe(line);
    }
  });
});
