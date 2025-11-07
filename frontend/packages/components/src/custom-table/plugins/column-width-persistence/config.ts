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
 * 列宽持久化插件默认配置
 *

 *
 */

import { PluginPriorityEnum } from '@/custom-table/types/core/enums';
import type { ColumnWidthPersistenceConfig } from './types';

/**
 * 列宽持久化插件默认配置
 * 基于实际业务场景优化的配置，适合大部分表格使用
 */
export const DEFAULT_COLUMN_WIDTH_PERSISTENCE_CONFIG: Required<ColumnWidthPersistenceConfig> =
  {
    /** 基础插件配置 */
    priority: PluginPriorityEnum.MEDIUM,
    enabled: true,
    autoInstall: true,
    dependencies: [],
    conflicts: [],

    /** 列宽持久化特有配置 - 基于work-flow实际使用优化 */
    enableAutoDetection: true, // 自动检测列宽变化
    detectionDelay: 300, // 300ms防抖延迟，平衡响应性和性能
    storageKeyPrefix: 'custom-table-column-width',
    enableLocalStorage: true, // 启用本地存储持久化
    minColumnWidth: 60, // 最小列宽60px，确保内容可读性
    maxColumnWidth: 600, // 最大列宽600px，适合大部分业务场景
  };

/**
 * 插件常量
 */
export const PLUGIN_CONSTANTS = {
  /** 插件名称 */
  PLUGIN_NAME: 'column-width-persistence' as const,

  /** 插件版本 */
  VERSION: '1.0.0' as const,

  /** 插件描述 */
  DESCRIPTION: '表格列宽持久化插件，支持翻页时保持列宽固定' as const,

  /** 存储键分隔符 */
  STORAGE_KEY_SEPARATOR: ':' as const,

  /** 列宽检测选择器 */
  COLUMN_SELECTOR: 'th[data-index]' as const,

  /** 表格容器选择器 */
  TABLE_CONTAINER_SELECTOR: '.arco-table' as const,
} as const;
