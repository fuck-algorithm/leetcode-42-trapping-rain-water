import React from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/no-unnecessary-act */
import { RowByRowVisualizer } from './index';
import { useRowByRowSteps } from './useRowByRowSteps';

const RECT = { x: 0, y: 0, top: 0, left: 0, right: 1000, bottom: 650, width: 1000, height: 650, toJSON: () => ({}) } as DOMRect;
beforeEach(() => {
  (window as any).ResizeObserver = class { observe() {} disconnect() {} };
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => RECT);
});
afterEach(() => jest.restoreAllMocks());

describe('RowByRowVisualizer terrain rendering', () => {
  it('renders a visible indexed terrain, a compact code panel, and stable teaching status', async () => {
    const heights = [3, 0, 2, 0, 4];
    const { container } = render(<RowByRowVisualizer heights={heights} />);
    const svg = container.querySelector('svg.d3-component') as SVGSVGElement;
    const codePanel = container.querySelector('.row-by-row-code-panel .code-display') as HTMLElement;
    await waitFor(() => expect(svg.querySelectorAll('.height-column')).toHaveLength(heights.length));
    expect(within(codePanel).getByRole('button', { name: 'JavaScript' })).toBeInTheDocument();
    expect(container.querySelectorAll('.algorithm-status-legend li')).toHaveLength(4);
    expect(container.querySelectorAll('.water-body').length).toBe(0);
    expect(Number(svg.getAttribute('height'))).toBeGreaterThan(0);
  });

  it('keeps each water cell pending until its row is closed by a right wall', async () => {
    const heights = [3, 0, 2, 0, 4];
    const { result } = renderHook(() => useRowByRowSteps({ heights }));
    const snapshots = result.current.steps;
    const firstPending = snapshots.find((step: any) => step.phase === 'scanRow' && step.currentRow === 1 && step.currentCol === 1);
    const rowClosed = snapshots.find((step: any) => step.phase === 'scanRow' && step.currentRow === 1 && step.currentCol === 2);
    expect(firstPending?.waterMatrix[0][1]).toBe(1);
    expect(firstPending?.confirmedWaterMatrix?.[0][1]).toBe(0);
    expect(rowClosed?.confirmedWaterMatrix?.[0][1]).toBe(1);
    expect(snapshots.at(-1)?.totalWater).toBe(7);
  });

  it('uses the sparse index ticks and displays a row-completion note after progressing', async () => {
    const heights = [3, 0, 2, 0, 4];
    const { container } = render(<RowByRowVisualizer heights={heights} />);
    const svg = container.querySelector('svg.d3-component') as SVGSVGElement;
    const next = screen.getByTitle('下一步 (→)');
    for (let step = 0; step < 4; step++) act(() => fireEvent.click(next));
    await waitFor(() => expect(container.querySelector('.algorithm-step-narration')).toHaveTextContent(/候选水|边界/));
    expect(svg.querySelectorAll('.height-column')).toHaveLength(heights.length);
    expect(container.querySelector('.row-by-row-code-panel .code-line.current')).toBeInTheDocument();
  });
});
