# 质量门禁

本仓库当前基于 Create React App/Jest：

- `npm run lint`
- `npm run type-check`
- `npm run test:unit`
- `npm run test:coverage`
- `npm run test:e2e`
- `CI=true npm run build`

覆盖率执行范围目前是 CRA 默认的 `src/`，总体覆盖低于技能标准；新增功能应优先提高算法步骤、输入校验与视觉状态映射覆盖率。部署使用 `.github/workflows/deploy.yml` 的 GitHub Pages Actions。
