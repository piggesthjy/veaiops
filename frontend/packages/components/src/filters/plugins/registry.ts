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

import type {
  EventHandler,
  FilterEventBus,
  FilterPlugin,
  FilterPluginContext,
  PluginRegistryOptions,
} from '@veaiops/types';

// 简单的事件总线实现
class EventBus implements FilterEventBus {
  private events: Map<string, EventHandler[]> = new Map();

  emit(event: string, ...args: unknown[]): void {
    const handlers = this.events.get(event) || [];
    handlers.forEach((handler) => handler(...args));
  }

  on({
    event,
    handler,
  }: {
    event: string;
    handler: EventHandler;
  }): void {
    const handlers = this.events.get(event) || [];
    handlers.push(handler);
    this.events.set(event, handlers);
  }

  off({
    event,
    handler,
  }: {
    event: string;
    handler: EventHandler;
  }): void {
    const handlers = this.events.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.events.set(event, handlers);
    }
  }
}

// 插件注册器
class FilterPluginRegistry {
  private plugins: Map<string, FilterPlugin> = new Map();
  private eventBus: FilterEventBus = new EventBus();
  private globalContext: FilterPluginContext = {
    eventBus: this.eventBus,
  };

  /**
   * 注册插件
   */
  register(plugin: FilterPlugin, options: PluginRegistryOptions = {}): void {
    const { override = false } = options;

    if (this.plugins.has(plugin.type) && !override) {
      return;
    }

    // 验证插件依赖
    if (plugin.dependencies) {
      const missingDeps = plugin.dependencies.filter(
        (dep) => !this.plugins.has(dep),
      );
      if (missingDeps.length > 0) {
        throw new Error(
          `Plugin "${plugin.type}" missing dependencies: ${missingDeps.join(
            ', ',
          )}`,
        );
      }
    }

    this.plugins.set(plugin.type, plugin);
    this.eventBus.emit('plugin:registered', plugin);
  }

  /**
   * 注销插件
   */
  unregister(type: string): boolean {
    const plugin = this.plugins.get(type);
    if (plugin) {
      this.plugins.delete(type);
      this.eventBus.emit('plugin:unregistered', plugin);

      return true;
    }
    return false;
  }

  /**
   * 获取插件
   */
  get(type: string): FilterPlugin | undefined {
    return this.plugins.get(type);
  }

  /**
   * 检查插件是否存在
   */
  has(type: string): boolean {
    return this.plugins.has(type);
  }

  /**
   * 获取所有注册的插件
   */
  getAll(): FilterPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件类型列表
   */
  getTypes(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * 批量注册插件
   */
  registerBatch(
    plugins: FilterPlugin[],
    options: PluginRegistryOptions = {},
  ): void {
    plugins.forEach((plugin) => this.register(plugin, options));
  }

  /**
   * 设置全局上下文
   */
  setGlobalContext(context: Partial<FilterPluginContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * 获取全局上下文
   */
  getGlobalContext(): FilterPluginContext {
    return this.globalContext;
  }

  /**
   * 获取事件总线
   */
  getEventBus(): FilterEventBus {
    return this.eventBus;
  }

  /**
   * 清空所有插件
   */
  clear(): void {
    this.plugins.clear();
    this.eventBus.emit('registry:cleared');
  }

  /**
   * 获取插件统计信息
   */
  getStats(): {
    total: number;
    types: string[];
    plugins: { type: string; name: string; version?: string }[];
  } {
    const plugins = this.getAll();
    return {
      total: plugins.length,
      types: this.getTypes(),
      plugins: plugins.map((p) => ({
        type: p.type,
        name: p.name,
        version: p.version,
      })),
    };
  }
}

// 导出单例实例
export const filterPluginRegistry = new FilterPluginRegistry();

// 导出类供自定义使用
export { FilterPluginRegistry };
