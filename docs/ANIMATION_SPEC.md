# 动画规格：LeetCode 42 接雨水

## 布局与可观察状态

- 主结构：高度数组 `height[i]`，稳定 ID `bar-{i}`；蓄水层 `water-{i}`；辅助线 `left-max`、`right-max`；指针 `pointer-left`、`pointer-right`。
- 逻辑坐标由当前 SVG 宽高与 `scaleBand(index)` / `scaleLinear(height)` 推导，跨帧保持索引 ID 和比例尺规则稳定，不随机重排。
- 教学层包括操作徽标/步骤说明、总蓄水量与步数、固定图例（当前、比较、已处理、完成）。

## 步骤规划

每个快照含 `operation`、`narration`、`anchorIds` 和绑定代码行。阶段映射：`init → init`、`compare → compare`、左右处理 → `move`、最终状态 → `done`。水量、指针及左右最大值均由预生成快照提供。

| 阶段 | 焦点 | 状态/变化 | 锚点 | 解说意图 |
|---|---|---|---|---|
| 初始化 | L/R 两端 | 初始端点 current | array-0 / step-0 | 记录边界，确定扫描范围 |
| 比较 | L/R 两柱 | 两端 compare | 当前数组索引 | 比较两侧高度，决定安全处理侧 |
| 移动与计算 | 单侧当前柱 | 左右指针向内、已处理区 visited | 当前数组索引 | 较矮端决定水位，累加水量或更新最大值 |
| 完成 | 全数组 | 节点 done，汇总结果 | 完成锚点 | 汇总并展示总水量 |

## 动效与无障碍

- 时间 token 位于 `src/algorithms/twoPointers/motion.ts`：更新时长不超过播放停留时间的 45%；跳步中断同名过渡后从当前 DOM 状态更新。
- D3 保留分层 `.layer-grid/.layer-water/.layer-bars/.layer-guides/.layer-pointers/.layer-labels`，柱、水、指针按稳定 ID keyed join；退场使用淡出 transition 后移除。
- `prefers-reduced-motion: reduce` 下 JS 动效时长为 0，CSS transition/animation 关闭；快照、指标与解说保持更新。
- 状态不仅依赖颜色：指针字母、图例文本、柱高与水层共同表达状态。

## 验收记录

目前仅确认构建及 motion 单测；Playwright 15 项、覆盖率、录屏/视口测量尚未建立或执行，详见 `ACCEPTANCE_REPORT_TEMPLATE.md`，不得据此判定整体 PASS。
