import * as d3 from 'd3';
import fc from 'fast-check';
import { getPersistentWaterLayer, renderWaterCells, WaterCell } from './rainwater';

/* eslint-disable testing-library/no-node-access */

describe('water keyed-join properties', () => {
  it('preserves matching water cell identities and applies the new geometry', () => {
    fc.assert(fc.property(
      fc.array(fc.record({ x: fc.integer({ min: 0, max: 600 }), y: fc.integer({ min: 0, max: 300 }), width: fc.integer({ min: 4, max: 40 }), height: fc.integer({ min: 2, max: 30 }) }), { minLength: 1, maxLength: 12 }),
      cells => {
        document.body.innerHTML = '<svg><g></g></svg>';
        const svg = d3.select(document.querySelector('svg') as SVGSVGElement);
        const layer = getPersistentWaterLayer(svg, 'water-property', 'translate(0,0)');
        const before: WaterCell[] = cells.map((cell, index) => ({ id: `water-${index}`, ...cell }));
        renderWaterCells(layer, before, 0, 'water-property', true);
        const nodes = before.map(cell => document.querySelector(`[data-water-id="${cell.id}"]`));
        const after = before.map(cell => ({ ...cell, x: cell.x + 3, y: cell.y + 2, width: cell.width + 1, height: cell.height + 1 }));
        renderWaterCells(layer, after, 0, 'water-property', true);
        return after.every((cell, index) => {
          const node = document.querySelector(`[data-water-id="${cell.id}"]`);
          const body = node?.querySelector('.water-body');
          return node === nodes[index]
            && node?.getAttribute('transform') === `translate(${cell.x},${cell.y})`
            && body?.getAttribute('width') === String(cell.width)
            && body?.getAttribute('height') === String(cell.height - 0.5);
        });
      }
    ), { numRuns: 30 });
  });
});
