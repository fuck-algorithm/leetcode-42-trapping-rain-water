import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/no-unnecessary-act */
import { RowByRowVisualizer } from './index';

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

  it('keeps closed water rows opaque and current unclosed cells marked as candidates', async () => {
    const heights = [3, 0, 2, 0, 4];
    const { container } = render(<RowByRowVisualizer heights={heights} />);
    const next = screen.getByTitle('下一步 (→)');
    for (let step = 0; step < 7; step++) act(() => fireEvent.click(next));
    await waitFor(() => expect(container.querySelectorAll('.water-cell')).toHaveLength(2));
    const cells = Array.from(container.querySelectorAll('.water-cell'));
    expect(cells.some(cell => cell.getAttribute('data-pending') === 'true')).toBe(true);
    expect(cells.every(cell => cell.getAttribute('data-pending') !== null)).toBe(true);
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
