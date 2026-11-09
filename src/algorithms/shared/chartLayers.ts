import * as d3 from 'd3';

export interface ChartLayerSpec {
  id: string;
  className: string;
}

type SvgGroupSelection = d3.Selection<SVGGElement, unknown, any, any>;

export function ensureChartLayers(plot: SvgGroupSelection, specs: ChartLayerSpec[]): Map<string, SvgGroupSelection> {
  const selections = new Map<string, SvgGroupSelection>();
  for (const spec of specs) {
    const layer = plot.selectAll<SVGGElement, unknown>(`g[data-layer-id="${spec.id}"]`)
      .data([null]).join(enter => enter.append('g'))
      .attr('class', spec.className)
      .attr('data-layer-id', spec.id);
    selections.set(spec.id, layer as SvgGroupSelection);
  }
  return selections;
}

export function ensureLayer<P extends d3.BaseType, PD>(
  plot: d3.Selection<SVGGElement, PD, P, any>,
  layerId: string,
  className: string
): d3.Selection<SVGGElement, null, SVGGElement, PD> {
  return plot.selectAll<SVGGElement, null>(`g[data-layer-id="${layerId}"]`)
    .data([null]).join(enter => enter.append('g'))
    .attr('class', className)
    .attr('data-layer-id', layerId) as d3.Selection<SVGGElement, null, SVGGElement, PD>;
}

export function updateKeyedItems<T>(
  layer: SvgGroupSelection,
  selector: string,
  data: T[],
  key: (item: T) => string,
  enter: (selection: d3.Selection<SVGGElement, T, any, any>) => void
): d3.Selection<SVGGElement, T, any, any> {
  const join = layer.selectAll<SVGGElement, T>(selector).data(data, key);
  join.exit().remove();
  const entered = join.enter().append('g');
  enter(entered);
  return entered.merge(join);
}
