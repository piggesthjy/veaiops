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
 * 生命周期管理 Hook 相关类型定义
 */
import type { BaseQuery, BaseRecord } from '../core';
import type {
  LifecycleListener,
  LifecyclePhase as PluginLifecyclePhase,
} from '../plugins/lifecycle';

/**
 * 生命周期阶段 (重新导出插件中的定义)
 */
export type LifecyclePhase = PluginLifecyclePhase;

/**
 * 生命周期回调函数
 */
export type LifecycleCallback<T = Record<string, unknown>> = (
  context: T,
) => void | Promise<void>;

/**
 * 生命周期配置
 */
export type LifecycleConfig<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> = {
  [K in LifecyclePhase]?: LifecycleCallback<{
    phase: K;
    data?: RecordType[];
    query?: QueryType;
    error?: Error;
    [key: string]: unknown;
  }>;
};

/**
 * useLifecycleManager Hook Props
 */
export interface UseLifecycleManagerProps {
  /** 生命周期配置 */
  config?: LifecycleConfig;
  /** 生命周期配置 */
  lifecycleConfig?: Record<string, unknown>;
  /** 管理器配置 */
  managerConfig?: Record<string, unknown>;
  /** 全局回调 */
  globalCallbacks?: Record<string, unknown>;
  /** 生命周期错误回调 */
  onLifecycleError?: (error: Error) => void;
  /** 是否启用调试 */
  debug?: boolean;
  /** 自定义上下文 */
  context?: Record<string, unknown>;
}

/**
 * 生命周期执行器
 */
export interface LifecycleExecutor {
  execute: (
    phase: LifecyclePhase,
    context?: Record<string, unknown>,
  ) => Promise<void>;
  register: (phase: LifecyclePhase, callback: LifecycleCallback) => void;
  unregister: (phase: LifecyclePhase, callback?: LifecycleCallback) => void;
  clear: () => void;
  getRegistered: (phase?: LifecyclePhase) => LifecycleCallback[];
}

/**
 * useLifecycleManager Hook 返回值
 */
export interface UseLifecycleManagerResult {
  /** 执行生命周期 */
  executeLifecycle: (
    phase: LifecyclePhase,
    pluginName: string,
    context: Record<string, unknown>,
  ) => Promise<void>;
  /** 添加监听器 */
  addListener: (listener: LifecycleListener) => void;
  /** 移除监听器 */
  removeListener: (listener: LifecycleListener) => void;
  /** 获取性能指标 */
  getPerformanceMetrics: () => Record<string, unknown>;
  /** 清除性能指标 */
  clearPerformanceMetrics: () => void;
}
