# Implementation Plan

## 1. 画布基础架构

- [x] 1.1 重构页面布局以最大化画布空间
  - 调整 CSS Grid/Flexbox 布局，确保画布占据至少 70% 视口空间
  - 压缩 Header、输入控制区域的高度
  - 将代码展示区域改为可折叠侧边栏
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.2 编写画布空间分配属性测试
  - **Property 1: Canvas Space Allocation**
  - **Validates: Requirements 1.1, 1.4**

- [x] 1.3 实现 InteractiveCanvas 组件
  - 创建基于 D3.js 的 SVG 画布组件
  - 实现 zoom 和 pan 行为
  - 支持鼠标滚轮缩放、拖拽平移
  - 支持触摸设备的捏合缩放
  - 实现双击重置视图功能
  - 添加缩放级别指示器和重置按钮
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

- [x] 1.4 编写画布交互属性测试
  - **Property 2: Pan Transform Correctness**
  - **Property 3: Zoom Transform Correctness**
  - **Validates: Requirements 2.1, 2.2, 2.3**

## 2. 数据结构渲染器

- [x] 2.1 实现数组渲染器
  - 水平排列数组元素，显示索引标签
  - 支持元素高亮和标注
  - 确保元素间距合理
  - _Requirements: 3.2_

- [x] 2.2 实现栈渲染器
  - 垂直排列栈元素，标识栈顶和栈底
  - 支持入栈、出栈动画
  - 显示栈内元素变化
  - _Requirements: 3.4_

- [x] 2.3 实现 HashMap 渲染器
  - 清晰展示 key-value 对
  - 支持条目高亮
  - 确保 key 和 value 视觉分离
  - _Requirements: 3.3_

- [x] 2.4 实现二叉树渲染器
  - 绘制节点和父子连接线
  - 支持节点标注
  - 计算合理的树形布局
  - _Requirements: 3.1_

- [x] 2.5 实现图渲染器
  - 绘制节点和边
  - 支持有向边的箭头指示
  - 实现力导向布局或层次布局
  - _Requirements: 3.5_

- [x] 2.6 编写数据结构渲染属性测试
  - **Property 4: Data Structure Rendering Completeness**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## 3. Checkpoint - 确保所有测试通过
- [x] Ensure all tests pass, ask the user if questions arise.

## 4. 标注系统

- [x] 4.1 实现 AnnotationManager
  - 创建标注管理器，支持添加、删除、清除标注
  - 实现标注定位算法（top/bottom/left/right）
  - 支持多种标注类型（state-change, comparison, assignment, info）
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.2 实现标注防重叠算法
  - 检测标注边界框重叠
  - 自动调整标注位置避免遮挡
  - 多标注垂直堆叠
  - _Requirements: 4.5, 4.6_

- [x] 4.3 编写标注属性测试
  - **Property 5: Node Value Display**
  - **Property 6: Annotation Creation on State Change**
  - **Property 7: Annotation Non-Overlap**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**


## 5. 数据流箭头系统

- [x] 5.1 实现 ArrowManager
  - 创建箭头管理器，支持添加、删除、清除箭头
  - 实现箭头路径计算（直线和曲线）
  - 支持箭头标签显示
  - _Requirements: 5.1, 5.2_

- [x] 5.2 实现箭头类型支持
  - 值传递箭头（value-transfer）
  - 参数传递箭头（parameter）
  - 返回值箭头（return-value）
  - 赋值箭头（assignment）
  - _Requirements: 5.3, 5.4_

- [x] 5.3 实现箭头防重叠算法
  - 检测箭头路径重叠
  - 使用曲线路径避免交叉
  - 偏移重叠箭头
  - _Requirements: 5.5, 5.6_

- [x] 5.4 编写数据流箭头属性测试
  - **Property 8: Data Flow Arrow Completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**

## 6. 执行上下文显示

- [x] 6.1 实现 ExecutionContextRenderer
  - 创建栈帧显示组件
  - 显示函数名、参数、局部变量
  - 显示递归深度指示器
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 6.2 实现栈帧动画
  - 递归调用时添加新栈帧动画
  - 递归返回时移除栈帧动画
  - 高亮当前活动栈帧
  - _Requirements: 6.2, 6.5_

- [x] 6.3 实现调用链显示
  - 显示从入口到当前状态的调用序列
  - 支持调用链导航
  - _Requirements: 6.6_

- [x] 6.4 编写执行上下文属性测试
  - **Property 9: Stack Frame Consistency**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

## 7. Checkpoint - 确保所有测试通过
- [x] Ensure all tests pass, ask the user if questions arise.

## 8. 动画帧与代码绑定系统

- [x] 8.1 设计多语言代码行映射机制
  - 创建 CodeLineBinding 接口
  - 为每个动画帧定义各语言对应的代码行
  - 支持单帧映射到多行代码
  - _Requirements: 7.3, 7.4_

- [x] 8.2 实现帧生成管道
  - 创建 FrameGenerator 接口
  - 实现算法执行轨迹记录
  - 将执行轨迹转换为动画帧
  - 确保帧粒度足够细（每个逻辑操作一帧）
  - _Requirements: 7.1, 7.5_

- [x] 8.3 实现代码高亮同步
  - 根据当前帧的 codeLineBindings 高亮代码行
  - 支持同时高亮多行
  - 切换语言时保持正确的行高亮
  - _Requirements: 7.2_

- [x] 8.4 实现帧信息显示
  - 显示当前帧号和总帧数
  - 显示当前操作描述
  - _Requirements: 7.6_

- [x] 8.5 编写代码绑定属性测试
  - **Property 10: Code Line Binding Consistency**
  - **Property 11: Frame Granularity**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

## 9. 智能布局引擎

- [x] 9.1 实现 LayoutEngine
  - 创建布局引擎核心类
  - 实现边界框计算
  - 实现边界框相交检测
  - _Requirements: 8.1, 8.5_

- [x] 9.2 实现重叠解决算法
  - 检测所有元素重叠
  - 自动调整元素位置消除重叠
  - 确保标签和注释不遮挡其他元素
  - _Requirements: 8.2, 8.3_

- [x] 9.3 实现元素分散布局
  - 大数据结构时分散元素到画布各区域
  - 保持合理的元素间距
  - 动画过渡元素位置变化
  - _Requirements: 8.4, 8.6_

- [x] 9.4 编写布局引擎属性测试
  - **Property 12: No Element Overlap**
  - **Validates: Requirements 8.1, 8.3, 8.4**

## 10. Checkpoint - 确保所有测试通过
- [x] Ensure all tests pass, ask the user if questions arise.

## 11. 自适应视图

- [x] 11.1 实现自动缩放算法
  - 计算所有元素的边界框
  - 计算最优缩放比例使所有元素可见
  - 确保元素尺寸不低于最小可读阈值
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 11.2 实现小数据放大
  - 数据量小时适当放大以利用空间
  - 保持元素比例协调
  - _Requirements: 9.3_

- [x] 11.3 实现手动缩放保护
  - 用户手动缩放后禁用自动缩放
  - 提供重置按钮恢复自动缩放
  - _Requirements: 9.5, 9.6_

- [x] 11.4 编写自适应视图属性测试
  - **Property 13: Auto-fit Completeness**
  - **Property 14: Manual Zoom Preservation**
  - **Validates: Requirements 9.1, 9.3, 9.4, 9.5**

## 12. 时间轴导航

- [x] 12.1 实现 Timeline 组件
  - 显示所有动画帧为可点击标记
  - 区分过去、当前、未来帧的视觉样式
  - 支持点击跳转到指定帧
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 12.2 实现时间轴交互
  - 悬停显示帧预览 tooltip
  - 播放时实时更新指示器位置
  - 大量帧时支持时间轴滚动或缩放
  - _Requirements: 10.4, 10.5, 10.6_

- [x] 12.3 编写时间轴属性测试
  - **Property 15: Timeline Marker Consistency**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.5, 10.6**

## 13. 变量面板

- [x] 13.1 实现 VariablesPanel 组件
  - 显示所有算法变量及其当前值
  - 变量值变化时高亮显示
  - 当前步骤引用的变量特殊标记
  - _Requirements: 11.1, 11.2, 11.4_

- [x] 13.2 实现复杂数据结构展示
  - 支持展开/折叠复杂数据结构
  - 保持面板紧凑以节省空间
  - 支持面板折叠或移动
  - _Requirements: 11.3, 11.5, 11.6_

- [x] 13.3 编写变量面板属性测试
  - **Property 16: Variable Panel Completeness**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

## 14. Checkpoint - 确保所有测试通过
- [x] Ensure all tests pass, ask the user if questions arise.

## 15. 导出与分享

- [x] 15.1 实现 ExportManager
  - 实现状态编码/解码
  - 生成分享 URL
  - 从 URL 恢复状态
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 15.2 实现分享功能
  - 复制到剪贴板功能
  - URL 过长时使用压缩编码
  - _Requirements: 12.4, 12.5_

- [x] 15.3 实现图片导出
  - 将当前画布导出为 PNG 图片
  - 支持下载保存
  - _Requirements: 12.6_

- [x] 15.4 编写导出分享属性测试
  - **Property 17: Export/Import Round-Trip**
  - **Property 18: Image Export Validity**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.5, 12.6**

## 16. 算法步骤细化

- [x] 16.1 细化双指针法动画帧
  - 为每个逻辑操作创建独立帧
  - 添加详细的标注和箭头
  - 绑定多语言代码行
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 16.2 细化单调栈法动画帧
  - 展示每次入栈、出栈的详细过程
  - 显示水量计算的公式和结果
  - 添加栈状态变化的标注
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 16.3 细化预计算法动画帧
  - 分阶段展示 leftMax、rightMax 数组构建
  - 展示最终水量计算过程
  - 添加数组更新的标注和箭头
  - _Requirements: 7.1, 7.2, 7.3_

## 17. Final Checkpoint - 确保所有测试通过
- [x] Ensure all tests pass, ask the user if questions arise.
