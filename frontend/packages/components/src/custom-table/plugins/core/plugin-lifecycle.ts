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

import type { PluginLifecycle } from '@/custom-table/types';
import {
  LifecyclePhaseEnum,
  PluginStatusEnum,
} from '@/custom-table/types/core/enums';
import { devLog } from '@/custom-table/utils';
/**
 * 插件生命周期管理模块
 * 负责插件的启用、禁用和生命周期执行
 *

 * @date 2025-12-19
 */
import type { PluginContext } from '@veaiops/types';
import type { PluginRegistry } from './plugin-registry';

/**
 * @name 插件生命周期管理器
 */
export class PluginLifecycleManager {
  constructor(private registry: PluginRegistry) {}

  /**
   * @name 启用插件
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async enablePlugin(
    pluginName: string,
  ): Promise<{ success: boolean; error?: Error }> {
    const plugin = this.registry.getPlugin(pluginName);
    if (!plugin) {
      return {
        success: false,
        error: new Error(`插件 "${pluginName}" 不存在`),
      };
    }

    if (plugin.enabled) {
      return { success: true };
    }

    const instance = this.registry.getInstance(pluginName);
    if (instance && plugin.onMount) {
      try {
        const setupStartTime = performance.now();
        await plugin.onMount(instance.context);
        const setupEndTime = performance.now();

        instance.performance.setupTime = setupEndTime - setupStartTime;
        this.registry.updatePluginStatus({
          pluginName,
          status: PluginStatusEnum.ACTIVE,
        });
        plugin.enabled = true;
        return { success: true };
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        if (instance) {
          instance.error = errorObj;
          this.registry.updatePluginStatus({
            pluginName,
            status: PluginStatusEnum.ERROR,
          });
        }
        return { success: false, error: errorObj };
      }
    }

    plugin.enabled = true;
    return { success: true };
  }

  /**
   * @name 禁用插件
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async disablePlugin(
    pluginName: string,
  ): Promise<{ success: boolean; error?: Error }> {
    const plugin = this.registry.getPlugin(pluginName);
    if (!plugin) {
      return {
        success: false,
        error: new Error(`插件 "${pluginName}" 不存在`),
      };
    }

    if (!plugin.enabled) {
      return { success: true };
    }

    const instance = this.registry.getInstance(pluginName);
    if (instance && plugin.onUnmount) {
      try {
        await plugin.onUnmount(instance.context);
        this.registry.updatePluginStatus({
          pluginName,
          status: PluginStatusEnum.INACTIVE,
        });
        plugin.enabled = false;
        return { success: true };
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        if (instance) {
          instance.error = errorObj;
          this.registry.updatePluginStatus({
            pluginName,
            status: PluginStatusEnum.ERROR,
          });
        }
        // 即使卸载失败，也禁用插件
        plugin.enabled = false;
        return { success: false, error: errorObj };
      }
    }

    plugin.enabled = false;
    return { success: true };
  }

  /**
   * @name 执行生命周期钩子
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async executeHook({
    lifecycle,
    context,
  }: {
    lifecycle: PluginLifecycle;
    context: PluginContext;
  }): Promise<{ success: boolean; error?: Error }> {
    const enabledPlugins = this.registry.getEnabledPlugins();

    type PluginWithLifecycle = Plugin & {
      [K in PluginLifecycle]?: (context: PluginContext) => Promise<void> | void;
    };

    let lastError: Error | undefined;

    for (const plugin of enabledPlugins) {
      try {
        const pluginWithLifecycle = plugin as any;
        const hookFn = pluginWithLifecycle[lifecycle];
        if (typeof hookFn === 'function') {
          const startTime = performance.now();
          await hookFn(context);
          const endTime = performance.now();

          const instance = this.registry.getInstance(plugin.name);
          if (instance) {
            instance.performance.lastExecutionTime = endTime - startTime;
            this.updatePluginStatus({ pluginName: plugin.name, lifecycle });
          }
        }
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const instance = this.registry.getInstance(plugin.name);
        if (instance) {
          instance.error = errorObj;
          this.registry.updatePluginStatus({
            pluginName: plugin.name,
            status: PluginStatusEnum.ERROR,
          });
        }
        // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
        devLog.error({
          component: 'PluginLifecycleManager',
          message: `执行插件生命周期钩子失败`,
          data: {
            pluginName: plugin.name,
            lifecycle,
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
        });
        lastError = errorObj;
      }
    }

    if (lastError) {
      return { success: false, error: lastError };
    }

    return { success: true };
  }

  /**
   * @name 更新插件状态
   */
  private updatePluginStatus({
    pluginName,
    lifecycle,
  }: {
    pluginName: string;
    lifecycle: PluginLifecycle;
  }): void {
    const instance = this.registry.getInstance(pluginName);
    if (!instance) {
      return;
    }

    switch (lifecycle) {
      case 'onMount':
        this.registry.updatePluginStatus({
          pluginName,
          status: PluginStatusEnum.ACTIVE,
        });
        break;
      case 'onUnmount':
        this.registry.updatePluginStatus({
          pluginName,
          status: PluginStatusEnum.INACTIVE,
        });
        break;
      case 'onUpdate':
        // 保持当前状态
        break;
      case 'onDestroy':
        this.registry.updatePluginStatus({
          pluginName,
          status: PluginStatusEnum.DESTROYED,
        });
        break;
      default:
        // 其他生命周期保持当前状态
        break;
    }
  }

  /**
   * @name 初始化所有插件
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async initializePlugins(
    context: PluginContext,
  ): Promise<{ success: boolean; error?: Error }> {
    const result = await this.executeHook({
      lifecycle: LifecyclePhaseEnum.ON_MOUNT,
      context,
    });
    if (!result.success && result.error) {
      // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
      devLog.error({
        component: 'PluginLifecycleManager',
        message: '初始化插件失败',
        data: {
          error: result.error.message,
          stack: result.error.stack,
          errorObj: result.error,
        },
      });
    }
    return result;
  }

  /**
   * @name 清理所有插件
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async cleanupPlugins(
    context: PluginContext,
  ): Promise<{ success: boolean; error?: Error }> {
    const result = await this.executeHook({
      lifecycle: LifecyclePhaseEnum.ON_DESTROY,
      context,
    });
    if (!result.success && result.error) {
      // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
      devLog.error({
        component: 'PluginLifecycleManager',
        message: '清理插件失败',
        data: {
          error: result.error.message,
          stack: result.error.stack,
          errorObj: result.error,
        },
      });
    }
    return result;
  }
}
