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
 * 插件系统基础类型定义
 */

import type { BaseQuery, BaseRecord } from '@veaiops/types';
// Key 类型已在 core/common.ts 中定义，此处导入供内部使用
import type { Key } from '../../core/common';
import type {
  LifecyclePhaseEnum,
  PluginPriority,
  PluginPriorityEnum,
  PluginStatusEnum,
} from '../../core/enums';

/**
 * Arco Table 滚动配置类型
 */
export interface ArcoScrollConfig {
  x?: number | string | boolean;
  y?: number | string | boolean;
}

// 注意：枚举和 Key 类型已在 core 中导出，此处不重复导出，避免与 core 冲突
// 插件系统内部使用这些类型时，从 core 或顶层 types 导入即可
// 如需在插件系统内部使用，可以：
// 1. 从 core 导入：import { PluginPriorityEnum } from '../../core/enums'
// 2. 从顶层导入：import { PluginPriorityEnum } from '@/custom-table/types'

/**
 * 插件生命周期阶段（基于枚举，扩展版本）
 */
export type PluginLifecycle =
  | LifecyclePhaseEnum
  | 'install'
  | 'setup'
  | 'uninstall'
  | 'activate'
  | 'deactivate'
  | 'onMount'
  | 'onDestroy';

/**
 * 插件状态（基于枚举）
 */
export type PluginStatus = PluginStatusEnum;
