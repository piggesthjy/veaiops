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

import { PluginStatusEnum } from '@/custom-table/types/core/enums';
import { devLog } from '@/custom-table/utils';
/**
 * 插件执行器模块
 * 负责插件方法的调用和渲染
 *

 * @date 2025-12-19
 */
import type { ReactNode } from 'react';
import type { PluginRegistry } from './plugin-registry';

/**
 * @name 插件执行器
 */
export interface PluginExecutorUseParams {
  pluginName: string;
  method: string;
  args?: unknown[];
}

export interface PluginExecutorRenderParams {
  pluginName: string;
  renderer: string;
  args?: unknown[];
}

export interface PluginExecutorUseBatchParams {
  method: string;
  args?: unknown[];
}

export interface PluginExecutorRenderBatchParams {
  renderer: string;
  args?: unknown[];
}

export class PluginExecutor {
  constructor(private registry: PluginRegistry) {}

  /**
   * @name 调用插件方法
   */
  use<T>({
    pluginName,
    method,
    args = [],
  }: PluginExecutorUseParams): T | undefined {
    const plugin = this.registry.getPlugin(pluginName);
    if (!plugin) {
      devLog.log({
        component: 'PluginExecutor',
        message: `Plugin "${pluginName}" is not registered yet, method: ${method}`,
        data: {},
      });
      return undefined;
    }

    const hookFn = plugin.hooks?.[method];
    if (typeof hookFn !== 'function') {
      return undefined;
    }

    try {
      const startTime = performance.now();
      const result = hookFn(...args) as T | undefined;
      const endTime = performance.now();

      // 更新性能指标
      const instance = this.registry.getInstance(pluginName);
      if (instance) {
        instance.performance.lastExecutionTime = endTime - startTime;
      }

      return result;
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const instance = this.registry.getInstance(pluginName);
      if (instance) {
        instance.error = errorObj;
        this.registry.updatePluginStatus({
          pluginName,
          status: PluginStatusEnum.ERROR,
        });
      }
      // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
      devLog.error({
        component: 'PluginExecutor',
        message: `插件方法调用失败`,
        data: {
          pluginName,
          method,
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
      });

      return undefined;
    }
  }

  /**
   * @name 渲染插件组件
   */
  render({
    pluginName,
    renderer,
    args = [],
  }: PluginExecutorRenderParams): ReactNode {
    const plugin = this.registry.getPlugin(pluginName);
    if (!plugin) {
      devLog.log({
        component: 'PluginExecutor',
        message: `Plugin "${pluginName}" is not registered yet, renderer: ${renderer}`,
        data: {},
      });
      return null;
    }

    const renderFn = plugin.render?.[renderer];
    if (typeof renderFn !== 'function') {
      return null;
    }

    try {
      const startTime = performance.now();
      const result = (renderFn as any)(...args);
      const endTime = performance.now();

      // 更新性能指标
      const instance = this.registry.getInstance(pluginName);
      if (instance) {
        instance.performance.renderTime = endTime - startTime;
      }

      return result;
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const instance = this.registry.getInstance(pluginName);
      if (instance) {
        instance.error = errorObj;
        this.registry.updatePluginStatus({
          pluginName,
          status: PluginStatusEnum.ERROR,
        });
      }
      // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
      devLog.error({
        component: 'PluginExecutor',
        message: `插件渲染失败`,
        data: {
          pluginName,
          renderer,
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
      });

      return null;
    }
  }

  /**
   * @name 批量调用插件方法
   */
  useBatch<T>({ method, args = [] }: PluginExecutorUseBatchParams): T[] {
    const enabledPlugins = this.registry.getEnabledPlugins();
    const results: T[] = [];

    for (const plugin of enabledPlugins) {
      const result = this.use<T>({ pluginName: plugin.name, method, args });
      if (result !== undefined) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * @name 批量渲染插件组件
   */
  renderBatch({
    renderer,
    args = [],
  }: PluginExecutorRenderBatchParams): ReactNode[] {
    const enabledPlugins = this.registry.getEnabledPlugins();
    const results: ReactNode[] = [];

    for (const plugin of enabledPlugins) {
      const result = this.render({ pluginName: plugin.name, renderer, args });
      if (result !== null) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * @name 检查插件是否支持指定方法
   */
  hasMethod({
    pluginName,
    method,
  }: {
    pluginName: string;
    method: string;
  }): boolean {
    const plugin = this.registry.getPlugin(pluginName);
    return Boolean(plugin?.hooks?.[method]);
  }

  /**
   * @name 检查插件是否支持指定渲染器
   */
  hasRenderer({
    pluginName,
    renderer,
  }: {
    pluginName: string;
    renderer: string;
  }): boolean {
    const plugin = this.registry.getPlugin(pluginName);
    return Boolean(plugin?.render?.[renderer]);
  }
}
