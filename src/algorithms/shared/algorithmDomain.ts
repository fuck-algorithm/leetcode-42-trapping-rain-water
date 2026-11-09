export type WaterInputIssue = 'empty' | 'too-many-bars' | 'height-out-of-range' | 'invalid-height';

export interface WaterInputValidation {
  valid: boolean;
  issue?: WaterInputIssue;
  index?: number;
}

export interface WaterTotals {
  water: number[];
  total: number;
}

export function validateWaterHeights(heights: number[], maxBars = 200, maxHeight = 10000): WaterInputValidation {
  if (!heights.length) return { valid: false, issue: 'empty' };
  if (heights.length > maxBars) return { valid: false, issue: 'too-many-bars' };
  if (!Number.isInteger(maxHeight) || maxHeight < 0) return { valid: false, issue: 'height-out-of-range' };
  for (let index = 0; index < heights.length; index++) {
    const value = heights[index];
    if (!Number.isInteger(value) || value < 0) return { valid: false, issue: 'invalid-height', index };
    if (value > maxHeight) return { valid: false, issue: 'height-out-of-range', index };
  }
  return { valid: true };
}

export function calculateWaterByBoundaries(heights: number[]): WaterTotals {
  const leftMax = new Array(heights.length).fill(0);
  let max = 0;
  for (let index = 0; index < heights.length; index++) {
    max = Math.max(max, heights[index]);
    leftMax[index] = max;
  }

  const water = new Array(heights.length).fill(0);
  let rightMax = 0;
  let total = 0;
  for (let index = heights.length - 1; index >= 0; index--) {
    rightMax = Math.max(rightMax, heights[index]);
    const amount = Math.max(0, Math.min(leftMax[index], rightMax) - heights[index]);
    water[index] = amount;
    total += amount;
  }
  return { water, total };
}
