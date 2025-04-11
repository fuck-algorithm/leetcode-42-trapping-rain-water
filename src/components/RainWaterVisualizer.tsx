import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useTrappingRainWater from '../hooks/useTrappingRainWater';

interface RainWaterVisualizerProps {
  heights: number[];
}

const RainWaterVisualizer: React.FC<RainWaterVisualizerProps> = ({ heights }) => {
  const d3Container = useRef<SVGSVGElement | null>(null);
  const { water, totalWater, leftMax, rightMax } = useTrappingRainWater(heights);
  
  useEffect(() => {
    if (heights && d3Container.current) {
      // Clear any existing SVG content
      d3.select(d3Container.current).selectAll('*').remove();
      
      // Set up dimensions
      const margin = { top: 20, right: 30, bottom: 40, left: 40 };
      const width = 600 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
      
      // Find the maximum height to set the scale
      const maxHeight = Math.max(...heights, ...heights.map((h, i) => h + water[i]));
      
      // Create the SVG container
      const svg = d3.select(d3Container.current)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // Set up scales
      const xScale = d3.scaleBand()
        .domain(heights.map((_, i) => i.toString()))
        .range([0, width])
        .padding(0.1);
      
      const yScale = d3.scaleLinear()
        .domain([0, maxHeight])
        .nice()
        .range([height, 0]);
      
      // Add X axis
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', margin.bottom - 5)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .text('Position');
      
      // Add Y axis
      svg.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 10)
        .attr('x', -height / 2)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .text('Height');
      
      // Draw height bars
      svg.selectAll('.bar-height')
        .data(heights)
        .enter()
        .append('rect')
        .attr('class', 'bar-height')
        .attr('x', (_, i) => xScale(i.toString())!)
        .attr('y', d => yScale(d))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d))
        .attr('fill', '#4285f4');
      
      // Draw water bars
      svg.selectAll('.bar-water')
        .data(water)
        .enter()
        .append('rect')
        .attr('class', 'bar-water')
        .attr('x', (_, i) => xScale(i.toString())!)
        .attr('y', (d, i) => yScale(heights[i] + d))
        .attr('width', xScale.bandwidth())
        .attr('height', d => d > 0 ? height - yScale(d) : 0)
        .attr('fill', 'rgba(66, 133, 244, 0.3)');
      
      // Draw left max line
      const leftMaxLine = d3.line<number>()
        .x((_, i) => (xScale(i.toString())! + xScale.bandwidth() / 2))
        .y(d => yScale(d));
      
      svg.append('path')
        .datum(leftMax)
        .attr('fill', 'none')
        .attr('stroke', '#ff7043')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', leftMaxLine);
      
      // Draw right max line
      const rightMaxLine = d3.line<number>()
        .x((_, i) => (xScale(i.toString())! + xScale.bandwidth() / 2))
        .y(d => yScale(d));
      
      svg.append('path')
        .datum(rightMax)
        .attr('fill', 'none')
        .attr('stroke', '#4caf50')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', rightMaxLine);
      
      // Add legend
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, 10)`);
      
      // Height bar legend
      legend.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '#4285f4');
      
      legend.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('fill', 'white')
        .text('Height');
      
      // Water bar legend
      legend.append('rect')
        .attr('y', 20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', 'rgba(66, 133, 244, 0.3)');
      
      legend.append('text')
        .attr('x', 20)
        .attr('y', 32)
        .attr('fill', 'white')
        .text('Water');
      
      // Left max line legend
      legend.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 47)
        .attr('y2', 47)
        .attr('stroke', '#ff7043')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      legend.append('text')
        .attr('x', 20)
        .attr('y', 52)
        .attr('fill', 'white')
        .text('Left Max');
      
      // Right max line legend
      legend.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 67)
        .attr('y2', 67)
        .attr('stroke', '#4caf50')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      legend.append('text')
        .attr('x', 20)
        .attr('y', 72)
        .attr('fill', 'white')
        .text('Right Max');
      
      // Add title and water amount
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .text(`Total trapped water: ${totalWater} units`);
    }
  }, [heights, water, totalWater, leftMax, rightMax]);

  return (
    <div className="rain-water-container">
      <svg ref={d3Container} className="d3-component" />
    </div>
  );
};

export default RainWaterVisualizer; 