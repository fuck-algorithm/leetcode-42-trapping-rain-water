# 动画规格：LeetCode 42 接雨水双指针法（Round 2）

## 画布优先空间分配

- 1366×768 实测：顶部/输入/页签/控制合计占 15.1%；SVG 532px（69.3%）；画布 1038px、代码列 328px，单屏无滚动。
- 1920×1080 的 E2E-001 视口检查覆盖画布/绘图区比例门槛。
- 工作区：主画布 + `clamp(320px,24vw,380px)` 代码侧栏；代码侧栏内语言、变量、折叠式辅助数据表。

## 可观察状态与稳定身份

- 主结构：高度柱 `bar-{index}`、蓄水块 `water-{index}`，固定索引轴与比例尺。
- 指针：`pointer-left` / `pointer-right`；辅助水位线：`left-max` / `right-max`；所有图元按稳定 ID keyed join。
- 每帧操作：初始化 `init`、两端比较 `compare`、水量加入 `fill`、最高墙更新 `update`、完成 `done`；每步提供因果说明和锚点 ID。
- 固定状态图例：当前/比较/已处理/完成；焦点最多一个 current，compare 最多两个；完成帧全柱转 done。
- 步骤预算：示例一 24 帧（初始化、比较/处理循环、完成），单步表达一次决策或一次处理。

## 教学解说

解说模板为“动作 + 对象 + 因为/所以”。比较步骤解释较矮侧的水量确定性；填水步骤显示当前索引、高度、水量、累计量；更新最大墙时说明新柱高覆盖旧墙。

## 动效

- MOTION token 仍由 `src/algorithms/twoPointers/motion.ts` 提供，动画时长最多占播放停留 45%；reduced-motion 时长归零。
- 状态类、数据标注和图例在 reduced-motion 下完整保留。
- D3 按稳定 key 更新并在步骤跳转时 interrupt 命名过渡。
- 视口支持指针拖拽平移与滚轮缩放；摄像机变换存放在 ref，步骤重画保留用户视口。
- 单调栈弹出底部导致栈空时添加明确说明帧：此柱没有左墙，不能组成可计算的凹槽。
- 双指针空输入使用单独的安全终态，不读取端点；四种解法的行号映射按各语言实际代码行核对，暴力/按行法现已提供行绑定。按行扫描的未闭合水格仅视作候选，遇到第二堵墙才计入答案。

## 可访问性与辅助阅读

- 四语言代码面板默认 Java、偏好持久化；代码行高亮跟随代码映射，显示关键变量旁注。
- 柱形具备键盘焦点与 aria-label；hover/focus 显示索引、柱高与蓄水 tooltip。
- 辅助表格提供全部位置的高度和水量，索引带作为可见摘要，不依赖颜色或 tooltip 才能读数。
- 截图证据：`docs/evidence/round-2/initial-reduced-motion.png`、`compare-step.png`、`process-step.png`；1x 连续步骤 trace：`step-transition-trace.zip`。

## Round 4：视觉层级与步骤叙述复查

- 柱体固定中性石板色；current/compare 通过不同描边粗细和颜色识别，水体保持独立蓝色系，避免“柱体是什么”随步骤改色。
- 每帧只显示当前焦点/比较端的柱高标签；边界水平线保留，但边界文字锚定画布两侧并上下错开，不再压在柱顶数值上。
- 双指针处理帧将“存水”与“刷新最高边界”分别用具体列号、边界值和累计量解释；零水量不再隐去“新边界”这一可观察变化。
- 本轮实测：1366×768 Chromium 首屏与示例积水截图为 `refined-initial.png`、`refined-water-filled.png`；按行法首屏为 `row-by-row-initial.png`。Playwright 全套 15/15 通过；步骤边界、行级快照单测通过。覆盖率 exit code 为 0，但当前 lines/functions/branches 仍低于项目目标，不得据此判定验收 PASS。
