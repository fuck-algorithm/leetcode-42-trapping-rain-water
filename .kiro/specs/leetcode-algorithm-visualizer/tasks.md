# Implementation Plan

## 1. 项目基础设施

- [x] 1.1 配置开发服务器端口
  - 修改 package.json 中的 start 脚本，使用 30000-65535 范围内的随机端口
  - 避免与其他服务冲突
  - _Requirements: 10.1, 10.2_

- [x] 1.2 配置 GitHub Actions 自动部署
  - 创建 `.github/workflows/deploy.yml` 文件
  - 配置构建和部署到 GitHub Pages 的流程
  - 确保构建前检查编译错误和 linter 错误
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 1.3 更新 README 文档
  - 简化 README 内容，只保留题目信息和 GitHub Pages 链接
  - _Requirements: 11.1, 11.2, 11.3_

## 2. 用户偏好持久化

- [x] 2.1 实现播放速度 IndexedDB 持久化
  - 创建 IndexedDB 工具函数用于存储和读取播放速度设置
  - 在 AnimationControls 组件中集成持久化逻辑
  - 页面加载时恢复上次保存的播放速度
  - _Requirements: 6.9, 6.10_

- [x] 2.2 编写播放速度持久化属性测试
  - **Property 11: Speed Persistence Round-Trip**
  - **Validates: Requirements 6.9, 6.10**

- [x] 2.3 实现代码语言选择 IndexedDB 持久化
  - 在 CodeDisplay 组件中添加语言选择持久化
  - 页面加载时恢复上次选择的编程语言
  - _Requirements: 4.2_

## 3. 数据输入验证增强

- [x] 3.1 增强输入验证逻辑
  - 实现完整的输入验证函数，检查格式、长度范围(1-200)、值范围(0-10000)
  - 显示详细的错误提示信息
  - _Requirements: 3.2, 3.3, 3.7_

- [x] 3.2 编写输入验证属性测试
  - **Property 2: Valid Input Acceptance**
  - **Property 3: Invalid Input Rejection**
  - **Validates: Requirements 3.2, 3.3**

- [x] 3.3 增强随机数据生成
  - 确保生成的数据符合题目约束（非负整数，0-10000范围，1-200长度）
  - _Requirements: 3.6, 3.7_

- [x] 3.4 编写随机生成属性测试
  - **Property 4: Random Generation Validity**
  - **Validates: Requirements 3.6, 3.7**

## 4. Checkpoint - 确保所有测试通过
- [x] Ensure all tests pass, ask the user if questions arise.

## 5. 代码展示组件增强

- [x] 5.1 添加多语言算法代码
  - 为每种算法添加 Java、Python、Golang、JavaScript 四种语言的 AC 代码
  - 确保代码格式正确，无对齐问题
  - _Requirements: 4.1, 4.5, 4.6_

- [x] 5.2 实现代码行与动画步骤同步
  - 设计多语言代码行映射机制
  - 在动画步骤中添加对应的代码行信息
  - 高亮当前执行的代码行
  - _Requirements: 4.3_

- [x] 5.3 实现变量值实时显示
  - 在代码行旁边显示当前变量的内存值
  - 类似 IDE 调试器的变量监视功能
  - _Requirements: 4.4_

- [x] 5.4 编写代码同步属性测试
  - **Property 5: Code Line Highlighting Synchronization**
  - **Property 6: Variable Display Synchronization**
  - **Validates: Requirements 4.3, 4.4**

## 6. 画布可视化增强

- [x] 6.1 实现画布缩放和拖拽功能
  - 使用 D3.js zoom 行为实现画布的平移和缩放
  - 支持鼠标滚轮缩放和拖拽移动
  - _Requirements: 5.2_

- [x] 6.2 实现自适应缩放
  - 根据数据大小自动调整视图比例
  - 确保所有元素在视口内可见
  - _Requirements: 5.8_

- [x] 6.3 编写自适应缩放属性测试
  - **Property 10: Auto-Scaling Correctness**
  - **Validates: Requirements 5.8**

- [x] 6.4 增强数据流可视化
  - 添加箭头指示数据流向
  - 在箭头旁边添加文字说明
  - 显示值传递、变量变更过程
  - _Requirements: 5.5_

- [x] 6.5 编写数据流箭头属性测试
  - **Property 8: Data Flow Arrow Accuracy**
  - **Validates: Requirements 5.5**

- [x] 6.6 优化元素布局避免重叠
  - 实现智能布局算法，分散元素位置
  - 确保标签、注释不会互相遮挡
  - _Requirements: 5.7_

- [x] 6.7 编写元素重叠属性测试
  - **Property 9: No Element Overlap**
  - **Validates: Requirements 5.7**

- [x] 6.8 增强元素高亮效果
  - 使用明显的颜色区分当前操作的元素
  - 添加动画效果突出显示状态变化
  - _Requirements: 5.3_

- [x] 6.9 编写元素高亮属性测试
  - **Property 7: Element Highlighting Consistency**
  - **Validates: Requirements 5.3**

## 7. Checkpoint - 确保所有测试通过
- [x] Ensure all tests pass, ask the user if questions arise.

## 8. 动画控制增强

- [x] 8.1 完善进度条拖拽功能
  - 确保进度条支持拖拽跳转到任意步骤
  - 已播放部分显示绿色，未播放部分显示灰色
  - _Requirements: 6.11, 6.12, 6.13_

- [x] 8.2 优化速度控制组件
  - 使用自定义滑块组件替代原生控件
  - 显示当前播放倍速
  - _Requirements: 6.7, 6.8_

## 9. 配色方案优化

- [x] 9.1 审查并移除紫色
  - 检查所有 CSS 文件和内联样式
  - 将任何紫色替换为协调的其他颜色
  - _Requirements: 8.3_

- [x] 9.2 编写配色约束属性测试
  - **Property 12: No Purple Colors**
  - **Validates: Requirements 8.3**

- [x] 9.3 统一配色方案
  - 确保整体配色协调一致
  - 使用统一的颜色变量
  - _Requirements: 8.2_

## 10. 辅助数据结构可视化

- [x] 10.1 增强单调栈可视化
  - 清晰展示栈的入栈、出栈操作
  - 显示栈内元素的变化过程
  - 添加状态变更的箭头和文字说明
  - _Requirements: 5.6_

- [x] 10.2 增强预计算数组可视化
  - 展示 leftMax 和 rightMax 数组的构建过程
  - 显示数组元素的更新和比较
  - _Requirements: 5.6_

## 11. 算法步骤细化

- [x] 11.1 细化双指针法动画步骤
  - 增加更详细的中间步骤
  - 确保每个步骤都有对应的代码行绑定
  - 添加决策逻辑的可视化说明
  - _Requirements: 5.4, 5.5_

- [x] 11.2 细化单调栈法动画步骤
  - 展示每次入栈、出栈的详细过程
  - 显示水量计算的公式和结果
  - _Requirements: 5.4, 5.5_

- [x] 11.3 细化预计算法动画步骤
  - 分阶段展示 leftMax、rightMax 数组的构建
  - 展示最终水量计算过程
  - _Requirements: 5.4, 5.5_

## 12. Final Checkpoint - 确保所有测试通过
- [x] Ensure all tests pass, ask the user if questions arise.
