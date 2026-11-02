# 测试计划

- 单元/属性测试：`npm run test:unit`，验证应用、通用画布属性、双指针快照以及动效时间 token。
- 覆盖率：`npm run test:coverage`，记录 statements/branches/functions/lines；当前未达 60/50/60 门槛。
- E2E：`npm run test:e2e:install` 后 `npm run test:e2e`，Chromium 覆盖 15 个关键路径。
- 工程检查：`npm run lint`、`npm run type-check`、`CI=true npm run build`。
- 当前环境首次全量 Jest 在默认 4GB heap 下出现 OOM，使用 `NODE_OPTIONS=--max-old-space-size=8192` 重跑通过。
