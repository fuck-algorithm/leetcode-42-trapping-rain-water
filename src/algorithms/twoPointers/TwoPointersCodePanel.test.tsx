import React from 'react';
import { render, screen } from '@testing-library/react';
import TwoPointersCodePanel from './TwoPointersCodePanel';

describe('TwoPointersCodePanel', () => {
  it('shows Java code and synchronizes the current algorithm line', () => {
    render(<TwoPointersCodePanel currentStep={{ codeLineBindings: { java: [7], python: [7], golang: [7], javascript: [7] }, left: 2, right: 9, leftMax: 3, rightMax: 4, totalWater: 6 }} />);
    expect(screen.getByRole('button', { name: 'Java' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/height\[left\] <= height\[right\]/)).toBeInTheDocument();
    expect(screen.getByText('left = 2')).toBeInTheDocument();
    expect(screen.getByText('right = 9')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const activeLine = screen.getByRole('region', { name: 'java 算法代码' }).querySelector('.two-pointer-code-line.current');
    expect(activeLine).toHaveAttribute('data-line', '7');
  });
});
