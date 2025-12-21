# Design Document

## Overview

本设计文档描述高级画布可视化系统的技术架构和实现方案。该系统是对现有 LeetCode 算法可视化网站的重大增强，专注于打造一个功能强大的交互式教学画布，能够清晰展示各种数据结构、数据流转、状态变更、递归调用等算法执行细节。

### 核心设计目标

1. **画布优先**: 画布占据页面主要空间（≥70%），最大化可视化区域
2. **丰富标注**: 通过文字标注、箭头指向清晰展示每一步的状态变化
3. **多语言代码绑定**: 动画帧与多种编程语言代码行精确映射
4. **智能布局**: 自动避免元素重叠，合理分布画布空间
5. **交互丰富**: 支持缩放、拖拽、时间轴导航等交互方式

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              App Container                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                         Header (Compact)                                 │ │
│ │  [GitHub] [Title: 42. 接雨水] [Input Controls] [Presets]                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────┬─────────────────┐ │
│ │                                                       │                 │ │
│ │                                                       │  Code Display   │ │
│ │                                                       │  ┌───────────┐  │ │
│ │                    Canvas Area (70%+)                 │  │ [Tabs]    │  │ │
│ │                                                       │  ├───────────┤  │ │
│ │  ┌─────────────────────────────────────────────────┐  │  │           │  │ │
│ │  │  Data Structure Visualization                   │  │  │  Code     │  │ │
│ │  │  - Arrays with indices                          │  │  │  + Line # │  │ │
│ │  │  - Trees with node labels                       │  │  │  + Vars   │  │ │
│ │  │  - Stacks/Queues                                │  │  │           │  │ │
│ │  │  - HashMaps (key-value)                         │  │  └───────────┘  │ │
│ │  └─────────────────────────────────────────────────┘  │                 │ │
│ │                                                       │  Variables      │ │
│ │  ┌─────────────────────────────────────────────────┐  │  Panel          │ │
│ │  │  Annotations & Arrows                           │  │  (Collapsible)  │ │
│ │  │  - State change labels                          │  │                 │ │
│ │  │  - Data flow arrows with text                   │  │                 │ │
│ │  │  - Comparison results                           │  │                 │ │
│ │  └─────────────────────────────────────────────────┘  │                 │ │
│ │                                                       │                 │ │
│ │  ┌─────────────────────────────────────────────────┐  │                 │ │
│ │  │  Execution Context (if recursive)               │  │                 │ │
│ │  │  - Stack frames                                 │  │                 │ │
│ │  │  - Call chain                                   │  │                 │ │
│ │  └─────────────────────────────────────────────────┘  │                 │ │
│ │                                                       │                 │ │
│ └───────────────────────────────────────────────────────┴─────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                         Animation Controls                               │ │
│ │  [◀][▶][⏸][↺]  Speed:[====]  Frame: 15/120  [Timeline ════════════════] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```


### 技术栈

- **React 19**: UI 框架
- **TypeScript**: 类型安全
- **D3.js 7**: 数据可视化和画布交互
- **IndexedDB**: 客户端持久化存储
- **fast-check**: 属性测试库

## Components and Interfaces

### 1. InteractiveCanvas Component

核心画布组件，负责所有可视化渲染和交互。

```typescript
interface InteractiveCanvasProps {
  width: number;
  height: number;
  elements: CanvasElement[];
  annotations: Annotation[];
  arrows: DataFlowArrow[];
  executionContext?: ExecutionContext;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
}

interface CanvasTransform {
  scale: number;      // 当前缩放比例
  translateX: number; // X 轴平移
  translateY: number; // Y 轴平移
}

interface CanvasElement {
  id: string;
  type: 'node' | 'array-cell' | 'stack-item' | 'hashmap-entry' | 'edge';
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
  highlighted?: boolean;
  highlightColor?: string;
}
```

### 2. Data Structure Renderers

各种数据结构的渲染器接口。

```typescript
// 二叉树渲染
interface BinaryTreeRenderer {
  render(root: TreeNode, container: SVGGElement): void;
  getNodePosition(nodeId: string): { x: number; y: number };
  highlightNode(nodeId: string, color: string): void;
  addNodeAnnotation(nodeId: string, text: string, position: 'top' | 'left' | 'right'): void;
}

interface TreeNode {
  id: string;
  value: any;
  left?: TreeNode;
  right?: TreeNode;
  annotations?: string[];
}

// 数组渲染
interface ArrayRenderer {
  render(array: ArrayElement[], container: SVGGElement): void;
  highlightCell(index: number, color: string): void;
  addCellAnnotation(index: number, text: string): void;
}

interface ArrayElement {
  index: number;
  value: any;
  highlighted?: boolean;
  annotation?: string;
}

// HashMap 渲染
interface HashMapRenderer {
  render(entries: HashMapEntry[], container: SVGGElement): void;
  highlightEntry(key: string, color: string): void;
}

interface HashMapEntry {
  key: string;
  value: any;
  highlighted?: boolean;
}

// 栈渲染
interface StackRenderer {
  render(items: StackItem[], container: SVGGElement): void;
  animatePush(item: StackItem): void;
  animatePop(): void;
}

interface StackItem {
  id: string;
  value: any;
  highlighted?: boolean;
}
```

### 3. Annotation System

标注系统接口。

```typescript
interface Annotation {
  id: string;
  targetElementId: string;
  text: string;
  type: 'state-change' | 'comparison' | 'assignment' | 'info';
  position: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
  style?: AnnotationStyle;
}

interface AnnotationStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: number;
}

interface AnnotationManager {
  addAnnotation(annotation: Annotation): void;
  removeAnnotation(id: string): void;
  clearAnnotations(): void;
  repositionToAvoidOverlap(): void;
  getAnnotationsForElement(elementId: string): Annotation[];
}
```

### 4. Data Flow Arrow System

数据流箭头系统。

```typescript
interface DataFlowArrow {
  id: string;
  from: ArrowEndpoint;
  to: ArrowEndpoint;
  label: string;
  type: 'value-transfer' | 'parameter' | 'return-value' | 'assignment';
  style?: ArrowStyle;
  animated?: boolean;
}

interface ArrowEndpoint {
  elementId: string;
  anchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface ArrowStyle {
  color?: string;
  strokeWidth?: number;
  dashArray?: string;
  curved?: boolean;
}

interface ArrowManager {
  addArrow(arrow: DataFlowArrow): void;
  removeArrow(id: string): void;
  clearArrows(): void;
  calculatePaths(): void; // 计算路径避免交叉
  offsetOverlappingArrows(): void;
}
```


### 5. Execution Context Display

递归和执行上下文显示。

```typescript
interface ExecutionContext {
  stackFrames: StackFrame[];
  currentDepth: number;
  callChain: string[];
}

interface StackFrame {
  id: string;
  functionName: string;
  parameters: { name: string; value: any }[];
  localVariables: { name: string; value: any }[];
  returnValue?: any;
  isActive: boolean;
}

interface ExecutionContextRenderer {
  render(context: ExecutionContext, container: SVGGElement): void;
  pushFrame(frame: StackFrame): void;
  popFrame(): void;
  highlightCurrentFrame(): void;
  showCallChain(): void;
}
```

### 6. Animation Frame System

动画帧与代码绑定系统。

```typescript
type Language = 'java' | 'python' | 'golang' | 'javascript';

interface AnimationFrame {
  id: string;
  frameNumber: number;
  description: string;
  
  // 多语言代码行绑定
  codeLineBindings: CodeLineBinding;
  
  // 画布状态
  canvasState: CanvasState;
  
  // 变量状态
  variables: VariableState[];
  
  // 标注
  annotations: Annotation[];
  
  // 数据流箭头
  arrows: DataFlowArrow[];
  
  // 执行上下文（递归时）
  executionContext?: ExecutionContext;
}

// 代码行绑定映射表
interface CodeLineBinding {
  // 帧 ID 到各语言行号的映射
  java: number[];      // 可能是多行
  python: number[];
  golang: number[];
  javascript: number[];
}

interface CanvasState {
  elements: CanvasElement[];
  highlightedElements: string[];
  transform: CanvasTransform;
}

interface VariableState {
  name: string;
  value: any;
  type: string;
  changed: boolean;  // 本帧是否变化
  referencedInStep: boolean; // 本步骤是否被引用
}

// 帧生成器接口
interface FrameGenerator {
  generateFrames(input: any): AnimationFrame[];
  getFrameCount(): number;
  getFrame(index: number): AnimationFrame;
}
```

### 7. Layout Engine

智能布局引擎，避免元素重叠。

```typescript
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutEngine {
  // 计算元素位置
  calculateLayout(elements: CanvasElement[]): Map<string, { x: number; y: number }>;
  
  // 检测重叠
  detectOverlaps(boxes: BoundingBox[]): OverlapResult[];
  
  // 解决重叠
  resolveOverlaps(elements: CanvasElement[]): CanvasElement[];
  
  // 获取元素边界框
  getBoundingBox(element: CanvasElement): BoundingBox;
  
  // 检查两个边界框是否相交
  boxesIntersect(a: BoundingBox, b: BoundingBox): boolean;
}

interface OverlapResult {
  element1Id: string;
  element2Id: string;
  overlapArea: number;
}

// 布局算法配置
interface LayoutConfig {
  minSpacing: number;        // 最小间距
  preferredSpacing: number;  // 首选间距
  canvasMargin: number;      // 画布边距
  spreadFactor: number;      // 分散系数
}
```

### 8. Timeline Navigation

时间轴导航组件。

```typescript
interface TimelineProps {
  totalFrames: number;
  currentFrame: number;
  onFrameSelect: (frame: number) => void;
  onHover: (frame: number) => void;
  isPlaying: boolean;
}

interface TimelineMarker {
  frameNumber: number;
  state: 'past' | 'current' | 'future';
  previewData?: FramePreview;
}

interface FramePreview {
  description: string;
  thumbnail?: string;
}
```

### 9. Variables Panel

变量面板组件。

```typescript
interface VariablesPanelProps {
  variables: VariableState[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  maxHeight: number;
}

interface ExpandableVariable {
  name: string;
  value: any;
  expanded: boolean;
  children?: ExpandableVariable[];
}
```

### 10. Export/Share System

导出分享系统。

```typescript
interface ExportState {
  inputData: any;
  currentFrame: number;
  canvasTransform: CanvasTransform;
  selectedLanguage: Language;
  playbackSpeed: number;
}

interface ExportManager {
  // 生成分享 URL
  generateShareUrl(state: ExportState): string;
  
  // 从 URL 恢复状态
  restoreFromUrl(url: string): ExportState;
  
  // 编码状态
  encodeState(state: ExportState): string;
  
  // 解码状态
  decodeState(encoded: string): ExportState;
  
  // 导出为图片
  exportAsImage(canvas: SVGElement): Promise<Blob>;
  
  // 复制到剪贴板
  copyToClipboard(text: string): Promise<void>;
}
```


## Data Models

### Canvas Element Types

```typescript
// 所有画布元素的联合类型
type CanvasElementType = 
  | ArrayCellElement
  | TreeNodeElement
  | StackItemElement
  | HashMapEntryElement
  | EdgeElement
  | PointerElement;

interface ArrayCellElement {
  type: 'array-cell';
  index: number;
  value: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface TreeNodeElement {
  type: 'tree-node';
  nodeId: string;
  value: any;
  parentId?: string;
  leftChildId?: string;
  rightChildId?: string;
  position: { x: number; y: number };
  radius: number;
}

interface StackItemElement {
  type: 'stack-item';
  stackId: string;
  index: number;  // 0 = bottom
  value: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface HashMapEntryElement {
  type: 'hashmap-entry';
  mapId: string;
  key: string;
  value: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface EdgeElement {
  type: 'edge';
  fromId: string;
  toId: string;
  directed: boolean;
  label?: string;
}

interface PointerElement {
  type: 'pointer';
  name: string;
  targetId: string;
  position: { x: number; y: number };
}
```

### Frame Generation Pipeline

```typescript
// 帧生成管道
interface FrameGenerationPipeline {
  // 1. 解析算法输入
  parseInput(input: any): ParsedInput;
  
  // 2. 执行算法并记录步骤
  executeWithTracing(input: ParsedInput): ExecutionTrace[];
  
  // 3. 将执行轨迹转换为动画帧
  traceToFrames(traces: ExecutionTrace[]): AnimationFrame[];
  
  // 4. 绑定代码行
  bindCodeLines(frames: AnimationFrame[], codes: Record<Language, string>): AnimationFrame[];
  
  // 5. 计算布局
  calculateLayout(frames: AnimationFrame[]): AnimationFrame[];
}

interface ExecutionTrace {
  operation: string;
  description: string;
  stateSnapshot: any;
  codeLocation: {
    java: number[];
    python: number[];
    golang: number[];
    javascript: number[];
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Canvas Space Allocation

*For any* viewport dimensions, the canvas element should occupy at least 70% of the total viewport area.

**Validates: Requirements 1.1, 1.4**

### Property 2: Pan Transform Correctness

*For any* drag operation on the canvas with delta (dx, dy), the canvas transform should change by exactly (dx, dy) in translation.

**Validates: Requirements 2.1**

### Property 3: Zoom Transform Correctness

*For any* zoom operation centered at point (cx, cy), the point under the cursor should remain at the same screen position after zooming.

**Validates: Requirements 2.2, 2.3**

### Property 4: Data Structure Rendering Completeness

*For any* data structure (binary tree, array, HashMap, stack, graph), all elements in the data structure should have corresponding visual representations on the canvas.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 5: Node Value Display

*For any* element with a value, the rendered canvas should contain text displaying that value.

**Validates: Requirements 4.1**

### Property 6: Annotation Creation on State Change

*For any* state change, comparison, or assignment operation in an animation frame, there should be a corresponding annotation created with descriptive text.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 7: Annotation Non-Overlap

*For any* set of annotations on the canvas, no two annotation bounding boxes should intersect.

**Validates: Requirements 4.5, 4.6**

### Property 8: Data Flow Arrow Completeness

*For any* value transfer, parameter passing, or return value in an animation frame, there should be a corresponding arrow with a label describing the transfer.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**

### Property 9: Stack Frame Consistency

*For any* recursive execution, the displayed stack frames should match the actual call stack, with correct function names, parameters, and local variables.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 10: Code Line Binding Consistency

*For any* animation frame, the code line binding should contain valid line numbers for all supported languages, and the highlighted lines should match the binding.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 11: Frame Granularity

*For any* sequence of consecutive animation frames, each frame should represent exactly one logical operation, with no skipped intermediate states.

**Validates: Requirements 7.1, 7.5**

### Property 12: No Element Overlap

*For any* canvas rendering, no two element bounding boxes (including labels and annotations) should intersect in a way that obscures content.

**Validates: Requirements 8.1, 8.3, 8.4**

### Property 13: Auto-fit Completeness

*For any* data input, after auto-fit, all elements should be visible within the viewport, and element sizes should be above the minimum readable threshold.

**Validates: Requirements 9.1, 9.3, 9.4**

### Property 14: Manual Zoom Preservation

*For any* manual zoom operation by the user, the system should not auto-scale until the user explicitly resets the view.

**Validates: Requirements 9.5**

### Property 15: Timeline Marker Consistency

*For any* animation with N frames, the timeline should display exactly N markers, and clicking marker i should navigate to frame i.

**Validates: Requirements 10.1, 10.2, 10.3, 10.5, 10.6**

### Property 16: Variable Panel Completeness

*For any* animation frame with variables, all variables should be displayed in the panel, and changed variables should be visually highlighted.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### Property 17: Export/Import Round-Trip

*For any* application state, exporting to URL and then importing from that URL should restore the exact same state (input data, current frame, view settings).

**Validates: Requirements 12.1, 12.2, 12.3, 12.5**

### Property 18: Image Export Validity

*For any* canvas state, exporting as image should produce valid PNG data that can be decoded as an image.

**Validates: Requirements 12.6**


## Error Handling

### Layout Errors

```typescript
// 当布局算法无法完全消除重叠时
function handleLayoutFailure(elements: CanvasElement[]): CanvasElement[] {
  // 1. 尝试增加画布尺寸
  // 2. 尝试减小元素尺寸
  // 3. 如果仍然失败，记录警告并返回最佳努力结果
  console.warn('Layout could not fully resolve overlaps');
  return bestEffortLayout(elements);
}
```

### Export/Import Errors

```typescript
// URL 解码失败
function handleImportError(error: Error): void {
  console.error('Failed to restore state from URL:', error);
  // 显示用户友好的错误消息
  showNotification('无法恢复分享的状态，将使用默认设置');
  // 使用默认状态
  resetToDefaultState();
}

// URL 过长处理
function handleLongUrl(state: ExportState): string {
  const encoded = encodeState(state);
  if (encoded.length > MAX_URL_LENGTH) {
    // 使用压缩编码
    return compressAndEncode(state);
  }
  return encoded;
}
```

### Canvas Interaction Errors

```typescript
// 缩放边界处理
function clampZoom(scale: number): number {
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 10;
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
}

// 平移边界处理
function clampPan(translate: { x: number; y: number }, bounds: BoundingBox): { x: number; y: number } {
  return {
    x: Math.max(bounds.x, Math.min(bounds.x + bounds.width, translate.x)),
    y: Math.max(bounds.y, Math.min(bounds.y + bounds.height, translate.y))
  };
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
│   │   ├── InteractiveCanvas.test.ts
│   │   ├── LayoutEngine.test.ts
│   │   ├── AnnotationManager.test.ts
│   │   ├── ArrowManager.test.ts
│   │   └── ExportManager.test.ts
│   └── property/
│       ├── canvasSpace.property.test.ts
│       ├── transform.property.test.ts
│       ├── dataStructureRendering.property.test.ts
│       ├── annotationOverlap.property.test.ts
│       ├── elementOverlap.property.test.ts
│       ├── codeLineBinding.property.test.ts
│       ├── frameGranularity.property.test.ts
│       ├── autoFit.property.test.ts
│       ├── timeline.property.test.ts
│       └── exportImport.property.test.ts
```

### Property Test Configuration

每个属性测试应运行至少 100 次迭代：

```typescript
import fc from 'fast-check';

const propertyConfig = {
  numRuns: 100,
  verbose: true
};

// 示例：元素重叠属性测试
describe('Element Overlap Properties', () => {
  // **Feature: advanced-canvas-visualization, Property 12: No Element Overlap**
  it('should not have overlapping element bounding boxes', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryCanvasElement(), { minLength: 2, maxLength: 50 }),
        (elements) => {
          const layoutEngine = new LayoutEngine();
          const positioned = layoutEngine.resolveOverlaps(elements);
          const boxes = positioned.map(e => layoutEngine.getBoundingBox(e));
          
          // 检查任意两个边界框不相交
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              if (layoutEngine.boxesIntersect(boxes[i], boxes[j])) {
                return false;
              }
            }
          }
          return true;
        }
      ),
      propertyConfig
    );
  });
});

// 示例：导出/导入往返属性测试
describe('Export/Import Properties', () => {
  // **Feature: advanced-canvas-visualization, Property 17: Export/Import Round-Trip**
  it('should restore exact state after export and import', () => {
    fc.assert(
      fc.property(
        arbitraryExportState(),
        (state) => {
          const exportManager = new ExportManager();
          const url = exportManager.generateShareUrl(state);
          const restored = exportManager.restoreFromUrl(url);
          
          return (
            JSON.stringify(restored.inputData) === JSON.stringify(state.inputData) &&
            restored.currentFrame === state.currentFrame &&
            restored.canvasTransform.scale === state.canvasTransform.scale &&
            restored.selectedLanguage === state.selectedLanguage
          );
        }
      ),
      propertyConfig
    );
  });
});
```

### Unit Test Examples

```typescript
describe('LayoutEngine', () => {
  it('should detect overlapping bounding boxes', () => {
    const engine = new LayoutEngine();
    const box1 = { x: 0, y: 0, width: 100, height: 100 };
    const box2 = { x: 50, y: 50, width: 100, height: 100 };
    
    expect(engine.boxesIntersect(box1, box2)).toBe(true);
  });
  
  it('should not detect overlap for non-intersecting boxes', () => {
    const engine = new LayoutEngine();
    const box1 = { x: 0, y: 0, width: 100, height: 100 };
    const box2 = { x: 200, y: 200, width: 100, height: 100 };
    
    expect(engine.boxesIntersect(box1, box2)).toBe(false);
  });
});

describe('CodeLineBinding', () => {
  it('should map frame to correct lines in all languages', () => {
    const frame: AnimationFrame = {
      id: 'frame-1',
      frameNumber: 1,
      description: 'Initialize left pointer',
      codeLineBindings: {
        java: [3],
        python: [2],
        golang: [4],
        javascript: [3]
      },
      // ... other fields
    };
    
    expect(frame.codeLineBindings.java).toContain(3);
    expect(frame.codeLineBindings.python).toContain(2);
  });
});
```

### Integration Test Approach

使用 Playwright 进行端到端测试：

```typescript
test('canvas pan and zoom interactions', async ({ page }) => {
  await page.goto('/');
  
  // 测试拖拽平移
  const canvas = page.locator('.interactive-canvas');
  await canvas.dragTo(canvas, {
    sourcePosition: { x: 200, y: 200 },
    targetPosition: { x: 300, y: 300 }
  });
  
  // 验证画布已平移
  const transform = await canvas.evaluate(el => el.style.transform);
  expect(transform).toContain('translate');
  
  // 测试滚轮缩放
  await canvas.hover();
  await page.mouse.wheel(0, -100);
  
  // 验证画布已缩放
  const newTransform = await canvas.evaluate(el => el.style.transform);
  expect(newTransform).toContain('scale');
});

test('timeline navigation', async ({ page }) => {
  await page.goto('/');
  
  // 点击时间轴上的标记
  await page.click('.timeline-marker:nth-child(5)');
  
  // 验证当前帧已更新
  const frameIndicator = page.locator('.frame-indicator');
  await expect(frameIndicator).toContainText('5/');
});
```
