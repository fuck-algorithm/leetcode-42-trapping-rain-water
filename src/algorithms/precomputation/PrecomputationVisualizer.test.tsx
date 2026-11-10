import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
/* eslint-disable testing-library/no-node-access, testing-library/no-container */
import { precomputationCode } from '../algorithmCodes';
import PrecomputationVisualizer from './PrecomputationVisualizer';

const HEIGHTS = [4, 2, 0, 3, 2, 5];
const RECT = { x: 0, y: 0, top: 0, left: 0, right: 1000, bottom: 650, width: 1000, height: 650, toJSON: () => ({}) } as DOMRect;
beforeEach(() => {
  (window as any).ResizeObserver = class { observe() {} disconnect() {} };
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => RECT);
});
afterEach(() => jest.restoreAllMocks());

describe('PrecomputationVisualizer first-frame and static axis layer', () => {
  it('renders a visible Java code line, chart area and playback controls', async () => {
    render(<PrecomputationVisualizer heights={HEIGHTS} />);
    expect(screen.getByText('更新左侧最大值')).toBeInTheDocument();
    const panel = screen.getByText('双数组法执行代码').closest('.code-display') as HTMLElement;
    expect(within(panel).getByText('Java', { selector: '.language-tab' })).toBeInTheDocument();
    await waitFor(() => expect(within(panel).getByText('2', { selector: '.code-line.current .line-number' })).toBeInTheDocument());
    expect(document.querySelector('svg.d3-component')).toBeInTheDocument();
    expect(precomputationCode.java.split('\n').length).toBeGreaterThan(20);
    expect(screen.getByTitle(/下一步/)).toBeInTheDocument();
  });

  it('shows the current column formula and result during water calculation', async () => {
    const heights = [3, 0, 2];
    const { container } = render(<PrecomputationVisualizer heights={heights} />);
    const next = screen.getByTitle('下一步 (→)');
    for (let step = 0; step < 9; step++) fireEvent.click(next);
    await waitFor(() => expect(container.querySelector('.column-water-formula')).toBeInTheDocument());
    const formula = container.querySelector('.column-water-formula');
    expect(formula).toHaveTextContent(/第 \d 列/);
    expect(formula).toHaveTextContent(/min\(3, 2\)/);
    expect(formula).toHaveTextContent(/= \d 格水/);
  });

  it('reuses the static axis instance and removes guide curves above the 30-column budget', async () => {
    const longHeights = Array.from({ length: 32 }, (_, index) => index % 6);
    const { container } = render(<PrecomputationVisualizer heights={longHeights} />);
    const svg = container.querySelector('svg.d3-component') as SVGSVGElement;
    const axes = svg.querySelector('.layer-chart-persistent .layer-static-axes');
    expect(axes).toBeInTheDocument();
    const previous = svg.querySelector('.layer-chart-persistent .layer-static-axes .x-axis');
    const leftGuide = svg.querySelector('.layer-chart-persistent .layer-static-guides .left-max-line');
    const legend = svg.querySelector('.layer-chart-persistent .layer-static-legend .legend-content');
    fireEvent.click(screen.getByTitle('下一步 (→)'));
    await waitFor(() => expect(svg.querySelectorAll('.layer-chart-persistent .layer-static-axes')).toHaveLength(1));
    expect(svg.querySelector('.layer-chart-persistent .layer-static-axes .x-axis')).toBe(previous);
    expect(svg.querySelector('.layer-chart-persistent .layer-static-legend .legend-content')).toBe(legend);
    expect(svg.querySelector('.layer-chart-persistent .layer-static-guides .left-max-line')).toBe(leftGuide);
    expect(svg.querySelectorAll('.layer-chart-persistent .layer-static-guides path')).toHaveLength(0);
    expect(svg.querySelectorAll('.height-column')).toHaveLength(32);
  });

  it('supports exiting the expanded algorithm note while preserving the chart surface', () => {
    render(<PrecomputationVisualizer heights={HEIGHTS} />);
    const header = screen.getByRole('heading', { name: /双数组法/ });
    fireEvent.click(header);
    expect(screen.getByText(/核心思想/)).toBeInTheDocument();
    expect(document.querySelector('svg.d3-component')).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText(/核心思想/)).not.toBeInTheDocument();
  });
});
