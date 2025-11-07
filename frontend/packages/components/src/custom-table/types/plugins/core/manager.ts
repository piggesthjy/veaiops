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
 * 插件管理器类型定义
 */

import type { BaseQuery, BaseRecord } from '@veaiops/types';
import type { ReactNode } from 'react';
import type { PluginLifecycle } from './base';
import type { PluginPerformanceMetrics } from './config';
import type { PluginContext } from './context';
import type { Plugin } from './plugin';

/**
 * 插件管理器API类型
 */
export interface PluginManagerAPI {
  // 插件注册
  register: <Config = Record<string, unknown>>(
    plugin: Plugin<Config>,
  ) => Promise<void>;
  unregister: (pluginName: string) => Promise<void>;

  // 插件管理
  enable: (pluginName: string) => Promise<void>;
  disable: (pluginName: string) => Promise<void>;

  // 插件查询
  getPlugin: (pluginName: string) => Plugin | undefined;
  getPlugins: () => Plugin[];
  getAllPlugins: () => Plugin[];
  getEnabledPlugins: () => Plugin[];
  getActivePlugins: () => Plugin[];
  isEnabled: (pluginName: string) => boolean;
  isPluginEnabled: (pluginName: string) => boolean;
  isPluginInstalled: (pluginName: string) => boolean;

  // 生命周期管理
  setup: (context: PluginContext) => Promise<void>;
  executeHook: (params: {
    lifecycle: PluginLifecycle;
    context: PluginContext;
  }) => Promise<void>;

  // 插件调用
  use: <T>({
    pluginName,
    method,
    args,
  }: { pluginName: string; method: string; args?: unknown[] }) => T;
  render: ({
    pluginName,
    renderer,
    args,
  }: { pluginName: string; renderer: string; args?: unknown[] }) => ReactNode;

  // 事件系统
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;

  // 性能监控
  getMetrics: () => PluginPerformanceMetrics;

  // 上下文管理
  setPluginContext: ({
    pluginName,
    context,
  }: { pluginName: string; context: PluginContext }) => void;
}

/**
 * 插件管理器类型
 */
export interface PluginManager extends PluginManagerAPI {
  context?: PluginContext;
  plugins: Map<string, Plugin>;
  metrics: PluginPerformanceMetrics;
}

/**
 * 插件管理器接口（泛型版本）
 */
export interface PluginManagerGeneric<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  register: <Config = Record<string, unknown>>(
    plugin: Plugin<Config>,
  ) => Promise<void>;
  unregister: (pluginName: string) => Promise<void>;
  enable: (pluginName: string) => Promise<void>;
  disable: (pluginName: string) => Promise<void>;
  isEnabled: (pluginName: string) => boolean;
  getAllPlugins: () => Plugin<Record<string, unknown>>[];
  getPlugin: (name: string) => Plugin<Record<string, unknown>> | undefined;
  setPluginContext: (
    pluginName: string,
    context: PluginContext<RecordType, QueryType>,
  ) => void;
  executeHook: (params: {
    lifecycle: PluginLifecycle;
    context: PluginContext<RecordType, QueryType>;
  }) => Promise<void>;
}
