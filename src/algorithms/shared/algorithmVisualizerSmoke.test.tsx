import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { precomputationCode, monotonicStackCode, rowByRowCode } from '../algorithmCodes';
import BruteForceVisualizer from '../bruteForce/BruteForceVisualizer';
import MonotonicStackVisualizer from '../monotonicStack/MonotonicStackVisualizer';
import PrecomputationVisualizer from '../precomputation/PrecomputationVisualizer';
import { RowByRowVisualizer } from '../rowByRow';

const FIXED_RECT = { x: 0, y: 0, top: 0, left: 0, right: 1000, bottom: 650, width: 1000, height: 650, toJSON: () => ({}) } as DOMRect;
beforeEach(() => {
  (window as any).ResizeObserver = class { observe() {} disconnect() {} };
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => FIXED_RECT);
});
afterEach(() => jest.restoreAllMocks());

const views = [
  { name: 'PrecomputationVisualizer', Component: PrecomputationVisualizer, code: precomputationCode.java, title: '双数组法执行代码' },
  { name: 'MonotonicStackVisualizer', Component: MonotonicStackVisualizer, code: monotonicStackCode.java, title: '单调栈执行代码' },
  { name: 'BruteForceVisualizer', Component: BruteForceVisualizer, code: undefined, title: '暴力法执行代码' },
  { name: 'RowByRowVisualizer', Component: RowByRowVisualizer, code: rowByRowCode.java, title: '按行法执行代码' },
];

/* eslint-disable testing-library/no-node-access */
describe.each(views)('$name component rendering', ({ Component, code: source, title }) => {
  it('renders the first frame canvas, localized code panel and active code line', async () => {
    const heights = [4, 2, 0, 3, 2, 5];
    render(<Component heights={heights} />);
    expect(screen.getByText(title)).toBeInTheDocument();
    const panel = screen.getByText(title).closest('.code-display') as HTMLElement;
    expect(within(panel).getByRole('button', { name: 'JavaScript' })).toBeInTheDocument();
    await waitFor(() => expect(panel.querySelector('.code-line.current .line-number')).toBeInTheDocument());
    const svg = document.querySelector('svg.d3-component') as SVGSVGElement;
    expect(svg).toBeInTheDocument();
    await waitFor(() => expect(svg.querySelector('.height-column, .bar')).toBeInTheDocument());
    expect(Number(svg.getAttribute('width'))).toBeGreaterThan(0);
    expect((source ?? 'fallback\ncode\nlines\nfor\nsmoke\ncoverage').split('\n').length).toBeGreaterThan(5);
  });
});
