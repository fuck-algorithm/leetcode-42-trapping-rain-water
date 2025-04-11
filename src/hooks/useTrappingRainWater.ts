import { useMemo } from 'react';

interface TrappingRainWaterResult {
  water: number[];
  totalWater: number;
  leftMax: number[];
  rightMax: number[];
}

/**
 * Custom hook to calculate the trapping rain water algorithm results
 * @param heights Array of heights representing the elevation map
 * @returns Object containing water at each position, total water, leftMax and rightMax arrays
 */
export const useTrappingRainWater = (heights: number[]): TrappingRainWaterResult => {
  return useMemo(() => {
    const n = heights.length;
    if (n <= 2) {
      return { 
        water: new Array(n).fill(0), 
        totalWater: 0,
        leftMax: new Array(n).fill(0),
        rightMax: new Array(n).fill(0)
      };
    }
    
    const leftMax = new Array(n).fill(0);
    const rightMax = new Array(n).fill(0);
    const water = new Array(n).fill(0);
    
    // Fill leftMax array
    leftMax[0] = heights[0];
    for (let i = 1; i < n; i++) {
      leftMax[i] = Math.max(leftMax[i-1], heights[i]);
    }
    
    // Fill rightMax array
    rightMax[n-1] = heights[n-1];
    for (let i = n-2; i >= 0; i--) {
      rightMax[i] = Math.max(rightMax[i+1], heights[i]);
    }
    
    // Calculate water at each position
    let totalWater = 0;
    for (let i = 0; i < n; i++) {
      water[i] = Math.min(leftMax[i], rightMax[i]) - heights[i];
      totalWater += water[i];
    }
    
    return { water, totalWater, leftMax, rightMax };
  }, [heights]);
};

export default useTrappingRainWater; 