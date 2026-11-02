# 质量门禁

本仓库现有命令：

- `npm run lint`
- `npm run type-check`
- `npm run test:unit`
- `npm run test:coverage`
- `npm run test:e2e`
- `CI=true npm run build`

现有 CRA 全项目 coverage 经本轮实测仍低于技能阈值；具体 lines/branches/functions 记录在验收报告。运行 `npm ci` 需本地/CI npm 配置 legacy peer deps（React Scripts 5 与 TS5 peer 范围冲突）。
