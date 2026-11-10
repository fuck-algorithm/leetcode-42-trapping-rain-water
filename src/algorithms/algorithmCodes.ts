// 算法代码 - 多语言版本
// 包含 Java, Python, Golang, JavaScript 四种语言的 AC 代码

import { Language } from '../components/CodeDisplay/CodeDisplay';

// 双指针法代码
export const twoPointersCode: Record<Language, string> = {
  java: `public int trap(int[] height) {
    if (height.length == 0) return 0;
    int left = 0, right = height.length - 1;
    int leftMax = height[left], rightMax = height[right];
    int water = 0;

    while (left < right) {
        if (height[left] <= height[right]) {
            left++;
            if (height[left] >= leftMax) {
                leftMax = height[left];
            } else {
                water += leftMax - height[left];
            }
        } else {
            right--;
            if (height[right] >= rightMax) {
                rightMax = height[right];
            } else {
                water += rightMax - height[right];
            }
        }
    }
    return water;
}`,

  python: `def trap(height: list[int]) -> int:
    if not height:
        return 0
    left, right = 0, len(height) - 1
    left_max, right_max = height[left], height[right]
    water = 0

    while left < right:
        if height[left] <= height[right]:
            left += 1
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
        else:
            right -= 1
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]

    return water`,

  golang: `func trap(height []int) int {
    if len(height) == 0 { return 0 }
    left, right := 0, len(height)-1
    leftMax, rightMax := height[left], height[right]
    water := 0

    for left < right {
        if height[left] <= height[right] {
            left++
            if height[left] >= leftMax {
                leftMax = height[left]
            } else {
                water += leftMax - height[left]
            }
        } else {
            right--
            if height[right] >= rightMax {
                rightMax = height[right]
            } else {
                water += rightMax - height[right]
            }
        }
    }
    return water
}`,

  javascript: `function trap(height) {
    if (height.length === 0) return 0;
    let left = 0, right = height.length - 1;
    let leftMax = height[left], rightMax = height[right];
    let water = 0;

    while (left < right) {
        if (height[left] <= height[right]) {
            left++;
            if (height[left] >= leftMax) {
                leftMax = height[left];
            } else {
                water += leftMax - height[left];
            }
        } else {
            right--;
            if (height[right] >= rightMax) {
                rightMax = height[right];
            } else {
                water += rightMax - height[right];
            }
        }
    }
    return water;
}`};


// 单调栈法代码
export const monotonicStackCode: Record<Language, string> = {
  java: `public int trap(int[] height) {
    int water = 0;
    Stack<Integer> stack = new Stack<>();
    
    for (int i = 0; i < height.length; i++) {
        while (!stack.isEmpty() && 
               height[i] > height[stack.peek()]) {
            int top = stack.pop();
            if (stack.isEmpty()) break;
            
            int width = i - stack.peek() - 1;
            int h = Math.min(height[i], 
                    height[stack.peek()]) - height[top];
            water += width * h;
        }
        stack.push(i);
    }
    return water;
}`,

  python: `def trap(height: list[int]) -> int:
    water = 0
    stack = []
    
    for i in range(len(height)):
        while stack and height[i] > height[stack[-1]]:
            top = stack.pop()
            if not stack:
                break
            
            width = i - stack[-1] - 1
            h = min(height[i], height[stack[-1]]) - height[top]
            water += width * h
        
        stack.append(i)
    
    return water`,

  golang: `func trap(height []int) int {
    water := 0
    stack := []int{}
    
    for i := 0; i < len(height); i++ {
        for len(stack) > 0 && 
            height[i] > height[stack[len(stack)-1]] {
            top := stack[len(stack)-1]
            stack = stack[:len(stack)-1]
            if len(stack) == 0 {
                break
            }
            
            width := i - stack[len(stack)-1] - 1
            h := min(height[i], 
                height[stack[len(stack)-1]]) - height[top]
            water += width * h
        }
        stack = append(stack, i)
    }
    return water
}`,

  javascript: `function trap(height) {
    let water = 0;
    const stack = [];
    
    for (let i = 0; i < height.length; i++) {
        while (stack.length > 0 && 
               height[i] > height[stack[stack.length - 1]]) {
            const top = stack.pop();
            if (stack.length === 0) break;
            
            const width = i - stack[stack.length - 1] - 1;
            const h = Math.min(height[i], 
                    height[stack[stack.length - 1]]) - height[top];
            water += width * h;
        }
        stack.push(i);
    }
    return water;
}`
};

// 预计算法（双数组法）代码
export const precomputationCode: Record<Language, string> = {
  java: `public int trap(int[] height) {
    int n = height.length;
    if (n == 0) return 0;
    
    int[] leftMax = new int[n];
    int[] rightMax = new int[n];
    
    // 计算左侧最大值
    leftMax[0] = height[0];
    for (int i = 1; i < n; i++) {
        leftMax[i] = Math.max(leftMax[i-1], height[i]);
    }
    
    // 计算右侧最大值
    rightMax[n-1] = height[n-1];
    for (int i = n-2; i >= 0; i--) {
        rightMax[i] = Math.max(rightMax[i+1], height[i]);
    }
    
    // 计算水量
    int water = 0;
    for (int i = 0; i < n; i++) {
        int currentWater = Math.min(leftMax[i], rightMax[i]) - height[i];
        water += Math.max(0, currentWater);
    }
    return water;
}`,

  python: `def trap(height: list[int]) -> int:
    n = len(height)
    if n == 0:
        return 0
    
    left_max = [0] * n
    right_max = [0] * n
    
    # 计算左侧最大值
    left_max[0] = height[0]
    for i in range(1, n):
        left_max[i] = max(left_max[i-1], height[i])
    
    # 计算右侧最大值
    right_max[n-1] = height[n-1]
    for i in range(n-2, -1, -1):
        right_max[i] = max(right_max[i+1], height[i])
    
    # 计算水量
    water = 0
    for i in range(n):
        current_water = min(left_max[i], right_max[i]) - height[i]
        water += max(0, current_water)
    
    return water`,

  golang: `func trap(height []int) int {
    n := len(height)
    if n == 0 {
        return 0
    }
    
    leftMax := make([]int, n)
    rightMax := make([]int, n)
    
    // 计算左侧最大值
    leftMax[0] = height[0]
    for i := 1; i < n; i++ {
        leftMax[i] = max(leftMax[i-1], height[i])
    }
    
    // 计算右侧最大值
    rightMax[n-1] = height[n-1]
    for i := n - 2; i >= 0; i-- {
        rightMax[i] = max(rightMax[i+1], height[i])
    }
    
    // 计算水量
    water := 0
    for i := 0; i < n; i++ {
        currentWater := max(0, min(leftMax[i], rightMax[i])-height[i])
        water += currentWater
    }
    return water
}`,

  javascript: `function trap(height) {
    const n = height.length;
    if (n === 0) return 0;
    
    const leftMax = new Array(n);
    const rightMax = new Array(n);
    
    // 计算左侧最大值
    leftMax[0] = height[0];
    for (let i = 1; i < n; i++) {
        leftMax[i] = Math.max(leftMax[i-1], height[i]);
    }
    
    // 计算右侧最大值
    rightMax[n-1] = height[n-1];
    for (let i = n-2; i >= 0; i--) {
        rightMax[i] = Math.max(rightMax[i+1], height[i]);
    }
    
    // 计算水量
    let water = 0;
    for (let i = 0; i < n; i++) {
        const currentWater = Math.min(leftMax[i], rightMax[i]) - height[i];
        water += Math.max(0, currentWater);
    }
    return water;
}`
};

// 暴力法代码
export const bruteForceCode: Record<Language, string> = {
  java: `public int trap(int[] height) {
    int n = height.length;
    int water = 0;
    
    for (int i = 0; i < n; i++) {
        int leftMax = 0, rightMax = 0;
        
        // 找左侧最大值
        for (int j = 0; j <= i; j++) {
            leftMax = Math.max(leftMax, height[j]);
        }
        
        // 找右侧最大值
        for (int j = i; j < n; j++) {
            rightMax = Math.max(rightMax, height[j]);
        }
        
        water += Math.min(leftMax, rightMax) - height[i];
    }
    return water;
}`,

  python: `def trap(height: list[int]) -> int:
    n = len(height)
    water = 0
    
    for i in range(n):
        left_max = 0
        right_max = 0
        
        # 找左侧最大值
        for j in range(i + 1):
            left_max = max(left_max, height[j])
        
        # 找右侧最大值
        for j in range(i, n):
            right_max = max(right_max, height[j])
        
        water += min(left_max, right_max) - height[i]
    
    return water`,

  golang: `func trap(height []int) int {
    n := len(height)
    water := 0
    
    for i := 0; i < n; i++ {
        leftMax, rightMax := 0, 0
        
        // 找左侧最大值
        for j := 0; j <= i; j++ {
            if height[j] > leftMax {
                leftMax = height[j]
            }
        }
        
        // 找右侧最大值
        for j := i; j < n; j++ {
            if height[j] > rightMax {
                rightMax = height[j]
            }
        }
        
        water += min(leftMax, rightMax) - height[i]
    }
    return water
}`,

  javascript: `function trap(height) {
    const n = height.length;
    let water = 0;
    
    for (let i = 0; i < n; i++) {
        let leftMax = 0, rightMax = 0;
        
        // 找左侧最大值
        for (let j = 0; j <= i; j++) {
            leftMax = Math.max(leftMax, height[j]);
        }
        
        // 找右侧最大值
        for (let j = i; j < n; j++) {
            rightMax = Math.max(rightMax, height[j]);
        }
        
        water += Math.min(leftMax, rightMax) - height[i];
    }
    return water;
}`
};

// 按行求法代码
export const rowByRowCode: Record<Language, string> = {
  java: `public int trap(int[] height) {
    int maxHeight = 0;
    for (int h : height) {
        maxHeight = Math.max(maxHeight, h);
    }
    
    int water = 0;
    for (int level = 1; level <= maxHeight; level++) {
        int left = -1;
        for (int i = 0; i < height.length; i++) {
            if (height[i] >= level) {
                if (left != -1) {
                    water += i - left - 1;
                }
                left = i;
            }
        }
    }
    return water;
}`,

  python: `def trap(height: list[int]) -> int:
    if not height:
        return 0
    
    max_height = max(height)
    water = 0
    
    for level in range(1, max_height + 1):
        left = -1
        for i in range(len(height)):
            if height[i] >= level:
                if left != -1:
                    water += i - left - 1
                left = i
    
    return water`,

  golang: `func trap(height []int) int {
    maxHeight := 0
    for _, h := range height {
        if h > maxHeight {
            maxHeight = h
        }
    }
    
    water := 0
    for level := 1; level <= maxHeight; level++ {
        left := -1
        for i := 0; i < len(height); i++ {
            if height[i] >= level {
                if left != -1 {
                    water += i - left - 1
                }
                left = i
            }
        }
    }
    return water
}`,

  javascript: `function trap(height) {
    if (height.length === 0) return 0;
    
    const maxHeight = Math.max(...height);
    let water = 0;
    
    for (let level = 1; level <= maxHeight; level++) {
        let left = -1;
        for (let i = 0; i < height.length; i++) {
            if (height[i] >= level) {
                if (left !== -1) {
                    water += i - left - 1;
                }
                left = i;
            }
        }
    }
    return water;
}`
};
