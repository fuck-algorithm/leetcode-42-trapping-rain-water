# Requirements Document

## Introduction

本项目是一个 LeetCode 算法可视化演示网站，专门用于教学目的，帮助用户理解 LeetCode 42 题「接雨水」的多种解法。网站采用 TypeScript + React + D3.js 技术栈，提供分步骤的算法动画演示，支持多种编程语言的代码展示，并具有完整的交互控制功能。

## Glossary

- **Visualizer（可视化器）**: 负责将算法执行过程以动画形式展示的组件
- **Animation Step（动画步骤）**: 算法执行过程中的一个离散状态，包含当前变量值、高亮元素等信息
- **Canvas（画布）**: D3.js 渲染的 SVG 区域，用于绘制数据结构和动画
- **Code Display（代码展示）**: 显示算法源代码并支持语法高亮和执行行高亮的组件
- **Animation Controls（动画控制）**: 播放、暂停、步进等控制按钮的集合
- **Heights Array（高度数组）**: 表示地形高度的非负整数数组，是接雨水问题的输入数据
- **IndexedDB**: 浏览器内置的客户端数据库，用于持久化存储用户偏好设置
- **GitHub Stars**: GitHub 仓库的星标数量，表示项目受欢迎程度

## Requirements

### Requirement 1: 页面标题与导航

**User Story:** As a user, I want to see the problem title matching LeetCode format and navigate to the original problem, so that I can reference the problem description easily.

#### Acceptance Criteria

1. WHEN the page loads THEN the System SHALL display the title "42. 接雨水" at the top of the page
2. WHEN a user clicks on the title THEN the System SHALL open the LeetCode problem page (https://leetcode.cn/problems/trapping-rain-water/) in a new browser tab
3. WHEN the page renders THEN the System SHALL display a brief problem description below the title

### Requirement 2: GitHub 徽标与 Star 数展示

**User Story:** As a user, I want to see the GitHub repository link and star count, so that I can support the project and gauge its popularity.

#### Acceptance Criteria

1. WHEN the page loads THEN the System SHALL display a GitHub icon on the left side of the header
2. WHEN a user clicks the GitHub icon THEN the System SHALL open the project's GitHub repository in a new browser tab
3. WHEN a user hovers over the GitHub icon THEN the System SHALL display a tooltip saying "点击去 GitHub 仓库 Star 支持一下"
4. WHEN the page loads THEN the System SHALL fetch the repository star count from GitHub API
5. WHEN the GitHub API request succeeds THEN the System SHALL cache the star count in IndexedDB with a 1-hour expiration
6. WHEN the GitHub API request fails THEN the System SHALL display the cached star count from IndexedDB
7. WHEN no cached star count exists and the API fails THEN the System SHALL display 0 as the default star count
8. WHEN fetching star count THEN the System SHALL avoid duplicate requests within the 1-hour cache period

### Requirement 3: 数据输入控制

**User Story:** As a user, I want to input custom height data or select from presets, so that I can visualize the algorithm with different inputs.

#### Acceptance Criteria

1. WHEN the page loads THEN the System SHALL display a compact data input section below the title
2. WHEN a user types in the input field THEN the System SHALL accept comma-separated non-negative integers
3. WHEN a user submits invalid data THEN the System SHALL display an error message and reject the input
4. WHEN the page loads THEN the System SHALL display preset data samples as clickable buttons
5. WHEN a user clicks a preset button THEN the System SHALL populate the input with that preset data
6. WHEN a user clicks the random generate button THEN the System SHALL generate valid random height data
7. WHEN generating random data THEN the System SHALL ensure all values are non-negative integers within valid range (0-10000) and array length is between 1-200

### Requirement 4: 算法代码展示

**User Story:** As a user, I want to see the algorithm code in multiple languages with syntax highlighting and debug-like features, so that I can understand the implementation.

#### Acceptance Criteria

1. WHEN the page loads THEN the System SHALL display algorithm code with Java, Python, Golang, and JavaScript language options
2. WHEN a user selects a language tab THEN the System SHALL display the corresponding code with syntax highlighting
3. WHEN the animation progresses THEN the System SHALL highlight the currently executing line in the code
4. WHEN the animation is at a step THEN the System SHALL display variable values next to their declaration lines
5. WHEN displaying code THEN the System SHALL show line numbers for each line
6. WHEN displaying code THEN the System SHALL ensure proper indentation and alignment without horizontal scrollbars
7. WHEN displaying code THEN the System SHALL size the code container to fit content without vertical scrollbars when possible

### Requirement 5: 画布与可视化

**User Story:** As a user, I want to see the algorithm visualization on an interactive canvas, so that I can understand the algorithm execution visually.

#### Acceptance Criteria

1. WHEN the page loads THEN the System SHALL allocate the majority of screen space to the visualization canvas
2. WHEN displaying the canvas THEN the System SHALL support pan and zoom interactions
3. WHEN the animation progresses THEN the System SHALL highlight current elements with distinct colors
4. WHEN displaying data structures THEN the System SHALL show labels and annotations above or beside elements
5. WHEN values change THEN the System SHALL display arrows indicating data flow with text descriptions
6. WHEN the algorithm uses auxiliary data structures THEN the System SHALL render them separately with clear state changes
7. WHEN elements would overlap THEN the System SHALL distribute them across the canvas to avoid collision
8. WHEN the data size is large THEN the System SHALL auto-scale the view to fit all elements

### Requirement 6: 动画播放控制

**User Story:** As a user, I want to control the animation playback with buttons and keyboard shortcuts, so that I can learn at my own pace.

#### Acceptance Criteria

1. WHEN the control panel renders THEN the System SHALL display Previous, Next, Play/Pause, and Reset buttons
2. WHEN a user presses the Left Arrow key THEN the System SHALL go to the previous step
3. WHEN a user presses the Right Arrow key THEN the System SHALL go to the next step
4. WHEN a user presses the Space key THEN the System SHALL toggle play/pause state
5. WHEN a user presses the R key THEN the System SHALL reset the animation to the beginning
6. WHEN displaying buttons THEN the System SHALL show the keyboard shortcut text on each button
7. WHEN the page loads THEN the System SHALL set the default playback speed to 1x
8. WHEN a user adjusts the speed slider THEN the System SHALL update the playback speed accordingly
9. WHEN a user changes the playback speed THEN the System SHALL persist the setting to IndexedDB
10. WHEN the page loads THEN the System SHALL restore the previously saved playback speed from IndexedDB
11. WHEN the control panel renders THEN the System SHALL display a progress bar at the bottom spanning full width
12. WHEN a user drags the progress bar THEN the System SHALL seek to the corresponding animation step
13. WHEN displaying the progress bar THEN the System SHALL show played portion in green and unplayed portion in gray

### Requirement 7: 微信交流群悬浮球

**User Story:** As a user, I want to join a WeChat discussion group, so that I can discuss algorithms with other learners.

#### Acceptance Criteria

1. WHEN the page loads THEN the System SHALL display a floating button in the bottom-right corner with "交流群" text
2. WHEN a user hovers over the floating button THEN the System SHALL display the WeChat QR code image
3. WHEN displaying the QR code THEN the System SHALL maintain the original image aspect ratio
4. WHEN displaying the QR code THEN the System SHALL show instructions to scan and send "leetcode" to join

### Requirement 8: 页面布局与配色

**User Story:** As a user, I want a single-screen application with harmonious colors, so that I can focus on learning without distractions.

#### Acceptance Criteria

1. WHEN the page renders THEN the System SHALL fit all content within a single screen without page scrolling
2. WHEN applying colors THEN the System SHALL use a coordinated color palette throughout the application
3. WHEN applying colors THEN the System SHALL avoid using any shade of purple
4. WHEN laying out components THEN the System SHALL maintain compact spacing to maximize canvas area

### Requirement 9: 部署与 CI/CD

**User Story:** As a developer, I want automatic deployment to GitHub Pages, so that changes are published without manual intervention.

#### Acceptance Criteria

1. WHEN code is pushed to the repository THEN the GitHub Action SHALL build and deploy to GitHub Pages
2. WHEN building the project THEN the System SHALL verify no compilation errors exist
3. WHEN building the project THEN the System SHALL verify no linter errors exist

### Requirement 10: 服务端口配置

**User Story:** As a developer, I want the development server to use a non-default port, so that it does not conflict with other services.

#### Acceptance Criteria

1. WHEN starting the development server THEN the System SHALL use a random port between 30000-65535
2. WHEN the port is already in use THEN the System SHALL select a different available port

### Requirement 11: README 文档

**User Story:** As a visitor, I want a concise README, so that I can quickly understand what this project is about.

#### Acceptance Criteria

1. WHEN viewing the README THEN the System SHALL display the LeetCode problem number and title
2. WHEN viewing the README THEN the System SHALL provide a link to the deployed GitHub Pages site
3. WHEN viewing the README THEN the System SHALL avoid excessive documentation content
