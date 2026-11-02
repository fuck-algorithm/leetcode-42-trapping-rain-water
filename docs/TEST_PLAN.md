# 测试计划（迭代轮次 2）

- 算法步骤与因果 narration：`src/algorithms/twoPointers/useTwoPointersSteps.test.tsx`
- 代码面板行映射/变量 watch：`TwoPointersCodePanel.test.tsx`
- SVG 教学徽标、解说、柱 hover：`TwoPointersVisualizer.test.tsx`
- 可访问数据表/索引摘要：`RainwaterVisualChecks.test.tsx`
- 全量单测：`NODE_OPTIONS=--max-old-space-size=8192 npm run test:unit -- --silent`
- 覆盖率：`npm run test:coverage -- --silent`，目前全仓仍不达门槛。
- E2E：`npm run test:e2e`，15 项覆盖双视口空间预算、步骤语义、平移/缩放、数据表读数。
- 工程：`npm run lint`、`npm run type-check`、`CI=true npm run build`。
- 动效证据：`docs/evidence/round-2/`。
