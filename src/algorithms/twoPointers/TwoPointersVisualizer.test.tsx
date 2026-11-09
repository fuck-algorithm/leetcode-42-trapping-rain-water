import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TwoPointersVisualizer from './TwoPointersVisualizer';

jest.mock('./useTwoPointersSteps', () => ({ __esModule: true, default: () => ({ currentStep: { heights: [2, 0, 2], left: 0, right: 2, leftMax: 2, rightMax: 2, water: [0, 2, 0], totalWater: 2, phase: 'init', operation: 'init', narration: '初始化，因为边界决定水位。', anchorIds: ['pointer-left'] }, currentStepIndex: 0, totalSteps: 1, isPlaying: false, progress: 0, togglePlay: jest.fn(), nextStep: jest.fn(), prevStep: jest.fn(), setProgress: jest.fn(), reset: jest.fn() }) }));

class ResizeObserverMock { observe() {} disconnect() {} }

beforeEach(() => { (window as any).ResizeObserver = ResizeObserverMock; });

describe('TwoPointersVisualizer teaching layer', () => {
  it('shows the operation, causal narration, and bar calculation on hover', async () => {
    render(<TwoPointersVisualizer heights={[2, 0, 2]} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText(/从两端开始 · Step/)).toBeInTheDocument();
    expect(screen.getByText('从左右两端开始。水面高度由两边较矮的边界决定。')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(screen.getByRole('img', { name: '双指针接雨水动画' }).querySelector('.canvas-metrics')).toHaveTextContent('累计接水 2 格');
    // eslint-disable-next-line testing-library/no-node-access
    expect(screen.getByRole('img', { name: '双指针接雨水动画' }).querySelector('.layer-index-axis')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    const bar = screen.getByRole('img', { name: '双指针接雨水动画' }).querySelector('[data-node-id="bar-1"]') as Element;
    fireEvent.mouseEnter(bar);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('i=1 · 高 0 · 水 2')).toBeInTheDocument();
  });
});
