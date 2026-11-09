import React from 'react';
import { render, screen } from '@testing-library/react';
import VisualizationTeachingLayer from './VisualizationTeachingLayer';

describe('VisualizationTeachingLayer', () => {
  it('exposes active code anchors as a synced teaching attribute', () => {
    render(<VisualizationTeachingLayer currentStep={2} totalSteps={8} operation="扫描" narration="逐步求边界。" metrics={[]} codeLines={[8, 9]} />);
    expect(screen.getByLabelText('当前算法步骤')).toHaveAttribute('data-code-lines', '8,9');
  });

  it('keeps one focus story, an explanation, metrics and fixed legend labels', () => {
    render(<VisualizationTeachingLayer currentStep={3} totalSteps={12} operation="比较两端" narration="比较 height[L] 与 height[R]，因为矮的一边决定当前水位。" metrics={[{ label: '水量', value: 4 }, { label: 'L', value: 2 }]} />);
    expect(screen.getByText('比较两端')).toBeInTheDocument();
    expect(screen.getByText(/因为矮的一边/)).toBeInTheDocument();
    expect(screen.getByText('水量')).toBeInTheDocument();
    expect(screen.getByText('当前柱')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByLabelText('当前算法步骤')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByLabelText('当前算法步骤')).toHaveAttribute('data-code-lines', '');
  });
});
