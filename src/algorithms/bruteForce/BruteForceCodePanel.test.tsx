import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
/* eslint-disable testing-library/no-node-access */
import BruteForceCodePanel from './BruteForceCodePanel';
import { useBruteForceSteps } from './useBruteForceSteps';

const BRUTE_FORCE_TEST_HEIGHTS = [3, 0, 3];
// Hook-driven smoke coverage is part of the pane's language switching contract.

const HookHarness: React.FC = () => {
  const { steps } = useBruteForceSteps({ heights: BRUTE_FORCE_TEST_HEIGHTS });
  return <BruteForceCodePanel step={steps[0]} />;
};

describe('BruteForceCodePanel', () => {
  it('shows language-specific active code lines and variable notes', async () => {
    render(<HookHarness />);
    const panel = screen.getByText('暴力法执行代码').closest('.code-display') as HTMLElement;
    await waitFor(() => expect(within(panel).getByText('2', { selector: '.code-line.current .line-number' })).toBeInTheDocument());
    const expected: Array<[string, string]> = [['Java', '2'], ['Python', '2'], ['Go', '2'], ['JavaScript', '2']];
    for (const [language, line] of expected) {
      fireEvent.click(within(panel).getByRole('button', { name: language }));
      expect(within(panel).getByText(line, { selector: '.code-line.current .line-number' })).toBeInTheDocument();
    }
    fireEvent.click(within(panel).getByRole('button', { name: 'Java' }));
    expect(within(panel).getAllByText(/water=/).length).toBe(1);
  });
});
