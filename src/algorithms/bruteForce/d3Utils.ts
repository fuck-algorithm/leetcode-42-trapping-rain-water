import * as d3 from 'd3';

/**
 * 创建D3比例尺和坐标轴
 */
export function createD3Scales(
  heights: number[], 
  width: number, 
  height: number,
  leftMargin = 0,
  rightMargin = 0
) {
  // 计算最大高度
  const maxHeight = Math.max(...heights, 4); // 最小显示高度为4，确保比例尺有足够的范围
  
  // 创建X轴的比例尺（使用band比例尺，适合离散数据）
  const x = d3.scaleBand()
    .domain(heights.map((_, i) => i.toString()))
    .range([leftMargin, width - rightMargin])
    .padding(0.3); // 增加一些间距，使柱子更明显
    
  // 创建Y轴的比例尺（线性比例尺）
  const y = d3.scaleLinear()
    .domain([0, maxHeight * 1.1]) // 增加10%的空间，使图表有呼吸感
    .range([height, 0]);
    
  return { x, y };
}

/**
 * 设置SVG基础元素
 */
export function setupSvgElements(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number,
  margin: { top: number, right: number, bottom: number, left: number }
) {
  // 清空SVG内容
  svg.selectAll("*").remove();
  
  // 调整SVG尺寸
  svg.attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);
  
  // 创建一个组容器，用于平移整个内容
  const contentGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  // 添加背景网格
  const gridGroup = contentGroup.append("g")
    .attr("class", "grid-lines");
    
  // 水平网格线
  const yGridLines = d3.axisLeft(d3.scaleLinear().domain([0, 10]).range([height, 0]))
    .tickSize(-width)
    .tickFormat(() => "")
    .ticks(5);
    
  gridGroup.call(yGridLines)
    .attr("opacity", 0.1)
    .selectAll("line")
    .attr("stroke", "#666");
  
  return contentGroup;
}

/**
 * 绘制柱状图
 */
export function drawBars(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  heights: number[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  currentPositionIndex: number
) {
  // 清除之前的柱子
  svgContentGroup.selectAll(".bar-elements").remove();
  
  // 创建柱子组元素
  const barGroup = svgContentGroup.append("g")
    .attr("class", "bar-elements");
  
  // 绘制底部参考线
  barGroup.append("line")
    .attr("x1", 0)
    .attr("x2", x.range()[1])
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", "#333")
    .attr("stroke-width", 1);
  
  // 为每个高度创建一个柱子
  heights.forEach((height, i) => {
    const isCurrentPosition = i === currentPositionIndex;
    const barColor = isCurrentPosition ? '#FF9800' : '#3f51b5';
    const barOpacity = isCurrentPosition ? 1 : 0.8;
    
    // 创建柱子组
    const bar = barGroup.append("g")
      .attr("class", "bar");
    
    // 柱子底座半圆
    bar.append("rect")
      .attr("x", x(i.toString()) || 0)
      .attr("y", y(0) - 2)
      .attr("width", x.bandwidth())
      .attr("height", 4)
      .attr("rx", 2)
      .attr("fill", "#333")
      .attr("opacity", 0.5);
    
    // 柱子矩形 - 即使高度为0也给一个最小高度1px以保证可见
    const effectiveHeight = height === 0 ? 0.05 : height; // 高度为0时使用一个微小值以保证显示
    
    bar.append("rect")
      .attr("class", "height-bar")
      .attr("x", x(i.toString()) || 0)
      .attr("y", y(effectiveHeight))
      .attr("width", x.bandwidth())
      .attr("height", Math.max(1, y(0) - y(effectiveHeight))) // 确保至少有1px高度
      .attr("fill", barColor)
      .attr("opacity", barOpacity)
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("stroke", isCurrentPosition ? '#E65100' : '#303F9F')
      .attr("stroke-width", isCurrentPosition ? 2 : 1);
    
    // 柱子顶部半圆 - 调整位置以确保即使高度为0也能看到
    bar.append("rect")
      .attr("x", x(i.toString()) || 0)
      .attr("y", y(effectiveHeight) - 2)
      .attr("width", x.bandwidth())
      .attr("height", 4)
      .attr("rx", 2)
      .attr("fill", isCurrentPosition ? '#E65100' : '#303F9F');
    
    // 高度标签背景 - 调整位置以确保即使高度为0也能看到
    bar.append("rect")
      .attr("x", (x(i.toString()) || 0) + x.bandwidth() / 2 - 10)
      .attr("y", y(effectiveHeight) - 20)
      .attr("width", 20)
      .attr("height", 20)
      .attr("rx", 10)
      .attr("fill", "white")
      .attr("opacity", 0.7);
    
    // 高度标签 - 调整位置以确保即使高度为0也能看到
    bar.append("text")
      .attr("class", "bar-label")
      .attr("x", (x(i.toString()) || 0) + x.bandwidth() / 2)
      .attr("y", y(effectiveHeight) - 7)
      .attr("text-anchor", "middle")
      .attr("font-size", "0.8em")
      .attr("font-weight", "bold")
      .attr("fill", isCurrentPosition ? '#E65100' : '#303F9F')
      .text(height);
    
    // 索引标签
    bar.append("text")
      .attr("class", "index-label")
      .attr("x", (x(i.toString()) || 0) + x.bandwidth() / 2)
      .attr("y", y(0) + 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "0.8em")
      .attr("fill", isCurrentPosition ? '#E65100' : '#333')
      .attr("font-weight", isCurrentPosition ? "bold" : "normal")
      .text(i);
      
    // 为当前位置添加高亮指示
    if (isCurrentPosition) {
      // 顶部箭头指示
      bar.append("path")
        .attr("d", `M${(x(i.toString()) || 0) + x.bandwidth() / 2},${y(effectiveHeight) - 25} 
                  L${(x(i.toString()) || 0) + x.bandwidth() / 2 - 10},${y(effectiveHeight) - 40} 
                  L${(x(i.toString()) || 0) + x.bandwidth() / 2 + 10},${y(effectiveHeight) - 40} Z`)
        .attr("fill", "#FF5722");
        
      // 当前位置标签背景
      bar.append("rect")
        .attr("x", (x(i.toString()) || 0) + x.bandwidth() / 2 - 40)
        .attr("y", y(effectiveHeight) - 60)
        .attr("width", 80)
        .attr("height", 20)
        .attr("rx", 5)
        .attr("fill", "white")
        .attr("stroke", "#FF5722")
        .attr("stroke-width", 1)
        .attr("opacity", 0.9);
        
      // 当前位置标签文字
      bar.append("text")
        .attr("x", (x(i.toString()) || 0) + x.bandwidth() / 2)
        .attr("y", y(effectiveHeight) - 45)
        .attr("text-anchor", "middle")
        .attr("font-size", "0.8em")
        .attr("font-weight", "bold")
        .attr("fill", "#FF5722")
        .text(`当前位置: ${i}`);
    }
  });
}

/**
 * 添加坐标轴
 */
export function addAxes(
  svgContentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number, never>,
  width: number,
  height: number,
  margin: { top: number, right: number, bottom: number, left: number }
) {
  // 创建X轴
  const xAxis = d3.axisBottom(x)
    .tickFormat((d) => d);
    
  svgContentGroup.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "middle")
    .attr("dy", "1em");
    
  // 添加X轴标签
  svgContentGroup.append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .text("位置索引")
    .attr("fill", "#333")
    .attr("font-size", "0.9em")
    .attr("font-weight", "bold");
  
  // 创建Y轴
  const yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickFormat(d => d.toString());
    
  svgContentGroup.append("g")
    .attr("class", "y-axis")
    .call(yAxis);
    
  // 添加Y轴标签
  svgContentGroup.append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("高度")
    .attr("fill", "#333")
    .attr("font-size", "0.9em")
    .attr("font-weight", "bold");
    
  // 添加图例
  const legendGroup = svgContentGroup.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 120}, 10)`);
    
  // 高度条图例
  legendGroup.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#3f51b5")
    .attr("rx", 2);
    
  legendGroup.append("text")
    .attr("x", 25)
    .attr("y", 12)
    .attr("font-size", "0.8em")
    .text("高度")
    .attr("fill", "#333");
    
  // 当前位置图例
  legendGroup.append("rect")
    .attr("x", 0)
    .attr("y", 25)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#FF9800")
    .attr("rx", 2);
    
  legendGroup.append("text")
    .attr("x", 25)
    .attr("y", 37)
    .attr("font-size", "0.8em")
    .text("当前位置")
    .attr("fill", "#333");
    
  // 水图例
  legendGroup.append("rect")
    .attr("x", 0)
    .attr("y", 50)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "rgba(3, 169, 244, 0.7)")
    .attr("rx", 2);
    
  legendGroup.append("text")
    .attr("x", 25)
    .attr("y", 62)
    .attr("font-size", "0.8em")
    .text("积水")
    .attr("fill", "#333");
} 