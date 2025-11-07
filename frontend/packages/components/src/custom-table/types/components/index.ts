// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * CustomTable 组件类型统一导出
 * 按照类型导出优化规范，使用 export * from 统一导出
 */

// ==================== 组件属性类型 ====================
export * from './props';
// 显式导出常用组件类型，确保 DTS 生成时正确识别
export type { FilterConfigItem } from './props';

// ==================== 自定义加载组件类型 ====================
export * from './custom-loading';

// ==================== 重试处理器组件类型 ====================
export * from './retry-handler';

// ==================== 默认底部组件类型 ====================
export * from './default-footer';

// ==================== 流式重试按钮组件类型 ====================
export * from './stream-retry-button';

// ==================== 表格提示组件类型 ====================
export * from './table-alert';

// ==================== 表格内容组件类型 ====================
export * from './table-content';

// ==================== 表格标题组件类型 ====================
export * from './table-title';

// ==================== 标题复选框组件类型 ====================
export * from './title-checkbox';

// ==================== 标题搜索组件类型 ====================
export * from './title-search';

// ==================== 缺失类型补充 ====================
// 注意：missing-types.ts 中包含一些类型定义的补充和兼容性导出
// 如果出现重复导出错误，需要检查并从源头解决重复定义
export * from './missing-types';
