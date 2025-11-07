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
 * CustomTable 工具类型统一导出
 */

// ==================== 错误相关类型 ====================
export * from './error';

// ==================== 类型安全工具 ====================
export * from './type-safe-utils';

// ==================== 状态管理器 ====================
// 显式导出关键函数，确保构建工具能够正确识别（避免星号导出解析问题）
export {
  createPaginationStateManager,
  createSorterStateManager,
  createSafeStateCleaner,
} from './state-managers';
// 导出类型定义
export type {
  PaginationStateManager,
  SorterStateManager,
  SafeStateCleaner,
} from './state-managers';
