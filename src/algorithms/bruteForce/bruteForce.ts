/**
 * 暴力法求解接雨水问题
 * 时间复杂度: O(n²)
 * 空间复杂度: O(1)
 */
export function algorithm(heights: number[]): number {
  let totalWater = 0;
  
  // 对于每个位置，找出左右两侧的最大高度，然后计算可以储水的量
  for (let i = 0; i < heights.length; i++) {
    let leftMax = 0;
    let rightMax = 0;
    
    // 查找左侧最大高度
    for (let j = 0; j <= i; j++) {
      leftMax = Math.max(leftMax, heights[j]);
    }
    
    // 查找右侧最大高度
    for (let j = i; j < heights.length; j++) {
      rightMax = Math.max(rightMax, heights[j]);
    }
    
    // 计算当前位置可以存储的水量
    const waterAtCurrentPosition = Math.min(leftMax, rightMax) - heights[i];
    
    // 如果能存水，则累加到总水量
    if (waterAtCurrentPosition > 0) {
      totalWater += waterAtCurrentPosition;
    }
  }
  
  return totalWater;
}

export default algorithm; 