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
  FilterPlugin,
  FilterPluginHooks,
  PluginConfig,
} from '@veaiops/types';
import { filterPluginRegistry } from '../registry';

/**
 * 插件扩展管理器
 * 提供插件的动态配置、热加载和扩展功能
 */
export class PluginExtensionManager {
  private hooks: Map<string, FilterPluginHooks> = new Map();
  private globalConfigs: Map<string, PluginConfig> = new Map();

  /**
   * 注册插件钩子
   */
  registerHooks({
    pluginType,
    hooks,
  }: {
    pluginType: string;
    hooks: FilterPluginHooks;
  }): void {
    this.hooks.set(pluginType, hooks);
  }

  /**
   * 获取插件钩子
   */
  getHooks(pluginType: string): FilterPluginHooks | undefined {
    return this.hooks.get(pluginType);
  }

  /**
   * 设置插件全局配置
   */
  setGlobalConfig({
    pluginType,
    config,
  }: {
    pluginType: string;
    config: PluginConfig;
  }): void {
    this.globalConfigs.set(pluginType, config);
  }

  /**
   * 获取插件全局配置
   */
  getGlobalConfig(pluginType: string): PluginConfig | undefined {
    return this.globalConfigs.get(pluginType);
  }

  /**
   * 合并配置（全局配置 + 实例配置）
   */
  mergeConfig(
    pluginType: string,
    instanceConfig: PluginConfig = {},
  ): PluginConfig {
    const globalConfig = this.globalConfigs.get(pluginType) || {};
    return { ...globalConfig, ...instanceConfig };
  }

  /**
   * 创建插件的增强版本
   */
  enhancePlugin(
    plugin: FilterPlugin,
    overrides: Partial<FilterPlugin> = {},
  ): FilterPlugin {
    const hooks = this.getHooks(plugin.type);

    return {
      ...plugin,
      ...overrides,
      render: (props) => {
        let enhancedProps = props;

        // 应用 beforeRender 钩子
        if (hooks?.beforeRender) {
          enhancedProps = hooks.beforeRender(props);
        }

        // 合并全局配置
        const mergedConfig = this.mergeConfig(
          plugin.type,
          enhancedProps.componentProps as PluginConfig,
        );
        enhancedProps = {
          ...enhancedProps,
          componentProps: mergedConfig,
        };

        // 渲染组件
        let element = plugin.render(enhancedProps);

        // 应用 afterRender 钩子
        if (hooks?.afterRender) {
          element = hooks.afterRender(element, enhancedProps);
        }

        return element;
      },
      validateConfig: (config) => {
        // 先使用插件自己的验证
        if (plugin.validateConfig && !plugin.validateConfig(config)) {
          return false;
        }

        // 再使用钩子验证
        if (hooks?.validateConfig) {
          const result = hooks.validateConfig(config);
          return typeof result === 'boolean' ? result : false;
        }

        return true;
      },
    };
  }

  /**
   * 批量增强插件并重新注册
   */
  enhanceAndRegisterPlugins(
    plugins: FilterPlugin[],
    overrides: Record<string, Partial<FilterPlugin>> = {},
  ): void {
    plugins.forEach((plugin) => {
      const enhanced = this.enhancePlugin(plugin, overrides[plugin.type]);
      filterPluginRegistry.register(enhanced, { override: true });
    });
  }

  /**
   * 动态创建插件
   */
  createDynamicPlugin(config: {
    type: string;
    name: string;
    render: FilterPlugin['render'];
    validateConfig?: FilterPlugin['validateConfig'];
    defaultConfig?: PluginConfig;
    hooks?: FilterPluginHooks;
  }): FilterPlugin {
    const plugin: FilterPlugin = {
      type: config.type,
      name: config.name,
      render: config.render,
      validateConfig: config.validateConfig,
      defaultConfig: config.defaultConfig,
      version: '1.0.0-dynamic',
      description: `动态创建的 ${config.name} 插件`,
    };

    // 注册钩子
    if (config.hooks) {
      this.registerHooks({ pluginType: config.type, hooks: config.hooks });
    }

    return plugin;
  }

  /**
   * 获取所有已注册的钩子
   */
  getAllHooks(): Record<string, FilterPluginHooks> {
    return Object.fromEntries(this.hooks.entries());
  }

  /**
   * 获取所有全局配置
   */
  getAllGlobalConfigs(): Record<string, PluginConfig> {
    return Object.fromEntries(this.globalConfigs.entries());
  }

  /**
   * 清空所有扩展数据
   */
  clear(): void {
    this.hooks.clear();
    this.globalConfigs.clear();
  }

  /**
   * 获取扩展统计信息
   */
  getStats(): {
    hooksCount: number;
    configsCount: number;
    plugins: string[];
    hooks: string[];
    configs: string[];
  } {
    return {
      hooksCount: this.hooks.size,
      configsCount: this.globalConfigs.size,
      plugins: Array.from(
        new Set([...this.hooks.keys(), ...this.globalConfigs.keys()]),
      ),
      hooks: Array.from(this.hooks.keys()),
      configs: Array.from(this.globalConfigs.keys()),
    };
  }
}

// 导出单例实例
export const pluginExtensionManager = new PluginExtensionManager();
