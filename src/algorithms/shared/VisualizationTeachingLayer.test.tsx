import React from 'react';
import { render, screen } from '@testing-library/react';
import VisualizationTeachingLayer from './VisualizationTeachingLayer';

describe('VisualizationTeachingLayer', () => {
  it('keeps one focus story, an explanation, metrics and fixed legend labels', () => {
    render(<VisualizationTeachingLayer currentStep={3} totalSteps={12} operation="比较两端" narration="比较 height[L] 与 height[R]，因为矮的一边决定当前水位。" metrics={[{ label: '水量', value: 4 }, { label: 'L', value: 2 }]} />);
    expect(screen.getByText('比较两端')).toBeInTheDocument();
    expect(screen.getByText(/因为矮的一边/)).toBeInTheDocument();
    expect(screen.getByText('水量')).toBeInTheDocument();
    expect(screen.getByText('当前')).toBeInTheDocument();
    expect(screen.getByText('完成')).toBeInTheDocument();
  });
});
