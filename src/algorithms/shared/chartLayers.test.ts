import * as d3 from 'd3';
import { ensureChartLayers, updateKeyedItems } from './chartLayers';

/* eslint-disable testing-library/no-node-access */

describe('chart layer helpers', () => {
  it('reuses named layers as specifications update', () => {
    document.body.innerHTML = '<svg><g class="plot"></g></svg>';
    const svg = d3.select(document.querySelector('svg') as SVGSVGElement);
    const plot = svg.select<SVGGElement>('g.plot');
    const first = ensureChartLayers(plot, [{ id: 'axes', className: 'layer-axes' }, { id: 'labels', className: 'layer-labels' }]);
    const axes = first.get('axes')?.node();
    const second = ensureChartLayers(plot, [{ id: 'axes', className: 'layer-axes' }]);
    expect(plot.selectAll('[data-layer-id="axes"]').size()).toBe(1);
    expect(second.get('axes')?.node()).toBe(axes);
    expect(plot.selectAll('[data-layer-id="labels"]').size()).toBe(1);
  });

  it('updates keyed child groups and removes data that exits', () => {
    document.body.innerHTML = '<svg><g class="plot"><g data-layer-id="nodes"></g></g></svg>';
    const svg = d3.select(document.querySelector('svg') as SVGSVGElement);
    const layer = svg.select<SVGGElement>('[data-layer-id="nodes"]');
    const add = (groups: d3.Selection<SVGGElement, { id: string }, any, any>) => groups.attr('class', 'node').attr('data-item-id', item => item.id);
    const first = updateKeyedItems(layer as any, 'g.node', [{ id: 'a' }, { id: 'b' }], item => item.id, add);
    const a = first.filter(item => item.id === 'a').node();
    updateKeyedItems(layer as any, 'g.node', [{ id: 'a' }, { id: 'c' }], item => item.id, add);
    expect(layer.select('[data-item-id="a"]').node()).toBe(a);
    expect(layer.selectAll('g.node').size()).toBe(2);
    expect(layer.select('[data-item-id="b"]').empty()).toBe(true);
  });
});
