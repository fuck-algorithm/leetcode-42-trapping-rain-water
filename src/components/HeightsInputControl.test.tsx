import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import HeightsInputControl from './HeightsInputControl';

const DEFAULTS = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];

describe('HeightsInputControl', () => {
  it('clears a visible validation error when the user edits again', () => {
    const onUpdateHeights = jest.fn();
    render(<HeightsInputControl initialHeights={DEFAULTS} onUpdateHeights={onUpdateHeights} />);
    const input = screen.getByLabelText(/高度数组/);
    fireEvent.change(input, { target: { value: '1,x' } });
    fireEvent.click(screen.getByRole('button', { name: '更新' }));
    expect(screen.getByText(/只能包含/)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '1,2' } });
    expect(screen.queryByText(/只能包含/)).toBeNull();
    expect(onUpdateHeights).not.toHaveBeenCalled();
  });

  it('rejects malformed values without submitting a new terrain', () => {
    const onUpdateHeights = jest.fn();
    render(<HeightsInputControl initialHeights={DEFAULTS} onUpdateHeights={onUpdateHeights} />);
    const input = screen.getByLabelText(/高度数组/);
    fireEvent.change(input, { target: { value: '1,-2,3' } });
    fireEvent.click(screen.getByRole('button', { name: '更新' }));
    expect(screen.getByText(/只能包含数字/)).toBeInTheDocument();
    expect(onUpdateHeights).not.toHaveBeenCalled();
  });

  it('commits a valid input only after the update action', () => {
    const onUpdateHeights = jest.fn();
    render(<HeightsInputControl initialHeights={DEFAULTS} onUpdateHeights={onUpdateHeights} />);
    const input = screen.getByLabelText(/高度数组/);
    fireEvent.change(input, { target: { value: '4,2,0,3,2,5' } });
    expect(onUpdateHeights).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '更新' }));
    expect(onUpdateHeights).toHaveBeenCalledWith([4, 2, 0, 3, 2, 5]);
  });

  it('loads presets, resets defaults, and generates bounded random legal data', () => {
    const onUpdateHeights = jest.fn();
    render(<HeightsInputControl initialHeights={DEFAULTS} onUpdateHeights={onUpdateHeights} />);
    fireEvent.click(screen.getByRole('button', { name: '凹槽' }));
    expect(onUpdateHeights).toHaveBeenLastCalledWith([5, 1, 1, 1, 5]);
    fireEvent.click(screen.getByRole('button', { name: '重置' }));
    expect(onUpdateHeights).toHaveBeenLastCalledWith(DEFAULTS);
    fireEvent.click(screen.getByRole('button', { name: '随机' }));
    const random = onUpdateHeights.mock.lastCall?.[0] as number[];
    expect(random.length).toBeGreaterThanOrEqual(8);
    expect(random.length).toBeLessThanOrEqual(15);
    expect(random.every(value => Number.isInteger(value) && value >= 0 && value <= 9)).toBe(true);
  });
});
