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

import type { Plugin, PluginContext, PluginStatus } from '@/custom-table/types';
/**
 * 插件注册管理模块
 * 负责插件的注册、注销和查询
 *

 * @date 2025-12-19
 */
import {
  PluginPriorityEnum,
  PluginStatusEnum,
} from '@/custom-table/types/core/enums';
import { devLog } from '@/custom-table/utils';

/**
 * @name 插件实例信息
 */
export interface PluginInstance {
  plugin: Plugin;
  context: PluginContext;
  status: PluginStatus;
  error?: Error;
  performance: {
    installTime: number;
    setupTime: number;
    renderTime: number;
    lastExecutionTime: number;
  };
}

/**
 * @name 插件注册表管理器
 */
export class PluginRegistry {
  private plugins: Plugin[] = [];
  private pluginInstances: Map<string, PluginInstance> = new Map();

  /**
   * @name 注册插件
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async register(plugin: Plugin): Promise<{ success: boolean; error?: Error }> {
    try {
      // 检查插件名称是否已存在
      if (this.plugins.some((p) => p.name === plugin.name)) {
        devLog.log({
          component: 'PluginRegistry',
          message: `Plugin "${plugin.name}" is already registered, skipping.`,
        });
        return {
          success: false,
          error: new Error(`插件 "${plugin.name}" 已注册`),
        };
      }

      // 检查依赖
      if (plugin.dependencies?.length) {
        const missingDeps = plugin.dependencies.filter(
          (dep: string) => !this.plugins.some((p) => p.name === dep),
        );

        if (missingDeps.length) {
          return {
            success: false,
            error: new Error(`缺少依赖: ${missingDeps.join(', ')}`),
          };
        }
      }

      // 检查冲突
      if (plugin.conflicts?.length) {
        const conflicting = plugin.conflicts.filter((conf: string) =>
          this.plugins.some((p) => p.name === conf),
        );

        if (conflicting.length) {
          return {
            success: false,
            error: new Error(`与插件冲突: ${conflicting.join(', ')}`),
          };
        }
      }

      // 记录安装时间
      const installStartTime = performance.now();

      // 添加到插件列表
      this.plugins.push(plugin);

      // 记录安装结束时间并创建实例
      const installEndTime = performance.now();
      const installTime = installEndTime - installStartTime;

      this.pluginInstances.set(plugin.name, {
        plugin,
        context: {} as PluginContext, // 初始化为空，稍后设置
        status: PluginStatusEnum.INSTALLED,
        performance: {
          installTime,
          setupTime: 0,
          renderTime: 0,
          lastExecutionTime: 0,
        },
      });

      // 按优先级排序
      const priorityMap = {
        [PluginPriorityEnum.CRITICAL]: -1,
        [PluginPriorityEnum.HIGH]: 0,
        [PluginPriorityEnum.MEDIUM]: 1,
        [PluginPriorityEnum.LOW]: 2,
      } as const;
      this.plugins.sort((a, b) => {
        const aPriority =
          priorityMap[a.priority as keyof typeof priorityMap] || 3;
        const bPriority =
          priorityMap[b.priority as keyof typeof priorityMap] || 3;
        return aPriority - bPriority;
      });

      return { success: true };
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      return { success: false, error: errorObj };
    }
  }

  /**
   * @name 注销插件
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async unregister(
    pluginName: string,
  ): Promise<{ success: boolean; error?: Error }> {
    const plugin = this.getPlugin(pluginName);
    if (!plugin) {
      return {
        success: false,
        error: new Error(`插件 "${pluginName}" 不存在`),
      };
    }

    const instance = this.pluginInstances.get(pluginName);
    let uninstallError: Error | undefined;

    if (instance && plugin.uninstall) {
      try {
        await plugin.uninstall(instance.context);
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
        devLog.error({
          component: 'PluginRegistry',
          message: `插件 "${pluginName}" 卸载失败`,
          data: {
            pluginName,
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
        });
        uninstallError = errorObj;
      }
    }

    // 从列表中移除
    const index = this.plugins.findIndex((p) => p.name === pluginName);
    if (index > -1) {
      this.plugins.splice(index, 1);
    }

    // 移除实例
    this.pluginInstances.delete(pluginName);

    // 如果卸载过程有错误，返回错误信息，但插件已成功从注册表中移除
    if (uninstallError) {
      return { success: false, error: uninstallError };
    }

    return { success: true };
  }

  /**
   * @name 获取指定插件
   */
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.find((p) => p.name === pluginName);
  }

  /**
   * @name 获取所有插件
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  /**
   * @name 获取已启用的插件
   */
  getEnabledPlugins(): Plugin[] {
    return this.plugins.filter((p) => p.enabled);
  }

  /**
   * @name 获取插件实例
   */
  getInstance(pluginName: string): PluginInstance | undefined {
    return this.pluginInstances.get(pluginName);
  }

  /**
   * @name 检查插件是否已启用
   */
  isEnabled(pluginName: string): boolean {
    const plugin = this.getPlugin(pluginName);
    return plugin ? (plugin.enabled ?? false) : false;
  }

  /**
   * @name 设置插件上下文
   */
  setPluginContext({
    pluginName,
    context,
  }: { pluginName: string; context: PluginContext }): void {
    const instance = this.pluginInstances.get(pluginName);
    if (instance) {
      instance.context = context;
    }
  }

  /**
   * @name 更新插件状态
   */
  updatePluginStatus({
    pluginName,
    status,
  }: { pluginName: string; status: PluginStatus }): void {
    const instance = this.pluginInstances.get(pluginName);
    if (instance) {
      instance.status = status;
    }
  }

  /**
   * @name 清空所有插件
   */
  clear(): void {
    this.plugins = [];
    this.pluginInstances.clear();
  }
}
