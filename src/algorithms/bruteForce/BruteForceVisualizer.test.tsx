import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import BruteForceVisualizer from './BruteForceVisualizer';

const VALID_HEIGHTS = [0, 2, 0, 3];
const RECT = { x: 0, y: 0, top: 0, left: 0, right: 1000, bottom: 650, width: 1000, height: 650, toJSON: () => ({}) } as DOMRect;

beforeEach(() => {
  (window as any).ResizeObserver = class { observe() {} disconnect() {} };
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => RECT);
});
afterEach(() => jest.restoreAllMocks());

/* eslint-disable testing-library/no-node-access, testing-library/no-container */
describe('BruteForceVisualizer playback surface', () => {
  it('renders guidance, an active SVG surface, and the localized language code panel', async () => {
    const { container } = render(<BruteForceVisualizer heights={VALID_HEIGHTS} />);
    expect(await screen.findByText('选择当前位置')).toBeInTheDocument();
    expect(screen.getByText('当前柱')).toBeInTheDocument();
    expect(screen.getByText(/暴力法执行代码/)).toBeInTheDocument();
    const panel = container.querySelector('.brute-force-code-panel .code-display') as HTMLElement;
    expect(within(panel).getByRole('button', { name: 'JavaScript' })).toBeInTheDocument();
    expect(within(panel).getByText('2', { selector: '.code-line.current .line-number' })).toBeInTheDocument();
    expect(container.querySelector('svg.d3-component')).toBeInTheDocument();
  });
});
