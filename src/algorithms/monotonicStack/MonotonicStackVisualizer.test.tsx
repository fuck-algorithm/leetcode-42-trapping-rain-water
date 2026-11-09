import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { monotonicStackCode } from '../algorithmCodes';
import MonotonicStackVisualizer from './MonotonicStackVisualizer';

const HEIGHTS = [4, 1, 3, 0, 2, 5];
const RECT = { width: 1000, height: 650, x: 0, y: 0, top: 0, left: 0, right: 1000, bottom: 650, toJSON: () => ({}) } as DOMRect;
class ResizeObserverMock { observe() {} disconnect() {} }

/* eslint-disable testing-library/no-node-access, testing-library/no-container */
describe('MonotonicStackVisualizer D3 view', () => {
  beforeEach(() => {
    (window as any).ResizeObserver = ResizeObserverMock;
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => RECT);
  });
  afterEach(() => jest.restoreAllMocks());

  it('renders the terrain, transient plot, localized panel and operation line', async () => {
    render(<MonotonicStackVisualizer heights={HEIGHTS} />);
    const panel = screen.getByText('单调栈执行代码').closest('.code-display') as HTMLElement;
    const svg = document.querySelector('svg.d3-component') as SVGSVGElement;
    await waitFor(() => expect(svg.querySelector('.layer-transient-plot')).toBeInTheDocument());
    await waitFor(() => expect(svg.querySelector('.height-column')).toBeInTheDocument());
    expect(svg.querySelector('.layer-terrain-persistent')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'JavaScript' })).toBeInTheDocument();
    expect(panel.querySelector('.code-line.current')).toBeInTheDocument();
    expect(monotonicStackCode.javascript.split('\n')).toHaveLength(19);
    expect(screen.getByText(/入栈当前柱/)).toBeInTheDocument();
    expect(screen.getByText('槽面积')).toBeInTheDocument();
    expect(screen.getByText('新增水格')).toBeInTheDocument();
  });

  it('renders basin cells after repeated pop/calculate events and updates the code focus', async () => {
    render(<MonotonicStackVisualizer heights={HEIGHTS} />);
    const panel = screen.getByText('单调栈执行代码').closest('.code-display') as HTMLElement;
    const next = screen.getByTitle('下一步 (→)');
    for (let index = 0; index < 12; index++) fireEvent.click(next);
    await waitFor(() => expect(document.querySelectorAll('.water-cell').length).toBeGreaterThan(0));
    expect(document.querySelectorAll('.height-column')).toHaveLength(HEIGHTS.length);
    expect(panel.querySelector('.code-line.current')).toBeInTheDocument();
    expect(document.querySelectorAll('.layer-transient-plot')).toHaveLength(1);
  });

  it('handles long descending stacks and thins axis ticks beyond fifteen bars', async () => {
    const longTerrain = Array.from({ length: 24 }, (_, index) => 24 - index);
    render(<MonotonicStackVisualizer heights={longTerrain} />);
    const svg = document.querySelector('svg.d3-component') as SVGSVGElement;
    await waitFor(() => expect(svg.querySelectorAll('.height-column')).toHaveLength(24));
    await waitFor(() => expect(svg.querySelectorAll('.layer-transient-plot .tick').length).toBeLessThanOrEqual(14));
    expect(document.querySelector('.monotonic-stack-code-panel')).toBeInTheDocument();
  });
});
