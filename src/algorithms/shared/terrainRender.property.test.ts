import * as d3 from 'd3';
import fc from 'fast-check';
import { getPersistentTerrainLayer, HeightColumn, renderHeightColumns } from './rainwater';

/* eslint-disable testing-library/no-node-access */

describe('terrain renderer state properties', () => {
  it('keeps every keyed column with finite positive geometry and semantic status', () => {
    fc.assert(fc.property(
      fc.array(fc.integer({ min: 0, max: 40 }), { minLength: 1, maxLength: 20 }),
      fc.integer({ min: 0, max: 10 }),
      (values, seed) => {
        document.body.innerHTML = '<svg></svg>';
        const svg = d3.select(document.querySelector('svg') as SVGSVGElement);
        const layer = getPersistentTerrainLayer(svg, 'terrain-property', 'translate(0,0)');
        const columns: HeightColumn[] = values.map((value, index) => ({
          id: `bar-${index}`, index, value, x: index * 24, y: 200 - value * 3,
          width: 20, height: value * 3, stroke: '#333', strokeWidth: index === seed % values.length ? 3 : 1,
        }));
        renderHeightColumns(layer, columns, 0, true);
        const nodes = Array.from(document.querySelectorAll<SVGRectElement>('.height-column'));
        return nodes.length === columns.length && nodes.every((node, index) => {
          const column = columns[index];
          return node.getAttribute('data-node-id') === column.id
            && Number.isFinite(Number(node.getAttribute('x')))
            && Number(node.getAttribute('width')) > 0
            && Number(node.getAttribute('height')) === column.height
            && node.getAttribute('data-status') === (column.strokeWidth > 1 ? 'current' : 'idle');
        });
      }
    ), { numRuns: 50 });
  });
});
