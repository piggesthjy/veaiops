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
 * 插件工具函数模块
 * 提供插件系统的实用工具函数
 *

 * @date 2025-12-19
 */
import type {
  BaseQuery,
  BaseRecord,
  Plugin,
  PluginContext,
  PluginManager,
} from '@/custom-table/types';
import { devLog } from '@/custom-table/utils';
import type React from 'react';

/**
 * @name 初始化所有插件
 *
 * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
 */
export async function initializePlugins(
  pluginManager: PluginManager,
  context: PluginContext,
): Promise<{ success: boolean; error?: Error }> {
  try {
    // 设置所有插件的上下文
    const plugins = pluginManager.getAllPlugins();
    plugins.forEach((plugin: Plugin) => {
      pluginManager.setPluginContext?.({ pluginName: plugin.name, context });
    });

    // 依次执行各插件的 install 与 setup，确保 helpers/state 已注入
    type PluginWithInstallSetup = Plugin & {
      install?: (context: PluginContext) => Promise<void>;
      setup?: (context: PluginContext) => Promise<void>;
    };

    let lastError: Error | undefined;

    for (const plugin of plugins) {
      try {
        const pluginWithMethods = plugin;
        if (typeof pluginWithMethods.install === 'function') {
          await pluginWithMethods.install(context);
        }
        if (typeof pluginWithMethods.setup === 'function') {
          await pluginWithMethods.setup(context);
        }
      } catch (error: unknown) {
        // ✅ 正确：单插件的初始化失败不阻塞其它插件，但记录错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        // 注意：这里只记录日志，不抛出错误，因为单个插件失败不应阻塞其他插件
        devLog.warn({
          component: 'PluginUtils',
          message: `Plugin "${plugin.name}" initialization failed: ${errorObj.message}`,
          data: {
            pluginName: plugin.name,
            error: errorObj.message,
            stack: errorObj.stack,
          },
        });
        lastError = errorObj;
      }
    }

    // 执行初始化生命周期（兼容旧版 onMount 钩子）
    // 注意：executeHook 可能返回结果对象或 void，这里兼容两种方式
    try {
      // 注意：executeHook 的实际实现返回结果对象，但接口定义为 void
      // 使用类型断言兼容两种方式，实际运行时返回的是结果对象
      const hookResult = await pluginManager.executeHook?.({
        lifecycle: 'onMount',
        context,
      });
      const result = hookResult as
        | { success: boolean; error?: Error }
        | void
        | undefined;
      // 如果返回结果对象，检查是否成功
      if (result && typeof result === 'object' && 'success' in result) {
        if (!result.success && result.error) {
          devLog.error({
            component: 'PluginUtils',
            message: `执行 onMount 钩子失败: ${result.error.message}`,
            data: {
              error: result.error.message,
              stack: result.error.stack,
              errorObj: result.error,
            },
          });
          lastError = result.error;
        }
      }
    } catch (error: unknown) {
      // ✅ 正确：兼容旧版本可能抛出错误的情况
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      devLog.error({
        component: 'PluginUtils',
        message: `执行 onMount 钩子失败: ${errorObj.message}`,
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
      });
      lastError = errorObj;
    }

    // 如果有任何错误，返回失败结果，但不阻塞整个初始化流程
    if (lastError) {
      return { success: false, error: lastError };
    }

    return { success: true };
  } catch (error: unknown) {
    // ✅ 正确：记录错误并返回失败结果
    const errorObj = error instanceof Error ? error : new Error(String(error));
    devLog.error({
      component: 'PluginUtils',
      message: `初始化插件失败: ${errorObj.message}`,
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
      },
    });
    return { success: false, error: errorObj };
  }
}

/**
 * @name 清理所有插件
 *
 * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
 */
export async function cleanupPlugins(
  pluginManager: PluginManager,
  context: PluginContext,
): Promise<{ success: boolean; error?: Error }> {
  try {
    // 注意：executeHook 的实际实现返回结果对象，但接口定义为 void
    // 使用类型断言兼容两种方式，实际运行时返回的是结果对象
    const hookResult = await pluginManager.executeHook?.({
      lifecycle: 'onDestroy',
      context,
    });
    const result = hookResult as
      | { success: boolean; error?: Error }
      | void
      | undefined;
    // 如果返回结果对象，直接返回；否则返回成功
    if (result && typeof result === 'object' && 'success' in result) {
      if (!result.success && result.error) {
        devLog.error({
          component: 'PluginUtils',
          message: `清理插件失败: ${result.error.message}`,
          data: {
            error: result.error.message,
            stack: result.error.stack,
            errorObj: result.error,
          },
        });
      }
      return result;
    }
    return { success: true };
  } catch (error: unknown) {
    // ✅ 正确：兼容旧版本可能抛出错误的情况
    const errorObj = error instanceof Error ? error : new Error(String(error));
    devLog.error({
      component: 'PluginUtils',
      message: `清理插件失败: ${errorObj.message}`,
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
      },
    });
    return { success: false, error: errorObj };
  }
}

/**
 * @name 增强属性
 */
export function enhanceProps(
  pluginManager: PluginManager,
  props: Record<string, unknown>,
  context: PluginContext,
): Record<string, unknown> {
  const enabledPlugins = pluginManager.getAllPlugins();
  let enhancedProps = { ...props };

  enabledPlugins.forEach((plugin: Plugin) => {
    if (plugin.enhanceProps && typeof plugin.enhanceProps === 'function') {
      try {
        const enhanced = plugin.enhanceProps(enhancedProps, context);
        if (enhanced && typeof enhanced === 'object') {
          enhancedProps = { ...enhancedProps, ...enhanced };
        }
      } catch (error: unknown) {
        // ✅ 正确：记录错误但不中断属性增强流程
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        devLog.warn({
          component: 'PluginUtils',
          message: `Plugin "${plugin.name}" enhanceProps failed: ${errorObj.message}`,
          data: {
            pluginName: plugin.name,
            error: errorObj.message,
            stack: errorObj.stack,
          },
        });
      }
    }
  });

  return enhancedProps;
}

/**
 * @name 包装组件与插件
 */
/**
 * wrapWithPlugins 参数接口
 */
interface WrapWithPluginsParams<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  pluginManager: PluginManager;
  content: React.ReactNode;
  context: PluginContext<RecordType, QueryType>;
}

export function wrapWithPlugins<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>({
  pluginManager,
  content,
  context,
}: WrapWithPluginsParams<RecordType, QueryType>): React.ReactNode {
  const enabledPlugins = pluginManager.getAllPlugins().filter(
    (plugin: Plugin) =>
      (
        plugin as unknown as {
          wrapComponent?: (
            node: React.ReactNode,
            ctx: PluginContext,
          ) => React.ReactNode;
        }
      ).wrapComponent &&
      typeof (
        plugin as unknown as {
          wrapComponent?: (
            node: React.ReactNode,
            ctx: PluginContext,
          ) => React.ReactNode;
        }
      ).wrapComponent === 'function',
  );

  let wrappedContent = content;

  enabledPlugins.forEach((plugin: Plugin) => {
    try {
      const wrap = (
        plugin as unknown as {
          wrapComponent?: (
            node: React.ReactNode,
            ctx: PluginContext,
          ) => React.ReactNode;
        }
      ).wrapComponent;
      if (wrap) {
        // Widen generic PluginContext<RecordType, QueryType> to base PluginContext for plugin wrappers
        wrappedContent = wrap(
          wrappedContent,
          context as unknown as PluginContext,
        );
      }
    } catch (error: unknown) {
      // ✅ 正确：记录错误但不中断组件包装流程
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      devLog.warn({
        component: 'PluginUtils',
        message: `Plugin "${plugin.name}" wrapComponent failed: ${errorObj.message}`,
        data: {
          pluginName: plugin.name,
          error: errorObj.message,
          stack: errorObj.stack,
        },
      });
    }
  });

  return wrappedContent;
}

/**
 * @name 验证插件配置
 */
export function validatePluginConfig(plugin: unknown): boolean {
  if (!plugin || typeof plugin !== 'object') {
    return false;
  }

  const p = plugin as {
    name?: unknown;
    version?: unknown;
    dependencies?: unknown;
    conflicts?: unknown;
    priority?: unknown;
  };
  if (!p.name || typeof p.name !== 'string') {
    return false;
  }

  if (!p.version || typeof p.version !== 'string') {
    return false;
  }

  if (p.dependencies && !Array.isArray(p.dependencies)) {
    return false;
  }

  if (p.conflicts && !Array.isArray(p.conflicts)) {
    return false;
  }

  if (
    p.priority &&
    !['critical', 'high', 'medium', 'low'].includes(p.priority as string)
  ) {
    return false;
  }

  return true;
}

/**
 * @name 排序插件
 */
export function sortPluginsByPriority<T extends { priority?: string }>(
  plugins: T[],
): T[] {
  const priorityMap = { critical: -1, high: 0, medium: 1, low: 2 };

  return [...plugins].sort((a, b) => {
    const aPriority =
      priorityMap[(a.priority as keyof typeof priorityMap) || 'low'] ?? 3;
    const bPriority =
      priorityMap[(b.priority as keyof typeof priorityMap) || 'low'] ?? 3;
    return aPriority - bPriority;
  });
}

/**
 * @name 检查插件依赖
 */
export function checkPluginDependencies(
  plugin: { dependencies?: string[] },
  registeredPlugins: { name: string }[],
): { isValid: boolean; missingDeps: string[] } {
  if (!plugin.dependencies || plugin.dependencies.length === 0) {
    return { isValid: true, missingDeps: [] };
  }

  const registeredNames = registeredPlugins.map((p) => p.name);
  const missingDeps = plugin.dependencies.filter(
    (dep: string) => !registeredNames.includes(dep),
  );

  return {
    isValid: missingDeps.length === 0,
    missingDeps,
  };
}

/**
 * @name 检查插件冲突
 */
export function checkPluginConflicts(
  plugin: { conflicts?: string[] },
  registeredPlugins: { name: string }[],
): { hasConflicts: boolean; conflicts: string[] } {
  if (!plugin.conflicts || plugin.conflicts.length === 0) {
    return { hasConflicts: false, conflicts: [] };
  }

  const registeredNames = registeredPlugins.map((p) => p.name);
  const conflicts = plugin.conflicts.filter((conf: string) =>
    registeredNames.includes(conf),
  );

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}
