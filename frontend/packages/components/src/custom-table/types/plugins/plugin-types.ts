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
 * 插件系统精确类型定义
 * 替代 any 类型，提供更安全的类型约束
 */

import type { BaseQuery, BaseRecord } from '@veaiops/types';
import type { ReactNode } from 'react';
import type { PluginContext } from './core';

/**
 * 插件配置基础接口
 */
export interface PluginConfigBase {
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 插件优先级 */
  priority?: number;
  /** 依赖插件列表 */
  dependencies?: string[];
}

/**
 * 插件注册信息
 */
export interface PluginRegistration<
  Config extends PluginConfigBase = PluginConfigBase,
> {
  /** 插件唯一标识 */
  id: string;
  /** 插件配置 */
  config: Config;
  /** 插件状态 */
  status: 'registered' | 'installed' | 'active' | 'inactive' | 'error';
  /** 错误信息 */
  error?: Error;
}

/**
 * 插件验证结果
 */
export interface PluginValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误消息 */
  errors: string[];
  /** 警告消息 */
  warnings: string[];
}

/**
 * 排序后的插件集合
 */
export interface SortedPlugins<
  Config extends PluginConfigBase = PluginConfigBase,
> {
  /** 按优先级排序的插件列表 */
  plugins: PluginRegistration<Config>[];
  /** 排序元数据 */
  metadata: {
    totalCount: number;
    activeCount: number;
    sortCriteria: 'priority' | 'dependencies' | 'name';
  };
}

/**
 * 插件冲突检测结果
 */
export interface PluginConflictResult<
  Config extends PluginConfigBase = PluginConfigBase,
> {
  /** 是否存在冲突 */
  hasConflicts: boolean;
  /** 冲突的插件对 */
  conflicts: Array<{
    plugin1: PluginRegistration<Config>;
    plugin2: PluginRegistration<Config>;
    reason: string;
  }>;
}

/**
 * 插件依赖检查结果
 */
export interface PluginDependencyResult<
  Config extends PluginConfigBase = PluginConfigBase,
> {
  /** 是否满足所有依赖 */
  allDependenciesMet: boolean;
  /** 缺失的依赖 */
  missingDependencies: Array<{
    plugin: PluginRegistration<Config>;
    missingDeps: string[];
  }>;
  /** 依赖关系图 */
  dependencyGraph: Map<string, string[]>;
}

/**
 * 类型安全的插件工具函数接口
 */
export interface TypeSafePluginUtils {
  /**
   * 验证插件配置
   */
  validatePluginConfig: <Config extends PluginConfigBase>(
    plugin: PluginRegistration<Config>,
  ) => PluginValidationResult;

  /**
   * 按优先级排序插件
   */
  sortPluginsByPriority: <Config extends PluginConfigBase>(
    plugins: PluginRegistration<Config>[],
  ) => SortedPlugins<Config>;

  /**
   * 检测插件冲突
   */
  detectPluginConflicts: <Config extends PluginConfigBase>(
    plugin: PluginRegistration<Config>,
    registeredPlugins: PluginRegistration<Config>[],
  ) => PluginConflictResult<Config>;

  /**
   * 检查插件依赖
   */
  checkPluginDependencies: <Config extends PluginConfigBase>(
    plugin: PluginRegistration<Config>,
    registeredPlugins: PluginRegistration<Config>[],
  ) => PluginDependencyResult<Config>;
}

/**
 * 插件渲染器参数类型
 */
export interface PluginRenderParams<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
  ExtraProps extends Record<string, unknown> = Record<string, unknown>,
> {
  /** 插件上下文 */
  context: PluginContext<RecordType, QueryType>;
  /** 额外属性 */
  extraProps?: ExtraProps;
  /** 子节点 */
  children?: ReactNode;
}

/**
 * 插件渲染函数类型
 */
export type PluginRenderFunction<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
  ExtraProps extends Record<string, unknown> = Record<string, unknown>,
> = (
  params: PluginRenderParams<RecordType, QueryType, ExtraProps>,
) => ReactNode;

/**
 * 插件回调函数类型
 */
export type PluginCallback<
  Args extends unknown[] = unknown[],
  ReturnType = void,
> = (...args: Args) => ReturnType;

/**
 * 插件事件监听器类型
 */
export interface PluginEventListener<EventData = unknown> {
  /** 事件名称 */
  eventName: string;
  /** 监听器函数 */
  listener: (eventData: EventData) => void;
  /** 是否只监听一次 */
  once?: boolean;
}

/**
 * 插件钩子配置
 */
export interface PluginHookConfig<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 钩子名称 */
  hookName: string;
  /** 钩子函数 */
  hook: PluginCallback<[PluginContext<RecordType, QueryType>], void>;
  /** 执行优先级 */
  priority?: number;
}
