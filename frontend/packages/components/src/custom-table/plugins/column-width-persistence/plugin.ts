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
 * 列宽持久化插件实现
 * 集成Arco Table列宽检测和持久化功能，解决翻页时列宽变化问题
 *

 *
 */

import type {
  ColumnWidthPersistenceConfig,
  ColumnWidthPersistenceState,
  PluginContext,
  PluginFactory,
} from '@/custom-table/types';
import { devLog } from '@/custom-table/utils/log-utils';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import {
  DEFAULT_COLUMN_WIDTH_PERSISTENCE_CONFIG,
  PLUGIN_CONSTANTS,
} from './config';
import { createColumnWidthHelpers } from './helpers';
import { createPluginHooks } from './plugin-hooks';
import { createTableEvents } from './table-events';
import {
  generateStorageKey,
  generateTableId,
  localStorageUtils,
} from './utils';

/**
 * 列宽持久化插件工厂函数
 */
export const ColumnWidthPersistencePlugin: PluginFactory<
  ColumnWidthPersistenceConfig
> = (config: ColumnWidthPersistenceConfig = {}) => {
  const finalConfig = { ...DEFAULT_COLUMN_WIDTH_PERSISTENCE_CONFIG, ...config };
  let pluginTableId = '';

  return {
    name: PLUGIN_CONSTANTS.PLUGIN_NAME,
    version: PLUGIN_CONSTANTS.VERSION,
    description: PLUGIN_CONSTANTS.DESCRIPTION,
    priority: finalConfig.priority || 'medium',
    enabled: finalConfig.enabled !== false,
    dependencies: ['table-columns'], // 依赖列管理插件
    conflicts: [],

    install(context: PluginContext) {
      devLog.log({
        component: PLUGIN_CONSTANTS.PLUGIN_NAME,
        message: 'Plugin installed',
      });

      // 初始化插件状态
      Object.assign(context.state, {
        columnWidthPersistence: {
          persistentWidths: {},
          isDetecting: false,
          lastDetectionTime: 0,
          widthHistory: [],
        },
      });
    },

    setup(context: PluginContext) {
      devLog.log({
        component: PLUGIN_CONSTANTS.PLUGIN_NAME,
        message: 'Plugin setup',
      });

      // 获取表格相关信息
      const { props } = context;

      // 自动生成tableId - 优先使用用户指定的，然后基于标题和路径自动生成
      const propsWithTitle = props as { tableId?: string; title?: string };
      pluginTableId =
        propsWithTitle.tableId ||
        generateTableId({
          title: propsWithTitle.title,
          pathname:
            typeof window !== 'undefined'
              ? window.location.pathname
              : undefined,
        });

      const stateWithColumns = context.state as { columns?: ColumnProps[] };
      const baseColumns = stateWithColumns.columns || [];

      // 从本地存储恢复列宽度
      if (
        finalConfig.enableLocalStorage &&
        localStorageUtils.isAvailable() &&
        pluginTableId
      ) {
        const storageKey = generateStorageKey({
          prefix: finalConfig.storageKeyPrefix,
          tableId: pluginTableId,
        });
        const savedWidths =
          localStorageUtils.load<Record<string, number>>(storageKey);

        if (savedWidths && Object.keys(savedWidths).length > 0) {
          const currentPersistenceState = (
            context.state as {
              columnWidthPersistence?: ColumnWidthPersistenceState;
            }
          ).columnWidthPersistence;
          Object.assign(context.state, {
            columnWidthPersistence: {
              ...currentPersistenceState,
              persistentWidths: savedWidths,
            },
          });

          // 应用到列配置中
          const updatedColumns = baseColumns.map((col: ColumnProps) => {
            const persistentWidth = savedWidths[col.dataIndex || ''];
            if (persistentWidth && col.dataIndex) {
              return {
                ...col,
                width: persistentWidth,
              };
            }
            return col;
          });

          Object.assign(context.state, { columns: updatedColumns });
        }
      }

      // 将tableId存储到上下文中，供其他方法使用
      Object.assign(context.state, {
        columnWidthPersistence: {
          ...(
            context.state as {
              columnWidthPersistence?: Record<string, unknown>;
            }
          ).columnWidthPersistence,
          tableId: pluginTableId, // 存储生成的tableId
        },
      });

      // 添加列宽持久化相关方法到上下文
      Object.assign(
        context.helpers,
        createColumnWidthHelpers({
          context,
          config: finalConfig,
          tableId: pluginTableId,
          baseColumns,
        }),
      );
    },

    update(_context: PluginContext) {
      // 当配置或数据更新时的操作
      devLog.log({
        component: PLUGIN_CONSTANTS.PLUGIN_NAME,
        message: 'Plugin updated',
      });
    },

    uninstall(_context: PluginContext) {
      // 卸载时的清理操作
      devLog.log({
        component: PLUGIN_CONSTANTS.PLUGIN_NAME,
        message: 'Plugin uninstalled',
      });
    },

    onMount(_context: PluginContext) {
      // DOM挂载后的操作，主要用于自动检测功能
      devLog.log({
        component: PLUGIN_CONSTANTS.PLUGIN_NAME,
        message: 'Plugin mounted - DOM is ready',
      });
    },

    // 插件钩子方法
    hooks: (() => {
      // 延迟初始化 hooks，确保 tableId 已设置
      if (!pluginTableId) {
        return {};
      }
      return createPluginHooks(finalConfig, pluginTableId);
    })(),

    // 表格事件处理
    tableEvents: createTableEvents(),
  };
};
