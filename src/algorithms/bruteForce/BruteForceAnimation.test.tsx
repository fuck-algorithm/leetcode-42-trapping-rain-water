import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BruteForceAnimation from './BruteForceAnimation';

const RECT = { x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 620, width: 900, height: 620, toJSON: () => ({}) } as DOMRect;

beforeEach(() => {
  (window as any).ResizeObserver = class { observe() {} disconnect() {} };
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => RECT);
});
afterEach(() => jest.restoreAllMocks());

/* eslint-disable testing-library/no-node-access, testing-library/no-container */
describe('BruteForceAnimation wrapper', () => {
  it('starts at 1x, invokes the owned speed update callback, then forwards the speed', () => {
    const { container } = render(<BruteForceAnimation heights={[3, 0, 3]} />);
    const slider = container.querySelector('.speed-slider') as HTMLInputElement;
    expect(slider).toHaveValue('500');
    fireEvent.change(slider, { target: { value: '250' } });
    expect(slider).toHaveValue('250');
  });
});
