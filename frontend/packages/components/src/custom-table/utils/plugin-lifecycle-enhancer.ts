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
 * 插件生命周期增强器
 * 为插件注入用户配置的生命周期回调
 */
import type { PluginLifecycle } from '@/custom-table/plugins';
import type { PluginContext } from '@/custom-table/types/plugins/core/context';
import type { Plugin } from '@/custom-table/types/plugins/core/plugin';
import type {
  CustomTableLifecycleConfig,
  LifecyclePhase,
} from '@/custom-table/types/plugins/lifecycle';
import {
  type LifecycleManager,
  createLifecycleManager,
} from './lifecycle-manager';
import { devLog } from './log-utils';

/**
 * 增强插件的生命周期方法的参数接口
 */
export interface EnhancePluginLifecycleParams<
  Config = Record<string, unknown>,
> {
  plugin: Plugin<Config>;
  lifecycleConfig?: CustomTableLifecycleConfig;
  lifecycleManager?: LifecycleManager;
}

/**
 * 增强插件的生命周期方法
 */
export function enhancePluginLifecycle<Config = Record<string, unknown>>({
  plugin,
  lifecycleConfig,
  lifecycleManager,
}: EnhancePluginLifecycleParams<Config>): Plugin<Config> {
  // 如果没有生命周期配置，直接返回原插件
  if (!lifecycleConfig) {
    return plugin;
  }

  const manager = lifecycleManager || createLifecycleManager();

  // 创建增强后的插件
  const enhancedPlugin: Plugin<Config> = {
    ...plugin,
    // 增强 beforeMount
    beforeMount: createEnhancedLifecycleMethod({
      originalMethod: plugin.beforeMount,
      phase: 'beforeMount',
      pluginName: plugin.name,
      manager,
      lifecycleConfig,
    }),
    // 增强 afterMount
    afterMount: createEnhancedLifecycleMethod({
      originalMethod: plugin.afterMount,
      phase: 'afterMount',
      pluginName: plugin.name,
      manager,
      lifecycleConfig,
    }),
    // 增强 beforeUpdate
    beforeUpdate: createEnhancedLifecycleMethod({
      originalMethod: plugin.beforeUpdate,
      phase: 'beforeUpdate',
      pluginName: plugin.name,
      manager,
      lifecycleConfig,
    }),
    // 增强 afterUpdate
    afterUpdate: createEnhancedLifecycleMethod({
      originalMethod: plugin.afterUpdate,
      phase: 'afterUpdate',
      pluginName: plugin.name,
      manager,
      lifecycleConfig,
    }),
    // 增强 beforeUnmount
    beforeUnmount: createEnhancedLifecycleMethod({
      originalMethod: plugin.beforeUnmount,
      phase: 'beforeUnmount',
      pluginName: plugin.name,
      manager,
      lifecycleConfig,
    }),
    // 增强 uninstall
    uninstall: createEnhancedLifecycleMethod({
      originalMethod: plugin.uninstall,
      phase: 'uninstall',
      pluginName: plugin.name,
      manager,
      lifecycleConfig,
    }),
  };

  return enhancedPlugin;
}

/**
 * 创建增强的生命周期方法的参数接口
 */
interface CreateEnhancedLifecycleMethodParams {
  originalMethod: ((context: PluginContext) => void) | undefined;
  phase: LifecyclePhase;
  pluginName: string;
  manager: LifecycleManager;
  lifecycleConfig: CustomTableLifecycleConfig;
}

/**
 * 创建增强的生命周期方法
 */
function createEnhancedLifecycleMethod({
  originalMethod,
  phase,
  pluginName,
  manager,
  lifecycleConfig,
}: CreateEnhancedLifecycleMethodParams): (
  context: PluginContext,
) => Promise<void> {
  return async (context: PluginContext): Promise<void> => {
    try {
      // 1. 执行用户配置的前置回调
      await manager.executeLifecycle({
        phase,
        pluginName,
        context,
        lifecycleConfig,
      });

      // 2. 执行原始的插件生命周期方法
      if (originalMethod) {
        await Promise.resolve(originalMethod(context));
      }
    } catch (error: unknown) {
      // 根据错误处理策略决定是否重新抛出错误
      const errorHandling = lifecycleConfig.errorHandling || 'warn';
      if (errorHandling === 'throw') {
        throw error;
      }
      // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
      // 如果错误处理策略不是 'throw'，记录错误日志（不透出到用户界面）
      // 注意：这是插件生命周期增强器的内部错误处理，错误已经在插件内部处理
      // 这里只记录日志，不显示错误消息给用户
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      devLog.warn({
        component: 'PluginLifecycleEnhancer',
        message: `Plugin "${pluginName}" lifecycle method "${phase}" failed: ${errorObj.message}`,
        data: {
          pluginName,
          phase,
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
      });
    }
  };
}

/**
 * 批量增强插件列表的参数接口
 */
export interface EnhancePluginsLifecycleParams<
  Config = Record<string, unknown>,
> {
  plugins: Plugin<Config>[];
  lifecycleConfig?: CustomTableLifecycleConfig;
  lifecycleManager?: LifecycleManager;
}

/**
 * 批量增强插件列表
 */
export function enhancePluginsLifecycle<Config = Record<string, unknown>>({
  plugins,
  lifecycleConfig,
  lifecycleManager,
}: EnhancePluginsLifecycleParams<Config>): Plugin<Config>[] {
  if (!lifecycleConfig) {
    return plugins;
  }

  const manager = lifecycleManager || createLifecycleManager();

  return plugins.map((plugin) =>
    enhancePluginLifecycle({
      plugin,
      lifecycleConfig,
      lifecycleManager: manager,
    }),
  );
}

/**
 * 为插件上下文添加生命周期触发器的参数接口
 */
export interface AddLifecycleTriggerToContextParams {
  context: PluginContext;
  lifecycleManager: LifecycleManager;
  lifecycleConfig?: CustomTableLifecycleConfig;
}

/**
 * 为插件上下文添加生命周期触发器
 */
export function addLifecycleTriggerToContext({
  context,
  lifecycleManager,
  lifecycleConfig,
}: AddLifecycleTriggerToContextParams): PluginContext {
  const enhancedContext = { ...context };

  // 添加生命周期触发器到 helpers
  if (!enhancedContext.helpers.lifecycle) {
    enhancedContext.helpers.lifecycle = {
      trigger: async ({
        phase,
        pluginName,
      }: {
        phase: PluginLifecycle;
        pluginName: string;
      }) => {
        if (lifecycleConfig) {
          await lifecycleManager.executeLifecycle({
            phase,
            pluginName,
            context: enhancedContext,
            lifecycleConfig,
          });
        }
      },
      addListener: (listener: (phase: string, ...args: unknown[]) => void) => {
        lifecycleManager.addListener(listener as any);
      },
      removeListener: (
        listener: (phase: string, ...args: unknown[]) => void,
      ) => {
        lifecycleManager.removeListener(listener as any);
      },
      getMetrics: () => {
        const metrics = lifecycleManager.getPerformanceMetrics();
        const result: Record<string, unknown> = {};
        metrics.forEach((value, key) => {
          result[key] = value;
        });
        return result;
      },
    };
  }

  return enhancedContext;
}

/**
 * 检查插件是否支持生命周期
 */
export function hasLifecycleSupport(plugin: Plugin): boolean {
  return Boolean(
    plugin.beforeMount ||
      plugin.afterMount ||
      plugin.beforeUpdate ||
      plugin.afterUpdate ||
      plugin.beforeUnmount ||
      plugin.uninstall,
  );
}

/**
 * 获取插件支持的生命周期阶段
 */
export function getPluginLifecyclePhases(plugin: Plugin): LifecyclePhase[] {
  const phases: LifecyclePhase[] = [];

  if (plugin.beforeMount) {
    phases.push('beforeMount');
  }
  if (plugin.afterMount) {
    phases.push('afterMount');
  }
  if (plugin.beforeUpdate) {
    phases.push('beforeUpdate');
  }
  if (plugin.afterUpdate) {
    phases.push('afterUpdate');
  }
  if (plugin.beforeUnmount) {
    phases.push('beforeUnmount');
  }
  if (plugin.uninstall) {
    phases.push('uninstall');
  }

  return phases;
}
