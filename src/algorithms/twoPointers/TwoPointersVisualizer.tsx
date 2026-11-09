import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useTwoPointersSteps from './useTwoPointersSteps';
import { renderWaterCells } from '../shared/rainwater';
import '../shared/rainwater.css';
import AnimationControls from '../../components/common/AnimationControls';
import TwoPointersCodePanel from './TwoPointersCodePanel';
import RainwaterVisualChecks from './RainwaterVisualChecks';
import { motionDuration } from './motion';
import { resolveHeightDomain } from '../shared/visualDomain';
import './TwoPointersVisualizer.css';

interface TwoPointersVisualizerProps {
  heights: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

const COLORS = {
  bar: '#52616b', water: '#2a78d6', current: '#1baf7a', compare: '#eb6834',
  visited: '#9ad3c2', done: '#18765a', text: '#19332d', muted: '#687b76', grid: '#e3ebe8'
};

const TwoPointersVisualizer: React.FC<TwoPointersVisualizerProps> = ({ heights, speed = 500, onSpeedChange = () => {} }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const rippleStepRef = useRef<string | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? true);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<{ index: number; height: number; water: number } | null>(null);
  const { currentStep, currentStepIndex, totalSteps, isPlaying, progress, togglePlay, nextStep, prevStep, setProgress, reset } = useTwoPointersSteps({ heights, speed });

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height }));
    if (chartRef.current) observer.observe(chartRef.current);
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media?.matches ?? true);
    updateMotion();
    media?.addEventListener?.('change', updateMotion);
    return () => { observer.disconnect(); media?.removeEventListener?.('change', updateMotion); };
  }, []);

  useEffect(() => {
    if (!currentStep || !svgRef.current) return;
    const fallbackRect = chartRef.current?.getBoundingClientRect();
    const { width = fallbackRect?.width || 900, height: viewHeight = fallbackRect?.height || 500 } = dimensions;
    const margin = { top: 46, right: 28, bottom: 68, left: 48 };
    const widthInner = Math.max(1, width - margin.left - margin.right);
    const heightInner = Math.max(1, viewHeight - margin.top - margin.bottom);
    const transitionMs = motionDuration(speed, reducedMotion);
    const { left, right, leftMax, rightMax, water, totalWater, currentFill, phase, decision, calculation } = currentStep;
    const [, maxHeight] = resolveHeightDomain([...heights, ...water.map((amount, index) => heights[index] + amount)]);
    const x = d3.scaleBand<number>().domain(heights.map((_, index) => index)).range([0, widthInner]).padding(heights.length > 20 ? 0.16 : 0.22);
    const y = d3.scaleLinear().domain([0, maxHeight * 1.14]).range([heightInner, 0]);
    const root = d3.select(svgRef.current);
    root.attr('viewBox', `0 0 ${width} ${viewHeight}`).attr('preserveAspectRatio', 'none');
    let plot = root.select<SVGGElement>('.plot');
    if (plot.empty()) {
      plot = root.append('g').attr('class', 'plot').attr('transform', `translate(${margin.left},${margin.top})`);
      plot.append('g').attr('class', 'layer-grid');
      plot.append('g').attr('class', 'layer-water');
      plot.append('g').attr('class', 'layer-water-ripples');
      plot.append('g').attr('class', 'layer-bars');
      plot.append('g').attr('class', 'layer-guides');
      plot.append('g').attr('class', 'layer-arrows');
      plot.append('g').attr('class', 'layer-pointers');
      plot.append('g').attr('class', 'layer-labels');
      root.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.7, 3]).on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        cameraRef.current = { x: event.transform.x, y: event.transform.y, scale: event.transform.k };
        plot.attr('transform', `translate(${event.transform.x + margin.left * event.transform.k},${event.transform.y + margin.top * event.transform.k}) scale(${event.transform.k})`);
      }));
    }
    plot.attr('transform', `translate(${cameraRef.current.x + margin.left * cameraRef.current.scale},${cameraRef.current.y + margin.top * cameraRef.current.scale}) scale(${cameraRef.current.scale})`);
    plot.select<SVGGElement>('.layer-grid').call(d3.axisLeft(y).ticks(5).tickSize(-widthInner).tickFormat(d3.format('~g'))).call(g => g.selectAll('path').remove()).call(g => g.selectAll('line').attr('stroke', COLORS.grid).attr('stroke-width', 1));

    const focusedIndex = phase === 'init' || phase === 'moveLeft' ? left : phase === 'moveRight' ? right : null;
    const xAxis = d3.axisBottom(x).tickFormat(index => `${index}`).tickSize(0).tickPadding(8);
    plot.selectAll<SVGGElement, unknown>('.layer-index-axis').data([null]).join('g')
      .attr('class', 'layer-index-axis').attr('transform', `translate(0,${heightInner})`)
      .call(xAxis).call(axis => axis.select('.domain').attr('stroke', '#aebbb7'))
      .call(axis => axis.selectAll('text').attr('fill', '#687b76').attr('font-size', heights.length > 24 ? 8 : 10));
    plot.select('.layer-grid').selectAll('.tick text').attr('x', -8).attr('text-anchor', 'end');
    const statuses = heights.map((value, index) => ({
      id: `bar-${index}`, index, value,
      status: currentStep.phase === 'complete' ? 'done' : phase === 'compare' && (index === left || index === right) ? 'compare' : index === focusedIndex ? 'current' : index < left || index > right ? 'visited' : 'idle'
    }));
    const bars = plot.select('.layer-bars').selectAll<SVGRectElement, typeof statuses[number]>('rect.bar').data(statuses, d => d.id);
    bars.exit().interrupt().transition('exit').duration(transitionMs).attr('opacity', 0).remove();
    const barEnter = bars.enter().append('rect').attr('class', 'bar').attr('data-node-id', d => d.id).attr('y', heightInner).attr('height', 0).attr('opacity', 0.5);
    barEnter.merge(bars).attr('data-status', d => d.status).attr('tabindex', 0).attr('role', 'button').attr('aria-label', d => `位置 ${d.index}，柱高 ${d.value}，蓄水 ${water[d.index] || 0}`)
      .on('mouseenter focus', (event, d) => setHoveredBar({ index: d.index, height: d.value, water: water[d.index] || 0 }))
      .on('mouseleave blur', () => setHoveredBar(null))
      .interrupt('exit').transition('update').duration(transitionMs)
      .attr('x', d => (x(d.index) ?? 0) + (x.bandwidth() > 24 ? (x.bandwidth() - 24) / 2 : 1)).attr('y', d => y(d.value)).attr('width', Math.min(24, Math.max(4, x.bandwidth() - 2))).attr('height', d => heightInner - y(d.value)).attr('opacity', 1);

    const waterData = heights.map((_, index) => ({
      id: `water-${index}`,
      x: (x(index) ?? 0) + (x.bandwidth() - x.step()) / 2,
      y: y(heights[index] + (water[index] || 0)),
      width: x.step() + 0.5,
      height: Math.max(0, y(heights[index]) - y(heights[index] + (water[index] || 0))),
      highlighted: (index === left && phase === 'moveLeft') || (index === right && phase === 'moveRight'),
      surface: true
    }));
    const currentIndex = phase === 'moveRight' ? right : left;
    const fillAtCurrent = phase === 'moveLeft' || phase === 'moveRight' ? water[currentIndex] || 0 : 0;
    const visibleWater = phase === 'complete' ? waterData : waterData.filter(cell => (water[Number(cell.id.slice(6))] || 0) > 0);
    const waterGroup = plot.select<SVGGElement>('.layer-water');
    renderWaterCells(waterGroup, visibleWater, transitionMs, `twoPointers:${heights.join(',')}`, reducedMotion);
    plot.select('.layer-water-ripples').raise();
    const rippleKey = `${currentStepIndex}:${currentStep.operation}:${currentStep.currentFill || 0}`;
    const shouldRipple = !reducedMotion && Boolean(currentStep.currentFill) && rippleStepRef.current !== rippleKey;
    if (shouldRipple) rippleStepRef.current = rippleKey;
    const ripples = shouldRipple ? waterData.filter(cell => cell.highlighted && cell.height > 0).map(cell => ({ ...cell, id: `ripple-${cell.id}` })) : [];
    const rippleJoin = plot.select('.layer-water-ripples').selectAll<SVGPathElement, typeof ripples[number]>('path.water-ripple').data(ripples, cell => cell.id);
    rippleJoin.exit().interrupt().attr('opacity', 0).remove();
    rippleJoin.enter().append('path').attr('class', 'water-ripple').attr('opacity', 0)
      .merge(rippleJoin).interrupt().attr('d', cell => {
        const width = cell.width;
        return `M${cell.x},${cell.y + 2} Q${cell.x + width * 0.25},${cell.y - 4} ${cell.x + width * 0.5},${cell.y + 1} T${cell.x + width},${cell.y + 1}`;
      }).attr('opacity', 1).transition('ripple').duration(Math.max(360, transitionMs * 2))
      .attrTween('d', cell => {
        const width = cell.width;
        return (time: number) => `M${cell.x},${cell.y + 2 - time * 5} Q${cell.x + width * 0.25},${cell.y - 4 - time * 5} ${cell.x + width * 0.5},${cell.y + 1 - time * 5} T${cell.x + width},${cell.y + 1 - time * 5}`;
      }).attr('opacity', 0).remove();

    const guideData = [{ id: 'left-max', value: leftMax, start: 0, end: x(left) ?? 0, labelX: 8, color: COLORS.current, label: `L max ${leftMax}`, side: 'start' }, { id: 'right-max', value: rightMax, start: widthInner, end: (x(right) ?? widthInner) + x.bandwidth(), labelX: widthInner - 8, color: COLORS.done, label: `R max ${rightMax}`, side: 'end' }];
    const guides = plot.select('.layer-guides').selectAll<SVGLineElement, typeof guideData[number]>('line.guide').data(guideData, d => d.id);
    guides.enter().append('line').attr('class', 'guide').merge(guides).interrupt('update').transition('update').duration(transitionMs)
      .attr('x1', d => d.start).attr('x2', d => d.end).attr('y1', d => y(d.value)).attr('y2', d => y(d.value)).attr('stroke', d => d.color);
    const guideLabels = plot.select('.layer-labels').selectAll<SVGTextElement, typeof guideData[number]>('text.guide-label').data(guideData, d => d.id);
    const guideLabelY = (guide: typeof guideData[number]) => {
      const coordinate = y(guide.value);
      if (coordinate < 26) return guide.id === 'left-max' ? coordinate + 38 : coordinate + 16;
      if (guide.id === 'left-max') return coordinate - 8;
      return coordinate + 14;
    };
    guideLabels.join('text').attr('class', 'guide-label').attr('text-anchor', d => d.side).attr('x', d => d.labelX).attr('y', guideLabelY).text(d => d.label);
    const anchorData = currentStep.phase === 'moveLeft' || currentStep.phase === 'moveRight' ? [{ id: `anchor-active-${currentStep.phase === 'moveRight' ? right : left}`, index: currentStep.phase === 'moveRight' ? right : left, label: fillAtCurrent ? `本列 +${fillAtCurrent} 格水` : '新边界', color: fillAtCurrent ? COLORS.water : COLORS.current }] : [];
    const anchors = plot.select('.layer-labels').selectAll<SVGGElement, typeof anchorData[number]>('g.value-anchor').data(anchorData, d => d.id);
    anchors.exit().interrupt().transition('exit').duration(transitionMs).attr('opacity', 0).remove();
    const anchorEnter = anchors.enter().append('g').attr('class', 'value-anchor').attr('opacity', 0);
    anchorEnter.append('line').attr('y1', -28).attr('y2', -5).attr('stroke-width', 1.5).attr('stroke-dasharray', '2 2');
    anchorEnter.append('text').attr('text-anchor', 'middle').attr('y', -32);
    anchorEnter.merge(anchors).attr('transform', d => `translate(${(x(d.index) ?? 0) + x.bandwidth() / 2},${y(heights[d.index])})`).attr('opacity', 1).attr('data-anchor-id', d => d.id);
    anchorEnter.merge(anchors).select('line').attr('stroke', d => d.color);
    anchorEnter.merge(anchors).select('text').attr('fill', COLORS.text).text(d => d.label);

    const pointerData = [{ id: 'pointer-left', index: left, label: 'L', color: COLORS.current }, { id: 'pointer-right', index: right, label: 'R', color: COLORS.done }];
    const pointers = plot.select('.layer-pointers').selectAll<SVGGElement, typeof pointerData[number]>('g.pointer').data(pointerData, d => d.id);
    pointers.exit().interrupt().transition('exit').duration(transitionMs).attr('opacity', 0).remove();
    const pointerEnter = pointers.enter().append('g').attr('class', 'pointer').attr('data-node-id', d => d.id);
    pointerEnter.append('path').attr('d', 'M0,0 L-6,-10 L6,-10 Z');
    pointerEnter.append('text').attr('y', -14).attr('text-anchor', 'middle');
    pointerEnter.merge(pointers).interrupt('exit').attr('transform', d => `translate(${(x(d.index) ?? 0) + x.bandwidth() / 2},${heightInner + 16})`).attr('fill', d => d.color);
    pointerEnter.merge(pointers).select('text').text(d => d.label);

    const decisionIndex = currentStep.phase === 'moveRight' ? right : left;
    const decisionData = currentStep.decision ? [{ id: 'decision-arrow', from: decisionIndex, label: currentStep.decision.action === 'move_left' ? '處理左側' : '處理右側' }] : [];
    const arrows = plot.select('.layer-arrows').selectAll<SVGPathElement, typeof decisionData[number]>('path.decision-arrow').data(decisionData, d => d.id);
    arrows.exit().interrupt().transition('exit').duration(transitionMs).attr('opacity', 0).remove();
    arrows.enter().append('path').attr('class', 'decision-arrow').attr('fill', 'none').attr('stroke-width', 2).merge(arrows).interrupt('exit')
      .attr('d', d => `M${(x(d.from) ?? 0) + x.bandwidth() / 2},${y(heights[d.from] || 0) - 18} Q${(x(d.from) ?? 0) + x.bandwidth() / 2},${y(heights[d.from] || 0) - 48} ${(x(Math.max(0, Math.min(heights.length - 1, d.from + (d.label.includes('左') ? 1 : -1)))) ?? 0) + x.bandwidth() / 2},${y(heights[Math.max(0, Math.min(heights.length - 1, d.from + (d.label.includes('左') ? 1 : -1)))] || 0) - 18}`)
      .attr('stroke', d => d.label.includes('左') ? COLORS.current : COLORS.done).attr('opacity', 1);

    const labeledIndices = new Set([focusedIndex, ...(phase === 'compare' ? [left, right] : [])].filter((index): index is number => index !== null));
    const valueLabels = heights.map((value, index) => ({ value, index })).filter(item => labeledIndices.has(item.index) || (phase === 'complete' && item.index % (heights.length > 24 ? 3 : 1) === 0));
    plot.select('.layer-labels').selectAll<SVGTextElement, typeof valueLabels[number]>('text.value-label').data(valueLabels, item => `value-${item.index}`)
      .join('text').attr('class', 'value-label').attr('data-node-id', item => `value-${item.index}`).attr('x', item => (x(item.index) ?? 0) + x.bandwidth() / 2).attr('y', item => y(item.value) - 8).text(item => item.value);

    root.selectAll('.teaching-layer').data([currentStep]).join('g').attr('class', 'teaching-layer').attr('transform', `translate(${margin.left},${Math.max(12, margin.top - 28)})`)
      .call(group => {
        group.selectAll('rect').data([null]).join('rect').attr('width', Math.min(widthInner, 560)).attr('height', 24).attr('rx', 6);
        group.selectAll('text.operation').data([currentStep]).join('text').attr('class', 'operation').attr('x', 10).attr('y', 16).text(`${operationLabel(currentStep.phase)} · Step ${currentStepIndex + 1}/${totalSteps}`);
      });
    const narrativeGroup = root.selectAll('.narration-card').data([currentStep]).join('g').attr('class', 'narration-card').attr('transform', `translate(${margin.left},${viewHeight - 50})`);
    narrativeGroup.selectAll('rect').data([null]).join('rect').attr('width', Math.max(0, width - margin.left - margin.right)).attr('height', 36).attr('rx', 7);
    narrativeGroup.selectAll('text').data([currentStep]).join('text').attr('class', 'step-narration').attr('x', 10).attr('y', 22).text(describeTwoPointerFrame(currentStep));
    root.selectAll('.canvas-metrics').data([null]).join('text').attr('class', 'canvas-metrics').attr('x', width - 16).attr('y', 20).attr('text-anchor', 'end').text(`累计接水 ${totalWater} 格  |  左边界 ${leftMax}  |  右边界 ${rightMax}`);
    root.selectAll('.bar-tooltip').data(hoveredBar ? [hoveredBar] : []).join('g').attr('class', 'bar-tooltip').attr('transform', d => `translate(${margin.left + (x(d.index) ?? 0) + x.bandwidth() / 2},${margin.top + Math.max(30, y(d.height + d.water) - 36)})`).call(group => {
      group.selectAll('rect').data([null]).join('rect').attr('x', -70).attr('y', -16).attr('width', 140).attr('height', 28).attr('rx', 5);
      group.selectAll('text').data(hoveredBar ? [hoveredBar] : []).join('text').attr('text-anchor', 'middle').attr('y', 2).text(d => `i=${d.index} · 高 ${d.height} · 水 ${d.water}`);
    });
    root.selectAll('.canvas-legend').data([null]).join('g').attr('class', 'canvas-legend').attr('transform', `translate(${margin.left},${viewHeight - 18})`)
      .call(group => {
        const legendData = [{ label: '当前柱', color: COLORS.current }, { label: '正在比较', color: COLORS.compare }, { label: '已处理', color: COLORS.visited }, { label: '存水', color: COLORS.water }];
        const items = group.selectAll<SVGGElement, typeof legendData[number]>('g').data(legendData, d => d.label).join(enter => { const item = enter.append('g'); item.append('circle').attr('r', 5); item.append('text').attr('x', 9).attr('y', 4); return item; }).attr('transform', (_, index) => `translate(${index * 80},0)`);
        items.select('circle').attr('fill', d => d.color); items.select('text').text(d => d.label);
      });
    void currentFill; void decision; void calculation;
  }, [heights, currentStep, currentStepIndex, totalSteps, dimensions, speed, reducedMotion, hoveredBar]);

  useEffect(() => {
    if (!currentStep?.description || !isSpeechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentStep.description);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [currentStep, isSpeechEnabled]);

  return <section className="algorithm-visualizer">
    <div className="algorithm-description-compact"><strong>双指针法</strong><span>时间 O(n) · 空间 O(1) · 移动较矮一侧，因为该侧水位已确定</span><button type="button" onClick={() => setIsSpeechEnabled(value => !value)} aria-label="切换语音解说">{isSpeechEnabled ? '关闭语音' : '语音解说'}</button></div>
    <div className="visualization-wrapper">
      <div className="two-pointer-workspace">
        <div className="two-pointer-chart" ref={chartRef}><svg ref={svgRef} className="d3-component" role="img" aria-label="双指针接雨水动画" /></div>
        <div className="two-pointer-code-column"><TwoPointersCodePanel currentStep={currentStep} />{currentStep && <RainwaterVisualChecks heights={heights} water={currentStep.water} />}</div>
      </div>
      <div ref={containerRef} className="animation-controls-host"><AnimationControls isPlaying={isPlaying} onPlay={togglePlay} onNext={nextStep} onPrev={prevStep} onReset={reset} onSeek={setProgress} onSpeedChange={onSpeedChange} speed={speed} progress={progress} currentStep={currentStepIndex} totalSteps={totalSteps} /></div>
    </div>
  </section>;
};

export function describeTwoPointerFrame(step: NonNullable<ReturnType<typeof useTwoPointersSteps>['currentStep']>): string {
  if (step.phase === 'complete') return `计算完成：一共接住 ${step.totalWater} 格水。`;
  if (step.phase === 'init') return `从左右两端开始。水面高度由两边较矮的边界决定。`;
  if (step.phase === 'compare') {
    const side = step.decision?.action === 'move_left' ? '左' : '右';
    const height = side === '左' ? step.decision?.leftHeight : step.decision?.rightHeight;
    return `比较两端：${side}边柱高 ${height}，本轮处理${side}边，因为较矮的一边决定水位。`;
  }
  const index = step.phase === 'moveRight' ? step.right : step.left;
  const height = step.heights[index] ?? 0;
  const boundary = step.phase === 'moveRight' ? step.rightMax : step.leftMax;
  const amount = step.water[index] ?? 0;
  return amount > 0
    ? `处理第 ${index} 根柱：柱高 ${height}，边界水位 ${boundary}，本列装 ${boundary} − ${height} = ${amount} 格；累计 ${step.totalWater} 格。`
    : `处理第 ${index} 根柱：柱高 ${height} 达到新的边界 ${boundary}，本列不存水；累计 ${step.totalWater} 格。`;
}

function operationLabel(phase: string): string {
  return ({ init: '从两端开始', compare: '比较两端高度', moveLeft: '处理左侧柱子', moveRight: '处理右侧柱子', complete: '计算完成' } as Record<string, string>)[phase] || '扫描';
}

export default TwoPointersVisualizer;
