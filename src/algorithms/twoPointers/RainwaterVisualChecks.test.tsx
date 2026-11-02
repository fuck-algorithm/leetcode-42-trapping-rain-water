import React from 'react';
import { render, screen } from '@testing-library/react';
import RainwaterVisualChecks from './RainwaterVisualChecks';

describe('RainwaterVisualChecks', () => {
  it('exposes each bar as an accessible row with calculation values', () => {
    render(<RainwaterVisualChecks heights={[3, 0, 3]} water={[0, 3, 0]} />);
    expect(screen.getByRole('button', { name: /位置 1.*高度 0.*蓄水 3/ })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
