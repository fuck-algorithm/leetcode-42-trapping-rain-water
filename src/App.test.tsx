import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/接雨水问题可视化/i);
  expect(linkElement).toBeInTheDocument();
});
