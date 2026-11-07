import React from 'react';
import './VisualizationTeachingLayer.css';

export type TeachingStatus = 'idle' | 'current' | 'compare' | 'visited' | 'done';

interface TeachingLegendProps {
  currentStep: number;
  totalSteps: number;
  narration: string;
  operation: string;
  metrics: Array<{ label: string; value: string | number }>;
}

const items: Array<{ status: TeachingStatus; label: string }> = [
  { status: 'current', label: '当前' },
  { status: 'compare', label: '比较' },
  { status: 'visited', label: '已处理' },
  { status: 'done', label: '完成' },
];

const VisualizationTeachingLayer: React.FC<TeachingLegendProps> = ({ currentStep, totalSteps, narration, operation, metrics }) => <div className="algorithm-teaching-layer" aria-label="当前算法步骤">
  <div className="algorithm-step-heading"><strong>{operation}</strong><span>Step {currentStep}/{totalSteps}</span><div className="algorithm-step-metrics">{metrics.slice(0, 3).map(metric => <span key={metric.label}>{metric.label} <b>{metric.value}</b></span>)}</div></div>
  <p className="algorithm-step-narration">{narration}</p>
  <ul className="algorithm-status-legend">{items.map(item => <li key={item.status} data-status={item.status}><i aria-hidden="true" />{item.label}</li>)}</ul>
</div>;

export default VisualizationTeachingLayer;
