import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useTwoPointersSteps from './useTwoPointersSteps';
import AnimationControls from '../../components/common/AnimationControls';
import { motionDuration } from './motion';
import './TwoPointersVisualizer.css';

interface TwoPointersVisualizerProps {
  heights: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

const COLORS = {
  bar: '#52616b', water: '#64a9d7', current: '#2f9e7d', compare: '#e8b04b',
  visited: '#9ad3c2', done: '#18765a', text: '#19332d', muted: '#687b76', grid: '#e3ebe8'
};

const TwoPointersVisualizer: React.FC<TwoPointersVisualizerProps> = ({ heights, speed = 500, onSpeedChange = () => {} }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const { currentStep, currentStepIndex, totalSteps, isPlaying, progress, togglePlay, nextStep, prevStep, setProgress, reset } = useTwoPointersSteps({ heights, speed });

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height }));
    if (containerRef.current) observer.observe(containerRef.current);
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media?.matches ?? false);
    updateMotion();
    media?.addEventListener?.('change', updateMotion);
    return () => { observer.disconnect(); media?.removeEventListener?.('change', updateMotion); };
  }, []);

  useEffect(() => {
    if (!currentStep || !svgRef.current || dimensions.width <= 0 || dimensions.height <= 0) return;
    const { width, height: viewHeight } = dimensions;
    const margin = { top: 40, right: 20, bottom: 42, left: 42 };
    const widthInner = Math.max(1, width - margin.left - margin.right);
    const heightInner = Math.max(1, viewHeight - margin.top - margin.bottom);
    const transitionMs = motionDuration(speed, reducedMotion);
    const { left, right, leftMax, rightMax, water, totalWater, currentFill, phase, decision, calculation } = currentStep;
    const maxHeight = Math.max(1, ...heights, ...water.map((amount, index) => heights[index] + amount));
    const x = d3.scaleBand<number>().domain(heights.map((_, index) => index)).range([0, widthInner]).padding(heights.length > 20 ? 0.08 : 0.16);
    const y = d3.scaleLinear().domain([0, maxHeight * 1.18]).range([heightInner, 0]);
    const root = d3.select(svgRef.current);
    root.attr('viewBox', `0 0 ${width} ${viewHeight}`).attr('preserveAspectRatio', 'none');
    let plot = root.select<SVGGElement>('.plot');
    if (plot.empty()) {
      plot = root.append('g').attr('class', 'plot').attr('transform', `translate(${margin.left},${margin.top})`);
      plot.append('g').attr('class', 'layer-grid');
      plot.append('g').attr('class', 'layer-water');
      plot.append('g').attr('class', 'layer-bars');
      plot.append('g').attr('class', 'layer-guides');
      plot.append('g').attr('class', 'layer-pointers');
      plot.append('g').attr('class', 'layer-labels');
    }
    plot.attr('transform', `translate(${margin.left},${margin.top})`);
    plot.select<SVGGElement>('.layer-grid').call(d3.axisLeft(y).ticks(5).tickSize(-widthInner).tickFormat(() => '')).call(g => g.selectAll('path').remove());

    const statuses = heights.map((value, index) => ({
      id: `bar-${index}`, index, value,
      status: currentStep.phase === 'complete' ? 'done' : index === left || index === right ? (phase === 'compare' ? 'compare' : 'current') : index < left || index > right ? 'visited' : 'idle'
    }));
    const bars = plot.select('.layer-bars').selectAll<SVGRectElement, typeof statuses[number]>('rect.bar').data(statuses, d => d.id);
    bars.exit().interrupt().transition('exit').duration(transitionMs).attr('opacity', 0).remove();
    bars.enter().append('rect').attr('class', 'bar').attr('data-node-id', d => d.id).attr('y', heightInner).attr('height', 0).attr('opacity', 0.5)
      .merge(bars).attr('data-status', d => d.status).interrupt('exit').transition('update').duration(transitionMs)
      .attr('x', d => x(d.index) ?? 0).attr('y', d => y(d.value)).attr('width', x.bandwidth()).attr('height', d => heightInner - y(d.value)).attr('opacity', 1);

    const waterData = heights.map((_, index) => ({ id: `water-${index}`, index, amount: water[index] || 0 }));
    const waterBars = plot.select('.layer-water').selectAll<SVGRectElement, typeof waterData[number]>('rect.water').data(waterData, d => d.id);
    waterBars.exit().interrupt().transition('exit').duration(transitionMs).attr('opacity', 0).remove();
    waterBars.enter().append('rect').attr('class', 'water').attr('data-node-id', d => d.id).attr('opacity', 0)
      .merge(waterBars).interrupt('exit').transition('update').duration(transitionMs).attr('x', d => x(d.index) ?? 0)
      .attr('y', d => y(heights[d.index] + d.amount)).attr('width', x.bandwidth()).attr('height', d => Math.max(0, y(heights[d.index]) - y(heights[d.index] + d.amount))).attr('opacity', d => d.amount ? 0.82 : 0);

    const guideData = [{ id: 'left-max', value: leftMax, start: 0, end: x(left) ?? 0, color: COLORS.current, label: `leftMax ${leftMax}` }, { id: 'right-max', value: rightMax, start: widthInner, end: (x(right) ?? widthInner) + x.bandwidth(), color: COLORS.done, label: `rightMax ${rightMax}` }];
    const guides = plot.select('.layer-guides').selectAll<SVGLineElement, typeof guideData[number]>('line.guide').data(guideData, d => d.id);
    guides.enter().append('line').attr('class', 'guide').merge(guides).interrupt('update').transition('update').duration(transitionMs)
      .attr('x1', d => d.start).attr('x2', d => d.end).attr('y1', d => y(d.value)).attr('y2', d => y(d.value)).attr('stroke', d => d.color);
    const guideLabels = plot.select('.layer-labels').selectAll<SVGTextElement, typeof guideData[number]>('text.guide-label').data(guideData, d => d.id);
    guideLabels.join('text').attr('class', 'guide-label').attr('text-anchor', (d, index) => index ? 'end' : 'start').attr('x', d => d.start).attr('y', d => y(d.value) - 6).text(d => d.label);

    const pointerData = [{ id: 'pointer-left', index: left, label: 'L', color: COLORS.current }, { id: 'pointer-right', index: right, label: 'R', color: COLORS.done }];
    const pointers = plot.select('.layer-pointers').selectAll<SVGGElement, typeof pointerData[number]>('g.pointer').data(pointerData, d => d.id);
    pointers.exit().interrupt().transition('exit').duration(transitionMs).attr('opacity', 0).remove();
    const pointerEnter = pointers.enter().append('g').attr('class', 'pointer').attr('data-node-id', d => d.id);
    pointerEnter.append('path').attr('d', 'M0,0 L-6,-10 L6,-10 Z');
    pointerEnter.append('text').attr('y', -14).attr('text-anchor', 'middle');
    pointerEnter.merge(pointers).interrupt('exit').transition('update').duration(transitionMs).attr('transform', d => `translate(${(x(d.index) ?? 0) + x.bandwidth() / 2},${heightInner + 16})`).attr('fill', d => d.color);
    pointerEnter.merge(pointers).select('text').text(d => d.label);

    plot.select('.layer-labels').selectAll<SVGTextElement, typeof heights[number]>('text.value-label').data(heights, (_, index) => `value-${index}`)
      .join('text').attr('class', 'value-label').attr('data-node-id', (_, index) => `value-${index}`).attr('x', (_, index) => (x(index) ?? 0) + x.bandwidth() / 2).attr('y', d => y(d) - 5).text(d => d);

    root.selectAll('.teaching-layer').data([currentStep]).join('g').attr('class', 'teaching-layer').attr('transform', `translate(${margin.left},${Math.max(12, margin.top - 28)})`)
      .call(group => {
        group.selectAll('rect').data([null]).join('rect').attr('width', Math.min(widthInner, 560)).attr('height', 24).attr('rx', 6);
        group.selectAll('text.operation').data([currentStep]).join('text').attr('class', 'operation').attr('x', 10).attr('y', 16).text(`${operationLabel(currentStep.phase)} · ${currentStep.description || '逐步确定每个位置的蓄水量'}`);
      });
    root.selectAll('.canvas-metrics').data([null]).join('text').attr('class', 'canvas-metrics').attr('x', width - 16).attr('y', 20).attr('text-anchor', 'end').text(`已蓄水 ${totalWater} · 当前 ${currentStepIndex + 1}/${totalSteps}`);
    root.selectAll('.canvas-legend').data([null]).join('g').attr('class', 'canvas-legend').attr('transform', `translate(${margin.left},${viewHeight - 8})`)
      .call(group => {
        const legendData = [{ label: '当前', color: COLORS.current }, { label: '比较', color: COLORS.compare }, { label: '已处理', color: COLORS.visited }, { label: '完成', color: COLORS.done }];
        const items = group.selectAll<SVGGElement, typeof legendData[number]>('g').data(legendData, d => d.label).join(enter => { const item = enter.append('g'); item.append('circle').attr('r', 5); item.append('text').attr('x', 9).attr('y', 4); return item; }).attr('transform', (_, index) => `translate(${index * 80},0)`);
        items.select('circle').attr('fill', d => d.color); items.select('text').text(d => d.label);
      });
    root.selectAll('.step-narration').data([currentStep]).join('text').attr('class', 'step-narration').attr('x', width - 16).attr('y', viewHeight - 8).attr('text-anchor', 'end').text(currentStep.description || '算法状态已更新');
    void currentFill; void decision; void calculation;
  }, [heights, currentStep, currentStepIndex, totalSteps, dimensions, speed, reducedMotion]);

  useEffect(() => {
    if (!currentStep?.description || !isSpeechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentStep.description);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [currentStep, isSpeechEnabled]);

  return <section className="algorithm-visualizer">
    <div className="algorithm-description-compact"><strong>双指针法</strong><span>时间 O(n) · 空间 O(1) · 每次处理较矮的一端</span><button type="button" onClick={() => setIsSpeechEnabled(value => !value)} aria-label="切换语音解说">{isSpeechEnabled ? '关闭语音' : '语音解说'}</button></div>
    <div className="visualization-wrapper" ref={containerRef}><svg ref={svgRef} className="d3-component" role="img" aria-label="双指针接雨水动画" />
      <AnimationControls isPlaying={isPlaying} onPlay={togglePlay} onNext={nextStep} onPrev={prevStep} onReset={reset} onSeek={setProgress} onSpeedChange={onSpeedChange} speed={speed} progress={progress} currentStep={currentStepIndex} totalSteps={totalSteps} />
    </div>
  </section>;
};

function operationLabel(phase: string): string {
  return ({ init: '初始化', compare: '比较', moveLeft: '左侧处理', moveRight: '右侧处理', complete: '完成' } as Record<string, string>)[phase] || '扫描';
}

export default TwoPointersVisualizer;
