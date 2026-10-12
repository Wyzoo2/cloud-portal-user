// 公共组件统一出口（板块 A）。页面从这里引，别逐个 import 文件。
// AppLayout 是布局壳，由 router 直接引用，不放进这个出口。
export { default as StatusTag } from './StatusTag.vue'
export { default as AmountText } from './AmountText.vue'
export { default as EmptyState } from './EmptyState.vue'
export { default as LoadingBox } from './LoadingBox.vue'
export { default as AmountInput } from './AmountInput.vue'
export { default as PagedTable } from './PagedTable.vue'
