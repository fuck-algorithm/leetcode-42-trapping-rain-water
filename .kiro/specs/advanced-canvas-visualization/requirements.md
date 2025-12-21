# Requirements Document

## Introduction

本项目是对现有 LeetCode 算法可视化演示网站的重大增强，专注于提升画布可视化能力。核心目标是将画布打造成一个功能强大的交互式教学工具，能够清晰展示各种数据结构（树、图、数组、HashMap等）、数据流转、状态变更、递归调用等算法执行细节。通过丰富的标注系统、箭头指向、文字说明，帮助用户深入理解算法的每一个执行步骤。

## Glossary

- **Canvas（画布）**: 使用 D3.js 渲染的 SVG 区域，支持缩放、拖拽，用于绘制数据结构和动画
- **Annotation（标注）**: 在节点、边、元素上方或旁边显示的文字说明
- **Data Flow Arrow（数据流箭头）**: 表示数值从一个位置传递到另一个位置的带标签箭头
- **State Transition（状态转移）**: 变量或数据结构状态的变更过程
- **Animation Frame（动画帧/分镜）**: 算法执行过程中的一个离散步骤，与代码行绑定
- **Code Line Binding（代码行绑定）**: 动画帧与多种编程语言代码行的映射关系
- **Execution Context（执行上下文）**: 包含栈帧、递归深度、调用链等运行时信息
- **Binary Tree Node（二叉树节点）**: 树形数据结构中的节点元素
- **HashMap Visualization（HashMap可视化）**: 键值对数据结构的图形化展示
- **Bounding Box（边界框）**: 元素在画布上占据的矩形区域

## Requirements

### Requirement 1: 画布空间分配

**User Story:** As a user, I want the canvas to occupy the majority of the screen space, so that I can focus on the algorithm visualization without distractions.

#### Acceptance Criteria

1. WHEN the page loads THEN the Canvas SHALL occupy at least 70% of the viewport area
2. WHEN the page renders THEN the Canvas SHALL be positioned as the primary visual element
3. WHEN other UI components render THEN the System SHALL minimize their footprint to maximize canvas space
4. WHEN the window resizes THEN the Canvas SHALL dynamically adjust to maintain the 70% minimum space allocation

### Requirement 2: 画布交互功能

**User Story:** As a user, I want to pan and zoom the canvas, so that I can explore large data structures and focus on specific areas.

#### Acceptance Criteria

1. WHEN a user drags on the canvas THEN the Canvas SHALL pan in the drag direction
2. WHEN a user scrolls the mouse wheel THEN the Canvas SHALL zoom in or out centered on the cursor position
3. WHEN a user pinches on a touch device THEN the Canvas SHALL zoom accordingly
4. WHEN the canvas is zoomed or panned THEN the Canvas SHALL maintain smooth 60fps animation
5. WHEN a user double-clicks on the canvas THEN the Canvas SHALL reset to the default view
6. WHEN displaying zoom controls THEN the Canvas SHALL show zoom level indicator and reset button

### Requirement 3: 数据结构绘制

**User Story:** As a user, I want to see various data structures rendered clearly on the canvas, so that I can understand the algorithm's data organization.

#### Acceptance Criteria

1. WHEN rendering a binary tree THEN the Canvas SHALL display nodes with clear parent-child connections
2. WHEN rendering an array THEN the Canvas SHALL display elements in a horizontal sequence with index labels
3. WHEN rendering a HashMap THEN the Canvas SHALL display key-value pairs with clear visual separation
4. WHEN rendering a stack THEN the Canvas SHALL display elements in a vertical arrangement showing top and bottom
5. WHEN rendering a graph THEN the Canvas SHALL display nodes and edges with directional indicators
6. WHEN rendering any data structure THEN the Canvas SHALL use consistent styling and spacing

### Requirement 4: 节点标注系统

**User Story:** As a user, I want to see text annotations on nodes and elements, so that I can understand the current state and values.

#### Acceptance Criteria

1. WHEN a node has a value THEN the Canvas SHALL display the value inside or beside the node
2. WHEN a state change occurs THEN the Canvas SHALL display an annotation above the affected element describing the change
3. WHEN a comparison operation occurs THEN the Canvas SHALL display the comparison expression and result
4. WHEN a variable is assigned THEN the Canvas SHALL display the assignment annotation near the target element
5. WHEN annotations are displayed THEN the Canvas SHALL position them to avoid overlapping with other elements
6. WHEN multiple annotations exist for one element THEN the Canvas SHALL stack them vertically with clear spacing

### Requirement 5: 数据流箭头

**User Story:** As a user, I want to see arrows indicating data flow between elements, so that I can trace value transfers and assignments.

#### Acceptance Criteria

1. WHEN a value transfers from one element to another THEN the Canvas SHALL draw an arrow from source to destination
2. WHEN drawing a data flow arrow THEN the Canvas SHALL display a label on the arrow describing the transfer
3. WHEN a return value is passed THEN the Canvas SHALL draw an arrow from callee to caller with the return value label
4. WHEN a parameter is passed THEN the Canvas SHALL draw an arrow from caller to callee with the parameter label
5. WHEN multiple arrows exist THEN the Canvas SHALL use curved paths to avoid crossing when possible
6. WHEN arrows would overlap THEN the Canvas SHALL offset them to maintain visibility

### Requirement 6: 递归与执行上下文

**User Story:** As a user, I want to see the recursion stack and execution context, so that I can understand the call hierarchy and current execution state.

#### Acceptance Criteria

1. WHEN a recursive call is made THEN the Canvas SHALL display a new stack frame in the execution context panel
2. WHEN a recursive call returns THEN the Canvas SHALL animate the stack frame removal
3. WHEN displaying stack frames THEN the Canvas SHALL show function name, parameters, and local variables
4. WHEN displaying recursion THEN the Canvas SHALL indicate the current recursion depth numerically
5. WHEN a function is entered THEN the Canvas SHALL highlight the corresponding node in the data structure
6. WHEN displaying the call chain THEN the Canvas SHALL show the sequence of function calls leading to current state

### Requirement 7: 动画分镜与代码绑定

**User Story:** As a user, I want detailed animation frames bound to specific code lines, so that I can correlate visual changes with code execution.

#### Acceptance Criteria

1. WHEN defining animation frames THEN the System SHALL create granular steps for each logical operation
2. WHEN an animation frame is active THEN the System SHALL highlight the corresponding code line in all supported languages
3. WHEN binding to multiple languages THEN the System SHALL maintain a mapping table from frame ID to language-specific line numbers
4. WHEN a single operation spans multiple code lines THEN the System SHALL highlight all relevant lines simultaneously
5. WHEN stepping through frames THEN the System SHALL never skip intermediate states
6. WHEN displaying frame information THEN the System SHALL show frame number, total frames, and operation description

### Requirement 8: 元素布局与防重叠

**User Story:** As a user, I want elements to be well-distributed on the canvas without overlapping, so that I can see all information clearly.

#### Acceptance Criteria

1. WHEN placing elements on the canvas THEN the System SHALL calculate positions to avoid bounding box overlaps
2. WHEN elements would overlap THEN the System SHALL redistribute them with adequate spacing
3. WHEN rendering labels and annotations THEN the System SHALL position them to not obscure other elements
4. WHEN the data structure is large THEN the System SHALL spread elements across the available canvas area
5. WHEN testing layout THEN the System SHALL verify no two element bounding boxes intersect
6. WHEN layout changes THEN the System SHALL animate element repositioning smoothly

### Requirement 9: 自适应视图

**User Story:** As a user, I want the canvas to automatically adjust the view for different data sizes, so that I can always see the complete visualization.

#### Acceptance Criteria

1. WHEN data is loaded THEN the Canvas SHALL calculate the optimal zoom level to fit all elements
2. WHEN elements exceed viewport bounds THEN the Canvas SHALL zoom out to include all elements
3. WHEN data is small THEN the Canvas SHALL zoom in to utilize available space effectively
4. WHEN auto-scaling THEN the Canvas SHALL maintain minimum readable element sizes
5. WHEN the user has manually zoomed THEN the System SHALL not auto-scale until reset
6. WHEN providing fit-to-view THEN the Canvas SHALL offer a button to trigger auto-fit

### Requirement 10: 时间轴导航

**User Story:** As a user, I want to navigate through animation history using a timeline, so that I can review past steps and preview future steps.

#### Acceptance Criteria

1. WHEN displaying the timeline THEN the System SHALL show all animation frames as navigable markers
2. WHEN a user clicks a timeline marker THEN the System SHALL jump to that specific frame
3. WHEN displaying the timeline THEN the System SHALL visually distinguish past, current, and future frames
4. WHEN hovering over a timeline marker THEN the System SHALL show a preview tooltip of that frame's state
5. WHEN the animation is playing THEN the System SHALL update the timeline indicator in real-time
6. WHEN the timeline has many frames THEN the System SHALL support scrolling or zooming the timeline view

### Requirement 11: 状态变量面板

**User Story:** As a user, I want to see all algorithm variables and their current values in a dedicated panel, so that I can track state changes throughout execution.

#### Acceptance Criteria

1. WHEN the algorithm uses variables THEN the System SHALL display them in a state variables panel
2. WHEN a variable value changes THEN the System SHALL highlight the change with animation
3. WHEN displaying complex data structures THEN the System SHALL render them with expandable views
4. WHEN a variable is referenced in the current step THEN the System SHALL highlight it in the panel
5. WHEN displaying the panel THEN the System SHALL minimize its size to preserve canvas space
6. WHEN the panel would obstruct the canvas THEN the System SHALL make it collapsible or movable

### Requirement 12: 导出与分享

**User Story:** As a user, I want to export or share specific animation states, so that I can save my learning progress or share with others.

#### Acceptance Criteria

1. WHEN a user clicks export THEN the System SHALL generate a shareable URL encoding the current state
2. WHEN a user loads a shared URL THEN the System SHALL restore the exact animation state
3. WHEN exporting THEN the System SHALL include input data, current frame, and view settings
4. WHEN sharing THEN the System SHALL provide copy-to-clipboard functionality
5. WHEN the URL is too long THEN the System SHALL use URL shortening or alternative encoding
6. WHEN exporting as image THEN the System SHALL capture the current canvas view as PNG

