import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import AnimationControls from '../../components/common/AnimationControls';
import { useElementSize } from '../../hooks/useElementSize';
import { BruteForceVisualizerProps, BruteForceStep } from './types';
import { calculateBruteForceSteps } from './bruteForceSteps';
import { createD3Scales, setupSvgElements, drawBars, addAxes } from './d3Utils';
import { renderScanIndicators, renderMaxHeightIndicators, renderCompareAndWaterCalculation } from './visualizerRender';
import { renderWater } from './waterRenderer';
import './BruteForceVisualizer.css';

/**
 * 暴力法可视化组件
 * 用于可视化展示暴力法解决接雨水问题的过程
 */
const BruteForceVisualizer: React.FC<BruteForceVisualizerProps> = ({ 
  heights, 
  speed: initialSpeed = 1000,
  onSpeedChange = () => {}
}) => {
  const [steps, setSteps] = useState<BruteForceStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [allWaterHeights, setAllWaterHeights] = useState<Record<number, number>>({});
  
  // 引用和尺寸相关
  const containerRef = useRef<HTMLDivElement>(null);
  const d3Container = useRef<SVGSVGElement>(null);
  const dimensions = useElementSize(containerRef);
  
  // 当外部speed变化时同步本地state
  useEffect(() => {
    setSpeed(initialSpeed);
  }, [initialSpeed]);

  // 当前步骤和进度
  const currentStep = steps[currentStepIndex] || { 
    phase: 'init', 
    position: -1, 
    leftMax: 0, 
    rightMax: 0, 
    totalWater: 0,
    description: '初始化算法'
  };
  const totalSteps = steps.length;
  const progress = totalSteps > 1 ? currentStepIndex / (totalSteps - 1) * 100 : 0;

  // 计算暴力法的步骤 - 只在heights变化时重新计算
  useEffect(() => {
    if (!heights || heights.length === 0) return;
    
    try {
      console.log("计算步骤，高度数组:", heights);
      const calculatedSteps = calculateBruteForceSteps(heights);
      console.log("计算的步骤数:", calculatedSteps.length);
      setSteps(calculatedSteps);
      setCurrentStepIndex(0);

      // 获取最终的积水高度
      const lastStep = calculatedSteps[calculatedSteps.length - 1];
      if (lastStep && lastStep.waterLevel) {
        setAllWaterHeights(lastStep.waterLevel);
      }
    } catch (error) {
      console.error("计算步骤时出错:", error);
    }
  }, [heights]);
  
  // 播放控制 - 处理自动播放逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, speed);
    } else if (isPlaying && currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIndex, steps.length, speed]);
  
  // D3可视化渲染 - 确保DOM元素存在且有尺寸
  useEffect(() => {
    if (!d3Container.current || !dimensions.width || !dimensions.height || heights.length === 0) {
      console.log("跳过渲染，条件不满足:", {
        hasContainer: !!d3Container.current,
        width: dimensions.width,
        height: dimensions.height,
        heightsLength: heights.length
      });
      return;
    }

    try {
      console.log("渲染步骤:", currentStepIndex, "阶段:", currentStep.phase);
      const svg = d3.select(d3Container.current);
      // 减小顶部和底部的边距，确保有足够空间显示完整内容
      const margin = { top: 20, right: 30, bottom: 50, left: 40 };
      const width = dimensions.width - margin.left - margin.right;
      const height = dimensions.height - margin.top - margin.bottom;

      // 创建比例尺
      const { x, y } = createD3Scales(heights, width, height, margin.left, margin.right);
      
      // 设置SVG基础元素
      const svgContentGroup = setupSvgElements(svg, width, height, margin);

      // 绘制柱状图
      drawBars(svgContentGroup, heights, x, y, currentStep.position);
      
      // 渲染扫描指示器
      renderScanIndicators(svgContentGroup, currentStep, x, y, heights);
      
      // 渲染左右最大高度指示器
      renderMaxHeightIndicators(svgContentGroup, currentStep, x, y, width);
      
      // 渲染比较和水量计算指示器
      renderCompareAndWaterCalculation(svgContentGroup, currentStep, x, y, heights, width);
      
      // 渲染水的积累效果
      renderWater(svgContentGroup, currentStep, x, y, heights);
      
      // 添加坐标轴
      addAxes(svgContentGroup, x, y, width, height, margin);
    } catch (error) {
      console.error("渲染时出错:", error);
    }
  }, [dimensions, heights, currentStep]);
  
  // 控制函数
  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextStep = () => setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  const setProgress = (progress: number) => setCurrentStepIndex(Math.round((progress / 100) * (steps.length - 1)));
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    onSpeedChange(newSpeed);
  };
  
  // 如果没有高度数组，显示提示
  if (!heights || heights.length === 0) {
    return <div className="brute-force-visualizer">请提供高度数组以开始可视化</div>;
  }

  return (
    <div className="brute-force-visualizer" ref={containerRef} style={{ position: 'relative', paddingBottom: '60px' }}>
      <div className="algorithm-header" style={{ margin: '2px 0', padding: '4px' }}>
        <h2 className="main-title" style={{ fontSize: '16px', margin: '2px 0' }}>暴力法解决接雨水问题</h2>
        <div className="phase-wrapper" style={{ fontSize: '12px' }}>
          <div className="phase-title" style={{ fontSize: '12px', margin: '1px 0' }}>当前步骤: {currentStepIndex + 1}/{totalSteps}</div>
          <div className="phase-description" style={{ fontSize: '11px', margin: '1px 0' }}>{currentStep.description}</div>
          <div className="phase-sub-description" style={{ fontSize: '10px', margin: '0' }}>{currentStep.subStepDescription}</div>
        </div>
      </div>
      
      <div className="visualization-wrapper" style={{ height: '500px', marginBottom: '2px' }}>
        <svg 
          ref={d3Container} 
          className="d3-component"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
        ></svg>
      </div>
      
      <div className="info-panel" style={{ marginBottom: '60px', padding: '4px', fontSize: '12px' }}>
        <div className="stats">总雨水量: <span className="total-water">{currentStep.totalWater}</span> 单位</div>
      </div>
      
      <div className="playback-controls-fixed">
        <AnimationControls 
          isPlaying={isPlaying}
          onPlay={togglePlay}
          onNext={nextStep}
          onPrev={prevStep}
          progress={progress}
          onSeek={setProgress}
          speed={speed}
          onSpeedChange={handleSpeedChange}
          currentStep={currentStepIndex}
          totalSteps={totalSteps}
        />
      </div>
    </div>
  );
};

export default BruteForceVisualizer; 