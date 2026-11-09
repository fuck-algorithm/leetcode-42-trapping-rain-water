import * as d3 from 'd3';
import { MOTION } from '../twoPointers/motion';
import { isPersistentRainwaterLayer } from './visualizationLayers';
import { buildWaterGlintPath, buildWaterSurfacePath, resolveVisibleWaterCells } from './waterCellGeometry';

export interface WaterCell {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  highlighted?: boolean;
  surface?: boolean;
  pending?: boolean;
}

export interface HeightColumn {
  id: string;
  index: number;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
}

let gradientSequence = 0;
const waterHistory = new Map<string, Set<string>>();

export function getPersistentWaterLayer(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, viewId: string, transform: string) {
  const layer = svg.selectAll<SVGGElement, unknown>('g.layer-water-persistent')
    .filter(function () { return this.getAttribute('data-view') === viewId; })
    .data([null]).join(enter => enter.append('g')).attr('class', 'layer-water-persistent')
    .attr('data-view', viewId).attr('transform', transform).raise();
  svg.selectAll<SVGGElement, unknown>('g.layer-transient-plot')
    .filter(function () { return this.getAttribute('data-view') === viewId; }).raise();
  return layer;
}

export function getPersistentChartLayer(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, viewId: string, transform: string) {
  return svg.selectAll<SVGGElement, unknown>('g.layer-chart-persistent')
    .filter(function () { return this.getAttribute('data-view') === viewId; })
    .data([null]).join(enter => enter.append('g')).attr('class', 'layer-chart-persistent')
    .attr('data-view', viewId).attr('transform', transform);
}

export function getPersistentTerrainLayer(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, viewId: string, transform: string) {
  const layer = svg.selectAll<SVGGElement, unknown>('g.layer-terrain-persistent')
    .filter(function () { return this.getAttribute('data-view') === viewId; })
    .data([null]).join(enter => enter.append('g')).attr('class', 'layer-terrain-persistent')
    .attr('data-view', viewId).attr('transform', transform);
  layer.raise();
  svg.selectAll<SVGGElement, unknown>('g.layer-water-persistent')
    .filter(function () { return this.getAttribute('data-view') === viewId; }).raise();
  svg.selectAll<SVGGElement, unknown>('g.layer-transient-plot')
    .filter(function () { return this.getAttribute('data-view') === viewId; }).raise();
  return layer;
}

export function createTransientPlotLayer(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, viewId: string, transform: string) {
  const layer = svg.selectAll<SVGGElement, unknown>('g.layer-transient-plot')
    .filter(function () { return this.getAttribute('data-view') === viewId; })
    .data([null]).join(enter => enter.append('g'))
    .attr('class', 'layer-transient-plot').attr('data-view', viewId).attr('transform', transform);
  return layer.selectAll<SVGGElement, null>('g.plot-content').data([null])
    .join(enter => enter.append('g').attr('class', 'plot-content'));
}

export function getTransientContentLayer(plot: d3.Selection<SVGGElement, null, any, any>) {
  return plot.selectAll<SVGGElement, null>('g.plot-transient-content').data([null])
    .join(enter => enter.append('g').attr('class', 'plot-transient-content'));
}

export function clearTransientPlotLayer(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, viewId: string): void {
  const plot = svg.selectAll<SVGGElement, unknown>('g.layer-transient-plot')
    .filter(function () { return this.getAttribute('data-view') === viewId; })
    .select<SVGGElement>('g.plot-content');
  getTransientContentLayer(plot as d3.Selection<SVGGElement, null, any, any>).selectAll('*').remove();
}

export function removeTransientSvgContent(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>): void {
  const svgNode = svg.node();
  svg.selectAll('*').filter(function () {
    let element: Element | null = this as Element;
    while (element && element !== svgNode) {
      if (isPersistentRainwaterLayer(element)) return false;
      element = element.parentElement;
    }
    return true;
  }).remove();
}

export function renderHeightColumns(layer: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>, columns: HeightColumn[], duration: number = MOTION.update, reducedMotion = false): void {
  const transitionMs = reducedMotion ? 0 : Math.min(MOTION.update, duration);
  const svg = layer.node()?.ownerSVGElement;
  if (svg) {
    const gradientId = `${svg.id || 'rainwater'}-terrain-gradient`;
    if (d3.select(svg).select(`#${gradientId}`).empty()) {
      const defs = d3.select(svg).select<SVGDefsElement>('defs').empty()
        ? d3.select(svg).insert('defs', ':first-child')
        : d3.select(svg).select<SVGDefsElement>('defs');
      const gradient = defs.append('linearGradient').attr('id', gradientId).attr('x1', '0').attr('y1', '0').attr('x2', '1').attr('y2', '0');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', '#647984');
      gradient.append('stop').attr('offset', '45%').attr('stop-color', '#8fa3a5');
      gradient.append('stop').attr('offset', '100%').attr('stop-color', '#61747f');
    }
  }
  const join = layer.selectAll<SVGRectElement, HeightColumn>('rect.height-column').data(columns, column => column.id);
  const exits = join.exit().interrupt();
  const enter = join.enter().append('rect').attr('class', 'height-column')
    .attr('data-node-id', column => column.id).attr('data-index', column => column.index)
    .attr('x', column => column.x).attr('y', column => column.y + column.height)
    .attr('width', column => column.width).attr('height', 0).attr('rx', column => Math.min(3, column.width / 2)).attr('fill', '#718991');
  const merged = enter.merge(join).interrupt('terrain-exit')
    .attr('data-status', column => column.strokeWidth > 1 ? 'current' : 'idle')
    .attr('data-node-id', column => column.id).attr('data-index', column => column.index);
  merged
    .attr('rx', column => Math.min(3, column.width / 2))
    .attr('fill', `url(#${svg?.id || 'rainwater'}-terrain-gradient)`)
    .attr('stroke', column => column.stroke)
    .attr('stroke-width', column => column.strokeWidth)
    .attr('vector-effect', 'non-scaling-stroke');
  if (transitionMs > 0) {
    exits.transition('terrain-exit').duration(MOTION.exit).attr('opacity', 0).on('end.terrain-exit', function () { this.remove(); });
    merged.transition('terrain-update').duration(transitionMs)
      .attr('x', column => column.x).attr('y', column => column.y)
      .attr('width', column => column.width).attr('height', column => column.height).attr('opacity', 1);
    enter.attr('opacity', 0).transition('terrain-enter').duration(MOTION.enter).attr('opacity', 1);
  } else {
    exits.remove();
    merged.attr('x', column => column.x).attr('y', column => column.y)
      .attr('width', column => column.width).attr('height', column => column.height).attr('opacity', 1);
  }
}

export function renderWaterCells(layer: d3.Selection<SVGGElement, any, any, any>, cells: WaterCell[], duration = 0, sceneKey = 'default', reducedMotion = false): void {
  const svgNode = layer.node()?.ownerSVGElement;
  if (!svgNode) return;
  let activeIds = waterHistory.get(sceneKey);
  if (!activeIds) { activeIds = new Set<string>(); waterHistory.set(sceneKey, activeIds); }
  const svg = d3.select(svgNode);
  let gradientId = svg.attr('data-water-gradient-id');
  if (!gradientId) { gradientId = `rainwater-gradient-${++gradientSequence}`; svg.attr('data-water-gradient-id', gradientId); }
  if (svg.select(`#${gradientId}`).empty()) {
    const defs = svg.select<SVGDefsElement>('defs').empty() ? svg.insert('defs', ':first-child') : svg.select<SVGDefsElement>('defs');
    const gradient = defs.append('linearGradient').attr('id', gradientId).attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#72d6ed').attr('stop-opacity', 0.9);
    gradient.append('stop').attr('offset', '38%').attr('stop-color', '#268fc2').attr('stop-opacity', 0.88);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#12608f').attr('stop-opacity', 0.94);
  }
  const transitionMs = reducedMotion ? 0 : Math.min(MOTION.update, duration || MOTION.update);
  const visibleCells = resolveVisibleWaterCells(cells);
  const freshIds = new Set(visibleCells.filter(cell => !activeIds!.has(cell.id)).map(cell => cell.id));
  waterHistory.set(sceneKey, new Set(visibleCells.map(cell => cell.id)));
  if (waterHistory.size > 20) waterHistory.delete(waterHistory.keys().next().value as string);
  const join = layer.selectAll<SVGGElement, WaterCell>('g.water-cell').data(visibleCells, cell => cell.id);
  const exiting = join.exit().interrupt();
  const enter = join.enter().append('g').attr('class', 'water-cell').attr('data-water-id', cell => cell.id).attr('opacity', 0)
    .attr('data-water-fresh', cell => freshIds.has(cell.id) ? 'true' : 'false');
  enter.append('rect').attr('class', 'water-body').attr('rx', 1.5);
  enter.append('path').attr('class', 'water-surface');
  enter.append('path').attr('class', 'water-glint');
  const merged = enter.merge(join).interrupt('water-exit')
    .attr('data-highlighted', cell => cell.highlighted ? 'true' : 'false')
    .attr('data-water-fresh', cell => freshIds.has(cell.id) ? 'true' : 'false')
    .attr('data-surface', cell => cell.surface === false ? 'false' : 'true')
    .attr('data-pending', cell => cell.pending ? 'true' : 'false');
  merged.select<SVGRectElement>('rect.water-body').classed('water-body--enter', cell => !reducedMotion && freshIds.has(cell.id)).attr('fill', `url(#${gradientId})`);
  if (transitionMs > 0) {
    exiting.transition('water-exit').duration(MOTION.exit).attr('opacity', 0).on('end.water-exit', function () { this.remove(); });
    merged.transition('water-update').duration(transitionMs).attrTween('transform', function (cell) {
      const current = this.getAttribute('transform')?.match(/translate\(([-\d.]+)[, ]+([-\d.]+)\)/);
      const x = d3.interpolateNumber(current ? Number(current[1]) : cell.x, cell.x);
      const y = d3.interpolateNumber(current ? Number(current[2]) : cell.y, cell.y);
      return time => `translate(${x(time)},${y(time)})`;
    }).attr('opacity', 1);
    merged.select<SVGRectElement>('rect.water-body').transition('water-update').duration(transitionMs)
      .attrTween('width', function (cell) { const width = d3.interpolateNumber(Number(this.getAttribute('width')) || cell.width, cell.width); return time => `${width(time)}`; })
      .attrTween('height', function (cell) { const height = d3.interpolateNumber(Number(this.getAttribute('height')) || cell.height, Math.max(0.5, cell.height - 0.5)); return time => `${height(time)}`; });
  } else {
    exiting.remove();
    merged.attr('transform', cell => `translate(${cell.x},${cell.y})`).attr('opacity', 1);
    merged.select<SVGRectElement>('rect.water-body').attr('width', cell => cell.width).attr('height', cell => Math.max(0.5, cell.height - 0.5));
  }
  merged.select<SVGRectElement>('rect.water-body--enter').on('animationend.water', function () { d3.select(this).classed('water-body--enter', false); })
    .on('animationcancel.water', function () { d3.select(this).classed('water-body--enter', false); });
  const surface = (cell: WaterCell) => buildWaterSurfacePath(cell);
  const glint = (cell: WaterCell) => buildWaterGlintPath(cell);
  const surfacePath = merged.select<SVGPathElement>('path.water-surface');
  const glintPath = merged.select<SVGPathElement>('path.water-glint').attr('opacity', cell => cell.highlighted ? 0.85 : 0.52);
  if (transitionMs > 0) {
    surfacePath.transition('water-update').duration(transitionMs).attrTween('d', function (cell) { return d3.interpolateString(this.getAttribute('d') || surface(cell), surface(cell)); });
    glintPath.transition('water-update').duration(transitionMs).attrTween('d', function (cell) { return d3.interpolateString(this.getAttribute('d') || glint(cell), glint(cell)); });
  } else {
    surfacePath.attr('d', surface);
    glintPath.attr('d', glint);
  }
}
