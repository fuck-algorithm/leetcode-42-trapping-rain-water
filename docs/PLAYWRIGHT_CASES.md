# Playwright 验收用例（迭代轮次 2）

`tests/e2e/acceptance.spec.ts` 保留 E2E-001~015。

- E2E-001：1920×1080 / 1366×768 检测 chrome、SVG 和画布比例。
- E2E-006：步骤切换后解说更新且 compare 焦点数量正确。
- E2E-009：数据图层、viewBox、平移/缩放以及索引数据辅助层。
- E2E-015：禁止紫色主题并锁定 current 状态色。

本项目当前非 E2E-005 以外的代码面板控件被本轮新增单元测试覆盖。运行全套：`npm run test:e2e`。
