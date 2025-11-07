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

import { PluginNames } from '@/custom-table/constants/enum';
/**
 * 表格排序插件
 */
import type {
  PluginContext,
  PluginFactory,
  TableSortingConfig,
} from '@/custom-table/types';
import { PluginPriorityEnum } from '@/custom-table/types/core/enums';
import { logger } from '@veaiops/utils';
import { DEFAULT_TABLE_SORTING_CONFIG } from './config';

export const TableSortingPlugin: PluginFactory<TableSortingConfig> = (
  config: TableSortingConfig = {},
) => {
  const finalConfig = { ...DEFAULT_TABLE_SORTING_CONFIG, ...config };

  return {
    name: PluginNames.TABLE_SORTING,
    version: '1.0.0',
    description: '表格排序插件',
    priority: finalConfig.priority || PluginPriorityEnum.MEDIUM,
    enabled: finalConfig.enabled !== false,
    config: finalConfig,
    dependencies: [],
    conflicts: [],

    install(_context: PluginContext) {
      // 安装时的操作
    },

    setup(context: PluginContext) {
      // 初始化排序处理
      const propsWithSortFieldMap = context.props as any;
      const sortFieldMap = propsWithSortFieldMap.sortFieldMap || {};

      // 插件设置逻辑 - 不调用 Hook，只进行配置
      // Hook 调用已移到组件层面
      // 排序状态由外层组件管理，这里只设置默认值
      Object.assign(context.state, {
        sorter: context.state.sorter || {},
        sortFieldMap: sortFieldMap || {},
      });

      // 添加排序相关方法到上下文
      Object.assign(context.helpers, {
        setSorter: context.helpers.setSorter,
        resetSorter: () => {
          // 重置排序的逻辑
          context.helpers.setSorter?.({});
        },
        getSorterParam: () =>
          // 获取排序参数的逻辑
          context.state.sorter,
      });
    },

    update(_context: PluginContext) {
      // 当配置或数据更新时的操作
    },

    uninstall(_context: PluginContext) {
      // 卸载时的清理操作
    },

    // 排序钩子
    hooks: {
      // 获取当前排序信息
      getSorterInfo: (...args: unknown[]) => {
        const context = args[0] as PluginContext;
        return context.state.sorter || {};
      },

      // 获取排序参数
      getSorterParam: (...args: unknown[]) => {
        const context = args[0] as PluginContext;
        return context.helpers.getSorterParam?.() || {};
      },

      // 重置排序
      resetSorter: (...args: unknown[]) => {
        const context = args[0] as PluginContext;
        return context.helpers.resetSorter?.();
      },
    },

    // 处理表格变更事件
    tableEvents: {
      // 处理表格排序变更
      onSorterChange(
        context: PluginContext,
        sorter: unknown,
        extra: Record<string, unknown>,
      ) {
        logger.log({
          message: 'onSorterChange called',
          data: {
            action: extra?.action,
            sorter,
            hasSetter: Boolean(context.helpers.setSorter),
          },
          source: 'CustomTable',
          component: 'TableSortingPlugin',
        });
        if (extra?.action === 'sort' && context.helpers.setSorter) {
          context.helpers.setSorter(sorter as any);
          logger.log({
            message: 'setSorter called',
            data: { sorter },
            source: 'CustomTable',
            component: 'TableSortingPlugin',
          });
        }
      },
    },
  } as ReturnType<PluginFactory<TableSortingConfig>>;
};
