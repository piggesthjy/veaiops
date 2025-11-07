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
 * 插件接口定义
 */

import type { BaseQuery, BaseRecord } from '@veaiops/types';
import type { ReactNode } from 'react';
// PluginPriority 已在 core/enums.ts 中定义，从 core 导入避免重复
// 静态导入枚举值，禁止使用动态 import()
import type { PluginPriority, PluginPriorityEnum } from '../../core/enums';
import type { PluginContext } from './context';
import type { PluginHook } from './utils';

/**
 * 插件接口定义（完整版本）
 */
export interface Plugin<Config = Record<string, unknown>> {
  name: string;
  version: string;
  description: string;
  priority: PluginPriority;
  enabled: boolean;
  dependencies?: string[];
  conflicts?: string[];
  config?: Config;

  // 生命周期方法
  install: (context: PluginContext) => void | Promise<void>;
  setup?: (context: PluginContext) => void | Promise<void>;
  beforeMount?: (context: PluginContext) => void | Promise<void>;
  afterMount?: (context: PluginContext) => void | Promise<void>;
  beforeUpdate?: (context: PluginContext) => void | Promise<void>;
  afterUpdate?: (context: PluginContext) => void | Promise<void>;
  beforeUnmount?: (context: PluginContext) => void | Promise<void>;
  afterUnmount?: (context: PluginContext) => void | Promise<void>;
  uninstall?: (context: PluginContext) => void | Promise<void>;

  // 旧版生命周期方法兼容
  onMount?: (context: PluginContext) => void | Promise<void>;
  onUnmount?: (context: PluginContext) => void | Promise<void>;
  activate?: (context: PluginContext) => void | Promise<void>;
  deactivate?: (context: PluginContext) => void | Promise<void>;

  // 钩子方法
  hooks?: Record<string, PluginHook>;

  // 事件处理器
  tableEvents?: Record<
    string,
    (context: PluginContext<BaseRecord, BaseQuery>, ...args: unknown[]) => void
  >;

  // 数据处理器
  dataProcessors?: Record<
    string,
    (data: unknown, context: PluginContext) => unknown
  >;

  // 渲染器
  render?: Record<
    string,
    (
      context: PluginContext<BaseRecord, BaseQuery>,
      ...args: unknown[]
    ) => ReactNode
  >;

  // 组件增强器
  enhanceProps?: (
    props: Record<string, unknown>,
    context: PluginContext,
  ) => Record<string, unknown>;

  // 插件特定配置
  features?: string[];
  settings?: Record<string, unknown>;
}

/**
 * 插件接口（简化版本，保持向后兼容）
 */
export interface CorePlugin<Config = Record<string, unknown>> {
  /** 插件名称 */
  readonly name: string;
  /** 插件配置 */
  readonly config: Config;
  /** 插件优先级 */
  readonly priority: typeof PluginPriorityEnum;
  /** 是否启用 */
  readonly enabled: boolean;

  /**
   * 插件初始化
   */
  initialize?: (context: PluginContext) => Promise<void> | void;

  /**
   * 插件销毁
   */
  destroy?: () => Promise<void> | void;

  /**
   * 渲染插件内容
   */
  render?: (context: PluginContext) => ReactNode;

  /**
   * 获取插件状态
   */
  getState?: () => Record<string, unknown>;

  /**
   * 更新插件状态
   */
  updateState?: (state: Record<string, unknown>) => void;
}
