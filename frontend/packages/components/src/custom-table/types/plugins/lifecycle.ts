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
 * 插件生命周期相关类型定义
 *

 * @date 2025-12-19
 */

import type { PluginContext } from './core';

/**
 * 生命周期阶段类型
 */
export type LifecyclePhase =
  | 'beforeMount'
  | 'afterMount'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeUnmount'
  | 'afterUnmount'
  | 'onMount'
  | 'onUnmount'
  | 'onUpdate'
  | 'onDestroy'
  | 'uninstall'
  | 'install'
  | 'setup'
  | 'activate'
  | 'deactivate';

/**
 * 生命周期执行上下文
 */
export interface LifecycleExecutionContext {
  phase: LifecyclePhase;
  pluginName: string;
  startTime: number;
  timestamp?: number;
  context: PluginContext;
}

/**
 * 生命周期监听器类型
 */
export type LifecycleListener = (
  executionContext: LifecycleExecutionContext,
  phase?: LifecyclePhase,
  pluginName?: string,
  context?: PluginContext,
) => void | Promise<void>;

/**
 * 生命周期回调类型
 */
export type LifecycleCallback = (
  context: PluginContext,
) => void | Promise<void>;

/**
 * 插件生命周期配置
 */
export interface PluginLifecycleConfig {
  beforeMount?: LifecycleCallback;
  afterMount?: LifecycleCallback;
  beforeUpdate?: LifecycleCallback;
  afterUpdate?: LifecycleCallback;
  beforeUnmount?: LifecycleCallback;
  afterUnmount?: LifecycleCallback;
  onMount?: LifecycleCallback;
  onUnmount?: LifecycleCallback;
  onUpdate?: LifecycleCallback;
  onDestroy?: LifecycleCallback;
  onUninstall?: LifecycleCallback;
}

/**
 * 生命周期管理器配置
 */
export interface LifecycleManagerConfig {
  enableLogging?: boolean;
  timeout?: number;
  retryCount?: number;
  globalLifecycle?: PluginLifecycleConfig;
  errorHandling?:
    | 'warn'
    | 'ignore'
    | 'throw'
    | {
        retryOnError?: boolean;
        maxRetries?: number;
        retryDelay?: number;
      };
  debug?: boolean;
  enablePerformanceMonitoring?: boolean;
  listeners?: LifecycleListener[];
}

/**
 * CustomTable 生命周期配置
 */
export interface CustomTableLifecycleConfig extends LifecycleManagerConfig {
  /** 全局生命周期回调 */
  global?: PluginLifecycleConfig;
  /** 插件特定配置 */
  plugins?: Record<string, PluginLifecycleConfig>;
}

/**
 * 插件特定生命周期配置
 */
export type PluginSpecificLifecycleConfig = Record<
  string,
  PluginLifecycleConfig
>;
