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
 * 列宽持久化插件统一导出
 *

 *
 */

// 插件实现
export { ColumnWidthPersistencePlugin } from './plugin';

// 类型定义
export type {
  ColumnWidthInfo,
  ColumnWidthPersistenceConfig,
  ColumnWidthPersistenceMethods,
  ColumnWidthPersistenceState,
} from './types';

// 配置和常量
export {
  DEFAULT_COLUMN_WIDTH_PERSISTENCE_CONFIG,
  PLUGIN_CONSTANTS,
} from './config';

// Hooks
export {
  useColumnWidthPersistence,
  type UseColumnWidthPersistenceProps,
  type UseColumnWidthPersistenceResult,
} from './hooks';

// 工具函数
export {
  compareColumnWidths,
  createColumnWidthInfo,
  createDebouncedWidthDetector,
  detectAllColumnWidthsFromDOM,
  detectColumnWidthFromDOM,
  filterValidColumnWidths,
  generateStorageKey,
  generateTableId,
  localStorageUtils,
  validateColumnWidth,
} from './utils';
