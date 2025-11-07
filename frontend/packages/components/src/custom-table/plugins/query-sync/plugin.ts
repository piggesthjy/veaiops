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
  Plugin,
  PluginContext,
  QuerySyncConfig,
} from '@/custom-table/types';
/**
 * 查询参数同步插件
 */
import { PluginPriorityEnum } from '@/custom-table/types/core/enums';
import { devLog } from '@/custom-table/utils';
import { useQueryFormat, useQuerySync, useUrlSyncState } from './hooks';
import { createQuerySyncUtils } from './utils/index';

/**
 * 查询参数同步插件配置
 */
export interface QuerySyncPluginConfig extends QuerySyncConfig {
  /** 插件优先级 */
  priority?: PluginPriorityEnum;
  /** 是否启用插件 */
  enabled?: boolean;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 查询参数同步插件实现
 */
const QuerySyncPlugin: Plugin<QuerySyncPluginConfig> = {
  name: 'query-sync',
  version: '1.0.0',
  description: 'Synchronizes query parameters with URL search parameters',
  priority: PluginPriorityEnum.HIGH,
  enabled: true,

  // 默认配置
  config: {
    syncQueryOnSearchParams: false,
    authQueryPrefixOnSearchParams: {},
    querySearchParamsFormat: {},
    queryFormat: {},
    useActiveKeyHook: false,
    enabled: true,
    debug: false,
  },

  /**
   * 插件安装
   */
  async install(context: PluginContext) {
    const config = this.config as QuerySyncPluginConfig;

    if (config.debug) {
      devLog.log({
        component: 'QuerySyncPlugin',
        message: 'Installing plugin with config:',
        data: config,
      });
    }

    // 验证配置
    if (config.syncQueryOnSearchParams && !context.helpers.setQuery) {
      throw new Error('QuerySyncPlugin requires setQuery helper in context');
    }

    // 扩展上下文，添加查询同步相关的功能
    context.plugins = context.plugins || {};
    context.plugins.querySync = {
      config,
      hooks: {
        useQuerySync,
        useQueryFormat,
        useUrlSyncState,
      },
      utils: createQuerySyncUtils,
    };
  },

  /**
   * 插件设置
   */
  async setup(context: PluginContext) {
    const config = this.config as QuerySyncPluginConfig;

    if (!config.enabled || !config.syncQueryOnSearchParams) {
      return;
    }

    if (config.debug) {
      devLog.log({
        component: 'QuerySyncPlugin',
        message: 'Setting up query sync functionality',
      });
    }
    const querySync = context.plugins?.querySync;
    if (
      querySync &&
      context.state.query &&
      typeof context.helpers.setQuery === 'function'
    ) {
      // 这里可以执行一些初始化逻辑
      // 具体的同步逻辑会在 hooks 中处理
      if (config.debug) {
        devLog.log({
          component: 'QuerySyncPlugin',
          message: 'Query sync initialized successfully',
        });
      }
    }
  },

  /**
   * 组件挂载前
   */
  async beforeMount(_context: PluginContext) {
    const config = this.config as QuerySyncPluginConfig;

    if (!config.enabled || !config.syncQueryOnSearchParams) {
      return;
    }

    if (config.debug) {
      devLog.log({
        component: 'QuerySyncPlugin',
        message: 'Before mount - preparing query sync',
      });
    }
  },

  /**
   * 组件挂载后
   */
  async afterMount(_context: PluginContext) {
    const config = this.config as QuerySyncPluginConfig;

    if (!config.enabled || !config.syncQueryOnSearchParams) {
      return;
    }

    if (config.debug) {
      devLog.log({
        component: 'QuerySyncPlugin',
        message: 'After mount - query sync is active',
      });
    }
  },

  /**
   * 更新前
   */
  async beforeUpdate(context: PluginContext) {
    const config = this.config as QuerySyncPluginConfig;

    if (config.debug && config.enabled && config.syncQueryOnSearchParams) {
      devLog.log({
        component: 'QuerySyncPlugin',
        message: 'Before update - query state:',
        data: context.state.query,
      });
    }
  },

  /**
   * 更新后
   */
  async afterUpdate(_context: PluginContext) {
    const config = this.config as QuerySyncPluginConfig;

    if (config.debug && config.enabled && config.syncQueryOnSearchParams) {
      devLog.log({
        component: 'QuerySyncPlugin',
        message: 'After update - query synced',
      });
    }
  },

  /**
   * 插件卸载
   */
  async uninstall(context: PluginContext) {
    const config = this.config as QuerySyncPluginConfig;

    if (config.debug) {
      devLog.log({
        component: 'QuerySyncPlugin',
        message: 'Uninstalling plugin',
      });
    }

    // 清理插件相关的上下文
    if (context.plugins?.querySync) {
      delete context.plugins.querySync;
    }
  },

  /**
   * 插件激活
   */
  async activate(_context: PluginContext) {
    const config = this.config as QuerySyncPluginConfig;

    if (config.debug) {
      devLog.log({
        component: 'QuerySyncPlugin',
        message: 'Plugin activated',
      });
    }

    // 可以在这里执行激活后的逻辑
  },

  /**
   * 插件停用
   */
  async deactivate(_context: PluginContext) {
    const config = this.config as QuerySyncPluginConfig;

    if (config.debug) {
      devLog.log({
        component: 'QuerySyncPlugin',
        message: 'Plugin deactivated',
      });
    }

    // 可以在这里执行停用后的清理逻辑
  },
};

/**
 * 创建查询参数同步插件实例
 */
export const createQuerySyncPlugin = (
  config: Partial<QuerySyncPluginConfig> = {},
): Plugin<QuerySyncPluginConfig> => ({
  ...QuerySyncPlugin,
  config: {
    ...QuerySyncPlugin.config,
    ...config,
  },
});

export { QuerySyncPlugin };
