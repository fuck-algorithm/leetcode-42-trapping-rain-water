import React from 'react';
import './RainwaterVisualChecks.css';

interface RainwaterVisualChecksProps {
  heights: number[];
  water: number[];
}

const RainwaterVisualChecks: React.FC<RainwaterVisualChecksProps> = ({ heights, water }) => <details className="rainwater-data-details">
  <summary>数据表 / 辅助理解</summary>
  <table aria-label="每个位置的高度与蓄水量">
    <thead><tr><th>索引</th><th>柱高</th><th>水量</th></tr></thead>
    <tbody>{heights.map((height, index) => <tr key={index}><th scope="row">{index}</th><td>{height}</td><td>{water[index] || 0}</td></tr>)}</tbody>
  </table>
  <div className="rainwater-index-strip" aria-label="选择柱子查看计算值">{heights.map((height, index) => <button key={index} type="button" aria-label={`位置 ${index}，高度 ${height}，蓄水 ${water[index] || 0}`} title={`位置 ${index}：高度 ${height}，蓄水 ${water[index] || 0}，当前界限 ${height + (water[index] || 0)}`}><span>{index}</span><strong>{height}</strong><small>水 {water[index] || 0}</small></button>)}</div>
</details>;

export default RainwaterVisualChecks;
