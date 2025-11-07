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
 * 插件工具类型定义
 */

import type { ReactNode } from 'react';
// 静态导入类型，禁止使用动态 import()
import type { PluginPriority } from '../../core/enums';
import type { PluginLifecycle } from './base';
import type { PluginContext } from './context';
import type { CorePlugin, Plugin } from './plugin';

/**
 * 插件钩子类型
 */
export type PluginHook<T = unknown> = (...args: unknown[]) => T;

/**
 * 插件渲染器类型
 */
export type PluginRenderer = (...args: unknown[]) => ReactNode;

/**
 * 插件事件监听器类型
 */
export type PluginEventListener = (...args: unknown[]) => void;

/**
 * 插件配置增强器类型
 */
export type PluginPropsEnhancer = (
  props: Record<string, unknown>,
  context: PluginContext,
) => Record<string, unknown>;

/**
 * 插件数据处理器类型
 */
export type PluginDataProcessor = (
  data: unknown,
  context: PluginContext,
) => unknown;

/**
 * 插件工厂函数类型
 */
export type PluginFactory<Config = Record<string, unknown>> = (
  config?: Config,
) => Plugin<Config>;

/**
 * 简化插件工厂函数类型（保持向后兼容）
 */
export type CorePluginFactory<Config = Record<string, unknown>> = (
  config?: Partial<Config>,
) => CorePlugin<Config> & { config: Config };

/**
 * 插件实例化配置
 */
export interface PluginInstallConfig {
  priority?: PluginPriority;
  autoStart?: boolean;
  dependencies?: string[];
  conflicts?: string[];
  config?: Record<string, unknown>;
}

/**
 * 插件错误信息
 */
export interface PluginError {
  plugin: string;
  phase: PluginLifecycle;
  error: Error;
  timestamp: number;
}

/**
 * 插件依赖解析结果
 */
export interface PluginDependencyResolution {
  resolved: string[];
  unresolved: string[];
  conflicts: string[];
  circularDependencies: string[][];
}
