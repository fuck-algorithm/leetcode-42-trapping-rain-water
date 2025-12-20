/**
 * 按行求解接雨水问题
 * 思路：先求高度为1的水，再求高度为2的水，依次类推
 * 时间复杂度: O(m*n)，m为最大高度，n为数组长度
 * 空间复杂度: O(1)
 */
export function algorithm(heights: number[]): number {
  let sum = 0;
  const max = getMax(heights); // 找到最大的高度，以便遍历

  for (let i = 1; i <= max; i++) {
    let isStart = false; // 标记是否开始更新 temp
    let tempSum = 0;
    
    for (let j = 0; j < heights.length; j++) {
      if (isStart && heights[j] < i) {
        tempSum++;
      }
      if (heights[j] >= i) {
        sum = sum + tempSum;
        tempSum = 0;
        isStart = true;
      }
    }
  }
  
  return sum;
}

function getMax(heights: number[]): number {
  let max = 0;
  for (let i = 0; i < heights.length; i++) {
    if (heights[i] > max) {
      max = heights[i];
    }
  }
  return max;
}

export default algorithm;
