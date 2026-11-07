import * as d3 from 'd3';
import { act } from '@testing-library/react';
import { getPersistentTerrainLayer, HeightColumn, renderHeightColumns } from './rainwater';

/* eslint-disable testing-library/no-node-access */

it('keeps height columns keyed and animates their state and geometry in place', async () => {
  document.body.innerHTML = '<svg></svg>';
  const svg = d3.select(document.querySelector('svg') as SVGSVGElement);
  const layer = getPersistentTerrainLayer(svg, 'terrain-test', 'translate(0,0)');
  const column: HeightColumn = {
    id: 'column-2', index: 2, value: 3, x: 20, y: 40, width: 18, height: 60,
    stroke: '#333', strokeWidth: 1
  };

  renderHeightColumns(layer, [column], 0, true);
  const node = document.querySelector('[data-node-id="column-2"]');
  expect(node).toHaveAttribute('height', '60');
  expect(node).toHaveAttribute('data-status', 'idle');
  expect(node).toHaveAttribute('data-index', '2');
  expect(node).toHaveAttribute('data-node-id', 'column-2');

  renderHeightColumns(layer, [{ ...column, y: 25, height: 75, stroke: '#ff7043', strokeWidth: 3 }], 180, false);
  expect(document.querySelectorAll('.height-column')).toHaveLength(1);
  expect(document.querySelector('[data-node-id="column-2"]')).toBe(node);
  expect(node).toHaveAttribute('data-status', 'current');
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 220)); });
  expect(node).toHaveAttribute('height', '75');
  expect(node).toHaveAttribute('y', '25');
});
