import { getPersistentTerrainLayer, getPersistentWaterLayer, HeightColumn, renderHeightColumns, renderWaterCells } from './rainwater';
import * as d3 from 'd3';
import { act } from '@testing-library/react';

/* eslint-disable testing-library/no-node-access */

it('updates persistent terrain columns in place while preserving stable ids', async () => {
  document.body.innerHTML = '<svg></svg>';
  const svg = d3.select(document.querySelector('svg') as SVGSVGElement);
  const layer = getPersistentTerrainLayer(svg, 'test-view', 'translate(0,0)') as d3.Selection<SVGGElement, any, any, any>;
  const column: HeightColumn = { id: 'column-0', index: 0, value: 2, x: 10, y: 20, width: 16, height: 40, stroke: '#333', strokeWidth: 1 };
  renderHeightColumns(layer, [column], 0, true);
  const initialNode = document.querySelector('[data-node-id="column-0"]');
  expect(initialNode).toHaveAttribute('height', '40');

  renderHeightColumns(layer, [{ ...column, y: 10, height: 50, stroke: '#ff7043', strokeWidth: 3 }], 180, false);
  expect(document.querySelectorAll('.height-column')).toHaveLength(1);
  expect(document.querySelector('[data-node-id="column-0"]')).toBe(initialNode);
  expect(document.querySelector('[data-node-id="column-0"]')).toHaveAttribute('data-status', 'current');
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 220)); });
  expect(document.querySelector('[data-node-id="column-0"]')).toHaveAttribute('height', '50');
});

it('renders layered water cells with stable ids, surface highlights and removes emptied cells', async () => {
  document.body.innerHTML = '<svg><g class="water-layer"></g></svg>';
  const svg = d3.select(document.querySelector('svg') as SVGSVGElement);
  const layer = getPersistentWaterLayer(svg, 'test-view', 'translate(0,0)') as d3.Selection<SVGGElement, any, any, any>;
  renderWaterCells(layer, [{ id: 'pool-1', x: 10, y: 20, width: 30, height: 24, highlighted: true }], 0, 'water-layer', true);

  expect(document.querySelector('[data-water-id="pool-1"]')).toBeInTheDocument();
  expect(document.querySelector('.water-body')).toHaveAttribute('height', '23.5');
  expect(document.querySelector('.water-surface')?.getAttribute('d')).toContain('T30,1');
  expect(document.querySelector('.water-cell')).toHaveAttribute('data-highlighted', 'true');
  expect(document.querySelector('.water-cell')).toHaveAttribute('data-water-fresh', 'true');
  expect(document.querySelector('.water-cell')).toHaveAttribute('data-surface', 'true');
  expect(document.querySelector('.water-body--enter')).toBeNull();

  renderWaterCells(layer, [{ id: 'pool-1', x: 10, y: 20, width: 30, height: 24 }], 0, 'water-layer', true);
  expect(document.querySelector('.water-cell')).toHaveAttribute('data-water-fresh', 'false');

  renderWaterCells(layer, [{ id: 'pool-1', x: 10, y: 20, width: 30, height: 24 }], 0, 'new-input', true);
  expect(document.querySelector('.water-cell')).toHaveAttribute('data-water-fresh', 'true');

  renderWaterCells(layer, [{ id: 'cell-under-water', x: 10, y: 0, width: 30, height: 12, surface: false, pending: true }], 0, 'row-view', true);
  expect(document.querySelector('[data-water-id="cell-under-water"]')).toHaveAttribute('data-surface', 'false');
  expect(document.querySelector('[data-water-id="cell-under-water"]')).toHaveAttribute('data-pending', 'true');
  expect(document.querySelector('[data-water-id="cell-under-water"] .water-surface')).toHaveAttribute('d', '');
  expect(document.querySelector('[data-water-id="cell-under-water"] .water-glint')).toHaveAttribute('d', '');

  renderWaterCells(layer, [{ id: 'surface-edge', x: 10, y: 0, width: 30, height: 12, surface: true }], 0, 'row-view', true);
  expect(document.querySelector('[data-water-id="surface-edge"] .water-surface')?.getAttribute('d')).toContain('T30,1');

  renderWaterCells(layer, [{ id: 'moving-pool', x: 40, y: 32, width: 36, height: 30 }], 0, 'transition', true);
  renderWaterCells(layer, [{ id: 'moving-pool', x: 70, y: 50, width: 48, height: 42 }], 200, 'transition');
  const movingPool = document.querySelector('[data-water-id="moving-pool"]') as SVGGElement;
  const movingBody = movingPool.querySelector('.water-body') as SVGRectElement;
  expect(movingPool.getAttribute('transform')).toBe('translate(40,32)');
  expect(movingBody).toHaveAttribute('width', '36');
  expect(movingPool.querySelector('.water-surface')).toHaveAttribute('d', 'M0,2 Q7.92,-1 17.28,1 T36,1');
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 240)); });
  expect(movingPool.getAttribute('transform')).toContain('70');
  expect(movingBody).toHaveAttribute('width', '48');
  expect(movingPool.querySelector('.water-surface')?.getAttribute('d')).toContain('T48,1');

  renderWaterCells(layer, [], 0, 'row-view');
  expect(document.querySelector('[data-water-id="pool-1"]')).not.toBeInTheDocument();
});
