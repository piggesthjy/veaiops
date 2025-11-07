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

import type { PluginContext } from '@/custom-table/types/plugins/core/context';
import type {
  CustomTableLifecycleConfig,
  LifecycleCallback,
  LifecycleExecutionContext,
  LifecycleListener,
  LifecycleManagerConfig,
  LifecyclePhase,
  PluginLifecycleConfig,
  PluginSpecificLifecycleConfig,
} from '@/custom-table/types/plugins/lifecycle';
/**
 * 生命周期管理器
 * 负责处理插件生命周期回调的执行和管理
 */
import type { BaseQuery, BaseRecord } from '@veaiops/types';
import { devLog } from './log-utils';

/**
 * 执行生命周期回调的参数接口
 */
interface ExecuteLifecycleParams<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  phase: LifecyclePhase;
  pluginName: string;
  context: PluginContext<RecordType, QueryType>;
  lifecycleConfig?: CustomTableLifecycleConfig;
}

/**
 * 收集需要执行的回调的参数接口
 */
interface CollectCallbacksParams {
  phase: LifecyclePhase;
  pluginName: string;
  userConfig?: CustomTableLifecycleConfig;
}

/**
 * 从配置中获取回调函数的参数接口
 */
interface GetCallbackFromConfigParams {
  config: PluginLifecycleConfig;
  phase: LifecyclePhase;
}

/**
 * 获取插件特定配置的参数接口
 */
interface GetPluginConfigParams {
  pluginsConfig: PluginSpecificLifecycleConfig;
  pluginName: string;
}

/**
 * 执行回调列表的参数接口
 */
interface ExecuteCallbacksParams<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  callbacks: LifecycleCallback[];
  context: PluginContext<RecordType, QueryType>;
}

/**
 * 带超时的回调执行的参数接口
 */
interface ExecuteWithTimeoutParams<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  callback: LifecycleCallback;
  context: PluginContext<RecordType, QueryType>;
  timeout: number;
}

/**
 * 处理生命周期错误的参数接口
 */
interface HandleLifecycleErrorParams {
  error: Error;
  phase: LifecyclePhase;
  pluginName: string;
  userConfig?: CustomTableLifecycleConfig;
}

/**
 * 生命周期管理器类
 */
export class LifecycleManager {
  private config: LifecycleManagerConfig;
  private listeners: LifecycleListener[] = [];
  private performanceMetrics: Map<string, number> = new Map();

  constructor(config: LifecycleManagerConfig = {}) {
    this.config = {
      enablePerformanceMonitoring: false,
      timeout: 5000, // 默认5秒超时
      ...config,
    };

    if (config.listeners) {
      this.listeners = [...config.listeners];
    }
  }

  /**
   * 执行生命周期回调
   */
  async executeLifecycle<
    RecordType extends BaseRecord = BaseRecord,
    QueryType extends BaseQuery = BaseQuery,
  >({
    phase,
    pluginName,
    context,
    lifecycleConfig: userConfig,
  }: ExecuteLifecycleParams<RecordType, QueryType>): Promise<void> {
    const startTime = Date.now();
    const executionContext: LifecycleExecutionContext = {
      phase,
      pluginName,
      startTime,
      timestamp: startTime,
      context: context as unknown as PluginContext<BaseRecord, BaseQuery>,
    };

    try {
      // 触发监听器
      this.listeners.forEach((listener) => {
        try {
          listener(executionContext);
        } catch (error: unknown) {
          // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
          // 记录错误但不中断其他监听器的执行
          const errorObj =
            error instanceof Error ? error : new Error(String(error));
          devLog.warn({
            component: 'LifecycleManager',
            message: `生命周期监听器执行失败: ${errorObj.message}`,
            data: {
              phase: executionContext.phase,
              pluginName: executionContext.pluginName,
              error: errorObj.message,
              stack: errorObj.stack,
              errorObj,
            },
          });
        }
      });

      // 收集要执行的回调
      const callbacks = this.collectCallbacks({
        phase,
        pluginName,
        userConfig,
      });

      // 执行回调
      await this.executeCallbacks<RecordType, QueryType>({
        callbacks,
        context,
      });

      // 记录性能指标
      if (this.config.enablePerformanceMonitoring) {
        const duration = Date.now() - startTime;
        const key = `${pluginName}-${phase}`;
        this.performanceMetrics.set(key, duration);

        // 调试模式下可在此处添加额外的日志输出
      }
    } catch (error) {
      // 注意：handleLifecycleError 期望对象参数，使用对象解构方式传递
      this.handleLifecycleError({
        error: error as Error,
        phase,
        pluginName,
        userConfig,
      });
    }
  }

  /**
   * 收集需要执行的回调
   */
  private collectCallbacks({
    phase,
    pluginName,
    userConfig,
  }: {
    phase: LifecyclePhase;
    pluginName: string;
    userConfig?: CustomTableLifecycleConfig;
  }): LifecycleCallback[] {
    const callbacks: LifecycleCallback[] = [];

    if (!userConfig) {
      return callbacks;
    }

    // 全局配置回调
    if (userConfig.global) {
      const globalCallback = this.getCallbackFromConfig({
        config: userConfig.global,
        phase,
      });
      if (globalCallback) {
        callbacks.push(globalCallback);
      }
    }

    // 插件特定配置回调
    if (userConfig.plugins) {
      const pluginConfig = this.getPluginConfig({
        pluginsConfig: userConfig.plugins,
        pluginName,
      });
      if (pluginConfig) {
        const pluginCallback = this.getCallbackFromConfig({
          config: pluginConfig,
          phase,
        });
        if (pluginCallback) {
          callbacks.push(pluginCallback);
        }
      }
    }

    return callbacks;
  }

  /**
   * 从配置中获取回调函数
   */
  private getCallbackFromConfig({
    config,
    phase,
  }: {
    config: PluginLifecycleConfig;
    phase: LifecyclePhase;
  }): LifecycleCallback | undefined {
    switch (phase) {
      case 'beforeMount':
        return config.beforeMount;
      case 'afterMount':
        return config.afterMount;
      case 'beforeUpdate':
        return config.beforeUpdate;
      case 'afterUpdate':
        return config.afterUpdate;
      case 'beforeUnmount':
        return config.beforeUnmount;
      case 'uninstall':
        return config.onUninstall;
      default:
        return undefined;
    }
  }

  /**
   * 获取插件特定配置
   */
  private getPluginConfig({
    pluginsConfig,
    pluginName,
  }: {
    pluginsConfig: PluginSpecificLifecycleConfig;
    pluginName: string;
  }): PluginLifecycleConfig | undefined {
    // 将插件名映射到配置键
    const configKey = this.mapPluginNameToConfigKey(pluginName);
    return configKey ? pluginsConfig[configKey] : undefined;
  }

  /**
   * 将插件名映射到配置键
   */
  private mapPluginNameToConfigKey(
    pluginName: string,
  ): keyof PluginSpecificLifecycleConfig | undefined {
    const mapping: Record<string, keyof PluginSpecificLifecycleConfig> = {
      'data-source': 'dataSource',
      'table-alert': 'tableAlert',
      'table-columns': 'tableColumns',
      'table-filter': 'tableFilter',
      'table-pagination': 'tablePagination',
      'table-sorting': 'tableSorting',
      'query-sync': 'querySync',
    };

    return mapping[pluginName];
  }

  /**
   * 执行回调列表
   */
  private async executeCallbacks<
    RecordType extends BaseRecord = BaseRecord,
    QueryType extends BaseQuery = BaseQuery,
  >({
    callbacks,
    context,
  }: ExecuteCallbacksParams<RecordType, QueryType>): Promise<void> {
    const promises = callbacks.map((callback) =>
      this.executeWithTimeout({
        callback,
        context,
        timeout: this.config.timeout || 5000,
      }),
    );

    await Promise.allSettled(promises);
  }

  /**
   * 带超时的回调执行
   */
  private async executeWithTimeout<
    RecordType extends BaseRecord = BaseRecord,
    QueryType extends BaseQuery = BaseQuery,
  >({
    callback,
    context,
    timeout,
  }: {
    callback: LifecycleCallback;
    context: PluginContext<RecordType, QueryType>;
    timeout: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Lifecycle callback timeout after ${timeout}ms`));
      }, timeout);

      Promise.resolve(
        callback(context as unknown as PluginContext<BaseRecord, BaseQuery>),
      )
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }

  /**
   * 处理生命周期错误
   */
  private handleLifecycleError({
    error,
    phase,
    pluginName,
    userConfig,
  }: {
    error: Error;
    phase: LifecyclePhase;
    pluginName: string;
    userConfig?: CustomTableLifecycleConfig;
  }): void {
    const errorHandling = userConfig?.errorHandling || 'warn';

    switch (errorHandling) {
      case 'ignore':
        // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
        // 静默忽略错误，但仍记录日志用于调试
        devLog.warn({
          component: 'LifecycleManager',
          message: `忽略生命周期错误 (${pluginName}/${phase}): ${error.message}`,
          data: {
            pluginName,
            phase,
            error: error.message,
            stack: error.stack,
            errorObj: error,
          },
        });
        break;
      case 'warn':
        // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
        devLog.warn({
          component: 'LifecycleManager',
          message: `生命周期执行警告 (${pluginName}/${phase}): ${error.message}`,
          data: {
            pluginName,
            phase,
            error: error.message,
            stack: error.stack,
            errorObj: error,
          },
        });
        break;
      case 'throw':
        throw error;
      default:
        // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
        // 默认行为：记录警告
        devLog.warn({
          component: 'LifecycleManager',
          message: `生命周期执行警告 (${pluginName}/${phase}): ${error.message}`,
          data: {
            pluginName,
            phase,
            error: error.message,
            stack: error.stack,
            errorObj: error,
          },
        });
    }
  }

  /**
   * 添加生命周期监听器
   */
  addListener(listener: LifecycleListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除生命周期监听器
   */
  removeListener(listener: LifecycleListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): Map<string, number> {
    return new Map(this.performanceMetrics);
  }

  /**
   * 清除性能指标
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.listeners.length = 0;
    this.performanceMetrics.clear();
  }
}

/**
 * 创建默认生命周期管理器实例
 */
export function createLifecycleManager(
  config?: LifecycleManagerConfig,
): LifecycleManager {
  return new LifecycleManager(config);
}

/**
 * 合并生命周期配置
 */
export function mergeLifecycleConfigs(
  ...configs: (CustomTableLifecycleConfig | undefined)[]
): CustomTableLifecycleConfig {
  const merged: CustomTableLifecycleConfig = {
    global: {},
    plugins: {},
    debug: false,
    errorHandling: 'warn',
  };

  configs.forEach((config) => {
    if (!config) {
      return;
    }

    // 合并全局配置
    if (config.global) {
      merged.global = { ...merged.global, ...config.global };
    }

    // 合并插件配置
    if (config.plugins) {
      merged.plugins = { ...merged.plugins, ...config.plugins };
    }

    // 合并其他选项
    if (config.debug !== undefined) {
      merged.debug = config.debug;
    }

    if (config.errorHandling) {
      merged.errorHandling = config.errorHandling;
    }
  });

  return merged;
}
