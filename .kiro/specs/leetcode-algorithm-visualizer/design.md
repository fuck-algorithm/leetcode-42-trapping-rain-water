# Design Document

## Overview

本设计文档描述 LeetCode 42 题「接雨水」算法可视化演示网站的技术架构和实现方案。该应用采用 TypeScript + React + D3.js 技术栈，提供分步骤的算法动画演示，支持多种编程语言的代码展示，并具有完整的交互控制功能。

### 核心设计目标

1. **单屏幕体验**: 所有内容在一个屏幕内展示，无需滚动
2. **教学导向**: 通过动画、标注、数据流可视化帮助用户理解算法
3. **交互丰富**: 支持键盘快捷键、拖拽、缩放等交互方式
4. **持久化设置**: 用户偏好（播放速度等）通过 IndexedDB 持久化

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Component                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Header Section                        │    │
│  │  ┌──────────┐  ┌─────────────────┐  ┌───────────────┐   │    │
│  │  │ GitHub   │  │   Title Link    │  │  Description  │   │    │
│  │  │ Stars    │  │   (42. 接雨水)   │  │               │   │    │
│  │  └──────────┘  └─────────────────┘  └───────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Input Control Section                   │    │
│  │  ┌──────────────┐  ┌─────────┐  ┌──────────────────┐    │    │
│  │  │ Text Input   │  │ Presets │  │ Random Generate  │    │    │
│  │  └──────────────┘  └─────────┘  └──────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Main Content Area                      │    │
│  │  ┌───────────────────────┐  ┌─────────────────────────┐ │    │
│  │  │                       │  │     Code Display        │ │    │
│  │  │   Visualization       │  │  ┌─────────────────┐    │ │    │
│  │  │   Canvas (D3.js)      │  │  │ Language Tabs   │    │ │    │
│  │  │                       │  │  ├─────────────────┤    │ │    │
│  │  │  - Height Bars        │  │  │ Code with       │    │ │    │
│  │  │  - Water Animation    │  │  │ - Line Numbers  │    │ │    │
│  │  │  - Pointers           │  │  │ - Highlighting  │    │ │    │
│  │  │  - Data Structures    │  │  │ - Variables     │    │ │    │
│  │  │  - Annotations        │  │  └─────────────────┘    │ │    │
│  │  │                       │  │                         │ │    │
│  │  └───────────────────────┘  └─────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                Animation Controls                        │    │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐  ┌────────┐ ┌───────────┐  │    │
│  │  │ ← │ │ ▶ │ │ → │ │ R │  │ Speed  │ │ Progress  │  │    │
│  │  └────┘ └────┘ └────┘ └────┘  └────────┘ └───────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                          ┌──────────────────┐   │
│                                          │  WeChat Float    │   │
│                                          └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

- **React 19**: UI 框架
- **TypeScript**: 类型安全
- **D3.js 7**: 数据可视化
- **IndexedDB**: 客户端持久化存储
- **Ant Design Icons**: 图标库
- **GitHub Actions**: CI/CD

## Components and Interfaces

### 1. App Component

主应用组件，负责整体布局和状态管理。

```typescript
interface AppState {
  heights: number[];           // 当前高度数组
  activeTab: string;           // 当前选中的算法标签
  speed: number;               // 播放速度 (ms per step)
}
```

### 2. GitHubStars Component

GitHub Star 数展示组件，带缓存功能。

```typescript
interface GitHubStarsProps {
  owner: string;               // 仓库所有者
  repo: string;                // 仓库名称
}

interface StarCache {
  count: number;               // Star 数量
  timestamp: number;           // 缓存时间戳
  expiresAt: number;           // 过期时间
}

// IndexedDB 存储结构
interface GitHubStarsDB {
  storeName: 'github-stars';
  key: string;                 // `${owner}/${repo}`
  value: StarCache;
}
```

### 3. HeightsInputControl Component

数据输入控制组件。

```typescript
interface HeightsInputControlProps {
  initialHeights: number[];
  onUpdateHeights: (heights: number[]) => void;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  heights?: number[];
}

// 预设数据样例
const PRESET_DATA = [
  { label: '示例1', data: [0,1,0,2,1,0,1,3,2,1,2,1] },
  { label: '示例2', data: [4,2,0,3,2,5] },
  { label: '空数组', data: [] },
  // ...
];
```

### 4. CodeDisplay Component

代码展示组件，支持多语言和调试功能。

```typescript
type Language = 'java' | 'python' | 'golang' | 'javascript';

interface VariableState {
  name: string;                // 变量名
  value: string | number;      // 变量值
  line: number;                // 所在行号
}

interface CodeDisplayProps {
  codes: Record<Language, string>;  // 各语言代码
  currentLine?: number;             // 当前执行行
  variables?: VariableState[];      // 变量状态
  highlightLines?: number[];        // 高亮行
}
```

### 5. AnimationControls Component

动画控制组件。

```typescript
interface AnimationControlsProps {
  isPlaying: boolean;
  progress: number;            // 0-100
  currentStep: number;
  totalSteps: number;
  speed: number;
  onNext: () => void;
  onPrev: () => void;
  onPlay: () => void;
  onReset: () => void;
  onSeek: (progress: number) => void;
  onSpeedChange: (speed: number) => void;
}

// IndexedDB 存储结构
interface SpeedSettingDB {
  storeName: 'settings';
  key: 'playbackSpeed';
  value: number;
}
```

### 6. Algorithm Visualizer Components

各算法可视化组件的通用接口。

```typescript
interface VisualizerProps {
  heights: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

interface AnimationStep {
  // 通用字段
  description: string;         // 步骤描述
  phase: string;               // 当前阶段
  
  // 指针/索引
  left?: number;
  right?: number;
  currentIndex?: number;
  
  // 数据状态
  water: number[];             // 各位置水量
  totalWater: number;          // 总水量
  
  // 辅助数据结构状态
  stack?: number[];            // 单调栈
  leftMax?: number[];          // 左侧最大值数组
  rightMax?: number[];         // 右侧最大值数组
  
  // 代码同步
  codeLine?: number;           // 对应代码行
  variables?: VariableState[]; // 变量状态
  
  // 可视化提示
  highlightBars?: number[];    // 高亮的柱子索引
  arrows?: Arrow[];            // 数据流箭头
  annotations?: Annotation[];  // 标注
}

interface Arrow {
  from: { x: number; y: number };
  to: { x: number; y: number };
  label: string;
  color?: string;
}

interface Annotation {
  position: { x: number; y: number };
  text: string;
  type: 'info' | 'warning' | 'success';
}
```

### 7. WeChatFloat Component

微信交流群悬浮球组件。

```typescript
interface WeChatFloatProps {
  qrCodeUrl: string;           // 二维码图片 URL
  instructions: string;        // 使用说明
}
```

## Data Models

### Animation Step Generation

每个算法需要实现步骤生成 Hook：

```typescript
interface UseAnimationStepsResult {
  steps: AnimationStep[];
  currentStep: AnimationStep | null;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  progress: number;
  
  // 控制方法
  nextStep: () => void;
  prevStep: () => void;
  togglePlay: () => void;
  reset: () => void;
  setProgress: (progress: number) => void;
}

function useAnimationSteps(config: {
  heights: number[];
  speed: number;
  generateSteps: (heights: number[]) => AnimationStep[];
}): UseAnimationStepsResult;
```

### IndexedDB Schema

```typescript
// 数据库名称: 'leetcode-visualizer-db'
// 版本: 1

interface DatabaseSchema {
  stores: {
    'github-stars': {
      keyPath: 'key';
      indexes: [];
      value: StarCache;
    };
    'settings': {
      keyPath: 'key';
      indexes: [];
      value: any;
    };
  };
}
```

### Input Validation

```typescript
interface ValidationRules {
  minLength: 1;
  maxLength: 200;
  minValue: 0;
  maxValue: 10000;
  allowedPattern: /^\d+(,\d+)*$/;
}

function validateHeights(input: string): ValidationResult {
  // 1. 检查格式（逗号分隔的数字）
  // 2. 解析为数组
  // 3. 检查长度范围
  // 4. 检查每个值的范围
  // 5. 返回验证结果
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Cache Consistency

*For any* GitHub star count fetch operation, if the cache is valid (not expired), the system should return the cached value without making an API request; if the cache is invalid or missing, the system should fetch from API and update the cache with a 1-hour expiration.

**Validates: Requirements 2.5, 2.8**

### Property 2: Valid Input Acceptance

*For any* string input that matches the pattern of comma-separated non-negative integers within valid ranges (0-10000) and valid array length (1-200), the system should accept the input and update the heights array accordingly.

**Validates: Requirements 3.2**

### Property 3: Invalid Input Rejection

*For any* string input that does not match the valid input pattern (contains non-numeric characters, negative numbers, values exceeding 10000, or array length exceeding 200), the system should reject the input and display an appropriate error message.

**Validates: Requirements 3.3**

### Property 4: Random Generation Validity

*For any* invocation of the random data generation function, the output should always be a valid heights array where all values are non-negative integers between 0-10000 and the array length is between 1-200.

**Validates: Requirements 3.6, 3.7**

### Property 5: Code Line Highlighting Synchronization

*For any* animation step, the highlighted line in the code display should correspond to the logical operation being performed in that step, as defined by the step's `codeLine` property.

**Validates: Requirements 4.3**

### Property 6: Variable Display Synchronization

*For any* animation step with variable states, the displayed variable values should match the actual algorithm state at that step, positioned at the correct line numbers.

**Validates: Requirements 4.4**

### Property 7: Element Highlighting Consistency

*For any* animation step, the elements marked in `highlightBars` should be visually distinguished with distinct colors from non-highlighted elements.

**Validates: Requirements 5.3**

### Property 8: Data Flow Arrow Accuracy

*For any* animation step where values change between elements, the system should display arrows with labels accurately describing the data transfer (source, destination, and value).

**Validates: Requirements 5.5**

### Property 9: No Element Overlap

*For any* canvas rendering with multiple elements (bars, labels, annotations, data structures), no two elements should have overlapping bounding boxes that obscure content.

**Validates: Requirements 5.7**

### Property 10: Auto-Scaling Correctness

*For any* heights array input, the canvas should scale such that all elements are visible within the viewport without requiring scrolling.

**Validates: Requirements 5.8**

### Property 11: Speed Persistence Round-Trip

*For any* playback speed value set by the user, saving to IndexedDB and then loading should return the exact same value.

**Validates: Requirements 6.9, 6.10**

### Property 12: No Purple Colors

*For any* color value used in the application's CSS or inline styles, the color should not be any shade of purple (hue values between 270-330 degrees in HSL color space).

**Validates: Requirements 8.3**

## Error Handling

### API Errors

```typescript
async function fetchGitHubStars(owner: string, repo: string): Promise<number> {
  try {
    // 1. 检查缓存
    const cached = await getFromIndexedDB('github-stars', `${owner}/${repo}`);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.count;
    }
    
    // 2. 调用 API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    const count = data.stargazers_count;
    
    // 3. 更新缓存
    await saveToIndexedDB('github-stars', `${owner}/${repo}`, {
      count,
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600000 // 1 hour
    });
    
    return count;
  } catch (error) {
    // 4. 失败时返回缓存或默认值
    const cached = await getFromIndexedDB('github-stars', `${owner}/${repo}`);
    return cached?.count ?? 0;
  }
}
```

### Input Validation Errors

```typescript
function validateHeights(input: string): ValidationResult {
  // 空输入
  if (!input.trim()) {
    return { isValid: false, error: '请输入高度数据' };
  }
  
  // 格式检查
  if (!/^[\d,\s]+$/.test(input)) {
    return { isValid: false, error: '输入只能包含数字和逗号' };
  }
  
  // 解析
  const heights = input.split(',').map(s => parseInt(s.trim(), 10));
  
  // 检查 NaN
  if (heights.some(isNaN)) {
    return { isValid: false, error: '包含无效数字' };
  }
  
  // 长度检查
  if (heights.length < 1 || heights.length > 200) {
    return { isValid: false, error: '数组长度必须在 1-200 之间' };
  }
  
  // 值范围检查
  if (heights.some(h => h < 0 || h > 10000)) {
    return { isValid: false, error: '每个值必须在 0-10000 之间' };
  }
  
  return { isValid: true, heights };
}
```

### IndexedDB Errors

```typescript
async function getFromIndexedDB<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const result = await store.get(key);
    return result ?? null;
  } catch (error) {
    console.error('IndexedDB read error:', error);
    return null;
  }
}

async function saveToIndexedDB<T>(storeName: string, key: string, value: T): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.put({ key, ...value });
  } catch (error) {
    console.error('IndexedDB write error:', error);
    // 静默失败，不影响用户体验
  }
}
```

## Testing Strategy

### Dual Testing Approach

本项目采用单元测试和属性测试相结合的方式：

1. **单元测试**: 验证具体示例和边界情况
2. **属性测试**: 验证通用属性在所有有效输入上成立

### Property-Based Testing Library

使用 **fast-check** 作为属性测试库。

```bash
npm install --save-dev fast-check
```

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── GitHubStars.test.ts
│   │   ├── HeightsInputControl.test.ts
│   │   ├── CodeDisplay.test.ts
│   │   └── AnimationControls.test.ts
│   └── property/
│       ├── inputValidation.property.test.ts
│       ├── randomGeneration.property.test.ts
│       ├── cacheConsistency.property.test.ts
│       ├── speedPersistence.property.test.ts
│       └── colorConstraints.property.test.ts
```

### Property Test Configuration

每个属性测试应运行至少 100 次迭代：

```typescript
import fc from 'fast-check';

// 配置
const propertyConfig = {
  numRuns: 100,
  verbose: true
};

// 示例：输入验证属性测试
describe('Input Validation Properties', () => {
  // **Feature: leetcode-algorithm-visualizer, Property 2: Valid Input Acceptance**
  it('should accept all valid height inputs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 10000 }), { minLength: 1, maxLength: 200 }),
        (heights) => {
          const input = heights.join(',');
          const result = validateHeights(input);
          return result.isValid === true;
        }
      ),
      propertyConfig
    );
  });
});
```

### Unit Test Examples

```typescript
describe('GitHubStars Component', () => {
  it('should display cached star count when cache is valid', async () => {
    // Setup: 预设有效缓存
    // Action: 渲染组件
    // Assert: 显示缓存的 star 数，未调用 API
  });
  
  it('should fetch from API when cache is expired', async () => {
    // Setup: 预设过期缓存
    // Action: 渲染组件
    // Assert: 调用 API，更新缓存
  });
  
  it('should display 0 when API fails and no cache exists', async () => {
    // Setup: 无缓存，API 返回错误
    // Action: 渲染组件
    // Assert: 显示 0
  });
});
```

### Integration Test Approach

使用 Playwright 进行端到端测试：

```typescript
test('animation controls keyboard shortcuts', async ({ page }) => {
  await page.goto('/');
  
  // 测试空格键播放/暂停
  await page.keyboard.press('Space');
  await expect(page.locator('.play-button')).toHaveAttribute('title', /暂停/);
  
  // 测试左右箭头键
  await page.keyboard.press('ArrowRight');
  // 验证步骤前进
  
  await page.keyboard.press('ArrowLeft');
  // 验证步骤后退
  
  // 测试 R 键重置
  await page.keyboard.press('r');
  // 验证重置到第一步
});
```
